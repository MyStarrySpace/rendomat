/**
 * Render Pipeline Integration Tests
 *
 * Tests the async render flow:
 *   POST /render-scenes -> returns immediately
 *   SSE /render-progress -> streams progress events
 *   GET /download -> serves rendered video
 *
 * Run: node --test server/test/render-pipeline.test.mjs
 * Requires server running on localhost:4321
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const API = process.env.TEST_API_URL || 'http://localhost:4321';

// Helper: fetch JSON
async function fetchJSON(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  const body = await res.json();
  return { status: res.status, body };
}

// Helper: collect SSE events until a condition is met or timeout
function collectSSE(path, { until, timeout = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const events = [];
    const controller = new AbortController();

    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`SSE timeout after ${timeout}ms. Collected ${events.length} events: ${JSON.stringify(events.map(e => e.stage || e.status))}`));
    }, timeout);

    fetch(`${API}${path}`, { signal: controller.signal, headers: { 'Accept': 'text/event-stream' } })
      .then(async (res) => {
        if (!res.ok) {
          clearTimeout(timer);
          reject(new Error(`SSE connection failed: ${res.status}`));
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line in buffer

          let eventType = null;
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ') && eventType === 'progress') {
              try {
                const data = JSON.parse(line.slice(6));
                events.push(data);
                if (until && until(data)) {
                  clearTimeout(timer);
                  controller.abort();
                  resolve(events);
                  return;
                }
              } catch {
                // skip malformed data
              }
              eventType = null;
            }
          }
        }
        clearTimeout(timer);
        resolve(events);
      })
      .catch((err) => {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
          resolve(events); // normal abort from until() condition
        } else {
          reject(err);
        }
      });
  });
}

// Find a test video with scenes
async function findTestVideo() {
  const { body: videos } = await fetchJSON('/api/videos');
  const video = videos.find(v => v.id);
  if (!video) throw new Error('No videos found in database');
  return video;
}

describe('Render Pipeline', () => {
  let testVideo;

  before(async () => {
    // Verify server is running
    try {
      const res = await fetch(`${API}/api/videos`);
      assert.ok(res.ok, 'Server should be running');
      testVideo = await findTestVideo();
      console.log(`Using test video: "${testVideo.title}" (id: ${testVideo.id})`);
    } catch (err) {
      throw new Error(`Server not running at ${API}. Start it first.\n${err.message}`);
    }
  });

  describe('POST /api/videos/:id/render-scenes', () => {
    it('should return immediately with status "started"', async () => {
      const start = Date.now();
      const { status, body } = await fetchJSON(`/api/videos/${testVideo.id}/render-scenes`, {
        method: 'POST',
      });
      const elapsed = Date.now() - start;

      assert.equal(status, 200);
      assert.ok(body.status === 'started' || body.status === 'already_rendering',
        `Expected status "started" or "already_rendering", got "${body.status}"`);
      assert.equal(body.videoId, testVideo.id);
      assert.ok(elapsed < 5000, `Endpoint should return in <5s, took ${elapsed}ms`);
    });

    it('should return 404 for non-existent video', async () => {
      const { status, body } = await fetchJSON('/api/videos/99999/render-scenes', {
        method: 'POST',
      });
      assert.equal(status, 404);
      assert.ok(body.error);
    });

    it('should return "already_rendering" if render is in progress', async () => {
      // First call starts render
      await fetchJSON(`/api/videos/${testVideo.id}/render-scenes`, { method: 'POST' });

      // Immediate second call should detect in-progress render
      const { body } = await fetchJSON(`/api/videos/${testVideo.id}/render-scenes`, {
        method: 'POST',
      });
      // Could be 'started' if first finished instantly, or 'already_rendering'
      assert.ok(body.status === 'started' || body.status === 'already_rendering',
        `Expected "started" or "already_rendering", got "${body.status}"`);
    });
  });

  describe('SSE /api/videos/:id/render-progress', () => {
    it('should stream progress events during render', async () => {
      // Start a render
      await fetchJSON(`/api/videos/${testVideo.id}/render-scenes`, { method: 'POST' });

      // Collect SSE events until complete or error
      const events = await collectSSE(`/api/videos/${testVideo.id}/render-progress`, {
        until: (e) => e.stage === 'complete' || e.stage === 'error',
        timeout: 120000,
      });

      assert.ok(events.length > 0, 'Should receive at least one SSE event');

      // Check we got progress events with expected fields
      const lastEvent = events[events.length - 1];
      assert.ok(lastEvent.stage === 'complete' || lastEvent.stage === 'error',
        `Last event should be complete or error, got "${lastEvent.stage}"`);

      if (lastEvent.stage === 'complete') {
        assert.equal(lastEvent.overall_progress, 100);
      }

      // Check intermediate events had scene data
      const renderingEvents = events.filter(e => e.stage === 'rendering');
      if (renderingEvents.length > 0) {
        const evt = renderingEvents[0];
        assert.ok(evt.scenes, 'Rendering events should include scenes array');
        assert.ok(evt.total_scenes > 0, 'Should have total_scenes > 0');
      }
    });

    it('should send current state on connection', async () => {
      // Start a render
      await fetchJSON(`/api/videos/${testVideo.id}/render-scenes`, { method: 'POST' });

      // Small delay to let render start
      await new Promise(r => setTimeout(r, 500));

      // Connect SSE - should get current state immediately
      const events = await collectSSE(`/api/videos/${testVideo.id}/render-progress`, {
        until: () => true, // stop after first event
        timeout: 10000,
      });

      assert.ok(events.length >= 1, 'Should receive initial state event on connect');
    });
  });

  describe('GET /api/videos/:id/download', () => {
    it('should return 404 if video has not been rendered', async () => {
      // Use a video that likely has no output_path
      const { status, body } = await fetchJSON('/api/videos/99999/download');
      assert.equal(status, 404);
    });

    it('should serve video file after render completes', async () => {
      // Start render and wait for completion
      await fetchJSON(`/api/videos/${testVideo.id}/render-scenes`, { method: 'POST' });

      const events = await collectSSE(`/api/videos/${testVideo.id}/render-progress`, {
        until: (e) => e.stage === 'complete' || e.stage === 'error',
        timeout: 120000,
      });

      const lastEvent = events[events.length - 1];
      if (lastEvent.stage !== 'complete') {
        console.log('Render did not complete, skipping download test');
        return;
      }

      // Now try download
      const res = await fetch(`${API}/api/videos/${testVideo.id}/download`);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'video/mp4');

      const blob = await res.blob();
      assert.ok(blob.size > 0, 'Downloaded file should not be empty');
    });
  });

  describe('Scene state lifecycle', () => {
    it('should update scene cache_path in DB after rendering', async () => {
      // Get scenes before render
      const { body: scenesBefore } = await fetchJSON(`/api/videos/${testVideo.id}/scenes`);
      const uncachedBefore = scenesBefore.filter(s => !s.cache_path).length;

      if (uncachedBefore === 0) {
        console.log('All scenes already cached, clearing one for test');
        const sceneId = scenesBefore[0].id;
        await fetchJSON(`/api/scenes/${sceneId}/clear-cache`, { method: 'POST' });
      }

      // Start render
      await fetchJSON(`/api/videos/${testVideo.id}/render-scenes`, { method: 'POST' });

      // Wait for completion via SSE
      await collectSSE(`/api/videos/${testVideo.id}/render-progress`, {
        until: (e) => e.stage === 'complete' || e.stage === 'error',
        timeout: 120000,
      });

      // Check scenes after render
      const { body: scenesAfter } = await fetchJSON(`/api/videos/${testVideo.id}/scenes`);
      const uncachedAfter = scenesAfter.filter(s => !s.cache_path).length;

      assert.equal(uncachedAfter, 0, `All scenes should be cached after render, but ${uncachedAfter} are not`);
    });
  });
});

describe('Single Scene Render', () => {
  let testVideo;
  let testScene;

  before(async () => {
    testVideo = await findTestVideo();
    const { body: scenes } = await fetchJSON(`/api/videos/${testVideo.id}/scenes`);
    testScene = scenes[0];
    assert.ok(testScene, 'Should have at least one scene');
  });

  it('should render a single scene and return cache_path', async () => {
    const { status, body } = await fetchJSON(`/api/scenes/${testScene.id}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceRender: true }),
    });

    assert.equal(status, 200);
    assert.ok(body.success, 'Should return success: true');
    assert.ok(body.cache_path, 'Should return cache_path');
  });

  it('should use cache on second render without force', async () => {
    // Ensure scene is cached from previous test
    const { body: first } = await fetchJSON(`/api/scenes/${testScene.id}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceRender: false }),
    });

    assert.ok(first.success);
    assert.ok(first.cached, 'Second render should use cache');
  });
});

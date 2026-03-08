/**
 * State Management Unit Tests
 *
 * Tests database-level state transitions for videos, scenes, transitions,
 * render jobs, and credits — without requiring a running server.
 *
 * Run: node --test server/test/state-management.test.mjs
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  clientDb,
  videoDb,
  sceneDb,
  transitionDb,
  renderJobDb,
  userDb,
  creditTransactionDb,
} from "../database.mjs";

// Track IDs for cleanup
let testClientId;
const testVideoIds = [];
const testUserIds = [];

before(() => {
  testClientId = clientDb.create({ company: "StateTest Inc" });
});

after(() => {
  // Cleanup in reverse dependency order
  for (const vid of testVideoIds) {
    transitionDb.deleteAllForVideo(vid);
    videoDb.delete(vid);
  }
  clientDb.delete(testClientId);
  for (const uid of testUserIds) {
    userDb.adjustCredits && undefined; // no-op, just cleanup
    // Delete credit transactions then user
    const txns = creditTransactionDb.getAllForUser(uid);
    // Can't delete txns via creditTransactionDb (no delete method), use raw approach
    // The user delete won't cascade in SQLite unless FK enforced, so just leave them
  }
});

// -- Video Status Lifecycle --

describe("Video status lifecycle", () => {
  it("defaults to 'draft' on creation", () => {
    const id = videoDb.create({
      client_id: testClientId,
      title: "Draft Test",
      composition_id: "comp-1",
    });
    testVideoIds.push(id);

    const video = videoDb.getById(id);
    assert.equal(video.status, "draft");
    assert.equal(video.output_path, null);
    assert.equal(video.render_progress, null);
  });

  it("transitions from draft to rendering", () => {
    const id = videoDb.create({
      client_id: testClientId,
      title: "Render Lifecycle",
      composition_id: "comp-2",
    });
    testVideoIds.push(id);

    const updated = videoDb.update(id, { status: "rendering" });
    assert.equal(updated.status, "rendering");
  });

  it("transitions from rendering to completed with output_path", () => {
    const id = videoDb.create({
      client_id: testClientId,
      title: "Complete Test",
      composition_id: "comp-3",
    });
    testVideoIds.push(id);

    videoDb.update(id, { status: "rendering" });
    const completed = videoDb.update(id, {
      status: "completed",
      output_path: "/output/video.mp4",
    });

    assert.equal(completed.status, "completed");
    assert.equal(completed.output_path, "/output/video.mp4");
  });

  it("transitions from rendering to error", () => {
    const id = videoDb.create({
      client_id: testClientId,
      title: "Error Test",
      composition_id: "comp-4",
    });
    testVideoIds.push(id);

    videoDb.update(id, { status: "rendering" });
    const errored = videoDb.update(id, { status: "error" });
    assert.equal(errored.status, "error");
  });

  it("stores and retrieves render_progress JSON", () => {
    const id = videoDb.create({
      client_id: testClientId,
      title: "Progress Test",
      composition_id: "comp-5",
    });
    testVideoIds.push(id);

    const progress = JSON.stringify({
      stage: "rendering",
      overall_progress: 45,
      total_scenes: 3,
      scenes: [
        { id: 1, status: "done" },
        { id: 2, status: "rendering", progress: 35 },
        { id: 3, status: "pending" },
      ],
    });

    videoDb.update(id, { status: "rendering", render_progress: progress });
    const video = videoDb.getById(id);

    assert.equal(video.status, "rendering");
    const parsed = JSON.parse(video.render_progress);
    assert.equal(parsed.overall_progress, 45);
    assert.equal(parsed.total_scenes, 3);
    assert.equal(parsed.scenes.length, 3);
  });

  it("can reset from completed back to draft", () => {
    const id = videoDb.create({
      client_id: testClientId,
      title: "Reset Test",
      composition_id: "comp-6",
    });
    testVideoIds.push(id);

    videoDb.update(id, {
      status: "completed",
      output_path: "/output/old.mp4",
    });
    const reset = videoDb.update(id, {
      status: "draft",
      output_path: null,
      render_progress: null,
    });

    assert.equal(reset.status, "draft");
  });
});

// -- Scene Cache State --

describe("Scene cache state", () => {
  let videoId;
  let sceneId;

  before(() => {
    videoId = videoDb.create({
      client_id: testClientId,
      title: "Cache Test Video",
      composition_id: "cache-comp",
    });
    testVideoIds.push(videoId);

    sceneId = sceneDb.create({
      video_id: videoId,
      scene_number: 1,
      name: "Scene 1",
      start_frame: 0,
      end_frame: 90,
      data: { headline: "Hello" },
    });
  });

  it("starts with null cache fields", () => {
    const scene = sceneDb.getById(sceneId);
    assert.equal(scene.cache_path, null);
    assert.equal(scene.cache_hash, null);
    assert.equal(scene.cached_at, null);
  });

  it("sets cache via updateCache", () => {
    sceneDb.updateCache(sceneId, "/cache/scene1.mp4", "abc123");
    const scene = sceneDb.getById(sceneId);

    assert.equal(scene.cache_path, "/cache/scene1.mp4");
    assert.equal(scene.cache_hash, "abc123");
    assert.ok(scene.cached_at, "cached_at should be set");
  });

  it("invalidates cache via invalidateCache", () => {
    // Ensure cached first
    sceneDb.updateCache(sceneId, "/cache/scene1.mp4", "abc123");
    sceneDb.invalidateCache(sceneId);

    const scene = sceneDb.getById(sceneId);
    assert.equal(scene.cache_path, null);
    assert.equal(scene.cache_hash, null);
    assert.equal(scene.cached_at, null);
  });

  it("auto-invalidates cache when data is updated", () => {
    // Set cache first
    sceneDb.updateCache(sceneId, "/cache/scene1.mp4", "abc123");
    let scene = sceneDb.getById(sceneId);
    assert.ok(scene.cache_path, "Should have cache before data update");

    // Update data → should auto-invalidate
    sceneDb.update(sceneId, { data: { headline: "Updated" } });
    scene = sceneDb.getById(sceneId);
    assert.equal(scene.cache_path, null, "Cache should be cleared after data change");
  });

  it("auto-invalidates cache when scene_type is updated", () => {
    sceneDb.updateCache(sceneId, "/cache/scene1.mp4", "def456");

    sceneDb.update(sceneId, { scene_type: "image-background" });
    const scene = sceneDb.getById(sceneId);
    assert.equal(scene.cache_path, null, "Cache should be cleared after scene_type change");
  });

  it("does NOT invalidate cache when only name is updated", () => {
    sceneDb.updateCache(sceneId, "/cache/scene1.mp4", "ghi789");

    sceneDb.update(sceneId, { name: "Renamed Scene" });
    const scene = sceneDb.getById(sceneId);
    assert.equal(scene.cache_path, "/cache/scene1.mp4", "Cache should remain after name-only change");
  });

  it("does NOT invalidate cache when cache_path is explicitly set alongside data", () => {
    sceneDb.update(sceneId, {
      data: { headline: "New Data" },
      cache_path: "/cache/explicit.mp4",
    });
    const scene = sceneDb.getById(sceneId);
    assert.equal(scene.cache_path, "/cache/explicit.mp4", "Explicit cache_path should be preserved");
  });
});

// -- Render Job State --

describe("Render job state", () => {
  it("creates with default queued status", () => {
    const jobId = `test-job-${Date.now()}`;
    renderJobDb.create({ job_id: jobId });

    const job = renderJobDb.getByJobId(jobId);
    assert.equal(job.status, "queued");
    assert.equal(job.progress, 0);
    assert.equal(job.error, null);
  });

  it("updates progress during render", () => {
    const jobId = `test-progress-${Date.now()}`;
    renderJobDb.create({ job_id: jobId });

    renderJobDb.update(jobId, { status: "rendering", progress: 0.5 });
    let job = renderJobDb.getByJobId(jobId);
    assert.equal(job.status, "rendering");
    assert.equal(job.progress, 0.5);

    renderJobDb.update(jobId, { progress: 1.0, status: "completed", output_path: "/out.mp4" });
    job = renderJobDb.getByJobId(jobId);
    assert.equal(job.status, "completed");
    assert.equal(job.progress, 1.0);
    assert.equal(job.output_path, "/out.mp4");
  });

  it("stores error message on failure", () => {
    const jobId = `test-error-${Date.now()}`;
    renderJobDb.create({ job_id: jobId });

    renderJobDb.update(jobId, { status: "error", error: "FFmpeg exited with code 1" });
    const job = renderJobDb.getByJobId(jobId);
    assert.equal(job.status, "error");
    assert.equal(job.error, "FFmpeg exited with code 1");
  });

  it("links job to video and scene", () => {
    const videoId = videoDb.create({
      client_id: testClientId,
      title: "Job Link Test",
      composition_id: "job-comp",
    });
    testVideoIds.push(videoId);

    const sceneId = sceneDb.create({
      video_id: videoId,
      scene_number: 1,
      name: "S1",
      start_frame: 0,
      end_frame: 60,
    });

    const jobId = `test-link-${Date.now()}`;
    renderJobDb.create({ job_id: jobId, video_id: videoId, scene_id: sceneId });

    const job = renderJobDb.getByJobId(jobId);
    assert.equal(job.video_id, videoId);
    assert.equal(job.scene_id, sceneId);
  });
});

// -- Transition State --

describe("Transition state", () => {
  let videoId;

  before(() => {
    videoId = videoDb.create({
      client_id: testClientId,
      title: "Transition Test",
      composition_id: "trans-comp",
    });
    testVideoIds.push(videoId);

    // Create 3 scenes
    for (let i = 1; i <= 3; i++) {
      sceneDb.create({
        video_id: videoId,
        scene_number: i,
        name: `Scene ${i}`,
        start_frame: (i - 1) * 90,
        end_frame: i * 90,
      });
    }
  });

  it("createDefaultsForVideo creates transitions between consecutive scenes", () => {
    const created = transitionDb.createDefaultsForVideo(videoId);
    assert.equal(created.length, 2, "3 scenes → 2 transitions");

    const all = transitionDb.getAllForVideo(videoId);
    assert.equal(all.length, 2);
    assert.equal(all[0].from_scene_number, 1);
    assert.equal(all[0].to_scene_number, 2);
    assert.equal(all[1].from_scene_number, 2);
    assert.equal(all[1].to_scene_number, 3);
  });

  it("createDefaultsForVideo skips existing transitions (idempotent)", () => {
    const created = transitionDb.createDefaultsForVideo(videoId);
    assert.equal(created.length, 0, "No new transitions should be created");
  });

  it("defaults to crossfade type with 20 frame duration", () => {
    const all = transitionDb.getAllForVideo(videoId);
    for (const t of all) {
      assert.equal(t.transition_type, "crossfade");
      assert.equal(t.duration_frames, 20);
    }
  });

  it("invalidates cache when transition is updated", () => {
    const all = transitionDb.getAllForVideo(videoId);
    const t = all[0];

    // Set cache
    transitionDb.updateCache(t.id, "/cache/t1.mp4", "hash1");
    let updated = transitionDb.getById(t.id);
    assert.equal(updated.cache_path, "/cache/t1.mp4");

    // Update transition_type → should clear cache
    transitionDb.update(t.id, { transition_type: "wipe-left" });
    updated = transitionDb.getById(t.id);
    assert.equal(updated.transition_type, "wipe-left");
    assert.equal(updated.cache_path, null, "Cache should be invalidated on type change");
    assert.equal(updated.cache_hash, null);
  });

  it("invalidates cache when duration changes", () => {
    const all = transitionDb.getAllForVideo(videoId);
    const t = all[1];

    transitionDb.updateCache(t.id, "/cache/t2.mp4", "hash2");
    transitionDb.update(t.id, { duration_frames: 30 });

    const updated = transitionDb.getById(t.id);
    assert.equal(updated.duration_frames, 30);
    assert.equal(updated.cache_path, null);
  });

  it("unique constraint prevents duplicate transitions", () => {
    assert.throws(
      () =>
        transitionDb.create({
          video_id: videoId,
          from_scene_number: 1,
          to_scene_number: 2,
        }),
      (err) => {
        assert.ok(
          err.message.includes("UNIQUE") || err.code === "SQLITE_CONSTRAINT_UNIQUE",
          "Should throw unique constraint error"
        );
        return true;
      }
    );
  });
});

// -- Scene Reorder --

describe("Scene reorder", () => {
  let videoId;
  let sceneIds;

  before(() => {
    videoId = videoDb.create({
      client_id: testClientId,
      title: "Reorder Test",
      composition_id: "reorder-comp",
    });
    testVideoIds.push(videoId);

    sceneIds = [];
    // Create 4 scenes: 90 frames each (no transitions — tests pure reorder logic)
    for (let i = 1; i <= 4; i++) {
      const id = sceneDb.create({
        video_id: videoId,
        scene_number: i,
        name: `R-Scene ${i}`,
        start_frame: (i - 1) * 90,
        end_frame: i * 90,
      });
      sceneIds.push(id);
    }
  });

  it("moves a scene earlier and renumbers correctly", () => {
    // Move scene 3 to position 1: [1,2,3,4] → [3,1,2,4]
    const result = sceneDb.reorderScene(sceneIds[2], 1);

    assert.equal(result.length, 4);
    // The scene that was originally scene 3 should now be scene_number 1
    const movedScene = result.find((s) => s.id === sceneIds[2]);
    assert.equal(movedScene.scene_number, 1);
    // Original scene 1 should now be scene_number 2
    const shifted = result.find((s) => s.id === sceneIds[0]);
    assert.equal(shifted.scene_number, 2);
  });

  it("recalculates frames after reorder (no gaps)", () => {
    const scenes = sceneDb.getAllForVideo(videoId);

    for (let i = 0; i < scenes.length; i++) {
      const expected_start = i * 90;
      assert.equal(
        scenes[i].start_frame,
        expected_start,
        `Scene ${scenes[i].scene_number} start_frame should be ${expected_start}`
      );
      assert.equal(scenes[i].end_frame, expected_start + 90);
    }
  });

  it("moves a scene later and renumbers correctly", () => {
    // Current order by id: [sceneIds[2]=1, sceneIds[0]=2, sceneIds[1]=3, sceneIds[3]=4]
    // Move scene at position 1 to position 3
    const result = sceneDb.reorderScene(sceneIds[2], 3);

    assert.equal(result.length, 4);
    const movedScene = result.find((s) => s.id === sceneIds[2]);
    assert.equal(movedScene.scene_number, 3);
  });

  it("no-op when moving to same position", () => {
    const scenes = sceneDb.getAllForVideo(videoId);
    const targetScene = scenes[0];
    const result = sceneDb.reorderScene(targetScene.id, targetScene.scene_number);
    assert.equal(result.length, 4);
    assert.equal(result[0].id, targetScene.id);
  });
});

// -- Credit System --

describe("Credit system", () => {
  let userId;

  before(() => {
    const user = userDb.create({
      email: `credit-test-${Date.now()}@example.com`,
      provider: "test",
      provider_id: `cred-${Date.now()}`,
      credits: 30,
    });
    userId = user.id;
    testUserIds.push(userId);
  });

  it("creates user with signup bonus credit transaction", () => {
    const txns = creditTransactionDb.getAllForUser(userId);
    assert.equal(txns.length, 1);
    assert.equal(txns[0].amount, 30);
    assert.equal(txns[0].reason, "signup_bonus");
  });

  it("deducts credits for a render", () => {
    const updated = userDb.adjustCredits(userId, -1, "render", { video_id: 42 });
    assert.equal(updated.credits, 29);

    const txns = creditTransactionDb.getAllForUser(userId);
    const renderTxn = txns.find((t) => t.reason === "render");
    assert.ok(renderTxn);
    assert.equal(renderTxn.amount, -1);
    assert.equal(renderTxn.video_id, 42);
  });

  it("adds credits for a purchase", () => {
    const updated = userDb.adjustCredits(userId, 50, "purchase", {
      stripe_session_id: "cs_test_xyz",
    });
    assert.equal(updated.credits, 79); // 30 - 1 + 50

    const txns = creditTransactionDb.getAllForUser(userId);
    const purchaseTxn = txns.find((t) => t.reason === "purchase");
    assert.ok(purchaseTxn);
    assert.equal(purchaseTxn.stripe_session_id, "cs_test_xyz");
  });

  it("rejects deduction when insufficient credits", () => {
    assert.throws(
      () => userDb.adjustCredits(userId, -1000, "render"),
      (err) => {
        assert.ok(err.message.includes("Insufficient credits"));
        return true;
      }
    );

    // Credits should be unchanged
    const user = userDb.getById(userId);
    assert.equal(user.credits, 79);
  });

  it("rejects adjustCredits for nonexistent user", () => {
    assert.throws(
      () => userDb.adjustCredits("nonexistent-user-id", 10, "test"),
      (err) => {
        assert.ok(err.message.includes("User not found"));
        return true;
      }
    );
  });

  it("atomic: failed deduction creates no transaction", () => {
    const txnsBefore = creditTransactionDb.getAllForUser(userId);
    const countBefore = txnsBefore.length;

    try {
      userDb.adjustCredits(userId, -1000, "render");
    } catch {
      // expected
    }

    const txnsAfter = creditTransactionDb.getAllForUser(userId);
    assert.equal(txnsAfter.length, countBefore, "No new transaction on failed deduction");
  });
});

// -- User Upsert --

describe("User upsert", () => {
  const provider = "test";
  const providerId = `upsert-${Date.now()}`;

  it("creates user on first upsert", () => {
    const user = userDb.upsert({
      email: `upsert-${Date.now()}@example.com`,
      provider,
      provider_id: providerId,
      name: "Original Name",
    });
    testUserIds.push(user.id);

    assert.ok(user.id);
    assert.equal(user.name, "Original Name");
    assert.equal(user.credits, 30);
  });

  it("updates existing user on second upsert (no duplicate)", () => {
    const user = userDb.upsert({
      email: `updated-${Date.now()}@example.com`,
      provider,
      provider_id: providerId,
      name: "Updated Name",
      image: "https://example.com/avatar.jpg",
    });

    assert.equal(user.name, "Updated Name");
    assert.equal(user.image, "https://example.com/avatar.jpg");
    // Credits should NOT be reset
    assert.equal(user.credits, 30);
  });
});

// -- Scene Frame Recalculation --

describe("Scene frame recalculation", () => {
  let videoId;

  before(() => {
    videoId = videoDb.create({
      client_id: testClientId,
      title: "Frame Recalc Test",
      composition_id: "frame-comp",
    });
    testVideoIds.push(videoId);

    // Create scenes with intentional gaps
    sceneDb.create({
      video_id: videoId,
      scene_number: 1,
      name: "F1",
      start_frame: 0,
      end_frame: 60,
    });
    sceneDb.create({
      video_id: videoId,
      scene_number: 2,
      name: "F2",
      start_frame: 100, // gap!
      end_frame: 220, // 120 frames
    });
    sceneDb.create({
      video_id: videoId,
      scene_number: 3,
      name: "F3",
      start_frame: 300, // gap!
      end_frame: 390, // 90 frames
    });
  });

  it("closes gaps after recalculateFrames", () => {
    const scenes = sceneDb.recalculateFrames(videoId);

    assert.equal(scenes[0].start_frame, 0);
    assert.equal(scenes[0].end_frame, 60);
    assert.equal(scenes[1].start_frame, 60);
    assert.equal(scenes[1].end_frame, 180); // 60 + 120
    assert.equal(scenes[2].start_frame, 180);
    assert.equal(scenes[2].end_frame, 270); // 180 + 90
  });

  it("preserves scene durations", () => {
    const scenes = sceneDb.getAllForVideo(videoId);
    const durations = scenes.map((s) => s.end_frame - s.start_frame);
    assert.deepEqual(durations, [60, 120, 90]);
  });
});

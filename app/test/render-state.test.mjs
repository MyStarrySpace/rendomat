/**
 * Render State Tests
 *
 * Tests the pure state logic for render progress tracking, scene change
 * detection, zebra stripe rendering, and visual state computation.
 *
 * These tests encode EXPECTED correct behavior. If a test fails, the
 * production code has a bug that needs fixing.
 *
 * Run: node --test app/test/render-state.test.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateSceneHash,
  hasSceneChanged,
  computeSceneRenderProgress,
  getZebraStripeStyle,
  scenesNeedingRender,
  getSceneVisualState,
} from "../lib/render-state.mjs";

// ---------------------------------------------------------------------------
// hasSceneChanged — detect stale caches
// ---------------------------------------------------------------------------

describe("hasSceneChanged", () => {
  it("returns true when cache_hash is null (never rendered)", () => {
    assert.equal(
      hasSceneChanged({ data: '{"headline":"Hello"}', cache_hash: null }),
      true
    );
  });

  it("returns true when cache_hash is undefined", () => {
    assert.equal(
      hasSceneChanged({ data: '{"headline":"Hello"}', cache_hash: undefined }),
      true
    );
  });

  it("returns false when data is null (nothing to render)", () => {
    assert.equal(
      hasSceneChanged({ data: null, cache_hash: "abc123" }),
      false
    );
  });

  it("returns false when data matches cache_hash", () => {
    const data = '{"headline":"Hello","color":"#fff"}';
    const hash = generateSceneHash(data);
    assert.equal(hasSceneChanged({ data, cache_hash: hash }), false);
  });

  it("returns true when data differs from cache_hash", () => {
    const originalData = '{"headline":"Hello"}';
    const hash = generateSceneHash(originalData);
    const modifiedData = '{"headline":"Hello World"}';
    assert.equal(hasSceneChanged({ data: modifiedData, cache_hash: hash }), true);
  });

  it("detects changes in nested data", () => {
    const original = JSON.stringify({ headline: "A", style: { color: "red" } });
    const hash = generateSceneHash(original);
    const modified = JSON.stringify({ headline: "A", style: { color: "blue" } });
    assert.equal(hasSceneChanged({ data: modified, cache_hash: hash }), true);
  });

  it("is not fooled by key reordering (JSON is order-sensitive)", () => {
    const data1 = '{"a":1,"b":2}';
    const data2 = '{"b":2,"a":1}';
    const hash = generateSceneHash(data1);
    // Different JSON string = different hash (this is expected since we hash the string)
    assert.equal(hasSceneChanged({ data: data2, cache_hash: hash }), true);
  });
});

// ---------------------------------------------------------------------------
// generateSceneHash
// ---------------------------------------------------------------------------

describe("generateSceneHash", () => {
  it("returns a 16-char hex string", () => {
    const hash = generateSceneHash('{"test":true}');
    assert.equal(hash.length, 16);
    assert.match(hash, /^[0-9a-f]{16}$/);
  });

  it("is deterministic", () => {
    const data = '{"headline":"Test","color":"#000"}';
    assert.equal(generateSceneHash(data), generateSceneHash(data));
  });

  it("produces different hashes for different data", () => {
    assert.notEqual(
      generateSceneHash('{"a":1}'),
      generateSceneHash('{"a":2}')
    );
  });

  it("handles object input by stringifying", () => {
    const hash1 = generateSceneHash({ a: 1 });
    const hash2 = generateSceneHash('{"a":1}');
    assert.equal(hash1, hash2);
  });
});

// ---------------------------------------------------------------------------
// computeSceneRenderProgress — SSE progress → per-scene progress map
// ---------------------------------------------------------------------------

describe("computeSceneRenderProgress", () => {
  it("returns undefined when no progress data and no single-scene render", () => {
    assert.equal(computeSceneRenderProgress(null, null), undefined);
  });

  it("returns undefined for empty progressData", () => {
    assert.equal(computeSceneRenderProgress({}, null), undefined);
  });

  it("maps completed scenes to 100%", () => {
    const progress = computeSceneRenderProgress(
      { scenes: [{ id: 1, status: "completed", progress: 100 }] },
      null
    );
    assert.equal(progress.get(1), 100);
  });

  it("maps cached scenes to 100%", () => {
    const progress = computeSceneRenderProgress(
      { scenes: [{ id: 2, status: "cached" }] },
      null
    );
    assert.equal(progress.get(2), 100);
  });

  it("maps rendering scenes to their progress value", () => {
    const progress = computeSceneRenderProgress(
      { scenes: [{ id: 3, status: "rendering", progress: 42 }] },
      null
    );
    assert.equal(progress.get(3), 42);
  });

  it("defaults rendering scenes with no progress to 0", () => {
    const progress = computeSceneRenderProgress(
      { scenes: [{ id: 4, status: "rendering" }] },
      null
    );
    assert.equal(progress.get(4), 0);
  });

  it("excludes pending scenes from the map", () => {
    const progress = computeSceneRenderProgress(
      {
        scenes: [
          { id: 1, status: "completed", progress: 100 },
          { id: 2, status: "pending" },
        ],
      },
      null
    );
    assert.equal(progress.has(1), true);
    assert.equal(progress.has(2), false);
  });

  it("shows single-scene render as 50% (indeterminate)", () => {
    const progress = computeSceneRenderProgress(null, 5);
    assert.equal(progress.get(5), 50);
  });

  it("SSE data takes priority over single-scene render", () => {
    const progress = computeSceneRenderProgress(
      { scenes: [{ id: 5, status: "rendering", progress: 75 }] },
      5
    );
    // SSE says 75%, so single-scene 50% should not override
    assert.equal(progress.get(5), 75);
  });

  it("handles mixed statuses correctly", () => {
    const progress = computeSceneRenderProgress(
      {
        scenes: [
          { id: 1, status: "completed", progress: 100 },
          { id: 2, status: "rendering", progress: 30 },
          { id: 3, status: "pending" },
          { id: 4, status: "cached" },
        ],
      },
      null
    );
    assert.equal(progress.get(1), 100);
    assert.equal(progress.get(2), 30);
    assert.equal(progress.has(3), false);
    assert.equal(progress.get(4), 100);
  });
});

// ---------------------------------------------------------------------------
// getZebraStripeStyle — visual indicators for scene state
// ---------------------------------------------------------------------------

describe("getZebraStripeStyle", () => {
  it("returns empty object when rendered and no changes", () => {
    const style = getZebraStripeStyle(false, false);
    assert.deepEqual(style, {});
  });

  it("returns white stripes for unrendered scene without changes", () => {
    const style = getZebraStripeStyle(true, false);
    assert.ok(style.backgroundImage, "Should have backgroundImage");
    assert.ok(
      style.backgroundImage.includes("rgba(255, 255, 255, 0.15)"),
      "Should use white stripe color"
    );
  });

  it("returns yellow stripes when scene has changes", () => {
    const style = getZebraStripeStyle(false, true);
    assert.ok(
      style.backgroundImage.includes("rgba(255, 180, 0, 0.3)"),
      "Should use yellow stripe color for changes"
    );
  });

  it("yellow stripes take priority when both unrendered and changed", () => {
    const style = getZebraStripeStyle(true, true);
    assert.ok(
      style.backgroundImage.includes("rgba(255, 180, 0, 0.3)"),
      "hasChanges should take priority (yellow stripes)"
    );
  });
});

// ---------------------------------------------------------------------------
// scenesNeedingRender — which scenes should be re-rendered
// ---------------------------------------------------------------------------

describe("scenesNeedingRender", () => {
  it("includes scenes with no cache_path", () => {
    const scenes = [
      { id: 1, cache_path: null, cache_hash: null, data: null },
      { id: 2, cache_path: "/cache/s2.mp4", cache_hash: "abc", data: null },
    ];
    const result = scenesNeedingRender(scenes);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 1);
  });

  it("includes scenes in changedSceneIds set", () => {
    const scenes = [
      { id: 1, cache_path: "/cache/s1.mp4", cache_hash: null, data: null },
      { id: 2, cache_path: "/cache/s2.mp4", cache_hash: null, data: null },
    ];
    const changed = new Set([2]);
    const result = scenesNeedingRender(scenes, changed);
    assert.equal(result.length, 2); // Both: 1 has null cache_hash, 2 is in changed set
  });

  it("includes scenes with stale cache_hash", () => {
    const data = '{"headline":"Original"}';
    const hash = generateSceneHash(data);
    const scenes = [
      {
        id: 1,
        cache_path: "/cache/s1.mp4",
        cache_hash: hash,
        data: '{"headline":"Modified"}',
      },
    ];
    const result = scenesNeedingRender(scenes);
    assert.equal(result.length, 1, "Scene with stale hash should need render");
  });

  it("excludes scenes with matching cache_hash and not in changed set", () => {
    const data = '{"headline":"Hello"}';
    const hash = generateSceneHash(data);
    const scenes = [
      { id: 1, cache_path: "/cache/s1.mp4", cache_hash: hash, data },
    ];
    const result = scenesNeedingRender(scenes);
    assert.equal(result.length, 0, "Up-to-date scene should not need render");
  });

  it("handles empty scenes array", () => {
    assert.deepEqual(scenesNeedingRender([]), []);
  });

  it("handles missing changedSceneIds", () => {
    const scenes = [
      { id: 1, cache_path: "/x.mp4", cache_hash: null, data: null },
    ];
    // No changedSceneIds arg → defaults to empty set
    const result = scenesNeedingRender(scenes);
    assert.equal(result.length, 1); // cache_hash is null → needs render
  });
});

// ---------------------------------------------------------------------------
// getSceneVisualState — combined visual state for a scene block
// ---------------------------------------------------------------------------

describe("getSceneVisualState", () => {
  it("fresh scene (never rendered): zebra stripes + render button, no modified badge", () => {
    const scene = { cache_path: null, cache_hash: null, data: '{"x":1}' };
    const state = getSceneVisualState(scene, false, undefined);

    assert.equal(state.isUnrendered, true);
    assert.equal(state.showZebraStripes, true);
    assert.equal(state.showRenderButton, true);
    assert.equal(state.showModifiedBadge, false, "Unrendered scenes show stripes not badge");
    assert.equal(state.showProgressBar, false);
  });

  it("rendered scene with no changes: no indicators", () => {
    const data = '{"headline":"Hello"}';
    const hash = generateSceneHash(data);
    const scene = { cache_path: "/cache/s1.mp4", cache_hash: hash, data };
    const state = getSceneVisualState(scene, false, undefined);

    assert.equal(state.isUnrendered, false);
    assert.equal(state.hasChanges, false);
    assert.equal(state.showZebraStripes, false);
    assert.equal(state.showRenderButton, false);
    assert.equal(state.showModifiedBadge, false);
    assert.equal(state.showProgressBar, false);
    assert.deepEqual(state.zebraStyle, {});
  });

  it("rendered scene marked as changed: yellow stripes + modified badge", () => {
    const data = '{"headline":"Hello"}';
    const hash = generateSceneHash(data);
    const scene = { cache_path: "/cache/s1.mp4", cache_hash: hash, data };
    const state = getSceneVisualState(scene, true, undefined);

    assert.equal(state.hasChanges, true);
    assert.equal(state.showZebraStripes, true);
    assert.equal(state.showModifiedBadge, true);
    assert.equal(state.showRenderButton, true);
    assert.ok(
      state.zebraStyle.backgroundImage?.includes("rgba(255, 180, 0"),
      "Should show yellow stripes"
    );
  });

  it("rendered scene with stale cache_hash: detected as changed", () => {
    const scene = {
      cache_path: "/cache/s1.mp4",
      cache_hash: "old_hash",
      data: '{"headline":"New content"}',
    };
    const state = getSceneVisualState(scene, false, undefined);

    assert.equal(state.hasChanges, true, "Stale hash should be detected as changed");
    assert.equal(state.showModifiedBadge, true);
    assert.equal(state.showRenderButton, true);
  });

  it("scene currently rendering: shows progress bar", () => {
    const scene = { cache_path: null, cache_hash: null, data: '{"x":1}' };
    const state = getSceneVisualState(scene, false, 45);

    assert.equal(state.showProgressBar, true);
    assert.equal(state.showZebraStripes, true); // Still unrendered
  });

  it("render complete (progress 100): progress bar still shown until scene reloads", () => {
    const scene = { cache_path: null, cache_hash: null, data: '{"x":1}' };
    const state = getSceneVisualState(scene, false, 100);

    assert.equal(state.showProgressBar, true);
    // After loadData() refreshes scenes with cache_path set, this will clear
  });

  it("render complete and scene reloaded: clean state", () => {
    const data = '{"x":1}';
    const hash = generateSceneHash(data);
    const scene = { cache_path: "/cache/done.mp4", cache_hash: hash, data };
    const state = getSceneVisualState(scene, false, undefined);

    assert.equal(state.isUnrendered, false);
    assert.equal(state.hasChanges, false);
    assert.equal(state.showZebraStripes, false);
    assert.equal(state.showProgressBar, false);
    assert.equal(state.showRenderButton, false);
    assert.equal(state.showModifiedBadge, false);
  });
});

// ---------------------------------------------------------------------------
// Full lifecycle scenarios
// ---------------------------------------------------------------------------

describe("Scene render lifecycle", () => {
  it("fresh → edit → render → complete", () => {
    const changedIds = new Set();

    // 1. Fresh scene (just created)
    let scene = { id: 1, cache_path: null, cache_hash: null, data: null };
    let state = getSceneVisualState(scene, changedIds.has(1), undefined);
    assert.equal(state.isUnrendered, true, "Step 1: should be unrendered");
    assert.equal(state.showRenderButton, true);

    // 2. User adds content
    scene = { ...scene, data: '{"headline":"My Scene"}' };
    state = getSceneVisualState(scene, changedIds.has(1), undefined);
    assert.equal(state.isUnrendered, true, "Step 2: still unrendered");

    // 3. Render starts
    state = getSceneVisualState(scene, changedIds.has(1), 0);
    assert.equal(state.showProgressBar, true, "Step 3: progress bar visible");

    // 4. Render progresses
    state = getSceneVisualState(scene, changedIds.has(1), 50);
    assert.equal(state.showProgressBar, true, "Step 4: progress at 50%");

    // 5. Render completes — scene reloaded with cache
    const hash = generateSceneHash(scene.data);
    scene = { ...scene, cache_path: "/cache/s1.mp4", cache_hash: hash };
    state = getSceneVisualState(scene, changedIds.has(1), undefined);
    assert.equal(state.isUnrendered, false, "Step 5: rendered");
    assert.equal(state.hasChanges, false, "Step 5: no changes");
    assert.equal(state.showZebraStripes, false, "Step 5: no stripes");
  });

  it("rendered → edit → re-render → complete", () => {
    const changedIds = new Set();

    // 1. Fully rendered scene
    const origData = '{"headline":"Hello"}';
    const origHash = generateSceneHash(origData);
    let scene = {
      id: 1,
      cache_path: "/cache/s1.mp4",
      cache_hash: origHash,
      data: origData,
    };
    let state = getSceneVisualState(scene, changedIds.has(1), undefined);
    assert.equal(state.showZebraStripes, false, "Step 1: clean");

    // 2. User edits content — markSceneChanged called
    changedIds.add(1);
    state = getSceneVisualState(scene, changedIds.has(1), undefined);
    assert.equal(state.hasChanges, true, "Step 2: marked changed");
    assert.equal(state.showModifiedBadge, true, "Step 2: shows modified badge");

    // 3. User saves — cache cleared, changed cleared, render triggered
    scene = { ...scene, data: '{"headline":"Updated"}', cache_path: null, cache_hash: null };
    changedIds.delete(1);
    state = getSceneVisualState(scene, changedIds.has(1), undefined);
    assert.equal(state.isUnrendered, true, "Step 3: cache cleared");
    assert.equal(state.showRenderButton, true, "Step 3: render button shown");

    // 4. Render in progress
    state = getSceneVisualState(scene, changedIds.has(1), 60);
    assert.equal(state.showProgressBar, true, "Step 4: progress bar");

    // 5. Render complete
    const newHash = generateSceneHash(scene.data);
    scene = { ...scene, cache_path: "/cache/s1-v2.mp4", cache_hash: newHash };
    state = getSceneVisualState(scene, changedIds.has(1), undefined);
    assert.equal(state.showZebraStripes, false, "Step 5: clean again");
    assert.equal(state.showModifiedBadge, false, "Step 5: no badge");
  });

  it("page refresh with stale cache detects changes", () => {
    // Simulate: scene was edited on server but cache_hash is from old data
    const oldData = '{"headline":"Old"}';
    const oldHash = generateSceneHash(oldData);
    const scene = {
      id: 1,
      cache_path: "/cache/s1.mp4",
      cache_hash: oldHash,
      data: '{"headline":"New"}', // Data changed but cache_hash is stale
    };

    // After page refresh, changedSceneIds is empty (ephemeral set)
    const state = getSceneVisualState(scene, false, undefined);
    assert.equal(
      state.hasChanges,
      true,
      "Should detect stale cache via hash comparison even without changedSceneIds"
    );
    assert.equal(state.showModifiedBadge, true);
    assert.equal(state.showRenderButton, true);
  });

  it("page refresh with null cache_hash shows as unrendered", () => {
    // Many render paths store null for cache_hash — scene shows as unrendered
    const scene = {
      id: 1,
      cache_path: "/cache/s1.mp4",
      cache_hash: null,
      data: '{"headline":"Hello"}',
    };
    const state = getSceneVisualState(scene, false, undefined);
    // cache_path exists but cache_hash is null → hasSceneChanged returns true
    assert.equal(state.hasChanges, true,
      "null cache_hash should be treated as changed/unknown");
    assert.equal(state.isUnrendered, false, "cache_path exists so not unrendered");
    assert.equal(state.showModifiedBadge, true);
  });
});

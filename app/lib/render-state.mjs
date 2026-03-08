/**
 * Pure state logic for render progress, scene change detection, and visual indicators.
 *
 * Extracted from React components so it's testable without a browser.
 * Source components: useTimeline.ts, SceneBlock.tsx, timeline-utils.ts, videos/[id]/page.tsx
 */

import { createHash } from "node:crypto";

/**
 * Generate a hash for scene content to detect changes.
 * Mirrors server/scene-renderer.mjs generateSceneHash but simplified for client-side.
 * Hashes the scene data JSON to compare against stored cache_hash.
 */
export function generateSceneHash(sceneData) {
  const content =
    typeof sceneData === "string" ? sceneData : JSON.stringify(sceneData);
  return createHash("sha256").update(content).digest("hex").substring(0, 16);
}

/**
 * Determine if a scene's data has changed since it was last cached.
 *
 * Returns true if the scene needs re-rendering:
 * - No cache_hash stored → never been rendered
 * - No data → can't have changed (nothing to render)
 * - data hash differs from stored cache_hash → data changed since last render
 */
export function hasSceneChanged(scene) {
  if (!scene.cache_hash) return true; // Never rendered or hash not stored
  if (!scene.data) return false; // No data to change

  const currentHash = generateSceneHash(scene.data);
  return currentHash !== scene.cache_hash;
}

/**
 * Compute per-scene render progress from SSE progress data and single-scene render state.
 *
 * @param {object|null} progressData - SSE payload with .scenes array
 * @param {number|null} renderingSceneId - Scene ID being rendered individually
 * @returns {Map<number, number>|undefined} - Map of sceneId → progress (0-100), or undefined if empty
 */
export function computeSceneRenderProgress(progressData, renderingSceneId) {
  const map = new Map();

  // SSE bulk render progress
  if (progressData?.scenes) {
    for (const s of progressData.scenes) {
      if (s.status === "cached" || s.status === "completed") {
        map.set(s.id, 100);
      } else if (s.status === "rendering") {
        map.set(s.id, s.progress || 0);
      }
      // 'pending' scenes are not in the map (no fill)
    }
  }

  // Single-scene render (indeterminate progress shown as 50%)
  if (renderingSceneId != null && !map.has(renderingSceneId)) {
    map.set(renderingSceneId, 50);
  }

  return map.size > 0 ? map : undefined;
}

/**
 * Compute zebra stripe CSS style for a scene block.
 *
 * @param {boolean} isUnrendered - Scene has no cache_path
 * @param {boolean} hasChanges - Scene is in changedSceneIds set
 * @returns {object} CSS properties for the stripe pattern
 */
export function getZebraStripeStyle(isUnrendered, hasChanges) {
  if (!isUnrendered && !hasChanges) return {};

  const stripeColor = hasChanges
    ? "rgba(255, 180, 0, 0.3)" // Yellow for changes
    : "rgba(255, 255, 255, 0.15)"; // White for unrendered

  return {
    backgroundImage: `repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 4px,
      ${stripeColor} 4px,
      ${stripeColor} 8px
    )`,
  };
}

/**
 * Determine which scenes need rendering.
 *
 * A scene needs rendering if:
 * - It has no cache_path (never rendered or cache cleared)
 * - It's in the changedSceneIds set (edited since last render)
 * - Its data hash doesn't match cache_hash (stale cache detected)
 *
 * @param {Array} scenes - Scene objects with id, cache_path, cache_hash, data
 * @param {Set<number>} changedSceneIds - Scene IDs marked as changed in-memory
 * @returns {Array} Scenes that need rendering
 */
export function scenesNeedingRender(scenes, changedSceneIds = new Set()) {
  return scenes.filter(
    (scene) =>
      !scene.cache_path ||
      changedSceneIds.has(scene.id) ||
      hasSceneChanged(scene)
  );
}

/**
 * Determine the visual state of a scene block.
 *
 * @param {object} scene - Scene object
 * @param {boolean} isInChangedSet - Whether scene.id is in changedSceneIds
 * @param {number|undefined} renderProgress - Render progress 0-100 or undefined
 * @returns {object} Visual state flags
 */
export function getSceneVisualState(scene, isInChangedSet, renderProgress) {
  const isUnrendered = !scene.cache_path;
  const hasDataChanged = hasSceneChanged(scene);
  const hasChanges = isInChangedSet || hasDataChanged;

  return {
    isUnrendered,
    hasChanges,
    showZebraStripes: isUnrendered || hasChanges,
    showProgressBar: renderProgress != null && renderProgress >= 0,
    showRenderButton: isUnrendered || hasChanges,
    showModifiedBadge: hasChanges && !isUnrendered,
    zebraStyle: getZebraStripeStyle(isUnrendered, hasChanges),
  };
}

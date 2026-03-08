/**
 * Timeline utility functions for frame/pixel/time conversions
 */

export const FPS = 30;
export const ZOOM_SCALE = 1; // 1:1 — zoom value = pixels per second
export const DEFAULT_ZOOM = 80; // 100% in UI (80 px/s)
export const MIN_ZOOM = 20;    // 25% in UI
export const MAX_ZOOM = 600;   // 750% in UI
export const SNAP_GRID_FRAMES = 15; // 0.5 second snap (default)

// Track types for multi-track timeline
export type TrackType = 'video' | 'b-roll' | 'audio' | 'background';

export interface Track {
  id: TrackType;
  label: string;
  height: number;
}

export const TRACKS: Track[] = [
  { id: 'video', label: 'Video', height: 60 },
  { id: 'background', label: 'BG FX', height: 40 },
  { id: 'b-roll', label: 'B-Roll', height: 50 },
  { id: 'audio', label: 'Audio', height: 40 },
];

/**
 * Convert frame number to pixel position
 */
export function frameToPixel(frame: number, zoom: number): number {
  return (frame / FPS) * zoom * ZOOM_SCALE;
}

/**
 * Convert pixel position to frame number
 */
export function pixelToFrame(pixel: number, zoom: number): number {
  return Math.round((pixel / (zoom * ZOOM_SCALE)) * FPS);
}

/**
 * Convert frame number to time string (MM:SS)
 */
export function frameToTime(frame: number): string {
  const seconds = Math.floor(frame / FPS);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert frame number to time with frames (MM:SS:FF)
 */
export function frameToTimeWithFrames(frame: number): string {
  const totalSeconds = Math.floor(frame / FPS);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const frames = frame % FPS;
  return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

/**
 * Convert seconds to frame number
 */
export function secondsToFrame(seconds: number): number {
  return Math.round(seconds * FPS);
}

/**
 * Convert frame number to seconds
 */
export function frameToSeconds(frame: number): number {
  return frame / FPS;
}

/**
 * Get snap grid size based on zoom level
 * More zoomed in = finer snap grid
 */
export function getSnapGridSize(zoom: number, snapEnabled: boolean): number {
  if (!snapEnabled) return 1; // Snap to individual frames

  if (zoom >= 400) return 1;      // Frame-level at very high zoom
  if (zoom >= 200) return 5;      // 5 frames
  if (zoom >= 100) return 15;     // 0.5 seconds
  if (zoom >= 50) return 30;      // 1 second
  return 60;                       // 2 seconds at low zoom
}

/**
 * Snap frame to grid
 */
export function snapToGrid(frame: number, gridSize: number): number {
  if (gridSize <= 1) return frame;
  return Math.round(frame / gridSize) * gridSize;
}

/**
 * Calculate total duration in frames from scenes
 */
export function calculateTotalFrames(scenes: { start_frame: number; end_frame: number }[]): number {
  if (scenes.length === 0) return 0;
  return Math.max(...scenes.map(s => s.end_frame));
}

/**
 * Calculate timeline width based on total frames and zoom
 */
export function calculateTimelineWidth(totalFrames: number, zoom: number, padding: number = 100): number {
  return frameToPixel(totalFrames, zoom) + padding;
}

/**
 * Generate time ruler markers - more granular at high zoom
 */
export function generateRulerMarkers(
  totalFrames: number,
  zoom: number
): { frame: number; label: string; isMajor: boolean; isFrame?: boolean }[] {
  const markers: { frame: number; label: string; isMajor: boolean; isFrame?: boolean }[] = [];

  // Determine marker interval based on zoom level (pixels per second).
  // Target: major tick labels spaced ~80-150px apart, minor ticks ~20-40px.
  const pxPerSec = zoom * ZOOM_SCALE;
  let majorInterval: number;
  let minorInterval: number;
  let showFrames = false;

  if (pxPerSec < 15) {
    majorInterval = FPS * 30; // Every 30 seconds
    minorInterval = FPS * 10; // Every 10 seconds
  } else if (pxPerSec < 40) {
    majorInterval = FPS * 10; // Every 10 seconds
    minorInterval = FPS * 5;  // Every 5 seconds
  } else if (pxPerSec < 80) {
    majorInterval = FPS * 5;  // Every 5 seconds
    minorInterval = FPS;      // Every second
  } else if (pxPerSec < 160) {
    majorInterval = FPS * 2;  // Every 2 seconds
    minorInterval = FPS;      // Every second
  } else if (pxPerSec < 300) {
    majorInterval = FPS;      // Every second
    minorInterval = FPS / 2;  // Every 0.5 seconds
  } else if (pxPerSec < 500) {
    majorInterval = FPS / 2;  // Every 0.5 seconds
    minorInterval = FPS / 6;  // Every 5 frames
    showFrames = true;
  } else {
    majorInterval = FPS / 6;  // Every 5 frames
    minorInterval = 1;        // Every frame
    showFrames = true;
  }

  for (let frame = 0; frame <= totalFrames + majorInterval; frame += minorInterval) {
    const isMajor = frame % majorInterval === 0;
    let label = '';

    if (isMajor) {
      label = frameToTime(frame);
    } else if (showFrames && minorInterval <= 5) {
      label = `f${frame % FPS}`;
    }

    markers.push({
      frame,
      label,
      isMajor,
      isFrame: showFrames && !isMajor,
    });
  }

  return markers;
}

/**
 * Get scene at a specific frame
 */
export function getSceneAtFrame(
  scenes: { id: number; start_frame: number; end_frame: number }[],
  frame: number
): { id: number; start_frame: number; end_frame: number } | null {
  return scenes.find(s => frame >= s.start_frame && frame < s.end_frame) || null;
}

/**
 * Calculate scene duration in frames
 */
export function getSceneDuration(scene: { start_frame: number; end_frame: number }): number {
  return scene.end_frame - scene.start_frame;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format duration as human-readable string
 */
export function formatDuration(frames: number): string {
  const seconds = frames / FPS;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

/**
 * Compute sequential layout for scenes.
 * Returns scenes with recomputed start_frame/end_frame in sequence.
 * Optionally moves dragSceneId to targetIndex for preview during drag.
 */
export function computeSequentialLayout<T extends { id: number; start_frame: number; end_frame: number; scene_number: number }>(
  scenes: T[],
  dragSceneId?: number,
  targetIndex?: number,
): T[] {
  const sorted = [...scenes].sort((a, b) => a.scene_number - b.scene_number);

  if (dragSceneId !== undefined && targetIndex !== undefined) {
    // Remove dragged scene, layout the rest sequentially,
    // then place dragged scene at the gap position (for insertion line calc)
    const dragIdx = sorted.findIndex(s => s.id === dragSceneId);
    if (dragIdx !== -1) {
      const [dragged] = sorted.splice(dragIdx, 1);
      const insertIdx = Math.min(Math.max(0, targetIndex), sorted.length);

      // Layout non-dragged scenes sequentially
      let runningFrame = 0;
      const result: T[] = [];
      for (let i = 0; i < sorted.length; i++) {
        if (i === insertIdx) {
          // Reserve the insertion point frame for the dragged scene marker
          // but don't add gap - the dragged scene floats freely
        }
        const duration = sorted[i].end_frame - sorted[i].start_frame;
        result.push({
          ...sorted[i],
          start_frame: runningFrame,
          end_frame: runningFrame + duration,
          scene_number: i >= insertIdx ? i + 1 : i,
        });
        runningFrame += duration;
      }

      // Add dragged scene with its insertion-point position (used for insertion line)
      const insertFrame = insertIdx < result.length
        ? result[insertIdx].start_frame
        : runningFrame;
      const dragDuration = dragged.end_frame - dragged.start_frame;
      result.push({
        ...dragged,
        start_frame: insertFrame,
        end_frame: insertFrame + dragDuration,
        scene_number: insertIdx,
      });

      return result;
    }
  }

  // No drag: simple sequential layout
  let runningFrame = 0;
  return sorted.map((scene, index) => {
    const duration = scene.end_frame - scene.start_frame;
    const result = {
      ...scene,
      start_frame: runningFrame,
      end_frame: runningFrame + duration,
      scene_number: index,
    };
    runningFrame += duration;
    return result;
  });
}

/**
 * Find the target insertion index based on cursor frame position
 * among the sorted scenes (excluding the dragged scene).
 */
export function findDropTargetIndex<T extends { id: number; start_frame: number; end_frame: number }>(
  scenes: T[],
  dragSceneId: number,
  cursorFrame: number,
): number {
  const others = scenes.filter(s => s.id !== dragSceneId);
  if (others.length === 0) return 0;

  for (let i = 0; i < others.length; i++) {
    const midpoint = (others[i].start_frame + others[i].end_frame) / 2;
    if (cursorFrame < midpoint) return i;
  }
  return others.length;
}

/**
 * Simple fast hash for client-side scene data comparison.
 * Not cryptographic — just needs to detect data changes reliably.
 * Produces a 16-char hex string to match server's generateSceneHash format.
 */
function simpleHash(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = (h2 >>> 0) * 0x100000000 + (h1 >>> 0);
  return combined.toString(16).padStart(16, '0');
}

/**
 * Check if scene data has changed since last render.
 *
 * Uses client-side hash comparison. Note: the client hash algorithm differs
 * from the server's SHA-256 hash, so this only works when cache_hash was set
 * using the same client-side hash. For server-set cache_hash (SHA-256),
 * a mismatch will cause this to return true (safe — just means we show
 * the scene as needing re-render, which the user can verify).
 */
export function hasSceneChanged(scene: { data: string | null; cache_hash: string | null }): boolean {
  if (!scene.cache_hash) return true; // Never rendered or hash not stored
  if (!scene.data) return false;

  const currentHash = simpleHash(scene.data);
  return currentHash !== scene.cache_hash;
}

/**
 * Calculate color for scene block based on scene type
 */
export function getSceneTypeColor(sceneType: string): string {
  const colors: Record<string, string> = {
    'text-only': 'hsl(38 70% 50%)',
    'quote': 'hsl(45 70% 55%)',
    'stats': 'hsl(200 70% 55%)',
    'single-image': 'hsl(160 60% 45%)',
    'dual-images': 'hsl(160 60% 45%)',
    'grid-2x2': 'hsl(160 60% 45%)',
    'image-gallery': 'hsl(160 60% 45%)',
    'line-chart': 'hsl(280 60% 55%)',
    'bar-chart': 'hsl(280 60% 55%)',
    'pie-chart': 'hsl(280 60% 55%)',
    'area-chart': 'hsl(280 60% 55%)',
    'progress-bars': 'hsl(280 60% 55%)',
    'equation': 'hsl(340 60% 55%)',
    'spotlights': 'hsl(30 70% 50%)',
  };
  return colors[sceneType] || 'hsl(38 70% 50%)';
}

/**
 * Get zebra stripe pattern for unrendered/changed scenes
 */
export function getZebraStripeStyle(isUnrendered: boolean, hasChanges: boolean): React.CSSProperties {
  if (!isUnrendered && !hasChanges) return {};

  const stripeColor = hasChanges
    ? 'rgba(255, 180, 0, 0.3)' // Yellow for changes
    : 'rgba(255, 255, 255, 0.15)'; // White for unrendered

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

/**
 * Timeline utility functions for frame/pixel/time conversions
 */

export const FPS = 30;
export const DEFAULT_ZOOM = 80; // pixels per second
export const MIN_ZOOM = 10;  // Allow much more zoom out
export const MAX_ZOOM = 600; // Allow much more zoom in for frame-level editing
export const SNAP_GRID_FRAMES = 15; // 0.5 second snap (default)

// Track types for multi-track timeline
export type TrackType = 'video' | 'audio' | 'background';

export interface Track {
  id: TrackType;
  label: string;
  height: number;
}

export const TRACKS: Track[] = [
  { id: 'video', label: 'Video', height: 60 },
  { id: 'audio', label: 'Audio', height: 40 },
  { id: 'background', label: 'BG FX', height: 40 },
];

/**
 * Convert frame number to pixel position
 */
export function frameToPixel(frame: number, zoom: number): number {
  return (frame / FPS) * zoom;
}

/**
 * Convert pixel position to frame number
 */
export function pixelToFrame(pixel: number, zoom: number): number {
  return Math.round((pixel / zoom) * FPS);
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

  // Determine marker interval based on zoom level
  let majorInterval: number;
  let minorInterval: number;
  let showFrames = false;

  if (zoom < 20) {
    majorInterval = FPS * 30; // Every 30 seconds
    minorInterval = FPS * 10; // Every 10 seconds
  } else if (zoom < 50) {
    majorInterval = FPS * 10; // Every 10 seconds
    minorInterval = FPS * 5;  // Every 5 seconds
  } else if (zoom < 100) {
    majorInterval = FPS * 5;  // Every 5 seconds
    minorInterval = FPS;      // Every second
  } else if (zoom < 200) {
    majorInterval = FPS * 2;  // Every 2 seconds
    minorInterval = FPS / 2;  // Every 0.5 seconds
  } else if (zoom < 400) {
    majorInterval = FPS;      // Every second
    minorInterval = FPS / 6;  // Every 5 frames
    showFrames = true;
  } else {
    majorInterval = FPS / 2;  // Every 0.5 seconds
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
 * Check if scene data has changed since last render
 */
export function hasSceneChanged(scene: { data: string | null; cache_hash: string | null }): boolean {
  if (!scene.cache_hash) return true; // Never rendered
  if (!scene.data) return false;

  // Simple hash comparison - if data exists but hash is from old data, it's changed
  // In a real implementation, we'd compute a hash of the current data
  return false; // Placeholder - actual implementation would compare hashes
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

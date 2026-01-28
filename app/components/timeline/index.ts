// Timeline Editor Components
export { TimelineEditor } from './TimelineEditor';
export { TimelineHeader } from './TimelineHeader';
export { TimelineContainer } from './TimelineContainer';
export { TimelineTrack } from './TimelineTrack';
export { TimeRuler } from './TimeRuler';
export { Playhead } from './Playhead';
export { SceneBlock } from './SceneBlock';
export { TransitionIndicator } from './TransitionIndicator';
export { SidePanel } from './SidePanel';
export { SceneEditor } from './SceneEditor';
export { TransitionEditor } from './TransitionEditor';

// Hooks
export { useTimeline } from './hooks/useTimeline';
export type { TimelineState, UseTimelineOptions } from './hooks/useTimeline';

// Utilities
export {
  FPS,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  SNAP_GRID_FRAMES,
  TRACKS,
  frameToPixel,
  pixelToFrame,
  frameToTime,
  frameToTimeWithFrames,
  secondsToFrame,
  frameToSeconds,
  getSnapGridSize,
  snapToGrid,
  calculateTotalFrames,
  calculateTimelineWidth,
  generateRulerMarkers,
  getSceneAtFrame,
  getSceneDuration,
  clamp,
  formatDuration,
  hasSceneChanged,
  getSceneTypeColor,
  getZebraStripeStyle,
} from './lib/timeline-utils';

export type { TrackType, Track } from './lib/timeline-utils';

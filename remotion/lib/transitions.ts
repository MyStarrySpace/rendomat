/**
 * Transition System
 *
 * Defines transition types and configurations for scene-to-scene transitions.
 * Transitions are rendered as separate clips and stitched between scenes.
 */

import { spring, interpolate } from 'remotion';

// =============================================================================
// TRANSITION TYPES
// =============================================================================

export type TransitionType =
  | 'none'           // Hard cut, no transition
  | 'crossfade'      // Dissolve between scenes
  | 'fade-black'     // Fade to black, then fade in
  | 'fade-white'     // Fade to white, then fade in
  | 'slide-left'     // Scene B slides in from right
  | 'slide-right'    // Scene B slides in from left
  | 'slide-up'       // Scene B slides in from bottom
  | 'slide-down'     // Scene B slides in from top
  | 'wipe-left'      // Wipe reveal from right to left
  | 'wipe-right'     // Wipe reveal from left to right
  | 'wipe-up'        // Wipe reveal from bottom to top
  | 'wipe-down'      // Wipe reveal from top to bottom
  | 'zoom-in'        // Zoom into scene A, reveal scene B
  | 'zoom-out'       // Zoom out from scene B
  | 'blur'           // Blur out A, blur in B
  | 'glitch'         // Digital glitch effect
  | 'morph'          // Shape morph transition
  | 'flash'          // Bright white flash at midpoint
  | 'spin'           // Rotate + shrink/grow swap
  | 'flip'           // 3D card flip (rotateY)
  | 'pixelate'       // Crossfade with pixelation filter
  | 'iris-close'     // Shrinking circle reveals scene B
  | 'clock-wipe'     // Radial conic-gradient sweep
  | 'push-left';     // Both scenes slide left together

export interface TransitionConfig {
  type: TransitionType;
  durationFrames: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  // Type-specific options
  color?: string;          // For fade-black/fade-white
  direction?: number;      // For directional transitions (degrees)
  intensity?: number;      // For glitch/blur (0-1)
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

export const DEFAULT_TRANSITION_DURATION = 15; // 0.5 seconds at 30fps

export const TRANSITION_PRESETS: Record<TransitionType, Omit<TransitionConfig, 'type'>> = {
  'none': {
    durationFrames: 0,
  },
  'crossfade': {
    durationFrames: 20,
    easing: 'ease-in-out',
  },
  'fade-black': {
    durationFrames: 30,
    easing: 'ease-in-out',
    color: '#000000',
  },
  'fade-white': {
    durationFrames: 30,
    easing: 'ease-in-out',
    color: '#ffffff',
  },
  'slide-left': {
    durationFrames: 20,
    easing: 'spring',
  },
  'slide-right': {
    durationFrames: 20,
    easing: 'spring',
  },
  'slide-up': {
    durationFrames: 20,
    easing: 'spring',
  },
  'slide-down': {
    durationFrames: 20,
    easing: 'spring',
  },
  'wipe-left': {
    durationFrames: 18,
    easing: 'ease-out',
  },
  'wipe-right': {
    durationFrames: 18,
    easing: 'ease-out',
  },
  'wipe-up': {
    durationFrames: 18,
    easing: 'ease-out',
  },
  'wipe-down': {
    durationFrames: 18,
    easing: 'ease-out',
  },
  'zoom-in': {
    durationFrames: 24,
    easing: 'ease-in',
  },
  'zoom-out': {
    durationFrames: 24,
    easing: 'ease-out',
  },
  'blur': {
    durationFrames: 24,
    easing: 'ease-in-out',
    intensity: 0.8,
  },
  'glitch': {
    durationFrames: 12,
    easing: 'linear',
    intensity: 0.6,
  },
  'morph': {
    durationFrames: 30,
    easing: 'spring',
  },
  'flash': {
    durationFrames: 12,
    easing: 'ease-in-out',
  },
  'spin': {
    durationFrames: 24,
    easing: 'ease-in-out',
  },
  'flip': {
    durationFrames: 24,
    easing: 'ease-in-out',
  },
  'pixelate': {
    durationFrames: 20,
    easing: 'ease-in-out',
  },
  'iris-close': {
    durationFrames: 24,
    easing: 'ease-in-out',
  },
  'clock-wipe': {
    durationFrames: 24,
    easing: 'ease-out',
  },
  'push-left': {
    durationFrames: 20,
    easing: 'spring',
  },
};

// =============================================================================
// TRANSITION LABELS & DESCRIPTIONS (for UI)
// =============================================================================

export const TRANSITION_LABELS: Record<TransitionType, string> = {
  'none': 'Cut',
  'crossfade': 'Crossfade',
  'fade-black': 'Fade to Black',
  'fade-white': 'Fade to White',
  'slide-left': 'Slide Left',
  'slide-right': 'Slide Right',
  'slide-up': 'Slide Up',
  'slide-down': 'Slide Down',
  'wipe-left': 'Wipe Left',
  'wipe-right': 'Wipe Right',
  'wipe-up': 'Wipe Up',
  'wipe-down': 'Wipe Down',
  'zoom-in': 'Zoom In',
  'zoom-out': 'Zoom Out',
  'blur': 'Blur',
  'glitch': 'Glitch',
  'morph': 'Morph',
  'flash': 'Flash',
  'spin': 'Spin',
  'flip': 'Flip',
  'pixelate': 'Pixelate',
  'iris-close': 'Iris Close',
  'clock-wipe': 'Clock Wipe',
  'push-left': 'Push Left',
};

export const TRANSITION_DESCRIPTIONS: Record<TransitionType, string> = {
  'none': 'Instant cut with no transition effect',
  'crossfade': 'Smooth dissolve between scenes',
  'fade-black': 'Fade out to black, then fade in',
  'fade-white': 'Fade out to white, then fade in',
  'slide-left': 'New scene slides in from the right',
  'slide-right': 'New scene slides in from the left',
  'slide-up': 'New scene slides in from the bottom',
  'slide-down': 'New scene slides in from the top',
  'wipe-left': 'Reveal new scene with a left-moving wipe',
  'wipe-right': 'Reveal new scene with a right-moving wipe',
  'wipe-up': 'Reveal new scene with an upward wipe',
  'wipe-down': 'Reveal new scene with a downward wipe',
  'zoom-in': 'Zoom into current scene, reveal new scene',
  'zoom-out': 'New scene zooms out into view',
  'blur': 'Blur transition between scenes',
  'glitch': 'Digital glitch effect',
  'morph': 'Organic shape morphing',
  'flash': 'Bright white flash at midpoint',
  'spin': 'Scene rotates and shrinks, then grows back',
  'flip': '3D card flip between scenes',
  'pixelate': 'Crossfade with pixelation effect',
  'iris-close': 'Shrinking circle reveals new scene',
  'clock-wipe': 'Radial sweep revealing new scene',
  'push-left': 'Both scenes slide left together',
};

export const TRANSITION_CATEGORIES = {
  'Basic': ['none', 'crossfade', 'fade-black', 'fade-white'] as TransitionType[],
  'Slide': ['slide-left', 'slide-right', 'slide-up', 'slide-down'] as TransitionType[],
  'Wipe': ['wipe-left', 'wipe-right', 'wipe-up', 'wipe-down'] as TransitionType[],
  'Cinematic': ['zoom-in', 'zoom-out', 'blur', 'glitch', 'morph'] as TransitionType[],
  'Dynamic': ['flash', 'spin', 'flip', 'pixelate', 'iris-close', 'clock-wipe', 'push-left'] as TransitionType[],
};

// =============================================================================
// TRANSITION DATA MODEL
// =============================================================================

export interface SceneTransition {
  id?: number;
  video_id: number;
  from_scene_id: number;      // Scene before transition
  to_scene_id: number;        // Scene after transition
  transition_type: TransitionType;
  duration_frames: number;
  config?: Partial<TransitionConfig>;  // Optional overrides
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get full transition config with defaults
 */
export function getTransitionConfig(type: TransitionType, overrides?: Partial<TransitionConfig>): TransitionConfig {
  const preset = TRANSITION_PRESETS[type];
  return {
    type,
    ...preset,
    ...overrides,
  };
}

/**
 * Calculate transition progress with easing
 */
export function getTransitionProgress(
  frame: number,
  fps: number,
  config: TransitionConfig
): number {
  const { durationFrames, easing = 'ease-in-out' } = config;

  if (durationFrames === 0) return 1;

  const rawProgress = Math.min(1, Math.max(0, frame / durationFrames));

  switch (easing) {
    case 'linear':
      return rawProgress;
    case 'ease-in':
      return rawProgress * rawProgress;
    case 'ease-out':
      return 1 - Math.pow(1 - rawProgress, 2);
    case 'ease-in-out':
      return rawProgress < 0.5
        ? 2 * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;
    case 'spring':
      return spring({
        frame,
        fps,
        config: { damping: 20, stiffness: 150, mass: 1 },
        durationInFrames: durationFrames,
      });
    default:
      return rawProgress;
  }
}

/**
 * Get all transition types as array
 */
export function getAllTransitionTypes(): TransitionType[] {
  return Object.keys(TRANSITION_PRESETS) as TransitionType[];
}

/**
 * Check if a transition type requires rendering (vs. just a cut)
 */
export function transitionRequiresRender(type: TransitionType): boolean {
  return type !== 'none';
}

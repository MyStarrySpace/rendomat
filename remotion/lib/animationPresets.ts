/**
 * Animation Presets System
 *
 * Multiple animation styles for each scene type.
 * Presets control timing, spring physics, entrance direction, and effects.
 */

import { springConfig } from './motion';

// =============================================================================
// PRESET TYPES
// =============================================================================

export type AnimationPreset =
  | 'minimal'      // Subtle, professional - simple fades
  | 'smooth'       // Gentle, flowing animations
  | 'energetic'    // Bouncy, playful animations
  | 'dramatic'     // Bold, impactful entrances
  | 'elegant'      // Refined, sophisticated timing
  | 'kinetic'      // Fast, dynamic movement
  | 'typewriter'   // Sequential character/word reveals
  | 'cinematic';   // Slow, epic feel

export interface PresetConfig {
  /** Spring configuration key */
  spring: keyof typeof springConfig;
  /** Base delay before animation starts (frames) */
  startDelay: number;
  /** Delay between staggered elements (frames) */
  staggerDelay: number;
  /** Animation distance for translations (pixels) */
  distance: number;
  /** Scale start value for scale animations */
  scaleFrom: number;
  /** Entrance direction */
  direction: 'up' | 'down' | 'left' | 'right' | 'center' | 'random';
  /** Scene fade in duration (frames) */
  fadeInFrames: number;
  /** Scene fade out duration (frames) */
  fadeOutFrames: number;
  /** Extra effects */
  effects?: {
    blur?: boolean;
    rotate?: number;
    skew?: number;
  };
}

// =============================================================================
// GLOBAL PRESETS
// =============================================================================

export const ANIMATION_PRESETS: Record<AnimationPreset, PresetConfig> = {
  minimal: {
    spring: 'smooth',
    startDelay: 12,
    staggerDelay: 6,
    distance: 15,
    scaleFrom: 0.98,
    direction: 'up',
    fadeInFrames: 25,
    fadeOutFrames: 20,
  },

  smooth: {
    spring: 'gentle',
    startDelay: 10,
    staggerDelay: 8,
    distance: 25,
    scaleFrom: 0.95,
    direction: 'up',
    fadeInFrames: 22,
    fadeOutFrames: 18,
  },

  energetic: {
    spring: 'bouncy',
    startDelay: 5,
    staggerDelay: 5,
    distance: 40,
    scaleFrom: 0.8,
    direction: 'up',
    fadeInFrames: 18,
    fadeOutFrames: 12,
  },

  dramatic: {
    spring: 'snappy',
    startDelay: 15,
    staggerDelay: 12,
    distance: 60,
    scaleFrom: 0.7,
    direction: 'up',
    fadeInFrames: 30,
    fadeOutFrames: 20,
  },

  elegant: {
    spring: 'smooth',
    startDelay: 18,
    staggerDelay: 10,
    distance: 30,
    scaleFrom: 0.92,
    direction: 'up',
    fadeInFrames: 35,
    fadeOutFrames: 25,
  },

  kinetic: {
    spring: 'snappy',
    startDelay: 3,
    staggerDelay: 3,
    distance: 50,
    scaleFrom: 0.85,
    direction: 'left',
    fadeInFrames: 12,
    fadeOutFrames: 8,
  },

  typewriter: {
    spring: 'crisp',
    startDelay: 8,
    staggerDelay: 2,
    distance: 10,
    scaleFrom: 1,
    direction: 'right',
    fadeInFrames: 15,
    fadeOutFrames: 12,
  },

  cinematic: {
    spring: 'smooth',
    startDelay: 25,
    staggerDelay: 15,
    distance: 20,
    scaleFrom: 0.95,
    direction: 'up',
    fadeInFrames: 45,
    fadeOutFrames: 30,
  },
};

// =============================================================================
// SCENE-SPECIFIC PRESETS
// =============================================================================

export interface SceneAnimationConfig extends PresetConfig {
  /** Title-specific overrides */
  title?: Partial<PresetConfig>;
  /** Body text-specific overrides */
  body?: Partial<PresetConfig>;
  /** Image-specific overrides */
  image?: Partial<PresetConfig>;
  /** Stats/data-specific overrides */
  data?: Partial<PresetConfig>;
}

type SceneType =
  | 'text-only'
  | 'quote'
  | 'stats'
  | 'single-image'
  | 'dual-images'
  | 'grid'
  | 'bar-chart'
  | 'progress-bars'
  | 'equation';

/**
 * Scene-specific preset configurations
 * Each scene type can have unique animation behaviors per preset
 */
export const SCENE_PRESETS: Record<SceneType, Record<AnimationPreset, SceneAnimationConfig>> = {
  'text-only': {
    minimal: {
      ...ANIMATION_PRESETS.minimal,
      title: { distance: 12 },
      body: { startDelay: 20, distance: 10 },
    },
    smooth: {
      ...ANIMATION_PRESETS.smooth,
      title: { spring: 'crisp', distance: 30 },
      body: { startDelay: 22, distance: 20 },
    },
    energetic: {
      ...ANIMATION_PRESETS.energetic,
      title: { scaleFrom: 0.7, distance: 50 },
      body: { startDelay: 15, scaleFrom: 0.85 },
    },
    dramatic: {
      ...ANIMATION_PRESETS.dramatic,
      title: { distance: 80, scaleFrom: 0.6 },
      body: { startDelay: 35, distance: 40 },
    },
    elegant: {
      ...ANIMATION_PRESETS.elegant,
      title: { spring: 'smooth', distance: 25 },
      body: { startDelay: 30, spring: 'gentle' },
    },
    kinetic: {
      ...ANIMATION_PRESETS.kinetic,
      title: { direction: 'left', distance: 80 },
      body: { direction: 'right', startDelay: 10 },
    },
    typewriter: {
      ...ANIMATION_PRESETS.typewriter,
      title: { staggerDelay: 1 },
      body: { startDelay: 40, staggerDelay: 1 },
    },
    cinematic: {
      ...ANIMATION_PRESETS.cinematic,
      title: { distance: 15, fadeInFrames: 50 },
      body: { startDelay: 45, fadeInFrames: 40 },
    },
  },

  'quote': {
    minimal: {
      ...ANIMATION_PRESETS.minimal,
      title: { scaleFrom: 1 },
      body: { startDelay: 15 },
    },
    smooth: {
      ...ANIMATION_PRESETS.smooth,
      title: { spring: 'bouncy', scaleFrom: 0.5 }, // Quote mark bounces
      body: { startDelay: 18 },
    },
    energetic: {
      ...ANIMATION_PRESETS.energetic,
      title: { scaleFrom: 0.3 },
      body: { distance: 50 },
    },
    dramatic: {
      ...ANIMATION_PRESETS.dramatic,
      title: { scaleFrom: 0.1, spring: 'bouncy' },
      body: { startDelay: 25, distance: 50 },
    },
    elegant: {
      ...ANIMATION_PRESETS.elegant,
      title: { scaleFrom: 0.8 },
      body: { startDelay: 25, spring: 'smooth' },
    },
    kinetic: {
      ...ANIMATION_PRESETS.kinetic,
      title: { direction: 'center', scaleFrom: 2 },
      body: { direction: 'left' },
    },
    typewriter: {
      ...ANIMATION_PRESETS.typewriter,
      body: { staggerDelay: 2 },
    },
    cinematic: {
      ...ANIMATION_PRESETS.cinematic,
      title: { fadeInFrames: 60 },
      body: { startDelay: 40 },
    },
  },

  'stats': {
    minimal: {
      ...ANIMATION_PRESETS.minimal,
      data: { staggerDelay: 8 },
    },
    smooth: {
      ...ANIMATION_PRESETS.smooth,
      data: { staggerDelay: 10 },
    },
    energetic: {
      ...ANIMATION_PRESETS.energetic,
      data: { staggerDelay: 6, scaleFrom: 0.5 },
    },
    dramatic: {
      ...ANIMATION_PRESETS.dramatic,
      data: { staggerDelay: 15, scaleFrom: 0.4, distance: 80 },
    },
    elegant: {
      ...ANIMATION_PRESETS.elegant,
      data: { staggerDelay: 12 },
    },
    kinetic: {
      ...ANIMATION_PRESETS.kinetic,
      data: { staggerDelay: 4, direction: 'random' },
    },
    typewriter: {
      ...ANIMATION_PRESETS.typewriter,
      data: { staggerDelay: 8 },
    },
    cinematic: {
      ...ANIMATION_PRESETS.cinematic,
      data: { staggerDelay: 20 },
    },
  },

  'single-image': {
    minimal: {
      ...ANIMATION_PRESETS.minimal,
      image: { scaleFrom: 0.98 },
      title: { startDelay: 25 },
    },
    smooth: {
      ...ANIMATION_PRESETS.smooth,
      image: { scaleFrom: 0.92, spring: 'gentle' },
      title: { startDelay: 28 },
    },
    energetic: {
      ...ANIMATION_PRESETS.energetic,
      image: { scaleFrom: 0.7, spring: 'bouncy' },
      title: { startDelay: 20 },
    },
    dramatic: {
      ...ANIMATION_PRESETS.dramatic,
      image: { scaleFrom: 0.5, spring: 'snappy' },
      title: { startDelay: 35 },
    },
    elegant: {
      ...ANIMATION_PRESETS.elegant,
      image: { scaleFrom: 0.9, fadeInFrames: 40 },
      title: { startDelay: 35 },
    },
    kinetic: {
      ...ANIMATION_PRESETS.kinetic,
      image: { direction: 'left', distance: 100 },
      title: { direction: 'right', startDelay: 15 },
    },
    typewriter: {
      ...ANIMATION_PRESETS.typewriter,
      image: { scaleFrom: 1 },
      title: { staggerDelay: 2, startDelay: 30 },
    },
    cinematic: {
      ...ANIMATION_PRESETS.cinematic,
      image: { scaleFrom: 1.1, fadeInFrames: 60 }, // Ken Burns zoom out
      title: { startDelay: 50 },
    },
  },

  'dual-images': {
    minimal: {
      ...ANIMATION_PRESETS.minimal,
      image: { distance: 20 },
    },
    smooth: {
      ...ANIMATION_PRESETS.smooth,
      image: { distance: 40 },
    },
    energetic: {
      ...ANIMATION_PRESETS.energetic,
      image: { distance: 80, spring: 'bouncy' },
    },
    dramatic: {
      ...ANIMATION_PRESETS.dramatic,
      image: { distance: 120 },
    },
    elegant: {
      ...ANIMATION_PRESETS.elegant,
      image: { distance: 50 },
    },
    kinetic: {
      ...ANIMATION_PRESETS.kinetic,
      image: { distance: 150, staggerDelay: 5 },
    },
    typewriter: {
      ...ANIMATION_PRESETS.typewriter,
      image: { distance: 30, staggerDelay: 10 },
    },
    cinematic: {
      ...ANIMATION_PRESETS.cinematic,
      image: { distance: 60, fadeInFrames: 50 },
    },
  },

  'grid': {
    minimal: {
      ...ANIMATION_PRESETS.minimal,
      image: { staggerDelay: 6, scaleFrom: 0.98 },
    },
    smooth: {
      ...ANIMATION_PRESETS.smooth,
      image: { staggerDelay: 8 },
    },
    energetic: {
      ...ANIMATION_PRESETS.energetic,
      image: { staggerDelay: 4, scaleFrom: 0.6 },
    },
    dramatic: {
      ...ANIMATION_PRESETS.dramatic,
      image: { staggerDelay: 10, scaleFrom: 0.5 },
    },
    elegant: {
      ...ANIMATION_PRESETS.elegant,
      image: { staggerDelay: 10 },
    },
    kinetic: {
      ...ANIMATION_PRESETS.kinetic,
      image: { staggerDelay: 3, direction: 'random' },
    },
    typewriter: {
      ...ANIMATION_PRESETS.typewriter,
      image: { staggerDelay: 5 },
    },
    cinematic: {
      ...ANIMATION_PRESETS.cinematic,
      image: { staggerDelay: 15 },
    },
  },

  'bar-chart': {
    minimal: {
      ...ANIMATION_PRESETS.minimal,
      data: { staggerDelay: 8 },
    },
    smooth: {
      ...ANIMATION_PRESETS.smooth,
      data: { staggerDelay: 10 },
    },
    energetic: {
      ...ANIMATION_PRESETS.energetic,
      data: { staggerDelay: 5, spring: 'bouncy' },
    },
    dramatic: {
      ...ANIMATION_PRESETS.dramatic,
      data: { staggerDelay: 12 },
    },
    elegant: {
      ...ANIMATION_PRESETS.elegant,
      data: { staggerDelay: 12 },
    },
    kinetic: {
      ...ANIMATION_PRESETS.kinetic,
      data: { staggerDelay: 3 },
    },
    typewriter: {
      ...ANIMATION_PRESETS.typewriter,
      data: { staggerDelay: 6 },
    },
    cinematic: {
      ...ANIMATION_PRESETS.cinematic,
      data: { staggerDelay: 18 },
    },
  },

  'progress-bars': {
    minimal: {
      ...ANIMATION_PRESETS.minimal,
      data: { staggerDelay: 10, direction: 'left' },
    },
    smooth: {
      ...ANIMATION_PRESETS.smooth,
      data: { staggerDelay: 12, direction: 'left' },
    },
    energetic: {
      ...ANIMATION_PRESETS.energetic,
      data: { staggerDelay: 6, direction: 'left' },
    },
    dramatic: {
      ...ANIMATION_PRESETS.dramatic,
      data: { staggerDelay: 15, direction: 'left', distance: 80 },
    },
    elegant: {
      ...ANIMATION_PRESETS.elegant,
      data: { staggerDelay: 14, direction: 'left' },
    },
    kinetic: {
      ...ANIMATION_PRESETS.kinetic,
      data: { staggerDelay: 4, direction: 'left', distance: 100 },
    },
    typewriter: {
      ...ANIMATION_PRESETS.typewriter,
      data: { staggerDelay: 8, direction: 'left' },
    },
    cinematic: {
      ...ANIMATION_PRESETS.cinematic,
      data: { staggerDelay: 20, direction: 'left' },
    },
  },

  'equation': {
    minimal: {
      ...ANIMATION_PRESETS.minimal,
      data: { staggerDelay: 15, scaleFrom: 0.95 },
    },
    smooth: {
      ...ANIMATION_PRESETS.smooth,
      data: { staggerDelay: 18 },
    },
    energetic: {
      ...ANIMATION_PRESETS.energetic,
      data: { staggerDelay: 10, scaleFrom: 0.6 },
    },
    dramatic: {
      ...ANIMATION_PRESETS.dramatic,
      data: { staggerDelay: 20, scaleFrom: 0.5 },
    },
    elegant: {
      ...ANIMATION_PRESETS.elegant,
      data: { staggerDelay: 18 },
    },
    kinetic: {
      ...ANIMATION_PRESETS.kinetic,
      data: { staggerDelay: 8 },
    },
    typewriter: {
      ...ANIMATION_PRESETS.typewriter,
      data: { staggerDelay: 12 },
    },
    cinematic: {
      ...ANIMATION_PRESETS.cinematic,
      data: { staggerDelay: 25 },
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the merged config for a specific scene type and preset
 */
export function getScenePreset(
  sceneType: SceneType,
  preset: AnimationPreset = 'smooth'
): SceneAnimationConfig {
  return SCENE_PRESETS[sceneType]?.[preset] ?? ANIMATION_PRESETS[preset];
}

/**
 * Get element-specific config (title, body, image, data)
 */
export function getElementConfig(
  sceneType: SceneType,
  preset: AnimationPreset,
  element: 'title' | 'body' | 'image' | 'data'
): PresetConfig {
  const sceneConfig = getScenePreset(sceneType, preset);
  const elementOverrides = sceneConfig[element] ?? {};

  return {
    ...sceneConfig,
    ...elementOverrides,
  };
}

/**
 * Get random direction for 'random' direction type
 */
export function getRandomDirection(): 'up' | 'down' | 'left' | 'right' {
  const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'down', 'left', 'right'];
  return directions[Math.floor(Math.random() * directions.length)];
}

/**
 * Map direction to translation values
 */
export function getDirectionTranslation(
  direction: PresetConfig['direction'],
  distance: number,
  index?: number
): { x: number; y: number } {
  const actualDirection = direction === 'random'
    ? getRandomDirection()
    : direction;

  switch (actualDirection) {
    case 'up':
      return { x: 0, y: distance };
    case 'down':
      return { x: 0, y: -distance };
    case 'left':
      return { x: -distance, y: 0 };
    case 'right':
      return { x: distance, y: 0 };
    case 'center':
      return { x: 0, y: 0 };
    default:
      return { x: 0, y: distance };
  }
}

/**
 * Preset labels for UI
 */
export const PRESET_LABELS: Record<AnimationPreset, string> = {
  minimal: 'Minimal',
  smooth: 'Smooth',
  energetic: 'Energetic',
  dramatic: 'Dramatic',
  elegant: 'Elegant',
  kinetic: 'Kinetic',
  typewriter: 'Typewriter',
  cinematic: 'Cinematic',
};

/**
 * Preset descriptions for UI
 */
export const PRESET_DESCRIPTIONS: Record<AnimationPreset, string> = {
  minimal: 'Subtle, professional animations',
  smooth: 'Gentle, flowing movement',
  energetic: 'Bouncy, playful feel',
  dramatic: 'Bold, impactful entrances',
  elegant: 'Refined, sophisticated timing',
  kinetic: 'Fast, dynamic motion',
  typewriter: 'Sequential text reveals',
  cinematic: 'Slow, epic atmosphere',
};

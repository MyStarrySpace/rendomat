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
  | 'cinematic'    // Slow, epic feel
  | 'spiral'       // Spiral - text slides in and rotates in a spiral pattern
  | 'stacking'     // Words fly up and stack into sentences
  | 'cascade'      // Words cascade down from above
  | 'burst';       // Words burst in from center

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

// Professional animation presets following Apple/Material motion guidelines:
// - Subtle distances (8-20px max for text)
// - Minimal scale changes (0.95-1.0)
// - Tight stagger timing (1-3 frames)
// - Single primary effect per element
export const ANIMATION_PRESETS: Record<AnimationPreset, PresetConfig> = {
  minimal: {
    spring: 'smooth',
    startDelay: 8,
    staggerDelay: 2,
    distance: 8,
    scaleFrom: 0.99,
    direction: 'up',
    fadeInFrames: 20,
    fadeOutFrames: 15,
  },

  smooth: {
    spring: 'gentle',
    startDelay: 6,
    staggerDelay: 2,
    distance: 12,
    scaleFrom: 0.97,
    direction: 'up',
    fadeInFrames: 18,
    fadeOutFrames: 14,
  },

  energetic: {
    spring: 'bouncy',
    startDelay: 4,
    staggerDelay: 2,
    distance: 16,
    scaleFrom: 0.95,
    direction: 'up',
    fadeInFrames: 15,
    fadeOutFrames: 10,
  },

  dramatic: {
    spring: 'snappy',
    startDelay: 10,
    staggerDelay: 3,
    distance: 20,
    scaleFrom: 0.94,
    direction: 'up',
    fadeInFrames: 24,
    fadeOutFrames: 16,
  },

  elegant: {
    spring: 'smooth',
    startDelay: 12,
    staggerDelay: 3,
    distance: 14,
    scaleFrom: 0.96,
    direction: 'up',
    fadeInFrames: 28,
    fadeOutFrames: 20,
  },

  kinetic: {
    spring: 'snappy',
    startDelay: 3,
    staggerDelay: 1,
    distance: 18,
    scaleFrom: 0.96,
    direction: 'left',
    fadeInFrames: 12,
    fadeOutFrames: 8,
  },

  typewriter: {
    spring: 'crisp',
    startDelay: 6,
    staggerDelay: 1,
    distance: 6,
    scaleFrom: 1,
    direction: 'up',
    fadeInFrames: 12,
    fadeOutFrames: 10,
  },

  cinematic: {
    spring: 'smooth',
    startDelay: 18,
    staggerDelay: 4,
    distance: 12,
    scaleFrom: 0.97,
    direction: 'up',
    fadeInFrames: 36,
    fadeOutFrames: 24,
  },

  // Spiral animation - custom multi-step choreography (uses SpiralTextAnimation)
  spiral: {
    spring: 'smooth',
    startDelay: 5,
    staggerDelay: 4,
    distance: 60,
    scaleFrom: 0.9,
    direction: 'right',
    fadeInFrames: 15,
    fadeOutFrames: 12,
  },

  stacking: {
    spring: 'snappy',
    startDelay: 8,
    staggerDelay: 5,
    distance: 80,        // Words fly up from below
    scaleFrom: 0.85,
    direction: 'up',
    fadeInFrames: 18,
    fadeOutFrames: 15,
  },

  cascade: {
    spring: 'gentle',
    startDelay: 6,
    staggerDelay: 4,
    distance: 50,        // Words drop from above
    scaleFrom: 0.95,
    direction: 'down',
    fadeInFrames: 20,
    fadeOutFrames: 15,
  },

  burst: {
    spring: 'elastic',
    startDelay: 3,
    staggerDelay: 2,
    distance: 40,        // Words expand from center
    scaleFrom: 0.3,      // Start small and grow
    direction: 'center',
    fadeInFrames: 12,
    fadeOutFrames: 10,
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
    spiral: {
      ...ANIMATION_PRESETS.spiral,
      title: { distance: 80, staggerDelay: 5 },
      body: { startDelay: 15, distance: 60, staggerDelay: 4 },
    },
    stacking: {
      ...ANIMATION_PRESETS.stacking,
      title: { distance: 100, scaleFrom: 0.8 },
      body: { startDelay: 20, distance: 80, staggerDelay: 6 },
    },
    cascade: {
      ...ANIMATION_PRESETS.cascade,
      title: { distance: 60, direction: 'down' },
      body: { startDelay: 18, distance: 50, staggerDelay: 4 },
    },
    burst: {
      ...ANIMATION_PRESETS.burst,
      title: { scaleFrom: 0.2, distance: 50 },
      body: { startDelay: 12, scaleFrom: 0.3, staggerDelay: 3 },
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
    spiral: {
      ...ANIMATION_PRESETS.spiral,
      title: { scaleFrom: 0.5, distance: 40 },
      body: { startDelay: 20, distance: 70, staggerDelay: 5 },
    },
    stacking: {
      ...ANIMATION_PRESETS.stacking,
      title: { scaleFrom: 0.4, distance: 60 },
      body: { startDelay: 25, distance: 80 },
    },
    cascade: {
      ...ANIMATION_PRESETS.cascade,
      title: { distance: 40 },
      body: { startDelay: 20, distance: 55 },
    },
    burst: {
      ...ANIMATION_PRESETS.burst,
      title: { scaleFrom: 0.1 },
      body: { startDelay: 15, scaleFrom: 0.4 },
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
    spiral: {
      ...ANIMATION_PRESETS.spiral,
      data: { staggerDelay: 6, distance: 50 },
    },
    stacking: {
      ...ANIMATION_PRESETS.stacking,
      data: { staggerDelay: 8, distance: 70 },
    },
    cascade: {
      ...ANIMATION_PRESETS.cascade,
      data: { staggerDelay: 6, distance: 45 },
    },
    burst: {
      ...ANIMATION_PRESETS.burst,
      data: { staggerDelay: 4, scaleFrom: 0.2 },
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
    spiral: {
      ...ANIMATION_PRESETS.spiral,
      image: { scaleFrom: 0.85, distance: 50 },
      title: { startDelay: 25, distance: 60 },
    },
    stacking: {
      ...ANIMATION_PRESETS.stacking,
      image: { scaleFrom: 0.8, distance: 70 },
      title: { startDelay: 30, distance: 80 },
    },
    cascade: {
      ...ANIMATION_PRESETS.cascade,
      image: { distance: 45 },
      title: { startDelay: 25, distance: 50 },
    },
    burst: {
      ...ANIMATION_PRESETS.burst,
      image: { scaleFrom: 0.4 },
      title: { startDelay: 20, scaleFrom: 0.3 },
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
    spiral: {
      ...ANIMATION_PRESETS.spiral,
      image: { distance: 80, staggerDelay: 6 },
    },
    stacking: {
      ...ANIMATION_PRESETS.stacking,
      image: { distance: 100, staggerDelay: 8 },
    },
    cascade: {
      ...ANIMATION_PRESETS.cascade,
      image: { distance: 60, staggerDelay: 5 },
    },
    burst: {
      ...ANIMATION_PRESETS.burst,
      image: { scaleFrom: 0.3, staggerDelay: 4 },
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
    spiral: {
      ...ANIMATION_PRESETS.spiral,
      image: { staggerDelay: 5, distance: 60 },
    },
    stacking: {
      ...ANIMATION_PRESETS.stacking,
      image: { staggerDelay: 6, distance: 80 },
    },
    cascade: {
      ...ANIMATION_PRESETS.cascade,
      image: { staggerDelay: 5, distance: 50 },
    },
    burst: {
      ...ANIMATION_PRESETS.burst,
      image: { staggerDelay: 3, scaleFrom: 0.2 },
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
    spiral: {
      ...ANIMATION_PRESETS.spiral,
      data: { staggerDelay: 5, distance: 50 },
    },
    stacking: {
      ...ANIMATION_PRESETS.stacking,
      data: { staggerDelay: 6, distance: 70 },
    },
    cascade: {
      ...ANIMATION_PRESETS.cascade,
      data: { staggerDelay: 5, distance: 45, direction: 'down' },
    },
    burst: {
      ...ANIMATION_PRESETS.burst,
      data: { staggerDelay: 3, scaleFrom: 0.3 },
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
    spiral: {
      ...ANIMATION_PRESETS.spiral,
      data: { staggerDelay: 6, direction: 'left', distance: 60 },
    },
    stacking: {
      ...ANIMATION_PRESETS.stacking,
      data: { staggerDelay: 8, direction: 'up', distance: 80 },
    },
    cascade: {
      ...ANIMATION_PRESETS.cascade,
      data: { staggerDelay: 6, direction: 'down', distance: 50 },
    },
    burst: {
      ...ANIMATION_PRESETS.burst,
      data: { staggerDelay: 4, scaleFrom: 0.3 },
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
    spiral: {
      ...ANIMATION_PRESETS.spiral,
      data: { staggerDelay: 10, distance: 60 },
    },
    stacking: {
      ...ANIMATION_PRESETS.stacking,
      data: { staggerDelay: 12, distance: 80 },
    },
    cascade: {
      ...ANIMATION_PRESETS.cascade,
      data: { staggerDelay: 10, distance: 50 },
    },
    burst: {
      ...ANIMATION_PRESETS.burst,
      data: { staggerDelay: 6, scaleFrom: 0.2 },
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
  spiral: 'Spiral',
  stacking: 'Stacking',
  cascade: 'Cascade',
  burst: 'Burst',
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
  spiral: 'Text slides in and rotates in a spiral',
  stacking: 'Words fly up and stack into sentences',
  cascade: 'Words cascade down from above',
  burst: 'Words burst in from center with scale',
};

// =============================================================================
// TEXT ANIMATION PRESETS
// =============================================================================

import type { TextUnit, TextEffect } from './textAnimation';

/**
 * Text-specific animation configuration
 * Controls how text is split and animated at character/word/line level
 */
export interface TextAnimationPreset {
  /** Unit to animate: character, word, line, or element */
  unit: TextUnit;
  /** Frames between each unit's animation start */
  staggerFrames: number;
  /** Spring configuration key */
  spring: keyof typeof springConfig;
  /** Animation distance in pixels */
  distance: number;
  /** Animation direction */
  direction: 'up' | 'down' | 'left' | 'right';
  /** Effects to apply */
  effects: TextEffect[];
}

/**
 * Text animation configurations for each preset
 * Professional guidelines:
 * - Word-level is the default (character-level is too busy)
 * - Single effect per element (no effect stacking)
 * - Subtle distances (8-16px)
 * - No squash/stretch on text
 */
export const TEXT_ANIMATION_PRESETS: Record<AnimationPreset, TextAnimationPreset> = {
  minimal: {
    unit: 'element',
    staggerFrames: 0,
    spring: 'smooth',
    distance: 8,
    direction: 'up',
    effects: ['fadeUp'],
  },
  smooth: {
    unit: 'word',
    staggerFrames: 1,
    spring: 'gentle',
    distance: 12,
    direction: 'up',
    effects: ['fadeUp'],
  },
  energetic: {
    unit: 'word',
    staggerFrames: 1,
    spring: 'bouncy',
    distance: 14,
    direction: 'up',
    effects: ['fadeUp'],
  },
  dramatic: {
    unit: 'word',
    staggerFrames: 2,
    spring: 'snappy',
    distance: 16,
    direction: 'up',
    effects: ['fadeUp'],
  },
  elegant: {
    unit: 'word',
    staggerFrames: 2,
    spring: 'smooth',
    distance: 10,
    direction: 'up',
    effects: ['fadeUp'],
  },
  kinetic: {
    unit: 'word',  // Changed from character to word
    staggerFrames: 1,
    spring: 'snappy',
    distance: 16,
    direction: 'left',
    effects: ['fadeLeft'],
  },
  typewriter: {
    unit: 'word',  // Changed from character to word
    staggerFrames: 1,
    spring: 'crisp',
    distance: 6,
    direction: 'up',
    effects: ['fadeUp'],
  },
  cinematic: {
    unit: 'line',
    staggerFrames: 4,
    spring: 'smooth',
    distance: 12,
    direction: 'up',
    effects: ['fadeUp'],
  },

  // Spiral animation - handled by custom SpiralTextAnimation component
  spiral: {
    unit: 'word',
    staggerFrames: 3,
    spring: 'smooth',
    distance: 40,
    direction: 'right',
    effects: ['fadeUp'],
  },

  stacking: {
    unit: 'word',
    staggerFrames: 5,
    spring: 'snappy',
    distance: 80,
    direction: 'up',
    effects: ['fadeUp'],
  },

  cascade: {
    unit: 'word',
    staggerFrames: 4,
    spring: 'gentle',
    distance: 50,
    direction: 'down',
    effects: ['fadeDown'],
  },

  burst: {
    unit: 'word',
    staggerFrames: 2,
    spring: 'elastic',
    distance: 40,
    direction: 'up',     // Combined with scale for burst effect
    effects: ['scaleUp'],
  },
};

/**
 * Get text animation preset configuration
 */
export function getTextAnimationPreset(preset: AnimationPreset): TextAnimationPreset {
  return TEXT_ANIMATION_PRESETS[preset] ?? TEXT_ANIMATION_PRESETS.smooth;
}

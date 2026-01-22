/**
 * Motion Design System for Remotion
 *
 * Spring-based animations following motion design principles:
 * - Natural spring physics for organic movement
 * - Staggered children for visual hierarchy
 * - Fade-up entrance animations
 * - Purposeful timing based on content flow
 */

import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

// =============================================================================
// SPRING CONFIGURATIONS
// =============================================================================

export const springConfig = {
  /** Gentle, smooth animation for content entrance */
  gentle: { damping: 14, stiffness: 120, mass: 1 },
  /** Quick, responsive animation for interactive elements */
  snappy: { damping: 20, stiffness: 300, mass: 1 },
  /** Bouncy animation for emphasis */
  bouncy: { damping: 10, stiffness: 400, mass: 1 },
  /** Very smooth, slow animation for backgrounds */
  smooth: { damping: 20, stiffness: 100, mass: 1 },
  /** Crisp animation for text reveals */
  crisp: { damping: 18, stiffness: 200, mass: 1 },
} as const;

// =============================================================================
// TIMING HELPERS
// =============================================================================

/** Calculate stagger delay for child elements */
export function staggerDelay(index: number, baseDelay = 5): number {
  return index * baseDelay;
}

/** Calculate element entrance timing with stagger */
export function getEntranceFrame(index: number, startFrame = 10, stagger = 8): number {
  return startFrame + index * stagger;
}

// =============================================================================
// ANIMATION HOOKS
// =============================================================================

interface UseSpringEntranceOptions {
  /** Frame to start the animation */
  delay?: number;
  /** Spring configuration */
  config?: keyof typeof springConfig;
  /** Duration override for spring calculation */
  durationInFrames?: number;
}

/**
 * Creates a spring-based entrance animation value (0 to 1)
 */
export function useSpringEntrance(options: UseSpringEntranceOptions = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { delay = 0, config = 'gentle', durationInFrames = 90 } = options;

  const adjustedFrame = Math.max(0, frame - delay);

  return spring({
    frame: adjustedFrame,
    fps,
    config: springConfig[config],
    durationInFrames,
  });
}

interface UseFadeUpOptions extends UseSpringEntranceOptions {
  /** How far to translate from (in pixels) */
  distance?: number;
}

/**
 * Creates a fade-up animation (opacity + Y translation)
 * Returns { opacity, translateY }
 */
export function useFadeUp(options: UseFadeUpOptions = {}) {
  const { distance = 30, ...springOptions } = options;
  const progress = useSpringEntrance(springOptions);

  return {
    opacity: progress,
    translateY: interpolate(progress, [0, 1], [distance, 0]),
  };
}

/**
 * Creates a scale-in animation
 * Returns { opacity, scale }
 */
export function useScaleIn(options: UseSpringEntranceOptions = {}) {
  const progress = useSpringEntrance({ ...options, config: options.config || 'snappy' });

  return {
    opacity: progress,
    scale: interpolate(progress, [0, 1], [0.85, 1]),
  };
}

/**
 * Creates a fade-in from left animation
 * Returns { opacity, translateX }
 */
export function useFadeInLeft(options: UseFadeUpOptions = {}) {
  const { distance = 40, ...springOptions } = options;
  const progress = useSpringEntrance(springOptions);

  return {
    opacity: progress,
    translateX: interpolate(progress, [0, 1], [-distance, 0]),
  };
}

/**
 * Creates a fade-in from right animation
 * Returns { opacity, translateX }
 */
export function useFadeInRight(options: UseFadeUpOptions = {}) {
  const { distance = 40, ...springOptions } = options;
  const progress = useSpringEntrance(springOptions);

  return {
    opacity: progress,
    translateX: interpolate(progress, [0, 1], [distance, 0]),
  };
}

// =============================================================================
// SCENE-LEVEL ANIMATIONS
// =============================================================================

interface UseSceneFadeOptions {
  /** Duration of the scene in frames */
  durationInFrames: number;
  /** Frames for fade in (default: 20) */
  fadeInFrames?: number;
  /** Frames for fade out (default: 15) */
  fadeOutFrames?: number;
}

/**
 * Scene-level fade in/out with eased transitions
 */
export function useSceneFade(options: UseSceneFadeOptions) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { durationInFrames, fadeInFrames = 20, fadeOutFrames = 15 } = options;

  const fadeOutStart = durationInFrames - fadeOutFrames;

  // Fade in with spring
  if (frame < fadeInFrames) {
    return spring({
      frame,
      fps,
      config: springConfig.smooth,
      durationInFrames: fadeInFrames,
    });
  }

  // Fade out with easing
  if (frame > fadeOutStart) {
    const fadeOutProgress = (frame - fadeOutStart) / fadeOutFrames;
    // Ease out cubic
    return 1 - Math.pow(fadeOutProgress, 3);
  }

  return 1;
}

// =============================================================================
// STAGGER ANIMATION HELPER
// =============================================================================

interface StaggeredElementOptions {
  /** Index of the element in the list */
  index: number;
  /** Total number of elements */
  total: number;
  /** Frame to start the stagger sequence */
  startFrame?: number;
  /** Frames between each element */
  staggerFrames?: number;
  /** Spring config to use */
  config?: keyof typeof springConfig;
  /** Animation type */
  type?: 'fadeUp' | 'scaleIn' | 'fadeLeft' | 'fadeRight';
  /** Distance for translation animations */
  distance?: number;
}

/**
 * Get animation styles for a staggered list element
 */
export function useStaggeredElement(options: StaggeredElementOptions) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const {
    index,
    startFrame = 15,
    staggerFrames = 8,
    config = 'gentle',
    type = 'fadeUp',
    distance = 25,
  } = options;

  const delay = startFrame + index * staggerFrames;
  const adjustedFrame = Math.max(0, frame - delay);

  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: springConfig[config],
    durationInFrames: 60,
  });

  switch (type) {
    case 'scaleIn':
      return {
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.85, 1])})`,
      };
    case 'fadeLeft':
      return {
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [-distance, 0])}px)`,
      };
    case 'fadeRight':
      return {
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [distance, 0])}px)`,
      };
    case 'fadeUp':
    default:
      return {
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
      };
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// =============================================================================
// PRESET-AWARE HOOKS
// =============================================================================

import type { AnimationPreset, PresetConfig } from './animationPresets';

interface UsePresetAnimationOptions {
  /** Animation preset name */
  preset: AnimationPreset;
  /** Element type for scene-specific overrides */
  element?: 'title' | 'body' | 'image' | 'data';
  /** Index for staggered elements */
  index?: number;
  /** Override config values */
  overrides?: Partial<PresetConfig>;
}

/**
 * Get animation values based on preset configuration
 * Dynamically imports preset config to avoid circular dependencies
 */
export function usePresetAnimation(
  config: PresetConfig,
  index: number = 0
) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = config.startDelay + index * config.staggerDelay;
  const adjustedFrame = Math.max(0, frame - delay);

  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: springConfig[config.spring],
    durationInFrames: 60,
  });

  // Calculate translation based on direction
  let translateX = 0;
  let translateY = 0;

  switch (config.direction) {
    case 'up':
      translateY = interpolate(progress, [0, 1], [config.distance, 0]);
      break;
    case 'down':
      translateY = interpolate(progress, [0, 1], [-config.distance, 0]);
      break;
    case 'left':
      translateX = interpolate(progress, [0, 1], [-config.distance, 0]);
      break;
    case 'right':
      translateX = interpolate(progress, [0, 1], [config.distance, 0]);
      break;
    case 'center':
      // No translation, just scale/opacity
      break;
    case 'random':
      // Random direction per element (seeded by index)
      const directions = ['up', 'down', 'left', 'right'];
      const dir = directions[index % 4];
      if (dir === 'up') translateY = interpolate(progress, [0, 1], [config.distance, 0]);
      if (dir === 'down') translateY = interpolate(progress, [0, 1], [-config.distance, 0]);
      if (dir === 'left') translateX = interpolate(progress, [0, 1], [-config.distance, 0]);
      if (dir === 'right') translateX = interpolate(progress, [0, 1], [config.distance, 0]);
      break;
  }

  const scale = interpolate(progress, [0, 1], [config.scaleFrom, 1]);

  return {
    opacity: progress,
    translateX,
    translateY,
    scale,
    progress,
  };
}

/**
 * Scene fade with preset configuration
 */
export function usePresetSceneFade(config: PresetConfig, durationInFrames: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeOutStart = durationInFrames - config.fadeOutFrames;

  // Fade in with spring
  if (frame < config.fadeInFrames) {
    return spring({
      frame,
      fps,
      config: springConfig.smooth,
      durationInFrames: config.fadeInFrames,
    });
  }

  // Fade out with easing
  if (frame > fadeOutStart) {
    const fadeOutProgress = (frame - fadeOutStart) / config.fadeOutFrames;
    return 1 - Math.pow(fadeOutProgress, 3);
  }

  return 1;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

/**
 * Ease out cubic
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease in out cubic
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// =============================================================================
// STYLE HELPERS
// =============================================================================

/**
 * Build transform string from animation values
 */
export function buildTransform(values: {
  translateX?: number;
  translateY?: number;
  scale?: number;
  rotate?: number;
}): string {
  const transforms: string[] = [];

  if (values.translateX !== undefined) {
    transforms.push(`translateX(${values.translateX}px)`);
  }
  if (values.translateY !== undefined) {
    transforms.push(`translateY(${values.translateY}px)`);
  }
  if (values.scale !== undefined) {
    transforms.push(`scale(${values.scale})`);
  }
  if (values.rotate !== undefined) {
    transforms.push(`rotate(${values.rotate}deg)`);
  }

  return transforms.join(' ') || 'none';
}

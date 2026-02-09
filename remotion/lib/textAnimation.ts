/**
 * Text Animation Utilities
 *
 * Provides text splitting, animation calculations, and performance safeguards
 * for character/word/line-level text animations.
 */

// =============================================================================
// TYPES
// =============================================================================

export type TextUnit = 'character' | 'word' | 'line' | 'element';

export interface TextSegment {
  /** The text content of this segment */
  text: string;
  /** Index of this segment within its parent */
  index: number;
  /** Total segments at this level */
  total: number;
  /** Whether this is a space (for character mode) */
  isSpace?: boolean;
  /** Word index this character belongs to (for character mode) */
  wordIndex?: number;
}

export interface SplitTextResult {
  /** The split segments */
  segments: TextSegment[];
  /** The unit used for splitting */
  unit: TextUnit;
  /** Whether the text was downgraded due to performance limits */
  wasDowngraded: boolean;
  /** Original unit if downgraded */
  originalUnit?: TextUnit;
}

// =============================================================================
// PERFORMANCE SAFEGUARDS
// =============================================================================

/** Maximum characters to animate individually */
export const MAX_ANIMATED_CHARACTERS = 100;

/** Maximum words to animate individually */
export const MAX_ANIMATED_WORDS = 30;

/** Maximum lines to animate individually */
export const MAX_ANIMATED_LINES = 10;

/**
 * Determines the appropriate text unit based on content length
 * Auto-downgrades if content exceeds performance limits
 */
export function getOptimalUnit(
  text: string,
  requestedUnit: TextUnit
): { unit: TextUnit; wasDowngraded: boolean; originalUnit?: TextUnit } {
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const lineCount = text.split('\n').filter(Boolean).length;

  // Element mode never downgrades
  if (requestedUnit === 'element') {
    return { unit: 'element', wasDowngraded: false };
  }

  // Line mode
  if (requestedUnit === 'line') {
    if (lineCount <= MAX_ANIMATED_LINES) {
      return { unit: 'line', wasDowngraded: false };
    }
    return { unit: 'element', wasDowngraded: true, originalUnit: 'line' };
  }

  // Word mode
  if (requestedUnit === 'word') {
    if (wordCount <= MAX_ANIMATED_WORDS) {
      return { unit: 'word', wasDowngraded: false };
    }
    if (lineCount <= MAX_ANIMATED_LINES) {
      return { unit: 'line', wasDowngraded: true, originalUnit: 'word' };
    }
    return { unit: 'element', wasDowngraded: true, originalUnit: 'word' };
  }

  // Character mode - most likely to downgrade
  if (requestedUnit === 'character') {
    if (charCount <= MAX_ANIMATED_CHARACTERS) {
      return { unit: 'character', wasDowngraded: false };
    }
    if (wordCount <= MAX_ANIMATED_WORDS) {
      return { unit: 'word', wasDowngraded: true, originalUnit: 'character' };
    }
    if (lineCount <= MAX_ANIMATED_LINES) {
      return { unit: 'line', wasDowngraded: true, originalUnit: 'character' };
    }
    return { unit: 'element', wasDowngraded: true, originalUnit: 'character' };
  }

  return { unit: requestedUnit, wasDowngraded: false };
}

// =============================================================================
// TEXT SPLITTING
// =============================================================================

/**
 * Split text into characters, preserving word grouping info
 */
export function splitIntoCharacters(text: string): TextSegment[] {
  const chars: TextSegment[] = [];
  let wordIndex = 0;
  let charIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isSpace = /\s/.test(char);

    chars.push({
      text: char,
      index: charIndex++,
      total: text.length,
      isSpace,
      wordIndex,
    });

    // Increment word index after space
    if (isSpace && i + 1 < text.length && !/\s/.test(text[i + 1])) {
      wordIndex++;
    }
  }

  return chars;
}

/**
 * Split text into words
 */
export function splitIntoWords(text: string): TextSegment[] {
  // Split by whitespace but preserve positions
  const words = text.split(/(\s+)/).filter(Boolean);
  let index = 0;

  return words
    .filter(word => !/^\s+$/.test(word)) // Filter out pure whitespace
    .map((word, _, arr) => ({
      text: word,
      index: index++,
      total: arr.length,
    }));
}

/**
 * Split text into lines
 */
export function splitIntoLines(text: string): TextSegment[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);

  return lines.map((line, index) => ({
    text: line.trim(),
    index,
    total: lines.length,
  }));
}

/**
 * Split text according to specified unit with performance safeguards
 */
export function splitText(text: string, unit: TextUnit): SplitTextResult {
  const { unit: optimalUnit, wasDowngraded, originalUnit } = getOptimalUnit(text, unit);

  let segments: TextSegment[];

  switch (optimalUnit) {
    case 'character':
      segments = splitIntoCharacters(text);
      break;
    case 'word':
      segments = splitIntoWords(text);
      break;
    case 'line':
      segments = splitIntoLines(text);
      break;
    case 'element':
    default:
      segments = [{ text, index: 0, total: 1 }];
      break;
  }

  return {
    segments,
    unit: optimalUnit,
    wasDowngraded,
    originalUnit,
  };
}

// =============================================================================
// ANIMATION TIMING
// =============================================================================

export interface StaggerConfig {
  /** Base delay before any animation starts (in frames) */
  startDelay: number;
  /** Delay between each animated unit (in frames) */
  staggerFrames: number;
  /** Total segments being animated */
  totalSegments: number;
  /** Duration of individual segment animation (in frames) */
  segmentDuration?: number;
}

/**
 * Calculate the start frame for a specific segment index
 */
export function getSegmentStartFrame(
  index: number,
  config: StaggerConfig
): number {
  return config.startDelay + index * config.staggerFrames;
}

/**
 * Calculate total animation duration for staggered text
 */
export function getTotalAnimationDuration(config: StaggerConfig): number {
  const lastSegmentStart = getSegmentStartFrame(
    config.totalSegments - 1,
    config
  );
  return lastSegmentStart + (config.segmentDuration || 30);
}

/**
 * Check if a segment should be visible at a given frame
 */
export function isSegmentActive(
  frame: number,
  segmentIndex: number,
  config: StaggerConfig
): boolean {
  const startFrame = getSegmentStartFrame(segmentIndex, config);
  return frame >= startFrame;
}

/**
 * Get animation progress (0-1) for a segment at a given frame
 * Returns raw linear progress before spring physics are applied
 */
export function getSegmentProgress(
  frame: number,
  segmentIndex: number,
  config: StaggerConfig
): number {
  const startFrame = getSegmentStartFrame(segmentIndex, config);
  const duration = config.segmentDuration || 30;

  if (frame < startFrame) return 0;
  if (frame >= startFrame + duration) return 1;

  return (frame - startFrame) / duration;
}

// =============================================================================
// EFFECT UTILITIES
// =============================================================================

export type TextEffect =
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'scaleUp'
  | 'squashStretch'
  | 'anticipation'
  | 'followThrough'
  | 'blur'
  | 'rotate'
  | 'snap';

export interface EffectValues {
  opacity: number;
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
  blur: number;
}

/**
 * Get base effect values for a given progress (0-1)
 * These are raw values before spring physics
 */
export function getBaseEffectValues(
  progress: number,
  effects: TextEffect[],
  distance: number = 30
): EffectValues {
  const values: EffectValues = {
    opacity: progress,
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    blur: 0,
  };

  for (const effect of effects) {
    switch (effect) {
      case 'fadeUp':
        values.translateY = (1 - progress) * distance;
        break;
      case 'fadeDown':
        values.translateY = (1 - progress) * -distance;
        break;
      case 'fadeLeft':
        values.translateX = (1 - progress) * -distance;
        break;
      case 'fadeRight':
        values.translateX = (1 - progress) * distance;
        break;
      case 'scaleUp':
        const scale = 0.8 + progress * 0.2;
        values.scaleX = scale;
        values.scaleY = scale;
        break;
      case 'blur':
        values.blur = (1 - progress) * 8;
        break;
      case 'rotate':
        values.rotate = (1 - progress) * 15;
        break;
      case 'snap':
        values.opacity = progress > 0.01 ? 1 : 0;
        break;
      // squashStretch, anticipation, followThrough are handled by hooks
    }
  }

  return values;
}

/**
 * Build CSS transform string from effect values
 */
export function buildTextTransform(values: Partial<EffectValues>): string {
  const transforms: string[] = [];

  if (values.translateX !== undefined && values.translateX !== 0) {
    transforms.push(`translateX(${values.translateX}px)`);
  }
  if (values.translateY !== undefined && values.translateY !== 0) {
    transforms.push(`translateY(${values.translateY}px)`);
  }
  if (values.scaleX !== undefined || values.scaleY !== undefined) {
    const scaleX = values.scaleX ?? 1;
    const scaleY = values.scaleY ?? 1;
    if (scaleX !== 1 || scaleY !== 1) {
      if (scaleX === scaleY) {
        transforms.push(`scale(${scaleX})`);
      } else {
        transforms.push(`scale(${scaleX}, ${scaleY})`);
      }
    }
  }
  if (values.rotate !== undefined && values.rotate !== 0) {
    transforms.push(`rotate(${values.rotate}deg)`);
  }

  return transforms.length > 0 ? transforms.join(' ') : 'none';
}

/**
 * Build CSS filter string for blur effect
 */
export function buildTextFilter(blur: number): string {
  if (blur <= 0.1) return 'none';
  return `blur(${blur}px)`;
}

// =============================================================================
// MEMOIZATION HELPERS
// =============================================================================

/**
 * Create a cache key for split text results
 */
export function getSplitCacheKey(text: string, unit: TextUnit): string {
  return `${unit}:${text}`;
}

/**
 * Simple memoization for split text operations
 * Returns a function that caches results
 */
export function createSplitTextCache() {
  const cache = new Map<string, SplitTextResult>();

  return {
    get(text: string, unit: TextUnit): SplitTextResult {
      const key = getSplitCacheKey(text, unit);
      const cached = cache.get(key);
      if (cached) return cached;

      const result = splitText(text, unit);
      cache.set(key, result);
      return result;
    },
    clear() {
      cache.clear();
    },
  };
}

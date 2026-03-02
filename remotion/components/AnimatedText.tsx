/**
 * AnimatedText Component
 *
 * Main component for character/word/line-level text animations.
 * Integrates with the existing animation preset system.
 */

import React, { useMemo } from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { springConfig } from '../lib/motion';
import {
  splitText,
  getSegmentStartFrame,
  type TextUnit,
  type TextEffect,
  type TextSegment,
  buildTextTransform,
  buildTextFilter,
} from '../lib/textAnimation';
import { getGlitchWordJitter } from '../lib/textModifiers';
import { AnimatedCharacter } from './AnimatedCharacter';
import { AnimatedWord } from './AnimatedWord';
import type { AnimationPreset } from '../lib/animationPresets';
import type { TextModifierType, TextModifierRenderFn } from '../lib/textModifiers';
import { getTextModifier } from '../lib/textModifiers';

// =============================================================================
// TEXT ANIMATION PRESET CONFIGURATIONS
// =============================================================================

export interface TextAnimationConfig {
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
 * Maps existing AnimationPreset to text-specific behavior
 */
export const TEXT_ANIMATION_CONFIGS: Record<AnimationPreset, TextAnimationConfig> = {
  minimal: {
    unit: 'element',
    staggerFrames: 0,
    spring: 'smooth',
    distance: 15,
    direction: 'up',
    effects: ['fadeUp'],
  },
  smooth: {
    unit: 'word',
    staggerFrames: 3,
    spring: 'gentle',
    distance: 25,
    direction: 'up',
    effects: ['fadeUp'],
  },
  energetic: {
    unit: 'word',
    staggerFrames: 2,
    spring: 'bouncy',
    distance: 40,
    direction: 'up',
    effects: ['fadeUp', 'squashStretch', 'followThrough'],
  },
  dramatic: {
    unit: 'word',
    staggerFrames: 4,
    spring: 'snappy',
    distance: 50,
    direction: 'up',
    effects: ['fadeUp', 'scaleUp', 'blur', 'rotate'],
  },
  elegant: {
    unit: 'character',
    staggerFrames: 1,
    spring: 'smooth',
    distance: 20,
    direction: 'up',
    effects: ['wave'],
  },
  kinetic: {
    unit: 'character',
    staggerFrames: 1,
    spring: 'snappy',
    distance: 35,
    direction: 'left',
    effects: ['fadeLeft', 'squashStretch'],
  },
  typewriter: {
    unit: 'character',
    staggerFrames: 2,
    spring: 'crisp',
    distance: 0,
    direction: 'up',
    effects: ['snap'],
  },
  cinematic: {
    unit: 'line',
    staggerFrames: 12,
    spring: 'smooth',
    distance: 20,
    direction: 'up',
    effects: ['fadeUp', 'blur', 'anticipation'],
  },
  spiral: {
    unit: 'word',
    staggerFrames: 3,
    spring: 'smooth',
    distance: 40,
    direction: 'right',
    effects: ['fadeUp'],
  },
  stacking: {
    unit: 'character',
    staggerFrames: 1,
    spring: 'snappy',
    distance: 0,
    direction: 'up',
    effects: ['scramble'],
  },
  cascade: {
    unit: 'word',
    staggerFrames: 4,
    spring: 'gentle',
    distance: 50,
    direction: 'down',
    effects: ['fadeDown', 'rotate'],
  },
  burst: {
    unit: 'word',
    staggerFrames: 2,
    spring: 'elastic',
    distance: 40,
    direction: 'up',
    effects: ['scaleUp'],
  },
  echo: {
    unit: 'element',
    staggerFrames: 0,
    spring: 'smooth',
    distance: 0,
    direction: 'up',
    effects: ['fadeUp'],
  },
  reveal: {
    unit: 'element',
    staggerFrames: 0,
    spring: 'crisp',
    distance: 0,
    direction: 'left',
    effects: ['fadeUp'],
  },
  tracking: {
    unit: 'element',
    staggerFrames: 0,
    spring: 'gentle',
    distance: 0,
    direction: 'up',
    effects: ['fadeUp'],
  },
  flicker: {
    unit: 'element',
    staggerFrames: 0,
    spring: 'smooth',
    distance: 0,
    direction: 'up',
    effects: ['fadeUp'],
  },
  'blur-in': {
    unit: 'word',
    staggerFrames: 2,
    spring: 'smooth',
    distance: 6,
    direction: 'up',
    effects: ['blur', 'fadeUp'],
  },
  'blur-out': {
    unit: 'word',
    staggerFrames: 2,
    spring: 'smooth',
    distance: 8,
    direction: 'down',
    effects: ['blur', 'fadeUp'],
  },
  'blur-through': {
    unit: 'word',
    staggerFrames: 3,
    spring: 'gentle',
    distance: 10,
    direction: 'up',
    effects: ['blur', 'fadeUp'],
  },
};

// =============================================================================
// ANIMATED TEXT COMPONENT
// =============================================================================

export interface AnimatedTextProps {
  /** The text content to animate */
  children: string;
  /** Animation preset (uses existing preset system) */
  preset?: AnimationPreset;
  /** Override: animation unit */
  unit?: TextUnit;
  /** Override: frames between each unit */
  staggerFrames?: number;
  /** Override: spring configuration */
  spring?: keyof typeof springConfig;
  /** Override: animation distance */
  distance?: number;
  /** Override: animation direction */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Override: effects to apply */
  effects?: TextEffect[];
  /** Frame delay before animation starts */
  startDelay?: number;
  /** Style to apply to the container */
  style?: React.CSSProperties;
  /** Style to apply to each animated segment */
  segmentStyle?: React.CSSProperties;
  /** Class name for the container */
  className?: string;
  /** Optional visual modifier to apply on top of the animation */
  modifier?: TextModifierType;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  preset = 'energetic',
  unit: unitOverride,
  staggerFrames: staggerOverride,
  spring: springOverride,
  distance: distanceOverride,
  direction: directionOverride,
  effects: effectsOverride,
  startDelay = 10,
  style = {},
  segmentStyle = {},
  className,
  modifier,
}) => {
  // Ensure we have a valid string
  const text = children ?? '';

  // Resolve modifier function
  const modifierFn = modifier ? getTextModifier(modifier) : undefined;

  // Get preset configuration with overrides
  const config = useMemo(() => {
    const baseConfig = TEXT_ANIMATION_CONFIGS[preset] ?? TEXT_ANIMATION_CONFIGS.smooth;
    return {
      unit: unitOverride ?? baseConfig.unit,
      staggerFrames: staggerOverride ?? baseConfig.staggerFrames,
      spring: springOverride ?? baseConfig.spring,
      distance: distanceOverride ?? baseConfig.distance,
      direction: directionOverride ?? baseConfig.direction,
      effects: effectsOverride ?? baseConfig.effects,
    };
  }, [preset, unitOverride, staggerOverride, springOverride, distanceOverride, directionOverride, effectsOverride]);

  // Split text into segments (memoized)
  const splitResult = useMemo(() => {
    if (!text) {
      return { segments: [], unit: 'element' as const, wasDowngraded: false };
    }
    return splitText(text, config.unit);
  }, [text, config.unit]);

  // Guard against empty text after hooks
  if (!text) {
    return null;
  }

  // Render based on unit type
  const renderContent = () => {
    switch (splitResult.unit) {
      case 'character':
        return (
          <CharacterAnimation
            segments={splitResult.segments}
            config={config}
            startDelay={startDelay}
            segmentStyle={segmentStyle}
            modifierFn={modifierFn}
            modifierType={modifier}
          />
        );
      case 'word':
        return (
          <WordAnimation
            segments={splitResult.segments}
            config={config}
            startDelay={startDelay}
            segmentStyle={segmentStyle}
            modifierFn={modifierFn}
          />
        );
      case 'line':
        return (
          <LineAnimation
            segments={splitResult.segments}
            config={config}
            startDelay={startDelay}
            segmentStyle={segmentStyle}
            modifierFn={modifierFn}
          />
        );
      case 'element':
      default:
        return (
          <ElementAnimation
            text={children}
            config={config}
            startDelay={startDelay}
            modifierFn={modifierFn}
          />
        );
    }
  };

  return (
    <span className={className} style={{ display: 'inline', ...style }}>
      {renderContent()}
    </span>
  );
};

// =============================================================================
// INTERNAL ANIMATION COMPONENTS
// =============================================================================

interface AnimationProps {
  config: TextAnimationConfig;
  startDelay: number;
  segmentStyle?: React.CSSProperties;
  modifierFn?: TextModifierRenderFn;
  modifierType?: TextModifierType;
}

interface CharacterAnimationProps extends AnimationProps {
  segments: TextSegment[];
}

const CharacterAnimation: React.FC<CharacterAnimationProps> = ({
  segments,
  config,
  startDelay,
  segmentStyle,
  modifierFn,
  modifierType,
}) => {
  const frame = useCurrentFrame();
  const isTypewriter = config.effects.includes('snap');

  // In typewriter mode, find the typing front — last character whose animation has started
  let typingFrontIdx = -1;
  if (isTypewriter) {
    for (let i = segments.length - 1; i >= 0; i--) {
      const sf = getSegmentStartFrame(i, {
        startDelay,
        staggerFrames: config.staggerFrames,
        totalSegments: segments.length,
      });
      if (frame >= sf + 1) {
        typingFrontIdx = i;
        break;
      }
    }
  }

  // Hide cursor ~20 frames (≈0.67s) after the last character is typed
  const lastCharStart = getSegmentStartFrame(segments.length - 1, {
    startDelay,
    staggerFrames: config.staggerFrames,
    totalSegments: segments.length,
  });
  const allTyped = typingFrontIdx === segments.length - 1;
  const cursorHidden = allTyped && frame > lastCharStart + 20;
  const showCursorAtFront = isTypewriter && typingFrontIdx >= 0 && !cursorHidden;

  // Group characters by wordIndex so we can wrap each word in a nowrap span
  // to prevent mid-word line breaks
  const wordGroups: { wordIndex: number; chars: { segment: typeof segments[0]; idx: number }[] }[] = [];
  let currentWordIndex = -1;
  for (let idx = 0; idx < segments.length; idx++) {
    const segment = segments[idx];
    const wi = segment.wordIndex ?? 0;
    if (segment.isSpace) {
      // Spaces are rendered between word groups, not inside them
      wordGroups.push({ wordIndex: -1, chars: [{ segment, idx }] });
    } else if (wi !== currentWordIndex) {
      currentWordIndex = wi;
      wordGroups.push({ wordIndex: wi, chars: [{ segment, idx }] });
    } else {
      wordGroups[wordGroups.length - 1].chars.push({ segment, idx });
    }
  }

  return (
    <>
      {wordGroups.map((group, gi) => {
        // Spaces don't need a nowrap wrapper
        if (group.chars.length === 1 && group.chars[0].segment.isSpace) {
          const { segment, idx } = group.chars[0];
          return (
            <AnimatedCharacter
              key={`char-${idx}`}
              char={segment.text}
              index={idx}
              startFrame={getSegmentStartFrame(idx, {
                startDelay,
                staggerFrames: config.staggerFrames,
                totalSegments: segments.length,
              })}
              spring={config.spring}
              distance={config.distance}
              direction={config.direction}
              effects={config.effects}
              isSpace
              style={segmentStyle}
              modifier={modifierFn}
              isTypingFront={showCursorAtFront && idx === typingFrontIdx}
            />
          );
        }

        // Wrap word characters in a nowrap span to prevent mid-word breaks
        // Apply occasional word-level glitch jitter when glitch modifier is active
        const wordJitter = modifierType === 'glitch'
          ? getGlitchWordJitter(frame, group.wordIndex)
          : undefined;
        return (
          <span key={`word-${gi}`} style={{ whiteSpace: 'nowrap', transform: wordJitter, display: wordJitter ? 'inline-block' : undefined }}>
            {group.chars.map(({ segment, idx }) => (
              <AnimatedCharacter
                key={`char-${idx}`}
                char={segment.text}
                index={idx}
                startFrame={getSegmentStartFrame(idx, {
                  startDelay,
                  staggerFrames: config.staggerFrames,
                  totalSegments: segments.length,
                })}
                spring={config.spring}
                distance={config.distance}
                direction={config.direction}
                effects={config.effects}
                isSpace={segment.isSpace}
                style={segmentStyle}
                modifier={modifierFn}
                isTypingFront={showCursorAtFront && idx === typingFrontIdx}
              />
            ))}
          </span>
        );
      })}
    </>
  );
};

interface WordAnimationProps extends AnimationProps {
  segments: TextSegment[];
}

const WordAnimation: React.FC<WordAnimationProps> = ({
  segments,
  config,
  startDelay,
  segmentStyle,
  modifierFn,
}) => {
  return (
    <>
      {segments.map((segment, idx) => (
        <AnimatedWord
          key={`word-${idx}`}
          word={segment.text}
          index={idx}
          startFrame={getSegmentStartFrame(idx, {
            startDelay,
            staggerFrames: config.staggerFrames,
            totalSegments: segments.length,
          })}
          spring={config.spring}
          distance={config.distance}
          direction={config.direction}
          effects={config.effects}
          addSpace={idx < segments.length - 1}
          style={segmentStyle}
          modifier={modifierFn}
        />
      ))}
    </>
  );
};

interface LineAnimationProps extends AnimationProps {
  segments: TextSegment[];
}

const LineAnimation: React.FC<LineAnimationProps> = ({
  segments,
  config,
  startDelay,
  segmentStyle,
  modifierFn,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <span style={{ display: 'flex', flexDirection: 'column' }}>
      {segments.map((segment, idx) => {
        const lineStartFrame = getSegmentStartFrame(idx, {
          startDelay,
          staggerFrames: config.staggerFrames,
          totalSegments: segments.length,
        });
        const adjustedFrame = Math.max(0, frame - lineStartFrame);
        const progress = spring({
          frame: adjustedFrame,
          fps,
          config: springConfig[config.spring],
          durationInFrames: 40,
        });

        let translateX = 0;
        let translateY = 0;
        let blur = 0;

        // Apply effects
        for (const effect of config.effects) {
          switch (effect) {
            case 'fadeUp':
              translateY = interpolate(progress, [0, 1], [config.distance, 0]);
              break;
            case 'fadeDown':
              translateY = interpolate(progress, [0, 1], [-config.distance, 0]);
              break;
            case 'fadeLeft':
              translateX = interpolate(progress, [0, 1], [-config.distance, 0]);
              break;
            case 'fadeRight':
              translateX = interpolate(progress, [0, 1], [config.distance, 0]);
              break;
            case 'blur':
              blur = interpolate(progress, [0, 1], [6, 0]);
              break;
          }
        }

        const transform = buildTextTransform({ translateX, translateY });
        const filter = buildTextFilter(blur);

        const spanStyle: React.CSSProperties = {
          display: 'block',
          opacity: progress,
          transform,
          filter: filter !== 'none' ? filter : undefined,
          willChange: 'transform, opacity',
          ...segmentStyle,
        };

        if (modifierFn) {
          return (
            <React.Fragment key={`line-${idx}`}>
              {modifierFn({
                children: segment.text,
                progress,
                baseStyle: spanStyle,
                keyPrefix: `line-${idx}`,
              })}
            </React.Fragment>
          );
        }

        return (
          <span
            key={`line-${idx}`}
            style={spanStyle}
          >
            {segment.text}
          </span>
        );
      })}
    </span>
  );
};

interface ElementAnimationProps {
  text: string;
  config: TextAnimationConfig;
  startDelay: number;
  modifierFn?: TextModifierRenderFn;
}

const ElementAnimation: React.FC<ElementAnimationProps> = ({
  text,
  config,
  startDelay,
  modifierFn,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = Math.max(0, frame - startDelay);
  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: springConfig[config.spring],
    durationInFrames: 45,
  });

  let translateX = 0;
  let translateY = 0;
  let scale = 1;
  let blur = 0;

  // Apply effects
  for (const effect of config.effects) {
    switch (effect) {
      case 'fadeUp':
        translateY = interpolate(progress, [0, 1], [config.distance, 0]);
        break;
      case 'fadeDown':
        translateY = interpolate(progress, [0, 1], [-config.distance, 0]);
        break;
      case 'fadeLeft':
        translateX = interpolate(progress, [0, 1], [-config.distance, 0]);
        break;
      case 'fadeRight':
        translateX = interpolate(progress, [0, 1], [config.distance, 0]);
        break;
      case 'scaleUp':
        scale = interpolate(progress, [0, 1], [0.9, 1]);
        break;
      case 'blur':
        blur = interpolate(progress, [0, 1], [6, 0]);
        break;
    }
  }

  const transform = buildTextTransform({
    translateX,
    translateY,
    scaleX: scale,
    scaleY: scale,
  });
  const filter = buildTextFilter(blur);

  const spanStyle: React.CSSProperties = {
    display: 'inline-block',
    opacity: progress,
    transform,
    filter: filter !== 'none' ? filter : undefined,
    willChange: 'transform, opacity',
  };

  if (modifierFn) {
    return modifierFn({
      children: text,
      progress,
      baseStyle: spanStyle,
      keyPrefix: 'element-0',
    }) as React.ReactElement;
  }

  return (
    <span style={spanStyle}>
      {text}
    </span>
  );
};


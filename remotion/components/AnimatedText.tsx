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
import { AnimatedCharacter } from './AnimatedCharacter';
import { AnimatedWord } from './AnimatedWord';
import type { AnimationPreset } from '../lib/animationPresets';

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
    effects: ['fadeUp', 'scaleUp'],
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
    effects: ['fadeUp', 'anticipation', 'followThrough'],
  },
  elegant: {
    unit: 'word',
    staggerFrames: 5,
    spring: 'smooth',
    distance: 20,
    direction: 'up',
    effects: ['fadeUp', 'scaleUp'],
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
    distance: 10,
    direction: 'up',
    effects: ['fadeUp'],
  },
  cinematic: {
    unit: 'line',
    staggerFrames: 12,
    spring: 'smooth',
    distance: 20,
    direction: 'up',
    effects: ['fadeUp', 'blur', 'anticipation'],
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
}) => {
  // Ensure we have a valid string
  const text = children ?? '';

  // Get preset configuration with overrides
  const config = useMemo(() => {
    const baseConfig = TEXT_ANIMATION_CONFIGS[preset];
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
          />
        );
      case 'word':
        return (
          <WordAnimation
            segments={splitResult.segments}
            config={config}
            startDelay={startDelay}
            segmentStyle={segmentStyle}
          />
        );
      case 'line':
        return (
          <LineAnimation
            segments={splitResult.segments}
            config={config}
            startDelay={startDelay}
            segmentStyle={segmentStyle}
          />
        );
      case 'element':
      default:
        return (
          <ElementAnimation
            text={children}
            config={config}
            startDelay={startDelay}
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
}

interface CharacterAnimationProps extends AnimationProps {
  segments: TextSegment[];
}

const CharacterAnimation: React.FC<CharacterAnimationProps> = ({
  segments,
  config,
  startDelay,
  segmentStyle,
}) => {
  return (
    <>
      {segments.map((segment, idx) => (
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
        />
      ))}
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

        return (
          <span
            key={`line-${idx}`}
            style={{
              display: 'block',
              opacity: progress,
              transform,
              filter: filter !== 'none' ? filter : undefined,
              willChange: 'transform, opacity',
              ...segmentStyle,
            }}
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
}

const ElementAnimation: React.FC<ElementAnimationProps> = ({
  text,
  config,
  startDelay,
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

  return (
    <span
      style={{
        display: 'inline-block',
        opacity: progress,
        transform,
        filter: filter !== 'none' ? filter : undefined,
        willChange: 'transform, opacity',
      }}
    >
      {text}
    </span>
  );
};


/**
 * AnimatedWord Component
 *
 * Renders a word with spring-based animation.
 * Supports squash/stretch, anticipation, and follow-through effects.
 */

import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { springConfig } from '../lib/motion';
import type { TextEffect } from '../lib/textAnimation';
import { buildTextTransform, buildTextFilter } from '../lib/textAnimation';
import type { TextModifierRenderFn } from '../lib/textModifiers';

export interface AnimatedWordProps {
  /** The word to display */
  word: string;
  /** Index of this word in the sequence */
  index: number;
  /** Frame when this word's animation starts */
  startFrame: number;
  /** Spring configuration key */
  spring?: keyof typeof springConfig;
  /** Animation distance in pixels */
  distance?: number;
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Effects to apply */
  effects?: TextEffect[];
  /** Style overrides */
  style?: React.CSSProperties;
  /** Whether to add space after the word */
  addSpace?: boolean;
  /** Optional visual modifier to apply */
  modifier?: TextModifierRenderFn;
}

export const AnimatedWord: React.FC<AnimatedWordProps> = ({
  word,
  index,
  startFrame,
  spring: springKey = 'gentle',
  distance = 30,
  direction = 'up',
  effects = ['fadeUp'],
  style = {},
  addSpace = true,
  modifier,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate animation progress
  const adjustedFrame = Math.max(0, frame - startFrame);
  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: springConfig[springKey],
    durationInFrames: 40,
  });

  // Calculate transform values based on effects
  let translateX = 0;
  let translateY = 0;
  let scaleX = 1;
  let scaleY = 1;
  let rotate = 0;
  let blur = 0;

  // Track if we've applied a directional translation
  let hasDirectionalTranslation = false;

  for (const effect of effects) {
    switch (effect) {
      case 'fadeUp':
        translateY = interpolate(progress, [0, 1], [distance, 0]);
        hasDirectionalTranslation = true;
        break;
      case 'fadeDown':
        translateY = interpolate(progress, [0, 1], [-distance, 0]);
        hasDirectionalTranslation = true;
        break;
      case 'fadeLeft':
        translateX = interpolate(progress, [0, 1], [-distance, 0]);
        hasDirectionalTranslation = true;
        break;
      case 'fadeRight':
        translateX = interpolate(progress, [0, 1], [distance, 0]);
        hasDirectionalTranslation = true;
        break;
      case 'scaleUp': {
        const scale = interpolate(progress, [0, 1], [0.2, 1]);
        scaleX = scale;
        scaleY = scale;
        break;
      }
      case 'squashStretch': {
        // Enhanced squash/stretch for words - more pronounced effect
        const bounceProgress = spring({
          frame: adjustedFrame,
          fps,
          config: { damping: 8, stiffness: 350, mass: 1 },
          durationInFrames: 45,
        });
        const stretchPhase = Math.max(0, 1 - bounceProgress * 2.5);
        const squashPhase = Math.max(0, Math.sin(bounceProgress * Math.PI * 1.5) * (1 - progress));
        const rawScaleY = 1 + stretchPhase * 0.25 - squashPhase * 0.2;
        scaleY = interpolate(progress, [0, 1], [rawScaleY, 1]);
        scaleX = 1 / Math.sqrt(scaleY); // Softer volume preservation for words
        break;
      }
      case 'anticipation': {
        // Wind-up effect before main motion
        const anticipationFrames = 6;
        if (adjustedFrame < anticipationFrames) {
          const anticipationProgress = spring({
            frame: adjustedFrame,
            fps,
            config: springConfig.anticipate,
            durationInFrames: anticipationFrames,
          });
          // Pull back slightly before moving forward
          const pullback = anticipationProgress * 8;
          switch (direction) {
            case 'up':
              translateY += pullback;
              break;
            case 'down':
              translateY -= pullback;
              break;
            case 'left':
              translateX += pullback;
              break;
            case 'right':
              translateX -= pullback;
              break;
          }
        }
        break;
      }
      case 'followThrough': {
        // Use a spring that naturally overshoots
        const ftProgress = spring({
          frame: adjustedFrame,
          fps,
          config: springConfig.followThrough,
          durationInFrames: 50,
        });
        // Apply slight overshoot to scale
        const overshootScale = interpolate(ftProgress, [0, 0.8, 1], [0.8, 1.05, 1]);
        scaleX *= overshootScale;
        scaleY *= overshootScale;
        break;
      }
      case 'blur':
        blur = interpolate(progress, [0, 1], [6, 0]);
        break;
      case 'rotate':
        rotate = interpolate(progress, [0, 1], [10, 0]);
        break;
      case 'wave': {
        translateY = interpolate(progress, [0, 1], [distance, 0]);
        const wavePhase = index * 0.8;
        const waveAmplitude = distance * 0.25 * (1 - progress);
        translateY += Math.sin(progress * Math.PI * 3 + wavePhase) * waveAmplitude;
        hasDirectionalTranslation = true;
        break;
      }
    }
  }

  // Apply direction-based translation if no directional effect was applied
  if (!hasDirectionalTranslation) {
    switch (direction) {
      case 'up':
        translateY = interpolate(progress, [0, 1], [distance, 0]);
        break;
      case 'down':
        translateY = interpolate(progress, [0, 1], [-distance, 0]);
        break;
      case 'left':
        translateX = interpolate(progress, [0, 1], [-distance, 0]);
        break;
      case 'right':
        translateX = interpolate(progress, [0, 1], [distance, 0]);
        break;
    }
  }

  const transform = buildTextTransform({
    translateX,
    translateY,
    scaleX,
    scaleY,
    rotate,
  });

  const filter = buildTextFilter(blur);

  const spanStyle: React.CSSProperties = {
    display: 'inline-block',
    opacity: progress,
    transform,
    filter: filter !== 'none' ? filter : undefined,
    willChange: 'transform, opacity',
    transformOrigin: 'center bottom',
    whiteSpace: 'pre',
    ...style,
  };

  const content = <>{word}{addSpace ? ' ' : ''}</>;

  if (modifier) {
    return modifier({
      children: content,
      progress,
      baseStyle: spanStyle,
      keyPrefix: `word-${index}`,
    }) as React.ReactElement;
  }

  return (
    <span style={spanStyle}>
      {content}
    </span>
  );
};

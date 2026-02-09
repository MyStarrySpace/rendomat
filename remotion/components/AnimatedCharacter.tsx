/**
 * AnimatedCharacter Component
 *
 * Renders a single character with spring-based animation.
 * Designed to be composed within AnimatedText for character-level animations.
 */

import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { springConfig } from '../lib/motion';
import type { TextEffect } from '../lib/textAnimation';
import { buildTextTransform, buildTextFilter } from '../lib/textAnimation';
import type { TextModifierRenderFn } from '../lib/textModifiers';

export interface AnimatedCharacterProps {
  /** The character to display */
  char: string;
  /** Index of this character in the sequence */
  index: number;
  /** Frame when this character's animation starts */
  startFrame: number;
  /** Spring configuration key */
  spring?: keyof typeof springConfig;
  /** Animation distance in pixels */
  distance?: number;
  /** Animation direction */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Effects to apply */
  effects?: TextEffect[];
  /** Whether this is a space character */
  isSpace?: boolean;
  /** Style overrides */
  style?: React.CSSProperties;
  /** Optional visual modifier to apply */
  modifier?: TextModifierRenderFn;
  /** Whether this character is at the typing front (cursor rendered here) */
  isTypingFront?: boolean;
}

export const AnimatedCharacter: React.FC<AnimatedCharacterProps> = ({
  char,
  index,
  startFrame,
  spring: springKey = 'crisp',
  distance = 20,
  direction = 'up',
  effects = ['fadeUp'],
  isSpace = false,
  style = {},
  modifier,
  isTypingFront = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate animation progress
  const adjustedFrame = Math.max(0, frame - startFrame);
  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: springConfig[springKey],
    durationInFrames: 30,
  });

  // Calculate transform values based on effects
  let translateX = 0;
  let translateY = 0;
  let scaleX = 1;
  let scaleY = 1;
  let rotate = 0;
  let blur = 0;

  // Snap effect: binary opacity, no motion
  const isSnap = effects.includes('snap');

  for (const effect of effects) {
    switch (effect) {
      case 'snap':
        // Handled separately — no transform, binary opacity
        break;
      case 'fadeUp':
        translateY = interpolate(progress, [0, 1], [distance, 0]);
        break;
      case 'fadeDown':
        translateY = interpolate(progress, [0, 1], [-distance, 0]);
        break;
      case 'fadeLeft':
        translateX = interpolate(progress, [0, 1], [-distance, 0]);
        break;
      case 'fadeRight':
        translateX = interpolate(progress, [0, 1], [distance, 0]);
        break;
      case 'scaleUp': {
        const scale = interpolate(progress, [0, 1], [0.5, 1]);
        scaleX = scale;
        scaleY = scale;
        break;
      }
      case 'squashStretch': {
        // Squash/stretch effect with volume preservation
        const bounceProgress = spring({
          frame: adjustedFrame,
          fps,
          config: { damping: 6, stiffness: 400, mass: 1 },
          durationInFrames: 35,
        });
        const stretchPhase = Math.max(0, 1 - bounceProgress * 3);
        const squashPhase = Math.max(0, Math.sin(bounceProgress * Math.PI * 2) * (1 - progress));
        scaleY = interpolate(progress, [0, 1], [1 + stretchPhase * 0.2 - squashPhase * 0.3, 1]);
        scaleX = 1 / scaleY;
        break;
      }
      case 'blur':
        blur = interpolate(progress, [0, 1], [8, 0]);
        break;
      case 'rotate':
        rotate = interpolate(progress, [0, 1], [15, 0]);
        break;
    }
  }

  // For snap mode, opacity is binary: off until animation starts, then fully on
  const resolvedOpacity = isSnap ? (adjustedFrame >= 1 ? 1 : 0) : progress;

  // Apply direction-based translation (skip for snap — no motion)
  if (!isSnap && direction !== 'up' && !effects.includes('fadeUp') && !effects.includes('fadeDown') &&
      !effects.includes('fadeLeft') && !effects.includes('fadeRight')) {
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

  // Cursor: zero-width container so it never affects text layout.
  // Blink handled internally via frame timing (~530ms / 16 frames at 30fps).
  const cursorBlink = Math.floor(frame / 16) % 2 === 0;
  const cursorEl = isTypingFront ? (
    <span style={{ display: 'inline-block', width: 0, overflow: 'visible' as const }}>
      <span
        style={{
          display: 'inline-block',
          width: 2,
          height: '1em',
          backgroundColor: cursorBlink ? 'currentColor' : 'transparent',
          verticalAlign: 'text-bottom',
        }}
      />
    </span>
  ) : null;

  // Space characters need special handling to preserve whitespace
  if (isSpace) {
    return (
      <>
        <span
          style={{
            display: 'inline-block',
            width: '0.3em',
            opacity: resolvedOpacity,
            ...style,
          }}
        >
          &nbsp;
        </span>
        {cursorEl}
      </>
    );
  }

  const spanStyle: React.CSSProperties = {
    display: 'inline-block',
    opacity: resolvedOpacity,
    transform,
    filter: filter !== 'none' ? filter : undefined,
    willChange: 'transform, opacity',
    ...style,
  };

  // Only call modifier when character is visible (gate on opacity per contract)
  if (modifier && resolvedOpacity > 0) {
    return (
      <>
        {modifier({
          children: char,
          progress,       // spring timeline, NOT resolvedOpacity
          baseStyle: spanStyle,
          keyPrefix: `char-${index}`,
        })}
        {cursorEl}
      </>
    ) as React.ReactElement;
  }

  return (
    <>
      <span style={spanStyle}>
        {char}
      </span>
      {cursorEl}
    </>
  );
};

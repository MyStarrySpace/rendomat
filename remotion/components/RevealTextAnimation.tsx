/**
 * RevealTextAnimation Component
 *
 * Clip-path wipe that reveals text left-to-right (or configurable direction)
 * with a traveling accent bar at the reveal edge.
 */

import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { springConfig } from '../lib/motion';

export interface RevealTextAnimationProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  accentColor?: string;
  style?: React.CSSProperties;
}

export const RevealTextAnimation: React.FC<RevealTextAnimationProps> = ({
  text,
  fontSize = 56,
  fontFamily = 'sans-serif',
  fontWeight = 700,
  color = '#ffffff',
  direction = 'left',
  accentColor,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: springConfig.crisp,
    durationInFrames: 50,
  });

  // Build clip-path based on direction
  // inset(top right bottom left)
  let clipPath: string;
  let barStyle: React.CSSProperties;
  const barThickness = 3;
  const barColor = accentColor ?? color;
  const barOpacity = interpolate(progress, [0, 0.8, 1], [1, 1, 0]);

  switch (direction) {
    case 'left': // reveal L→R
      clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
      barStyle = {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: `${progress * 100}%`,
        width: barThickness,
        backgroundColor: barColor,
        opacity: barOpacity,
      };
      break;
    case 'right': // reveal R→L
      clipPath = `inset(0 0 0 ${(1 - progress) * 100}%)`;
      barStyle = {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: `${progress * 100}%`,
        width: barThickness,
        backgroundColor: barColor,
        opacity: barOpacity,
      };
      break;
    case 'up': // reveal top→bottom
      clipPath = `inset(0 0 ${(1 - progress) * 100}% 0)`;
      barStyle = {
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${progress * 100}%`,
        height: barThickness,
        backgroundColor: barColor,
        opacity: barOpacity,
      };
      break;
    case 'down': // reveal bottom→top
      clipPath = `inset(${(1 - progress) * 100}% 0 0 0)`;
      barStyle = {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: `${progress * 100}%`,
        height: barThickness,
        backgroundColor: barColor,
        opacity: barOpacity,
      };
      break;
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
        }}
      >
        <span
          style={{
            fontSize,
            fontFamily,
            fontWeight,
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
            clipPath,
            willChange: 'clip-path',
            display: 'inline-block',
          }}
        >
          {text}
        </span>

        {/* Accent bar at wipe edge */}
        <div style={barStyle} />
      </div>
    </div>
  );
};

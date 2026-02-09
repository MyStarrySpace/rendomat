/**
 * TrackingTextAnimation Component
 *
 * Letter-spacing animates from ultra-wide to normal with a combined fade-in.
 * Creates a premium "breathing" typography effect.
 */

import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { springConfig } from '../lib/motion';

export interface TrackingTextAnimationProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  startSpacing?: number;  // em
  endSpacing?: number;    // em
  style?: React.CSSProperties;
}

export const TrackingTextAnimation: React.FC<TrackingTextAnimationProps> = ({
  text,
  fontSize = 56,
  fontFamily = 'sans-serif',
  fontWeight = 700,
  color = '#ffffff',
  startSpacing = 0.5,
  endSpacing = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: springConfig.gentle,
    durationInFrames: 60,
  });

  const letterSpacing = interpolate(progress, [0, 1], [startSpacing, endSpacing]);

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
      <span
        style={{
          fontSize,
          fontFamily,
          fontWeight,
          color,
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
          letterSpacing: `${letterSpacing}em`,
          opacity: progress,
          willChange: 'letter-spacing, opacity',
        }}
      >
        {text}
      </span>
    </div>
  );
};

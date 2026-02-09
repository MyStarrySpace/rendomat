/**
 * FlickerTextAnimation Component
 *
 * Neon sign power-on effect with deterministic rapid opacity toggling.
 * Three phases: early (mostly off, brief flashes), mid (alternating),
 * late (mostly on, brief drops). Stabilizes after flickerFrames.
 */

import React from 'react';
import { useCurrentFrame } from 'remotion';

export interface FlickerTextAnimationProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  flickerFrames?: number;
  style?: React.CSSProperties;
}

/**
 * Deterministic flicker pattern using sin/cos combination.
 * Returns opacity 0 or 1 based on frame position within the flicker phase.
 */
function getFlickerOpacity(frame: number, flickerFrames: number): number {
  if (frame >= flickerFrames) return 1;
  if (frame < 0) return 0;

  const t = frame / flickerFrames; // 0→1 normalized progress

  // Deterministic pseudo-random signal
  const signal = Math.sin(frame * 2.7) * Math.cos(frame * 1.3);

  // Phase-dependent threshold: starts high (mostly off), drops (alternating), then low (mostly on)
  let threshold: number;
  if (t < 0.3) {
    // Early: mostly off, brief flashes
    threshold = 0.6;
  } else if (t < 0.7) {
    // Mid: alternating on/off
    threshold = 0.0;
  } else {
    // Late: mostly on, brief drops
    threshold = -0.5;
  }

  return signal > threshold ? 1 : 0;
}

export const FlickerTextAnimation: React.FC<FlickerTextAnimationProps> = ({
  text,
  fontSize = 56,
  fontFamily = 'sans-serif',
  fontWeight = 700,
  color = '#ffffff',
  flickerFrames = 30,
  style,
}) => {
  const frame = useCurrentFrame();
  const opacity = getFlickerOpacity(frame, flickerFrames);

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
          opacity,
        }}
      >
        {text}
      </span>
    </div>
  );
};

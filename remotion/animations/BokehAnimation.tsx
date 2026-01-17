import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps } from './types';

interface BokehCircle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  pulseSpeed: number;
  pulsePhase: number;
  driftX: number;
  driftY: number;
  driftSpeed: number;
}

export const BokehAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const circleCount = intensity === 'low' ? 10 : intensity === 'medium' ? 20 : 35;
  const accentColor = theme.colors.accent || '#8B5CF6';

  const circles = useMemo<BokehCircle[]>(() => {
    return Array.from({ length: circleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 30 + Math.random() * 100,
      opacity: 0.03 + Math.random() * 0.08,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      pulsePhase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.1,
      driftY: (Math.random() - 0.5) * 0.1,
      driftSpeed: 0.5 + Math.random() * 0.5,
    }));
  }, [circleCount]);

  // Parse accent color to create variations
  const parseColor = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 139, g: 92, b: 246 };
  };

  const baseColor = parseColor(accentColor);

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        {circles.map((circle) => {
          // Slight color variation for each circle
          const colorShift = (circle.id % 3) * 20 - 20;
          const r = Math.min(255, Math.max(0, baseColor.r + colorShift));
          const g = Math.min(255, Math.max(0, baseColor.g + colorShift * 0.5));
          const b = Math.min(255, Math.max(0, baseColor.b - colorShift * 0.3));

          return (
            <radialGradient key={`grad-${circle.id}`} id={`bokehGradient-${circle.id}`}>
              <stop offset="0%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.6" />
              <stop offset="50%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.2" />
              <stop offset="100%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0" />
            </radialGradient>
          );
        })}
      </defs>

      {circles.map((circle) => {
        // Calculate current position with drift
        const driftProgress = frame * circle.driftSpeed;
        const currentX =
          (circle.x / 100) * width +
          Math.sin(driftProgress * 0.01 + circle.id) * circle.driftX * width;
        const currentY =
          (circle.y / 100) * height +
          Math.cos(driftProgress * 0.01 + circle.id * 0.5) * circle.driftY * height;

        // Pulsing size and opacity
        const pulse = Math.sin(frame * circle.pulseSpeed + circle.pulsePhase);
        const currentSize = circle.size * (1 + pulse * 0.2);
        const currentOpacity = circle.opacity * (1 + pulse * 0.3);

        return (
          <circle
            key={circle.id}
            cx={currentX}
            cy={currentY}
            r={currentSize}
            fill={`url(#bokehGradient-${circle.id})`}
            opacity={currentOpacity}
          />
        );
      })}
    </svg>
  );
};

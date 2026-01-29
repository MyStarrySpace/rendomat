import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, resolveParams } from './types';
import { createRng, rngFloat } from './random';

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
  colorShift: number;
}

export const BokehAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
  params: rawParams,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = resolveParams(rawParams);

  const baseCount = intensity === 'low' ? 10 : intensity === 'medium' ? 20 : 35;
  const circleCount = Math.round(baseCount * p.density);
  const accentColor = p.colorOverride || theme.colors.accent || '#8B5CF6';

  const circles = useMemo<BokehCircle[]>(() => {
    const rng = createRng(3000);
    return Array.from({ length: circleCount }, (_, i) => ({
      id: i,
      x: rngFloat(rng, 0, 100),
      y: rngFloat(rng, 0, 100),
      size: rngFloat(rng, 30, 100),
      opacity: rngFloat(rng, 0.06, 0.15),
      pulseSpeed: rngFloat(rng, 0.02, 0.05),
      pulsePhase: rngFloat(rng, 0, Math.PI * 2),
      driftX: rngFloat(rng, -0.5, 0.5) * 0.2,
      driftY: rngFloat(rng, -0.5, 0.5) * 0.2,
      driftSpeed: rngFloat(rng, 0.5, 1),
      colorShift: (i % 3) * 20 - 20,
    }));
  }, [circleCount]);

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

  // Global entrance fade
  const entrance = interpolate(frame, [0, p.entranceDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * p.opacity;

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
        <filter id="bokehBlur">
          <feGaussianBlur stdDeviation={6 * p.blur} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {circles.map((circle) => {
          const r = Math.min(255, Math.max(0, baseColor.r + circle.colorShift));
          const g = Math.min(255, Math.max(0, baseColor.g + circle.colorShift * 0.5));
          const b = Math.min(255, Math.max(0, baseColor.b - circle.colorShift * 0.3));

          return (
            <radialGradient key={`grad-${circle.id}`} id={`bokehGrad-${circle.id}`}>
              <stop offset="0%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.7" />
              <stop offset="40%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.3" />
              <stop offset="70%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.1" />
              <stop offset="100%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0" />
            </radialGradient>
          );
        })}
      </defs>

      <g opacity={entrance}>
        {circles.map((circle) => {
          const driftProgress = frame * circle.driftSpeed * p.speed;
          const currentX =
            (circle.x / 100) * width +
            Math.sin(driftProgress * 0.01 + circle.id) * circle.driftX * width;
          const currentY =
            (circle.y / 100) * height +
            Math.cos(driftProgress * 0.01 + circle.id * 0.5) * circle.driftY * height;

          const pulse = Math.sin(frame * circle.pulseSpeed * p.speed + circle.pulsePhase);
          const currentSize = circle.size * (1 + pulse * 0.2) * p.scale;
          const currentOpacity = circle.opacity * (1 + pulse * 0.3);

          return (
            <g key={circle.id} filter="url(#bokehBlur)">
              {/* Outer glow ring */}
              <circle
                cx={currentX}
                cy={currentY}
                r={currentSize * 1.2}
                fill="none"
                stroke={`url(#bokehGrad-${circle.id})`}
                strokeWidth={2}
                opacity={currentOpacity * 0.4}
              />
              {/* Inner bright ring */}
              <circle
                cx={currentX}
                cy={currentY}
                r={currentSize}
                fill={`url(#bokehGrad-${circle.id})`}
                opacity={currentOpacity}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

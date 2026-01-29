import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, resolveParams } from './types';

export const AuroraAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
  params: rawParams,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = resolveParams(rawParams);

  const baseCount = intensity === 'low' ? 2 : intensity === 'medium' ? 3 : 4;
  const waveCount = Math.round(baseCount * p.density);
  const accentColor = p.colorOverride || theme.colors.accent || '#8B5CF6';

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

  // Generate aurora wave path using cubic bezier curves
  const generateAuroraPath = (
    baseY: number,
    amplitude: number,
    frequency: number,
    phase: number
  ) => {
    const segments = 20;
    const step = width / segments;
    const points: [number, number][] = [];

    for (let i = 0; i <= segments; i++) {
      const x = i * step;
      const normalizedX = x / width;

      const wave1 = Math.sin((normalizedX * frequency + frame * 0.005 * p.speed + phase) * Math.PI * 2) * amplitude * p.scale;
      const wave2 = Math.sin((normalizedX * frequency * 2 + frame * 0.008 * p.speed + phase * 1.5) * Math.PI * 2) * (amplitude * 0.3 * p.scale);
      const wave3 = Math.sin((normalizedX * frequency * 0.5 + frame * 0.003 * p.speed + phase * 0.7) * Math.PI * 2) * (amplitude * 0.5 * p.scale);

      const y = baseY + wave1 + wave2 + wave3;
      points.push([x, y]);
    }

    // Build cubic bezier path for smoother curves
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = prev[0] + (curr[0] - prev[0]) * 0.5;
      const cp1y = curr[1];
      const cp2x = curr[0] + (next[0] - curr[0]) * 0.5;
      const cp2y = curr[1];
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next[0]} ${next[1]}`;
    }

    d += ` L ${width} 0 L 0 0 Z`;
    return d;
  };

  const auroraWaves = Array.from({ length: waveCount }, (_, i) => {
    const hueShift = i * 30;
    const r = Math.min(255, Math.max(0, baseColor.r - hueShift * 0.5));
    const g = Math.min(255, Math.max(0, baseColor.g + hueShift * 0.3));
    const b = Math.min(255, Math.max(0, baseColor.b + hueShift * 0.2));

    // Time-shifting gradient color stop offset
    const gradShift = Math.sin(frame * 0.01 + i) * 10;

    const baseY = height * (0.3 + i * 0.15);
    const amplitude = 30 + i * 15;
    const frequency = 1 + i * 0.3;
    const phase = i * 0.8;
    const opacity = 0.08 + i * 0.02;

    return {
      path: generateAuroraPath(baseY, amplitude, frequency, phase),
      color: `rgb(${r},${g},${b})`,
      opacity: Math.min(opacity, 0.15),
      gradShift,
    };
  });

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
      preserveAspectRatio="none"
    >
      <defs>
        {auroraWaves.map((wave, i) => (
          <linearGradient
            key={`aurora-grad-${i}`}
            id={`auroraGradient-${i}`}
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset={`${Math.max(0, wave.gradShift)}%`} stopColor={wave.color} stopOpacity="0.8" />
            <stop offset={`${50 + wave.gradShift * 0.5}%`} stopColor={wave.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={wave.color} stopOpacity="0" />
          </linearGradient>
        ))}
        <filter id="auroraBlur">
          <feGaussianBlur stdDeviation={40 * p.blur} />
        </filter>
      </defs>

      <g filter="url(#auroraBlur)" opacity={entrance}>
        {auroraWaves.map((wave, i) => (
          <path
            key={i}
            d={wave.path}
            fill={`url(#auroraGradient-${i})`}
            opacity={wave.opacity}
          />
        ))}
      </g>
    </svg>
  );
};

import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps } from './types';

export const AuroraAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const waveCount = intensity === 'low' ? 2 : intensity === 'medium' ? 3 : 4;
  const accentColor = theme.colors.accent || '#8B5CF6';

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

  // Generate aurora wave path
  const generateAuroraPath = (
    waveIndex: number,
    baseY: number,
    amplitude: number,
    frequency: number,
    phase: number
  ) => {
    const points: string[] = [];
    const step = width / 100;

    for (let x = 0; x <= width; x += step) {
      const normalizedX = x / width;

      // Complex wave with multiple harmonics
      const wave1 = Math.sin((normalizedX * frequency + frame * 0.005 + phase) * Math.PI * 2) * amplitude;
      const wave2 = Math.sin((normalizedX * frequency * 2 + frame * 0.008 + phase * 1.5) * Math.PI * 2) * (amplitude * 0.3);
      const wave3 = Math.sin((normalizedX * frequency * 0.5 + frame * 0.003 + phase * 0.7) * Math.PI * 2) * (amplitude * 0.5);

      const y = baseY + wave1 + wave2 + wave3;

      if (x === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }

    // Create a closed shape that extends to top of screen
    points.push(`L ${width} 0`);
    points.push(`L 0 0`);
    points.push('Z');

    return points.join(' ');
  };

  const auroraWaves = Array.from({ length: waveCount }, (_, i) => {
    // Color shift for each wave
    const hueShift = i * 30;
    const r = Math.min(255, Math.max(0, baseColor.r - hueShift * 0.5));
    const g = Math.min(255, Math.max(0, baseColor.g + hueShift * 0.3));
    const b = Math.min(255, Math.max(0, baseColor.b + hueShift * 0.2));

    const baseY = height * (0.3 + i * 0.15);
    const amplitude = 30 + i * 15;
    const frequency = 1 + i * 0.3;
    const phase = i * 0.8;
    const opacity = 0.06 - i * 0.01;

    return {
      path: generateAuroraPath(i, baseY, amplitude, frequency, phase),
      color: `rgb(${r},${g},${b})`,
      opacity,
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
            <stop offset="0%" stopColor={wave.color} stopOpacity="0.8" />
            <stop offset="50%" stopColor={wave.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={wave.color} stopOpacity="0" />
          </linearGradient>
        ))}
        <filter id="auroraBlur">
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>

      <g filter="url(#auroraBlur)">
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

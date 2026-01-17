import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimationProps } from './types';

export const WavesAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const waveCount = intensity === 'low' ? 2 : intensity === 'medium' ? 3 : 4;
  const accentColor = theme.colors.accent || '#8B5CF6';

  const generateWavePath = (
    waveIndex: number,
    offsetY: number,
    amplitude: number,
    frequency: number,
    speed: number,
    phase: number
  ) => {
    const points: string[] = [];
    const step = width / 50;

    for (let x = 0; x <= width; x += step) {
      const normalizedX = x / width;
      const y =
        offsetY +
        Math.sin((normalizedX * frequency + frame * speed + phase) * Math.PI * 2) * amplitude +
        Math.sin((normalizedX * frequency * 0.5 + frame * speed * 0.7 + phase * 2) * Math.PI * 2) * (amplitude * 0.3);

      if (x === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }

    // Close the path at the bottom
    points.push(`L ${width} ${height}`);
    points.push(`L 0 ${height}`);
    points.push('Z');

    return points.join(' ');
  };

  const waves = Array.from({ length: waveCount }, (_, i) => {
    const baseY = height * (0.65 + i * 0.12);
    const amplitude = 20 + i * 10;
    const frequency = 1.5 + i * 0.3;
    const speed = 0.008 + i * 0.002;
    const phase = i * 0.5;
    const opacity = 0.08 - i * 0.015;

    return {
      path: generateWavePath(i, baseY, amplitude, frequency, speed, phase),
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
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {waves.map((wave, i) => (
        <path
          key={i}
          d={wave.path}
          fill="url(#waveGradient)"
          opacity={wave.opacity}
        />
      ))}
    </svg>
  );
};

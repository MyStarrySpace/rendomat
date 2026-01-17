import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps } from './types';

export const GridPulseAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const gridSize = intensity === 'low' ? 100 : intensity === 'medium' ? 60 : 40;
  const accentColor = theme.colors.accent || '#8B5CF6';

  const cols = Math.ceil(width / gridSize) + 1;
  const rows = Math.ceil(height / gridSize) + 1;

  // Create intersection points
  const intersections = useMemo(() => {
    const points: { x: number; y: number; delay: number }[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const distFromCenter = Math.sqrt(
          Math.pow(col - cols / 2, 2) + Math.pow(row - rows / 2, 2)
        );
        points.push({
          x: col * gridSize,
          y: row * gridSize,
          delay: distFromCenter * 2, // Ripple effect from center
        });
      }
    }
    return points;
  }, [cols, rows, gridSize]);

  // Pulse wave that repeats
  const pulseWave = (frame: number, delay: number) => {
    const cycleLength = 90;
    const adjustedFrame = ((frame - delay) % cycleLength + cycleLength) % cycleLength;

    if (adjustedFrame < 0 || adjustedFrame > 30) return 0;

    return interpolate(
      adjustedFrame,
      [0, 15, 30],
      [0, 1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  };

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
        <linearGradient id="gridLineGradientH" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
          <stop offset="50%" stopColor={accentColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gridLineGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
          <stop offset="50%" stopColor={accentColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Horizontal lines */}
      {Array.from({ length: rows }, (_, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * gridSize}
          x2={width}
          y2={i * gridSize}
          stroke="url(#gridLineGradientH)"
          strokeWidth={0.5}
          opacity={0.15}
        />
      ))}

      {/* Vertical lines */}
      {Array.from({ length: cols }, (_, i) => (
        <line
          key={`v-${i}`}
          x1={i * gridSize}
          y1={0}
          x2={i * gridSize}
          y2={height}
          stroke="url(#gridLineGradientV)"
          strokeWidth={0.5}
          opacity={0.15}
        />
      ))}

      {/* Pulsing intersection dots */}
      {intersections.map((point, i) => {
        const pulseIntensity = pulseWave(frame, point.delay);
        const size = 2 + pulseIntensity * 4;
        const opacity = 0.1 + pulseIntensity * 0.5;

        return (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={size}
            fill={accentColor}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};

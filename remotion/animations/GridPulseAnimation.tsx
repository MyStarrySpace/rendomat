import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, resolveParams } from './types';

export const GridPulseAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
  params: rawParams,
}) => {
  const rawFrame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = resolveParams(rawParams);
  const frame = rawFrame + p.timeOffset;

  const baseGridSize = intensity === 'low' ? 100 : intensity === 'medium' ? 60 : 40;
  const gridSize = Math.round(baseGridSize / p.density);
  const accentColor = p.colorOverride || theme.colors.accent || '#8B5CF6';

  const cols = Math.ceil(width / gridSize) + 1;
  const rows = Math.ceil(height / gridSize) + 1;

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
          delay: distFromCenter * 2,
        });
      }
    }
    return points;
  }, [cols, rows, gridSize]);

  // Global entrance fade (uses rawFrame so each scene fades in independently)
  const entrance = interpolate(rawFrame, [0, p.entranceDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * p.opacity;

  // Pulse wave that repeats
  const pulseWave = (f: number, delay: number) => {
    const cycleLength = 90;
    const adjustedFrame = ((f - delay) % cycleLength + cycleLength) % cycleLength;
    if (adjustedFrame > 30) return 0;
    return interpolate(
      adjustedFrame,
      [0, 15, 30],
      [0, 1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  };

  // Sweeping scan line position (cycles across width)
  const scanX = ((frame * 3 * p.speed) % (width + 200)) - 100;

  // Grid line breathing
  const breathe = 0.15 + Math.sin(frame * 0.03 * p.speed) * 0.05;

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
        <filter id="pulseGlow">
          <feGaussianBlur stdDeviation={3 * p.blur} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
          <stop offset="50%" stopColor={accentColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      <g opacity={entrance}>
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
            opacity={breathe}
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
            opacity={breathe}
          />
        ))}

        {/* Sweeping scan line */}
        <rect
          x={scanX - 50}
          y={0}
          width={100}
          height={height}
          fill="url(#scanGrad)"
          opacity={0.15}
        />

        {/* Pulsing intersection dots */}
        {intersections.map((point, i) => {
          const pulseIntensity = pulseWave(frame, point.delay);

          // Boost dots near scan line
          const distToScan = Math.abs(point.x - scanX);
          const scanBoost = distToScan < 60 ? (1 - distToScan / 60) * 0.3 : 0;

          const size = (2 + (pulseIntensity + scanBoost) * 4) * p.scale;
          const opacity = 0.1 + (pulseIntensity + scanBoost) * 0.5;

          return (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={size}
              fill={accentColor}
              opacity={opacity}
              filter={pulseIntensity > 0.3 || scanBoost > 0.1 ? 'url(#pulseGlow)' : undefined}
            />
          );
        })}
      </g>
    </svg>
  );
};

import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps } from './types';

interface GeometricLine {
  id: number;
  x1: number;
  y1: number;
  angle: number;
  length: number;
  delay: number;
  speed: number;
}

export const GeometricAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const lineCount = intensity === 'low' ? 8 : intensity === 'medium' ? 15 : 25;
  const accentColor = theme.colors.accent || '#8B5CF6';

  const lines = useMemo<GeometricLine[]>(() => {
    return Array.from({ length: lineCount }, (_, i) => ({
      id: i,
      x1: Math.random() * width,
      y1: Math.random() * height,
      angle: Math.random() * 360,
      length: 50 + Math.random() * 150,
      delay: Math.random() * 60,
      speed: 0.5 + Math.random() * 1,
    }));
  }, [lineCount, width, height]);

  // Create connection points for polygon effect
  const connectionPoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const count = intensity === 'low' ? 4 : intensity === 'medium' ? 6 : 8;
    for (let i = 0; i < count; i++) {
      points.push({
        x: width * 0.2 + Math.random() * width * 0.6,
        y: height * 0.2 + Math.random() * height * 0.6,
      });
    }
    return points;
  }, [intensity, width, height]);

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
        <linearGradient id="geoLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
          <stop offset="50%" stopColor={accentColor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Animated geometric lines */}
      {lines.map((line) => {
        const effectiveFrame = Math.max(0, frame - line.delay);
        const rotation = line.angle + effectiveFrame * line.speed;
        const angleRad = (rotation * Math.PI) / 180;

        const x2 = line.x1 + Math.cos(angleRad) * line.length;
        const y2 = line.y1 + Math.sin(angleRad) * line.length;

        // Pulsing opacity
        const pulse = Math.sin(effectiveFrame * 0.05 + line.id) * 0.5 + 0.5;
        const opacity = 0.05 + pulse * 0.1;

        return (
          <line
            key={line.id}
            x1={line.x1}
            y1={line.y1}
            x2={x2}
            y2={y2}
            stroke={accentColor}
            strokeWidth={1}
            opacity={opacity}
          />
        );
      })}

      {/* Connecting polygon lines */}
      {connectionPoints.map((point, i) => {
        const nextPoint = connectionPoints[(i + 1) % connectionPoints.length];
        const breathe = Math.sin(frame * 0.02 + i * 0.5) * 10;

        const currentX = point.x + breathe * Math.cos(i);
        const currentY = point.y + breathe * Math.sin(i);
        const nextX = nextPoint.x + breathe * Math.cos(i + 1);
        const nextY = nextPoint.y + breathe * Math.sin(i + 1);

        return (
          <React.Fragment key={`conn-${i}`}>
            <line
              x1={currentX}
              y1={currentY}
              x2={nextX}
              y2={nextY}
              stroke={accentColor}
              strokeWidth={0.5}
              opacity={0.15}
            />
            <circle
              cx={currentX}
              cy={currentY}
              r={3}
              fill={accentColor}
              opacity={0.2}
            />
          </React.Fragment>
        );
      })}
    </svg>
  );
};

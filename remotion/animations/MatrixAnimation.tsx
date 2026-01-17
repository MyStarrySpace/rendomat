import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps } from './types';

interface MatrixColumn {
  id: number;
  x: number;
  speed: number;
  length: number;
  delay: number;
  chars: string[];
}

export const MatrixAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const columnCount = intensity === 'low' ? 15 : intensity === 'medium' ? 25 : 40;
  const accentColor = theme.colors.accent || '#8B5CF6';
  const charSize = 14;

  // Characters to use (mix of numbers, symbols, and katakana-like chars)
  const charSet = '0123456789ABCDEF+=-*/><[]{}|\\'.split('');

  const columns = useMemo<MatrixColumn[]>(() => {
    return Array.from({ length: columnCount }, (_, i) => {
      const length = 5 + Math.floor(Math.random() * 15);
      return {
        id: i,
        x: (i / columnCount) * width + Math.random() * 20 - 10,
        speed: 1 + Math.random() * 2,
        length,
        delay: Math.random() * 120,
        chars: Array.from({ length }, () =>
          charSet[Math.floor(Math.random() * charSet.length)]
        ),
      };
    });
  }, [columnCount, width, charSet.length]);

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
        <linearGradient id="matrixFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
          <stop offset="50%" stopColor={accentColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {columns.map((column) => {
        const effectiveFrame = Math.max(0, frame - column.delay);
        const cycleLength = height / column.speed + column.length * charSize;
        const yOffset = (effectiveFrame * column.speed) % cycleLength;

        return (
          <g key={column.id}>
            {column.chars.map((char, charIndex) => {
              const baseY = yOffset - charIndex * charSize;
              const y = baseY;

              // Wrap around
              const wrappedY = ((y % (height + column.length * charSize)) + height + column.length * charSize) % (height + column.length * charSize) - column.length * charSize / 2;

              if (wrappedY < -charSize || wrappedY > height + charSize) return null;

              // First character is brighter
              const isBright = charIndex === 0;
              const fadeProgress = charIndex / column.length;
              const opacity = isBright ? 0.3 : Math.max(0, 0.15 * (1 - fadeProgress));

              // Randomly change character occasionally
              const frameOffset = Math.floor(effectiveFrame / 10) + column.id + charIndex;
              const displayChar = frameOffset % 20 === 0
                ? charSet[Math.floor(Math.random() * charSet.length)]
                : char;

              return (
                <text
                  key={`${column.id}-${charIndex}`}
                  x={column.x}
                  y={wrappedY}
                  fill={isBright ? '#fff' : accentColor}
                  fontSize={charSize}
                  fontFamily="monospace"
                  opacity={opacity}
                  textAnchor="middle"
                >
                  {displayChar}
                </text>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

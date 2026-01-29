import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, resolveParams } from './types';
import { createRng, rngFloat, rngInt, rngPick } from './random';

interface MatrixColumn {
  id: number;
  x: number;
  speed: number;
  length: number;
  delay: number;
  chars: string[];
  entranceDelay: number;
}

const CHAR_SET = '0123456789ABCDEF+=-*/><[]{}|\\'.split('');

export const MatrixAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
  params: rawParams,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = resolveParams(rawParams);

  const baseCount = intensity === 'low' ? 15 : intensity === 'medium' ? 25 : 40;
  const columnCount = Math.round(baseCount * p.density);
  const accentColor = p.colorOverride || theme.colors.accent || '#8B5CF6';
  const charSize = 14 * p.scale;

  const columns = useMemo<MatrixColumn[]>(() => {
    const rng = createRng(5000);
    return Array.from({ length: columnCount }, (_, i) => {
      const length = rngInt(rng, 5, 20);
      return {
        id: i,
        x: (i / columnCount) * width + rngFloat(rng, -10, 10),
        speed: rngFloat(rng, 1, 3),
        length,
        delay: rngFloat(rng, 0, 120),
        chars: Array.from({ length }, () => rngPick(rng, CHAR_SET)),
        entranceDelay: rngFloat(rng, 0, 30),
      };
    });
  }, [columnCount, width]);

  // Seeded character mutation (deterministic per frame)
  const getCharAtFrame = (baseChar: string, colId: number, charIdx: number, f: number): string => {
    const mutationSeed = colId * 100 + charIdx;
    const cycle = Math.floor(f / 8);
    // Use a simple hash to pick character deterministically
    const hash = ((mutationSeed + cycle) * 2654435761) >>> 0;
    if (hash % 5 === 0) {
      return CHAR_SET[hash % CHAR_SET.length];
    }
    return baseChar;
  };

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
        <linearGradient id="matrixFade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
          <stop offset="50%" stopColor={accentColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </linearGradient>
        <filter id="headGlow">
          <feGaussianBlur stdDeviation={4 * p.blur} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g opacity={entrance}>
        {columns.map((column) => {
          // Column stagger entrance
          const colEntrance = interpolate(
            frame,
            [column.entranceDelay, column.entranceDelay + 15],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          const effectiveFrame = Math.max(0, frame - column.delay);
          const cycleLength = height / column.speed + column.length * charSize;
          const yOffset = (effectiveFrame * column.speed * p.speed) % cycleLength;

          return (
            <g key={column.id} opacity={colEntrance}>
              {column.chars.map((char, charIndex) => {
                const baseY = yOffset - charIndex * charSize;
                const wrappedY = ((baseY % (height + column.length * charSize)) + height + column.length * charSize) % (height + column.length * charSize) - column.length * charSize / 2;

                if (wrappedY < -charSize || wrappedY > height + charSize) return null;

                const isHead = charIndex === 0;
                const fadeProgress = charIndex / column.length;
                const opacity = isHead ? 0.5 : Math.max(0, 0.25 * (1 - fadeProgress));

                const displayChar = getCharAtFrame(char, column.id, charIndex, effectiveFrame);

                return (
                  <text
                    key={`${column.id}-${charIndex}`}
                    x={column.x}
                    y={wrappedY}
                    fill={isHead ? '#fff' : accentColor}
                    fontSize={charSize}
                    fontFamily="monospace"
                    opacity={opacity}
                    textAnchor="middle"
                    filter={isHead ? 'url(#headGlow)' : undefined}
                  >
                    {displayChar}
                  </text>
                );
              })}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

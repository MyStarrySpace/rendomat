import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, resolveParams } from './types';
import { createRng, rngFloat, rngInt, rngPick } from './random';

type ConfettiShape = 'rect' | 'circle' | 'triangle' | 'star' | 'ribbon';

interface ConfettiPiece {
  id: number;
  x: number;
  startY: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  fallSpeed: number;
  swayAmplitude: number;
  swayFrequency: number;
  color: string;
  shape: ConfettiShape;
  delay: number;
  tumbleSpeed: number;
}

// Expanded color palette
const COLOR_PALETTE = [
  '#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#FF8C94', '#A8E6CF', '#FFD93D',
];

export const ConfettiAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
  params: rawParams,
}) => {
  const rawFrame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = resolveParams(rawParams);
  const frame = rawFrame + p.timeOffset;

  const baseCount = intensity === 'low' ? 20 : intensity === 'medium' ? 40 : 70;
  const pieceCount = Math.round(baseCount * p.density);
  const accentColor = p.colorOverride || theme.colors.accent || '#8B5CF6';

  const pieces = useMemo<ConfettiPiece[]>(() => {
    const rng = createRng(7000);
    const shapes: ConfettiShape[] = ['rect', 'circle', 'triangle', 'star', 'ribbon'];
    const colors = [accentColor, ...COLOR_PALETTE];

    return Array.from({ length: pieceCount }, (_, i) => ({
      id: i,
      x: rngFloat(rng, 0, 100),
      startY: rngFloat(rng, -20, -5),
      size: rngFloat(rng, 4, 10),
      rotation: rngFloat(rng, 0, 360),
      rotationSpeed: rngFloat(rng, -8, 8),
      fallSpeed: rngFloat(rng, 0.2, 0.5),
      swayAmplitude: rngFloat(rng, 2, 5),
      swayFrequency: rngFloat(rng, 0.02, 0.04),
      color: rngPick(rng, colors),
      shape: rngPick(rng, shapes),
      delay: rngFloat(rng, 0, 60),
      tumbleSpeed: rngFloat(rng, 0.08, 0.15),
    }));
  }, [pieceCount, accentColor]);

  // Global entrance: initial burst then settle (uses rawFrame so each scene fades in independently)
  const entrance = interpolate(rawFrame, [0, p.entranceDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * p.opacity;

  // Initial burst - faster fall at start (uses rawFrame for per-scene entrance)
  const burstMultiplier = interpolate(rawFrame, [0, 30, 60], [2, 1.2, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const renderShape = (piece: ConfettiPiece, rotation: number, tumbleScaleX: number) => {
    switch (piece.shape) {
      case 'rect':
        return (
          <rect
            x={-piece.size / 2}
            y={-piece.size / 4}
            width={piece.size}
            height={piece.size / 2}
            transform={`rotate(${rotation}) scale(${tumbleScaleX}, 1)`}
          />
        );
      case 'circle':
        return (
          <ellipse
            cx={0}
            cy={0}
            rx={piece.size / 2 * tumbleScaleX}
            ry={piece.size / 2}
          />
        );
      case 'triangle': {
        const h = piece.size * 0.866;
        return (
          <polygon
            points={`0,${-h / 2} ${-piece.size / 2},${h / 2} ${piece.size / 2},${h / 2}`}
            transform={`rotate(${rotation}) scale(${tumbleScaleX}, 1)`}
          />
        );
      }
      case 'star': {
        const r = piece.size / 2;
        const ir = r * 0.4;
        const pts: string[] = [];
        for (let i = 0; i < 5; i++) {
          const outerAngle = (i * 72 - 90) * (Math.PI / 180);
          const innerAngle = ((i * 72 + 36) - 90) * (Math.PI / 180);
          pts.push(`${Math.cos(outerAngle) * r},${Math.sin(outerAngle) * r}`);
          pts.push(`${Math.cos(innerAngle) * ir},${Math.sin(innerAngle) * ir}`);
        }
        return (
          <polygon
            points={pts.join(' ')}
            transform={`rotate(${rotation}) scale(${tumbleScaleX}, 1)`}
          />
        );
      }
      case 'ribbon':
        return (
          <rect
            x={-piece.size / 2}
            y={-piece.size / 8}
            width={piece.size}
            height={piece.size / 4}
            rx={piece.size / 8}
            transform={`rotate(${rotation}) scale(${tumbleScaleX}, 1)`}
          />
        );
      default:
        return null;
    }
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
      <g opacity={entrance}>
        {pieces.map((piece) => {
          const effectiveFrame = Math.max(0, frame - piece.delay);

          const progress = (effectiveFrame * piece.fallSpeed * burstMultiplier * p.speed) % 130;
          const y = piece.startY + progress;

          const sway = Math.sin(effectiveFrame * piece.swayFrequency + piece.id) * piece.swayAmplitude;
          const x = piece.x + sway;

          const currentRotation = piece.rotation + effectiveFrame * piece.rotationSpeed;

          // 3D tumble illusion via scaleX oscillation
          const tumbleScaleX = 0.3 + Math.abs(Math.cos(effectiveFrame * piece.tumbleSpeed)) * 0.7;

          const opacity = interpolate(
            y,
            [piece.startY, piece.startY + 10, 80, 100, 110],
            [0, 0.5, 0.4, 0.2, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          if (opacity <= 0) return null;

          return (
            <g
              key={piece.id}
              transform={`translate(${(x / 100) * width}, ${(y / 100) * height}) scale(${p.scale})`}
              fill={piece.color}
              opacity={opacity}
            >
              {renderShape(piece, currentRotation, tumbleScaleX)}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps } from './types';

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
  shape: 'rect' | 'circle' | 'triangle';
  delay: number;
}

export const ConfettiAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const pieceCount = intensity === 'low' ? 20 : intensity === 'medium' ? 40 : 70;
  const accentColor = theme.colors.accent || '#8B5CF6';

  // Parse accent color for variations
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

  const pieces = useMemo<ConfettiPiece[]>(() => {
    const shapes: Array<'rect' | 'circle' | 'triangle'> = ['rect', 'circle', 'triangle'];

    return Array.from({ length: pieceCount }, (_, i) => {
      // Generate color variations
      const hueShift = (Math.random() - 0.5) * 60;
      const r = Math.min(255, Math.max(0, baseColor.r + hueShift));
      const g = Math.min(255, Math.max(0, baseColor.g + hueShift * 0.5));
      const b = Math.min(255, Math.max(0, baseColor.b - hueShift * 0.3));

      return {
        id: i,
        x: Math.random() * 100,
        startY: -10 - Math.random() * 20,
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        fallSpeed: 0.3 + Math.random() * 0.4,
        swayAmplitude: 2 + Math.random() * 4,
        swayFrequency: 0.02 + Math.random() * 0.03,
        color: `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        delay: Math.random() * 90,
      };
    });
  }, [pieceCount, baseColor.r, baseColor.g, baseColor.b]);

  const renderShape = (piece: ConfettiPiece, rotation: number) => {
    switch (piece.shape) {
      case 'rect':
        return (
          <rect
            x={-piece.size / 2}
            y={-piece.size / 4}
            width={piece.size}
            height={piece.size / 2}
            rx={1}
            transform={`rotate(${rotation})`}
          />
        );
      case 'circle':
        return <circle cx={0} cy={0} r={piece.size / 2} />;
      case 'triangle':
        const h = piece.size * 0.866;
        return (
          <polygon
            points={`0,${-h / 2} ${-piece.size / 2},${h / 2} ${piece.size / 2},${h / 2}`}
            transform={`rotate(${rotation})`}
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
      {pieces.map((piece) => {
        const effectiveFrame = Math.max(0, frame - piece.delay);

        // Calculate position
        const progress = (effectiveFrame * piece.fallSpeed) % 130;
        const y = piece.startY + progress;

        // Sway motion
        const sway = Math.sin(effectiveFrame * piece.swayFrequency + piece.id) * piece.swayAmplitude;
        const x = piece.x + sway;

        // Rotation
        const currentRotation = piece.rotation + effectiveFrame * piece.rotationSpeed;

        // Fade out near bottom
        const opacity = interpolate(
          y,
          [80, 100, 110],
          [0.4, 0.2, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        if (opacity <= 0) return null;

        return (
          <g
            key={piece.id}
            transform={`translate(${(x / 100) * width}, ${(y / 100) * height})`}
            fill={piece.color}
            opacity={opacity}
          >
            {renderShape(piece, currentRotation)}
          </g>
        );
      })}
    </svg>
  );
};

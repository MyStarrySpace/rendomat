import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, resolveParams } from './types';
import { createRng, rngFloat, rngInt, rngPick } from './random';

type ShapeType = 'circle' | 'square' | 'triangle' | 'hexagon' | 'diamond';

interface FloatingShape {
  id: number;
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  floatSpeed: number;
  floatRange: number;
  opacity: number;
  delay: number;
}

export const FloatingShapesAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
  params: rawParams,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = resolveParams(rawParams);

  const baseCount = intensity === 'low' ? 8 : intensity === 'medium' ? 15 : 25;
  const shapeCount = Math.round(baseCount * p.density);

  const shapes = useMemo<FloatingShape[]>(() => {
    const rng = createRng(2000);
    const types: ShapeType[] = ['circle', 'square', 'triangle', 'hexagon', 'diamond'];
    return Array.from({ length: shapeCount }, (_, i) => ({
      id: i,
      type: rngPick(rng, types),
      x: rngFloat(rng, 0, 100),
      y: rngFloat(rng, 0, 100),
      size: rngFloat(rng, 30, 90),
      rotation: rngFloat(rng, 0, 360),
      rotationSpeed: rngFloat(rng, -1, 1),
      floatSpeed: rngFloat(rng, 0.02, 0.05),
      floatRange: rngFloat(rng, 10, 30),
      opacity: rngFloat(rng, 0.06, 0.12),
      delay: rngFloat(rng, 0, 30),
    }));
  }, [shapeCount]);

  const accentColor = p.colorOverride || theme.colors.accent || '#8B5CF6';

  // Global entrance fade
  const entrance = interpolate(frame, [0, p.entranceDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * p.opacity;

  const renderShape = (shape: FloatingShape, currentRotation: number) => {
    const transform = `rotate(${currentRotation})`;

    switch (shape.type) {
      case 'circle':
        return <circle cx="0" cy="0" r={shape.size / 2} transform={transform} />;
      case 'square':
        return (
          <rect
            x={-shape.size / 2}
            y={-shape.size / 2}
            width={shape.size}
            height={shape.size}
            transform={transform}
          />
        );
      case 'triangle': {
        const h = (shape.size * Math.sqrt(3)) / 2;
        return (
          <polygon
            points={`0,${-h / 1.5} ${-shape.size / 2},${h / 3} ${shape.size / 2},${h / 3}`}
            transform={transform}
          />
        );
      }
      case 'hexagon': {
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = (i * 60 - 30) * (Math.PI / 180);
          const r = shape.size / 2;
          return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
        }).join(' ');
        return <polygon points={points} transform={transform} />;
      }
      case 'diamond': {
        const half = shape.size / 2;
        return (
          <polygon
            points={`0,${-half} ${half * 0.6},0 0,${half} ${-half * 0.6},0`}
            transform={transform}
          />
        );
      }
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
      <defs>
        <filter id="shapeShadow">
          <feGaussianBlur stdDeviation={4 * p.blur} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g opacity={entrance}>
        {shapes.map((shape) => {
          const effectiveFrame = Math.max(0, frame - shape.delay);
          const currentRotation = shape.rotation + effectiveFrame * shape.rotationSpeed * p.speed;
          const floatOffset = Math.sin(effectiveFrame * shape.floatSpeed * p.speed) * shape.floatRange;

          const x = (shape.x / 100) * width;
          const y = (shape.y / 100) * height + floatOffset;

          // Staggered scale-up entrance per shape
          const shapeEntrance = interpolate(
            frame,
            [shape.delay, shape.delay + 15],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          const scale = (1 + Math.sin(effectiveFrame * 0.03 + shape.id) * 0.1) * shapeEntrance * p.scale;

          return (
            <g
              key={shape.id}
              transform={`translate(${x}, ${y}) scale(${scale})`}
              fill={accentColor}
              opacity={shape.opacity}
              filter="url(#shapeShadow)"
            >
              {renderShape(shape, currentRotation)}
            </g>
          );
        })}
      </g>
    </svg>
  );
};

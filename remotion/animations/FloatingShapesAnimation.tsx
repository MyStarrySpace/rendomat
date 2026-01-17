import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps } from './types';

type ShapeType = 'circle' | 'square' | 'triangle' | 'hexagon';

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
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const shapeCount = intensity === 'low' ? 8 : intensity === 'medium' ? 15 : 25;

  const shapes = useMemo<FloatingShape[]>(() => {
    const types: ShapeType[] = ['circle', 'square', 'triangle', 'hexagon'];
    return Array.from({ length: shapeCount }, (_, i) => ({
      id: i,
      type: types[Math.floor(Math.random() * types.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 30 + Math.random() * 60,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      floatSpeed: 0.02 + Math.random() * 0.03,
      floatRange: 10 + Math.random() * 20,
      opacity: 0.03 + Math.random() * 0.07,
      delay: Math.random() * 30,
    }));
  }, [shapeCount]);

  const accentColor = theme.colors.accent || '#8B5CF6';

  const renderShape = (shape: FloatingShape, currentRotation: number, scale: number) => {
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
            rx={shape.size * 0.1}
          />
        );
      case 'triangle':
        const h = (shape.size * Math.sqrt(3)) / 2;
        return (
          <polygon
            points={`0,${-h / 1.5} ${-shape.size / 2},${h / 3} ${shape.size / 2},${h / 3}`}
            transform={transform}
          />
        );
      case 'hexagon':
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = (i * 60 - 30) * (Math.PI / 180);
          const r = shape.size / 2;
          return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
        }).join(' ');
        return <polygon points={points} transform={transform} />;
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
      {shapes.map((shape) => {
        const effectiveFrame = Math.max(0, frame - shape.delay);
        const currentRotation = shape.rotation + effectiveFrame * shape.rotationSpeed;
        const floatOffset = Math.sin(effectiveFrame * shape.floatSpeed) * shape.floatRange;

        const x = (shape.x / 100) * width;
        const y = (shape.y / 100) * height + floatOffset;

        // Gentle pulse
        const scale = 1 + Math.sin(effectiveFrame * 0.03 + shape.id) * 0.1;

        return (
          <g
            key={shape.id}
            transform={`translate(${x}, ${y}) scale(${scale})`}
            fill={accentColor}
            opacity={shape.opacity}
          >
            {renderShape(shape, currentRotation, scale)}
          </g>
        );
      })}
    </svg>
  );
};

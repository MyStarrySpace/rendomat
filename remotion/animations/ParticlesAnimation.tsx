import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps } from './types';

interface Particle {
  id: number;
  x: number;
  startY: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
}

export const ParticlesAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particleCount = intensity === 'low' ? 20 : intensity === 'medium' ? 40 : 60;

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      startY: 100 + Math.random() * 20,
      size: 2 + Math.random() * 4,
      speed: 0.3 + Math.random() * 0.5,
      opacity: 0.2 + Math.random() * 0.4,
      delay: Math.random() * 60,
    }));
  }, [particleCount]);

  const accentColor = theme.colors.accent || '#8B5CF6';

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
        <radialGradient id="particleGradient">
          <stop offset="0%" stopColor={accentColor} stopOpacity="1" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      {particles.map((particle) => {
        const effectiveFrame = Math.max(0, frame - particle.delay);
        const progress = (effectiveFrame * particle.speed) % 120;
        const y = particle.startY - progress;

        // Fade in at start, fade out near top
        const particleOpacity = interpolate(
          y,
          [0, 20, 80, 100],
          [0, particle.opacity, particle.opacity, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Slight horizontal drift
        const drift = Math.sin(effectiveFrame * 0.05 + particle.id) * 2;

        return (
          <circle
            key={particle.id}
            cx={`${particle.x + drift}%`}
            cy={`${y}%`}
            r={particle.size}
            fill="url(#particleGradient)"
            opacity={particleOpacity}
          />
        );
      })}
    </svg>
  );
};

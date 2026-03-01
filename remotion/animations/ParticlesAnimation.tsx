import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, resolveParams } from './types';
import { createRng, rngFloat, rngInt } from './random';

type ParticleTier = 'sparkle' | 'dot' | 'orb';

interface Particle {
  id: number;
  x: number;
  startY: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
  tier: ParticleTier;
}

const TIER_SIZES: Record<ParticleTier, [number, number]> = {
  sparkle: [1, 2],
  dot: [3, 5],
  orb: [6, 10],
};

export const ParticlesAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
  params: rawParams,
}) => {
  const rawFrame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = resolveParams(rawParams);
  const frame = rawFrame + p.timeOffset;

  const baseCount = intensity === 'low' ? 20 : intensity === 'medium' ? 40 : 60;
  const particleCount = Math.round(baseCount * p.density);

  const particles = useMemo<Particle[]>(() => {
    const rng = createRng(1000);
    const tiers: ParticleTier[] = ['sparkle', 'sparkle', 'dot', 'dot', 'dot', 'orb'];
    return Array.from({ length: particleCount }, (_, i) => {
      const tier = tiers[rngInt(rng, 0, tiers.length - 1)];
      const [minSize, maxSize] = TIER_SIZES[tier];
      return {
        id: i,
        x: rngFloat(rng, 0, 100),
        startY: rngFloat(rng, 100, 120),
        size: rngFloat(rng, minSize, maxSize),
        speed: rngFloat(rng, 0.3, 0.8),
        opacity: rngFloat(rng, 0.15, 0.35),
        delay: rngFloat(rng, 0, 60),
        tier,
      };
    });
  }, [particleCount]);

  const accentColor = p.colorOverride || theme.colors.accent || '#8B5CF6';

  // Global entrance fade (uses rawFrame so each scene fades in independently)
  const entrance = interpolate(rawFrame, [0, p.entranceDuration], [0, 1], {
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
        <filter id="particleGlow">
          <feGaussianBlur stdDeviation={3 * p.blur} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <symbol id="particle-sparkle" viewBox="0 0 4 4">
          <circle cx="2" cy="2" r="2" />
        </symbol>
        <symbol id="particle-dot" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="5" />
        </symbol>
        <symbol id="particle-orb" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="10" />
          <circle cx="10" cy="10" r="6" opacity="0.5" />
        </symbol>
        <radialGradient id="particleGradient">
          <stop offset="0%" stopColor={accentColor} stopOpacity="1" />
          <stop offset="70%" stopColor={accentColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g opacity={entrance}>
        {particles.map((particle) => {
          const effectiveFrame = Math.max(0, frame - particle.delay);
          const progress = (effectiveFrame * particle.speed * p.speed) % 120;
          const y = particle.startY - progress;

          const particleOpacity = interpolate(
            y,
            [0, 20, 80, 100],
            [0, particle.opacity, particle.opacity, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          const drift = Math.sin(effectiveFrame * 0.05 + particle.id) * 2;

          return (
            <circle
              key={particle.id}
              cx={`${particle.x + drift}%`}
              cy={`${y}%`}
              r={particle.size * p.scale}
              fill="url(#particleGradient)"
              opacity={particleOpacity}
              filter="url(#particleGlow)"
            />
          );
        })}
      </g>
    </svg>
  );
};

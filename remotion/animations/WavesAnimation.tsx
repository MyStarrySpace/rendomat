import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, resolveParams } from './types';

// Golden ratio for irrational phase spacing — prevents waves from syncing
const PHI = 1.618033988749;

// Per-wave presets: each wave has its own character.
// speed: base animation rate (lower-frequency waves move faster, like real ocean dispersion)
// freq:  primary sine frequency
// amp:   base amplitude in px
// phase: irrational offset so layers never align
// yPct:  vertical position as fraction of height
const WAVE_PRESETS = [
  { speed: 0.012, freq: 1.0,  amp: 30, phase: 0,               yPct: 0.62 },
  { speed: 0.009, freq: 1.4,  amp: 24, phase: PHI,             yPct: 0.68 },
  { speed: 0.006, freq: 1.9,  amp: 18, phase: PHI * 2,         yPct: 0.74 },
  { speed: 0.015, freq: 0.8,  amp: 35, phase: PHI * 3,         yPct: 0.58 },
  { speed: 0.004, freq: 2.3,  amp: 14, phase: Math.PI,         yPct: 0.80 },
  { speed: 0.010, freq: 1.2,  amp: 27, phase: Math.PI + PHI,   yPct: 0.65 },
];

export const WavesAnimation: React.FC<AnimationProps> = ({
  durationInFrames,
  theme,
  intensity = 'medium',
  params: rawParams,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = resolveParams(rawParams);

  const baseCount = intensity === 'low' ? 3 : intensity === 'medium' ? 4 : 6;
  const waveCount = Math.min(Math.round(baseCount * p.density), WAVE_PRESETS.length);
  const accentColor = p.colorOverride || theme.colors.accent || '#8B5CF6';

  // Global entrance fade
  const entrance = interpolate(frame, [0, p.entranceDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }) * p.opacity;

  // Compute Y displacement for a single wave at position normalizedX [0..1].
  // Uses 3 harmonics with different frequency ratios for organic shape,
  // plus a slow vertical drift so each wave breathes independently.
  const computeY = (
    normalizedX: number,
    preset: typeof WAVE_PRESETS[number],
  ): number => {
    const t = frame * preset.speed * p.speed;
    const f = preset.freq;
    const ph = preset.phase;
    const a = preset.amp * p.scale;

    // Primary wave
    const w1 = Math.sin((normalizedX * f + t + ph) * Math.PI * 2) * a;
    // Second harmonic — half frequency, 40% amplitude, offset phase
    const w2 = Math.sin((normalizedX * f * 0.53 + t * 0.73 + ph * 1.7) * Math.PI * 2) * (a * 0.4);
    // Third harmonic — higher frequency for sharper crests, 15% amplitude
    const w3 = Math.sin((normalizedX * f * 2.1 + t * 1.3 + ph * 0.6) * Math.PI * 2) * (a * 0.15);
    // Slow vertical drift — each wave gently rises and falls over time
    const drift = Math.sin((t * 0.3 + ph * 2.3) * Math.PI * 2) * (a * 0.2);

    return w1 + w2 + w3 + drift;
  };

  const SEGMENTS = 30;

  const generateWavePath = (preset: typeof WAVE_PRESETS[number]) => {
    const step = width / SEGMENTS;
    const baseY = height * preset.yPct;
    const points: [number, number][] = [];

    for (let i = 0; i <= SEGMENTS; i++) {
      const x = i * step;
      const nx = x / width;
      points.push([x, baseY + computeY(nx, preset)]);
    }

    // Smooth quadratic bezier curve through all points
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev[0] + curr[0]) / 2;
      const cpy = (prev[1] + curr[1]) / 2;
      d += ` Q ${prev[0]} ${prev[1]}, ${cpx} ${cpy}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last[0]} ${last[1]}`;
    // Close at bottom
    d += ` L ${width} ${height} L 0 ${height} Z`;
    return d;
  };

  const generateCrestPath = (preset: typeof WAVE_PRESETS[number]) => {
    const step = width / SEGMENTS;
    const baseY = height * preset.yPct;
    const points: [number, number][] = [];

    for (let i = 0; i <= SEGMENTS; i++) {
      const x = i * step;
      const nx = x / width;
      points.push([x, baseY + computeY(nx, preset)]);
    }

    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev[0] + curr[0]) / 2;
      const cpy = (prev[1] + curr[1]) / 2;
      d += ` Q ${prev[0]} ${prev[1]}, ${cpx} ${cpy}`;
    }
    return d;
  };

  // Sort by yPct so back (higher) waves render first, front waves on top
  const activePresets = WAVE_PRESETS.slice(0, waveCount)
    .slice()
    .sort((a, b) => a.yPct - b.yPct);

  const waves = activePresets.map((preset, i) => {
    // Opacity: waves further back are more transparent, front waves more opaque
    const depthFactor = i / Math.max(waveCount - 1, 1);
    const opacity = 0.06 + depthFactor * 0.10;

    return {
      path: generateWavePath(preset),
      crest: generateCrestPath(preset),
      opacity,
    };
  });

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
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.8" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.2" />
        </linearGradient>
        <filter id="waveGlow">
          <feGaussianBlur stdDeviation={2 * p.blur} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g opacity={entrance}>
        {waves.map((wave, i) => (
          <g key={i}>
            <path
              d={wave.path}
              fill="url(#waveGradient)"
              opacity={wave.opacity}
            />
            <path
              d={wave.crest}
              fill="none"
              stroke={accentColor}
              strokeWidth={1.5}
              opacity={wave.opacity * 0.6}
              filter="url(#waveGlow)"
            />
          </g>
        ))}
      </g>
    </svg>
  );
};

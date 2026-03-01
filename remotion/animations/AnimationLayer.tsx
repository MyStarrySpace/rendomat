import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { AnimationStyleId, AnimationProps, AnimationParams, Theme, resolveParams } from './types';
import { ParticlesAnimation } from './ParticlesAnimation';
import { FloatingShapesAnimation } from './FloatingShapesAnimation';
import { WavesAnimation } from './WavesAnimation';
import { GridPulseAnimation } from './GridPulseAnimation';
import { BokehAnimation } from './BokehAnimation';
import { GeometricAnimation } from './GeometricAnimation';
import { MatrixAnimation } from './MatrixAnimation';
import { AuroraAnimation } from './AuroraAnimation';
import { ConfettiAnimation } from './ConfettiAnimation';

export interface AnimationLayerProps {
  animationStyle: AnimationStyleId;
  durationInFrames: number;
  theme: Theme;
  intensity?: 'low' | 'medium' | 'high';
  params?: AnimationParams;
}

const animationComponents: Record<
  Exclude<AnimationStyleId, 'none'>,
  React.FC<AnimationProps>
> = {
  particles: ParticlesAnimation,
  'floating-shapes': FloatingShapesAnimation,
  waves: WavesAnimation,
  'grid-pulse': GridPulseAnimation,
  bokeh: BokehAnimation,
  geometric: GeometricAnimation,
  matrix: MatrixAnimation,
  aurora: AuroraAnimation,
  confetti: ConfettiAnimation,
};

export const AnimationLayer: React.FC<AnimationLayerProps> = ({
  animationStyle,
  durationInFrames,
  theme,
  intensity = 'medium',
  params,
}) => {
  const frame = useCurrentFrame();

  if (animationStyle === 'none') {
    return null;
  }

  const AnimationComponent = animationComponents[animationStyle];

  if (!AnimationComponent) {
    console.warn(`Unknown animation style: ${animationStyle}`);
    return null;
  }

  const p = resolveParams(params);

  // Focus zoom: animate from scale(1) → scale(focusZoom) over 80% of duration
  const zoomEnd = Math.floor(durationInFrames * 0.8);
  const currentZoom = p.focusZoom !== 1
    ? interpolate(frame, [0, zoomEnd], [1, p.focusZoom], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.quad),
      })
    : 1;

  // Attenuated drift: translate in driftDirection over scene duration
  let driftX = 0;
  let driftY = 0;
  if (p.driftDirection !== 'none' && p.driftAmount > 0) {
    const driftProgress = interpolate(frame, [0, durationInFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.quad),
    });
    const drift = driftProgress * p.driftAmount;
    switch (p.driftDirection) {
      case 'up':    driftY = -drift; break;
      case 'down':  driftY = drift;  break;
      case 'left':  driftX = -drift; break;
      case 'right': driftX = drift;  break;
    }
  }

  const needsWrapper = currentZoom !== 1 || driftX !== 0 || driftY !== 0;

  const content = (
    <AnimationComponent
      durationInFrames={durationInFrames}
      theme={theme}
      intensity={intensity}
      params={params}
    />
  );

  if (!needsWrapper) {
    return content;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        transform: `translate(${driftX}px, ${driftY}px) scale(${currentZoom})`,
        transformOrigin: `${p.focusCenterX * 100}% ${p.focusCenterY * 100}%`,
      }}
    >
      {content}
    </div>
  );
};

// Helper function to get recommended animation for a scene type
export function getRecommendedAnimation(sceneType: string): AnimationStyleId {
  const recommendations: Record<string, AnimationStyleId> = {
    'text-only': 'floating-shapes',
    'single-image': 'bokeh',
    'dual-images': 'particles',
    'image-gallery': 'geometric',
    'grid': 'grid-pulse',
    'stats': 'particles',
    'bar-chart': 'grid-pulse',
    'line-chart': 'waves',
    'pie-chart': 'bokeh',
    'progress-bars': 'geometric',
    'quote': 'aurora',
    'equation': 'matrix',
  };

  return recommendations[sceneType] || 'none';
}

// Helper function to get animation suitable for theme mood
export function getAnimationForMood(mood: 'professional' | 'playful' | 'tech' | 'elegant'): AnimationStyleId[] {
  const moodAnimations: Record<string, AnimationStyleId[]> = {
    professional: ['floating-shapes', 'waves', 'bokeh'],
    playful: ['confetti', 'particles', 'floating-shapes'],
    tech: ['matrix', 'grid-pulse', 'geometric'],
    elegant: ['aurora', 'bokeh', 'waves'],
  };

  return moodAnimations[mood] || ['none'];
}

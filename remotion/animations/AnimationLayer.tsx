import React from 'react';
import { AnimationStyleId, AnimationProps, Theme } from './types';
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
}) => {
  if (animationStyle === 'none') {
    return null;
  }

  const AnimationComponent = animationComponents[animationStyle];

  if (!AnimationComponent) {
    console.warn(`Unknown animation style: ${animationStyle}`);
    return null;
  }

  return (
    <AnimationComponent
      durationInFrames={durationInFrames}
      theme={theme}
      intensity={intensity}
    />
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

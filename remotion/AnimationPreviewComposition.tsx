import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AnimationLayer } from './animations/AnimationLayer';
import { getTheme } from './themes';
import type { AnimationStyleId, AnimationParams } from './animations/types';

export interface AnimationPreviewProps {
  animationStyle: AnimationStyleId;
  animationIntensity?: 'low' | 'medium' | 'high';
  animationParams?: AnimationParams;
  themeId?: string;
  durationFrames?: number;
}

export const AnimationPreviewComposition: React.FC<AnimationPreviewProps> = ({
  animationStyle,
  animationIntensity = 'medium',
  animationParams,
  themeId = 'tech-dark',
  durationFrames = 90,
}) => {
  const theme = getTheme(themeId);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background || '#0a0a0a',
      }}
    >
      <AnimationLayer
        animationStyle={animationStyle}
        durationInFrames={durationFrames}
        theme={theme}
        intensity={animationIntensity}
        params={animationParams}
      />
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'sans-serif',
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {animationStyle}
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

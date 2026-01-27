import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SceneProps } from './types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { usePresetSceneFade } from '../lib/motion';
import {
  AnimationPreset,
  getElementConfig,
} from '../lib/animationPresets';
import { AnimatedText } from '../components/AnimatedText';

export const TextOnlyScene: React.FC<SceneProps> = ({ data, durationInFrames, theme, skipFadeOut = false }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'energetic' (user preference)
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'energetic';

  // Get element-specific configs
  const titleConfig = getElementConfig('text-only', preset, 'title');
  const bodyConfig = getElementConfig('text-only', preset, 'body');

  // Scene fade (skip fade-out when using external transitions)
  const sceneFade = usePresetSceneFade(titleConfig, durationInFrames, skipFadeOut);

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: layout.padding,
      opacity: sceneFade,
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: layout.maxWidth,
        fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
      }}>
        {data.title && (
          <div style={{
            fontSize: layout.titleFontSize,
            fontWeight: layout.titleFontWeight,
            color: theme.colors.textPrimary,
            marginBottom: layout.gap,
            lineHeight: 1.2,
            letterSpacing: layout.titleLetterSpacing,
            textShadow: layout.titleTextShadow,
            fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
          }}>
            <AnimatedText
              preset={preset}
              startDelay={titleConfig.startDelay}
              distance={titleConfig.distance}
            >
              {data.title}
            </AnimatedText>
          </div>
        )}
        {data.body_text && (
          <div style={{
            fontSize: layout.bodyFontSize,
            fontWeight: layout.bodyFontWeight,
            color: theme.colors.textSecondary,
            lineHeight: 1.5,
            letterSpacing: layout.bodyLetterSpacing,
            textShadow: layout.bodyTextShadow,
          }}>
            <AnimatedText
              preset={preset}
              startDelay={bodyConfig.startDelay}
              distance={bodyConfig.distance}
            >
              {data.body_text}
            </AnimatedText>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

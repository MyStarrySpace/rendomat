import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SceneProps } from './types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import {
  usePresetAnimation,
  usePresetSceneFade,
  buildTransform,
} from '../lib/motion';
import {
  AnimationPreset,
  getElementConfig,
} from '../lib/animationPresets';

export const TextOnlyScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'smooth'
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'smooth';

  // Get element-specific configs
  const titleConfig = getElementConfig('text-only', preset, 'title');
  const bodyConfig = getElementConfig('text-only', preset, 'body');

  // Scene fade
  const sceneFade = usePresetSceneFade(titleConfig, durationInFrames);

  // Element animations
  const titleAnim = usePresetAnimation(titleConfig, 0);
  const bodyAnim = usePresetAnimation(bodyConfig, 1);

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
            fontWeight: 700,
            color: theme.colors.textPrimary,
            opacity: titleAnim.opacity,
            transform: buildTransform({
              translateX: titleAnim.translateX,
              translateY: titleAnim.translateY,
              scale: titleAnim.scale,
            }),
            marginBottom: layout.gap,
            lineHeight: 1.2,
            fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
          }}>
            {data.title}
          </div>
        )}
        {data.body_text && (
          <div style={{
            fontSize: layout.bodyFontSize,
            fontWeight: 300,
            color: theme.colors.textSecondary,
            opacity: bodyAnim.opacity,
            transform: buildTransform({
              translateX: bodyAnim.translateX,
              translateY: bodyAnim.translateY,
              scale: bodyAnim.scale,
            }),
            lineHeight: 1.5
          }}>
            {data.body_text}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

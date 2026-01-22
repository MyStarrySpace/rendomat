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

export const QuoteScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'smooth'
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'smooth';

  // Get element-specific configs
  const quoteMarkConfig = getElementConfig('quote', preset, 'title');
  const quoteTextConfig = getElementConfig('quote', preset, 'body');
  const authorConfig = { ...quoteTextConfig, startDelay: quoteTextConfig.startDelay + 15 };

  // Scene fade
  const sceneFade = usePresetSceneFade(quoteMarkConfig, durationInFrames);

  // Element animations
  const quoteMarkAnim = usePresetAnimation(quoteMarkConfig, 0);
  const quoteTextAnim = usePresetAnimation(quoteTextConfig, 1);
  const authorAnim = usePresetAnimation(authorConfig, 2);

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: layout.padding * 1.5,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      opacity: sceneFade,
    }}>
      <div style={{ maxWidth: layout.maxWidth, textAlign: 'center' }}>
        {/* Opening quote mark */}
        <div style={{
          fontSize: layout.isVertical ? 80 : 100,
          color: theme.colors.accent,
          opacity: quoteMarkAnim.opacity,
          transform: buildTransform({
            scale: quoteMarkAnim.scale,
            translateY: quoteMarkAnim.translateY,
          }),
          marginBottom: layout.gap * 0.5,
          lineHeight: 0.5,
          fontFamily: 'Georgia, serif',
        }}>
          "
        </div>

        {data.quote && (
          <div style={{
            fontSize: layout.quoteFontSize,
            fontWeight: 300,
            color: theme.colors.textPrimary,
            opacity: quoteTextAnim.opacity,
            transform: buildTransform({
              translateX: quoteTextAnim.translateX,
              translateY: quoteTextAnim.translateY,
              scale: quoteTextAnim.scale,
            }),
            lineHeight: 1.4,
            fontStyle: 'italic',
            marginBottom: layout.gap * 1.5
          }}>
            {data.quote}
          </div>
        )}

        {data.author && (
          <div style={{
            fontSize: layout.isVertical ? 24 : layout.isSquare ? 28 : 32,
            fontWeight: 500,
            color: theme.colors.textSecondary,
            opacity: authorAnim.opacity,
            transform: buildTransform({
              translateX: authorAnim.translateX,
              translateY: authorAnim.translateY,
            }),
            letterSpacing: '0.05em',
          }}>
            — {data.author}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

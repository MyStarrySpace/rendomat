import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SceneProps } from './types';
import {
  usePresetAnimation,
  usePresetSceneFade,
  useSceneBlur,
  buildTransform,
} from '../lib/motion';
import {
  AnimationPreset,
  getElementConfig,
  resolvePresets,
} from '../lib/animationPresets';
import { AnimatedText } from '../components/AnimatedText';
import { EchoTextAnimation } from '../components/EchoTextAnimation';
import { RevealTextAnimation } from '../components/RevealTextAnimation';
import { TrackingTextAnimation } from '../components/TrackingTextAnimation';
import { FlickerTextAnimation } from '../components/FlickerTextAnimation';
import { useTextLayout } from '../hooks/useTextLayout';
import type { TextLayoutPreset } from '../lib/textLayouts';

export const QuoteScene: React.FC<SceneProps> = ({ data, durationInFrames, theme, skipFadeOut = false }) => {
  const { layout, textLayout } = useTextLayout(data.text_layout as TextLayoutPreset | undefined);

  // Get animation preset from data or default to 'dramatic' for quotes
  const { presetIn, presetOut } = resolvePresets(data, 'dramatic');
  const preset = presetIn;

  // Get element-specific configs
  const quoteMarkConfig = getElementConfig('quote', preset, 'title');
  const quoteTextConfig = getElementConfig('quote', preset, 'body');
  const authorConfig = { ...quoteTextConfig, startDelay: quoteTextConfig.startDelay + 15 };

  // Scene fade (skip fade-out when using external transitions)
  const sceneFade = usePresetSceneFade(quoteMarkConfig, durationInFrames, skipFadeOut);
  const sceneBlur = useSceneBlur(quoteMarkConfig, durationInFrames, skipFadeOut);
  const exitConfig = presetOut ? getElementConfig('quote', presetOut, 'title') : null;
  const exitFade = exitConfig ? usePresetSceneFade(exitConfig, durationInFrames, false) : 1;

  // Quote mark animation (still uses basic animation for the symbol)
  const quoteMarkAnim = usePresetAnimation(quoteMarkConfig, 0);
  const authorAnim = usePresetAnimation(authorConfig, 2);

  const quoteFontSize = layout.quoteFontSize * (textLayout.titleScale ?? 1);

  // Custom preset components: quote text uses the full-scene custom component
  if (preset === 'echo' && data.quote) {
    return (
      <AbsoluteFill style={{
        ...textLayout.container,
        background: theme.colors.backgroundGradient || theme.colors.background,
        opacity: sceneFade * exitFade,
        filter: sceneBlur || undefined,
      }}>
        <EchoTextAnimation
          text={data.quote}
          fontSize={quoteFontSize}
          fontFamily={`'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`}
          fontWeight={layout.bodyFontWeight}
          color={theme.colors.textPrimary}
        />
      </AbsoluteFill>
    );
  }

  if (preset === 'reveal' && data.quote) {
    return (
      <AbsoluteFill style={{
        ...textLayout.container,
        background: theme.colors.backgroundGradient || theme.colors.background,
        opacity: sceneFade * exitFade,
        filter: sceneBlur || undefined,
      }}>
        <RevealTextAnimation
          text={data.quote}
          fontSize={quoteFontSize}
          fontFamily={`'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`}
          fontWeight={layout.bodyFontWeight}
          color={theme.colors.textPrimary}
        />
      </AbsoluteFill>
    );
  }

  if (preset === 'tracking' && data.quote) {
    return (
      <AbsoluteFill style={{
        ...textLayout.container,
        background: theme.colors.backgroundGradient || theme.colors.background,
        opacity: sceneFade * exitFade,
        filter: sceneBlur || undefined,
      }}>
        <TrackingTextAnimation
          text={data.quote}
          fontSize={quoteFontSize}
          fontFamily={`'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`}
          fontWeight={layout.bodyFontWeight}
          color={theme.colors.textPrimary}
        />
      </AbsoluteFill>
    );
  }

  if (preset === 'flicker' && data.quote) {
    return (
      <AbsoluteFill style={{
        ...textLayout.container,
        background: theme.colors.backgroundGradient || theme.colors.background,
        opacity: sceneFade * exitFade,
        filter: sceneBlur || undefined,
      }}>
        <FlickerTextAnimation
          text={data.quote}
          fontSize={quoteFontSize}
          fontFamily={`'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`}
          fontWeight={layout.bodyFontWeight}
          color={theme.colors.textPrimary}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{
      ...textLayout.container,
      background: theme.colors.backgroundGradient || theme.colors.background,
      padding: layout.padding * 1.5,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      opacity: sceneFade * exitFade,
      filter: sceneBlur || undefined,
    }}>
      <div style={{
        ...textLayout.content,
        maxWidth: textLayout.maxWidth ?? layout.maxWidth,
      }}>
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
          &ldquo;
        </div>

        {data.quote && (
          <div style={{
            fontSize: quoteFontSize,
            fontWeight: layout.bodyFontWeight,
            color: theme.colors.textPrimary,
            lineHeight: 1.4,
            fontStyle: 'italic',
            marginBottom: layout.gap * 1.5,
            letterSpacing: layout.bodyLetterSpacing,
            textShadow: layout.bodyTextShadow,
            ...textLayout.title,
          }}>
            <AnimatedText
              preset={preset}
              startDelay={quoteTextConfig.startDelay}
              distance={quoteTextConfig.distance}
            >
              {data.quote}
            </AnimatedText>
          </div>
        )}

        {data.author && (
          <div style={{
            fontSize: layout.isVertical ? 24 : layout.isSquare ? 28 : 32,
            fontWeight: layout.subtitleFontWeight,
            color: theme.colors.textSecondary,
            opacity: authorAnim.opacity,
            transform: buildTransform({
              translateX: authorAnim.translateX,
              translateY: authorAnim.translateY,
            }),
            letterSpacing: '0.05em',
            ...textLayout.body,
          }}>
            — {data.author}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

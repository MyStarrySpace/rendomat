import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SceneProps } from './types';
import { usePresetSceneFade, useSceneBlur } from '../lib/motion';
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

export const TextOnlyScene: React.FC<SceneProps> = ({ data, durationInFrames, theme, skipFadeOut = false }) => {
  const { layout, textLayout } = useTextLayout(data.text_layout as TextLayoutPreset | undefined);

  // Resolve entrance/exit presets
  const { presetIn, presetOut } = resolvePresets(data, 'energetic');
  const preset = presetIn;

  // Get element-specific configs
  const titleConfig = getElementConfig('text-only', preset, 'title');
  const bodyConfig = getElementConfig('text-only', preset, 'body');

  // Scene fade + blur (skip fade-out when using external transitions)
  const sceneFade = usePresetSceneFade(titleConfig, durationInFrames, skipFadeOut);
  const sceneBlur = useSceneBlur(titleConfig, durationInFrames, skipFadeOut);

  // Exit animation: if presetOut is set, compute exit fade
  const exitConfig = presetOut ? getElementConfig('text-only', presetOut, 'title') : null;
  const exitFade = exitConfig ? usePresetSceneFade(exitConfig, durationInFrames, false) : 1;

  const titleFontSize = layout.titleFontSize * (textLayout.titleScale ?? 1);
  const bodyFontSize = layout.bodyFontSize * (textLayout.bodyScale ?? 1);

  // Diagonal layout: split title by newlines and offset each line
  const titleLines = textLayout.diagonalLineOffset && data.title
    ? data.title.split('\n')
    : null;

  // Custom preset components: title uses the full-scene custom component
  if (preset === 'echo' && data.title) {
    return (
      <AbsoluteFill style={{
        ...textLayout.container,
        background: theme.colors.backgroundGradient || theme.colors.background,
        opacity: sceneFade * exitFade,
        filter: sceneBlur || undefined,
      }}>
        <EchoTextAnimation
          text={data.title}
          fontSize={titleFontSize}
          fontFamily={`'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`}
          fontWeight={layout.titleFontWeight}
          color={theme.colors.textPrimary}
        />
      </AbsoluteFill>
    );
  }

  if (preset === 'reveal' && data.title) {
    return (
      <AbsoluteFill style={{
        ...textLayout.container,
        background: theme.colors.backgroundGradient || theme.colors.background,
        opacity: sceneFade * exitFade,
        filter: sceneBlur || undefined,
      }}>
        <RevealTextAnimation
          text={data.title}
          fontSize={titleFontSize}
          fontFamily={`'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`}
          fontWeight={layout.titleFontWeight}
          color={theme.colors.textPrimary}
        />
      </AbsoluteFill>
    );
  }

  if (preset === 'tracking' && data.title) {
    return (
      <AbsoluteFill style={{
        ...textLayout.container,
        background: theme.colors.backgroundGradient || theme.colors.background,
        opacity: sceneFade * exitFade,
        filter: sceneBlur || undefined,
      }}>
        <TrackingTextAnimation
          text={data.title}
          fontSize={titleFontSize}
          fontFamily={`'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`}
          fontWeight={layout.titleFontWeight}
          color={theme.colors.textPrimary}
        />
      </AbsoluteFill>
    );
  }

  if (preset === 'flicker' && data.title) {
    return (
      <AbsoluteFill style={{
        ...textLayout.container,
        background: theme.colors.backgroundGradient || theme.colors.background,
        opacity: sceneFade * exitFade,
        filter: sceneBlur || undefined,
      }}>
        <FlickerTextAnimation
          text={data.title}
          fontSize={titleFontSize}
          fontFamily={`'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`}
          fontWeight={layout.titleFontWeight}
          color={theme.colors.textPrimary}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{
      ...textLayout.container,
      background: theme.colors.backgroundGradient || theme.colors.background,
      padding: layout.padding,
      opacity: sceneFade * exitFade,
      filter: sceneBlur || undefined,
    }}>
      <div style={{
        ...textLayout.content,
        maxWidth: textLayout.maxWidth ?? layout.maxWidth,
        fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      }}>
        {data.title && !titleLines && (
          <div style={{
            fontSize: titleFontSize,
            fontWeight: layout.titleFontWeight,
            color: theme.colors.textPrimary,
            marginBottom: layout.gap,
            lineHeight: textLayout.title.lineHeight ?? 1.2,
            letterSpacing: layout.titleLetterSpacing,
            textShadow: layout.titleTextShadow,
            fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
            ...textLayout.title,
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
        {titleLines && (
          <div style={{
            marginBottom: layout.gap,
            fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
            ...textLayout.title,
          }}>
            {titleLines.map((line, index) => (
              <div
                key={index}
                style={{
                  fontSize: titleFontSize,
                  fontWeight: layout.titleFontWeight,
                  color: theme.colors.textPrimary,
                  lineHeight: textLayout.title.lineHeight ?? 1.2,
                  letterSpacing: layout.titleLetterSpacing,
                  textShadow: layout.titleTextShadow,
                  paddingLeft: index * (textLayout.diagonalLineOffset ?? 0),
                }}
              >
                <AnimatedText
                  preset={preset}
                  startDelay={titleConfig.startDelay + index * 4}
                  distance={titleConfig.distance}
                >
                  {line}
                </AnimatedText>
              </div>
            ))}
          </div>
        )}
        {data.body_text && (
          <div style={{
            fontSize: bodyFontSize,
            fontWeight: layout.bodyFontWeight,
            color: theme.colors.textSecondary,
            lineHeight: 1.5,
            letterSpacing: layout.bodyLetterSpacing,
            textShadow: layout.bodyTextShadow,
            ...textLayout.body,
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

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export const TextOnlyScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);
  const layout = useResponsiveLayout();

  const titleDelay = 10;
  const bodyDelay = 25;

  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;
  const bodyOpacity = frame > bodyDelay ? Math.min(1, (frame - bodyDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: layout.padding
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
            opacity: titleOpacity,
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
            opacity: bodyOpacity,
            lineHeight: 1.5
          }}>
            {data.body_text}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

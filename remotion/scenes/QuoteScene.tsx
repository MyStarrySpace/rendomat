import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export const QuoteScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);
  const layout = useResponsiveLayout();

  const quoteDelay = 15;
  const authorDelay = 35;

  const quoteOpacity = frame > quoteDelay ? Math.min(1, (frame - quoteDelay) / 20) * opacity : 0;
  const authorOpacity = frame > authorDelay ? Math.min(1, (frame - authorDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: layout.padding * 1.5,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
    }}>
      <div style={{ maxWidth: layout.maxWidth, textAlign: 'center' }}>
        <div style={{
          fontSize: layout.isVertical ? 48 : 28,
          color: theme.colors.accent,
          opacity: quoteOpacity,
          marginBottom: layout.gap
        }}>
          "
        </div>

        {data.quote && (
          <div style={{
            fontSize: layout.quoteFontSize,
            fontWeight: 300,
            color: theme.colors.textPrimary,
            opacity: quoteOpacity,
            lineHeight: 1.4,
            fontStyle: 'italic',
            marginBottom: layout.gap
          }}>
            {data.quote}
          </div>
        )}

        {data.author && (
          <div style={{
            fontSize: layout.isVertical ? 24 : layout.isSquare ? 28 : 32,
            fontWeight: 500,
            color: theme.colors.textSecondary,
            opacity: authorOpacity
          }}>
            — {data.author}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

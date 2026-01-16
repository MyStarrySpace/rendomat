import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';

export const QuoteScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  const quoteDelay = 15;
  const authorDelay = 35;

  const quoteOpacity = frame > quoteDelay ? Math.min(1, (frame - quoteDelay) / 20) * opacity : 0;
  const authorOpacity = frame > authorDelay ? Math.min(1, (frame - authorDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 120,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
    }}>
      <div style={{ maxWidth: 1200, textAlign: 'center' }}>
        <div style={{
          fontSize: 28,
          color: theme.colors.accent,
          opacity: quoteOpacity,
          marginBottom: 40
        }}>
          "
        </div>

        {data.quote && (
          <div style={{
            fontSize: 52,
            fontWeight: 300,
            color: theme.colors.textPrimary,
            opacity: quoteOpacity,
            lineHeight: 1.4,
            fontStyle: 'italic',
            marginBottom: 40
          }}>
            {data.quote}
          </div>
        )}

        {data.author && (
          <div style={{
            fontSize: 32,
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

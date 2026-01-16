import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';

export const ProgressBarsScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  // Parse from stats_text format: "75 | Label"
  const bars = data.stats_text
    ? data.stats_text.split('\n').filter(Boolean).map(line => {
        const [value, label] = line.split('|').map(s => s.trim());
        return { value: parseInt(value) || 0, label };
      })
    : [];

  const titleDelay = 10;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: 120,
      justifyContent: 'center'
    }}>
      {data.title && (
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: theme.colors.textPrimary,
          opacity: titleOpacity,
          textAlign: 'center',
          marginBottom: 80,
          fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
        }}>
          {data.title}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
        maxWidth: 1000,
        margin: '0 auto',
        width: '100%'
      }}>
        {bars.map((bar, idx) => {
          const delay = 25 + (idx * 12);
          const barOpacity = frame > delay ? Math.min(1, (frame - delay) / 15) * opacity : 0;
          const progressWidth = frame > delay + 5
            ? interpolate(frame, [delay + 5, delay + 30], [0, bar.value], { extrapolateRight: 'clamp' })
            : 0;

          return (
            <div key={idx} style={{ opacity: barOpacity }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <div style={{
                  fontSize: 24,
                  color: theme.colors.textPrimary,
                  fontWeight: 500
                }}>
                  {bar.label}
                </div>
                <div style={{
                  fontSize: 24,
                  color: theme.colors.accent,
                  fontWeight: 600
                }}>
                  {Math.round(progressWidth)}%
                </div>
              </div>
              <div style={{
                width: '100%',
                height: 24,
                backgroundColor: theme.colors.surfaceLight || 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progressWidth}%`,
                  height: '100%',
                  backgroundColor: theme.colors.accent,
                  borderRadius: 12,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

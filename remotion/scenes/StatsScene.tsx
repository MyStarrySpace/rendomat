import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export const StatsScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);
  const layout = useResponsiveLayout();

  // Parse stats from stats_text format: "75% | Description"
  const stats = data.stats_text
    ? data.stats_text.split('\n').filter(Boolean).map(line => {
        const [value, label] = line.split('|').map(s => s.trim());
        return { value, label };
      })
    : [];

  const titleDelay = 10;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  // In vertical mode, always stack stats vertically
  const shouldStackVertically = layout.isVertical || stats.length > 3;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: layout.padding * 1.5
    }}>
      {data.title && (
        <div style={{
          fontSize: layout.isVertical ? 44 : layout.isSquare ? 48 : 56,
          fontWeight: 700,
          color: theme.colors.textPrimary,
          opacity: titleOpacity,
          textAlign: 'center',
          marginBottom: layout.gap * 2,
          fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
        }}>
          {data.title}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: shouldStackVertically ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: layout.gap * 1.5,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {stats.map((stat, idx) => {
          const delay = 25 + (idx * 15);
          const statOpacity = frame > delay ? Math.min(1, (frame - delay) / 15) * opacity : 0;
          const scale = interpolate(
            frame,
            [delay, delay + 15],
            [0.8, 1],
            { extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={idx}
              style={{
                opacity: statOpacity,
                transform: `scale(${scale})`,
                textAlign: 'center',
                minWidth: layout.isVertical ? 200 : 300
              }}
            >
              <div style={{
                fontSize: layout.statValueFontSize,
                fontWeight: 700,
                color: theme.colors.accent,
                marginBottom: layout.isVertical ? 10 : 20,
                fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: layout.statLabelFontSize,
                fontWeight: 400,
                color: theme.colors.textSecondary,
                lineHeight: 1.4
              }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

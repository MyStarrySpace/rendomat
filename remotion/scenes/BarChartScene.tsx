import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { TextOnlyScene } from './TextOnlyScene';

export const BarChartScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  let chartData: any = null;
  try {
    chartData = data.chart_data ? JSON.parse(data.chart_data) : null;
  } catch (e) {
    // Invalid JSON
  }

  if (!chartData || !chartData.labels || !chartData.data) {
    return (
      <TextOnlyScene
        data={{ title: data.title || 'Chart Data Missing', body_text: 'Please add valid chart data' }}
        durationInFrames={durationInFrames}
        theme={theme}
      />
    );
  }

  const maxValue = Math.max(...chartData.data);
  const titleDelay = 10;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: 120
    }}>
      {data.title && (
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: theme.colors.textPrimary,
          opacity: titleOpacity,
          textAlign: 'center',
          marginBottom: 60,
          fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
        }}>
          {data.title}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: '60%',
        padding: '0 100px',
        gap: 30
      }}>
        {chartData.data.map((value: number, idx: number) => {
          const delay = 30 + (idx * 8);
          const barHeight = (value / maxValue) * 100;
          const animatedHeight = frame > delay
            ? interpolate(frame, [delay, delay + 20], [0, barHeight], { extrapolateRight: 'clamp' })
            : 0;

          const barOpacity = frame > delay ? Math.min(1, (frame - delay) / 15) * opacity : 0;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                opacity: barOpacity
              }}
            >
              <div style={{
                fontSize: 24,
                fontWeight: 600,
                color: theme.colors.textPrimary,
                marginBottom: 10,
                height: 30
              }}>
                {value}
              </div>
              <div style={{
                width: '100%',
                height: `${animatedHeight}%`,
                backgroundColor: theme.colors.accent,
                borderRadius: '8px 8px 0 0',
                minHeight: 10
              }} />
              <div style={{
                fontSize: 18,
                color: theme.colors.textSecondary,
                marginTop: 20,
                textAlign: 'center'
              }}>
                {chartData.labels[idx]}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { TextOnlyScene } from './TextOnlyScene';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export const BarChartScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);
  const layout = useResponsiveLayout();

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

  // Responsive chart sizing
  const chartHeight = layout.isVertical ? '50%' : layout.isSquare ? '55%' : '60%';
  const chartPadding = layout.isVertical ? '0 40px' : layout.isSquare ? '0 60px' : '0 100px';
  const valueFontSize = layout.isVertical ? 18 : layout.isSquare ? 20 : 24;
  const labelFontSize = layout.isVertical ? 14 : layout.isSquare ? 16 : 18;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: layout.padding * 1.5
    }}>
      {data.title && (
        <div style={{
          fontSize: layout.isVertical ? 36 : layout.isSquare ? 40 : 48,
          fontWeight: 700,
          color: theme.colors.textPrimary,
          opacity: titleOpacity,
          textAlign: 'center',
          marginBottom: layout.gap * 1.5,
          fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
        }}>
          {data.title}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: chartHeight,
        padding: chartPadding,
        gap: layout.gap * 0.75
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
                fontSize: valueFontSize,
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
                fontSize: labelFontSize,
                color: theme.colors.textSecondary,
                marginTop: layout.isVertical ? 10 : 20,
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

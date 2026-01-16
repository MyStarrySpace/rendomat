import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { TextOnlyScene } from './TextOnlyScene';

export const PieChartScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
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

  const total = chartData.data.reduce((sum: number, val: number) => sum + val, 0);
  const colors = [
    theme.colors.accent,
    theme.colors.accentSecondary || '#FF6B6B',
    '#FFD93D',
    '#4ECDC4',
    '#A78BFA'
  ];

  const titleDelay = 10;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  const radius = 200;
  const centerX = 400;
  const centerY = 300;

  let currentAngle = -90; // Start at top

  const animationDelay = 25;
  const animationProgress = frame > animationDelay
    ? Math.min(1, (frame - animationDelay) / 40)
    : 0;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: 80
    }}>
      {data.title && (
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: theme.colors.textPrimary,
          opacity: titleOpacity,
          textAlign: 'center',
          marginBottom: 40,
          fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
        }}>
          {data.title}
        </div>
      )}

      <div style={{ display: 'flex', gap: 100, alignItems: 'center', justifyContent: 'center' }}>
        <svg width={800} height={600} style={{ opacity }}>
          {chartData.data.map((value: number, idx: number) => {
            const percentage = value / total;
            const angle = percentage * 360 * animationProgress;

            const startAngle = currentAngle;
            const endAngle = startAngle + angle;

            const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

            const largeArc = angle > 180 ? 1 : 0;

            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${startX} ${startY}`,
              `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
              'Z'
            ].join(' ');

            currentAngle += percentage * 360;

            return (
              <path
                key={idx}
                d={pathData}
                fill={colors[idx % colors.length]}
                stroke={theme.colors.background}
                strokeWidth="3"
              />
            );
          })}
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {chartData.labels.map((label: string, idx: number) => {
            const legendDelay = animationDelay + 40 + (idx * 5);
            const legendOpacity = frame > legendDelay ? opacity : 0;
            const percentage = ((chartData.data[idx] / total) * 100).toFixed(1);

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 15,
                  opacity: legendOpacity
                }}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  backgroundColor: colors[idx % colors.length],
                  borderRadius: 4
                }} />
                <div>
                  <div style={{
                    fontSize: 24,
                    color: theme.colors.textPrimary,
                    fontWeight: 500
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: 18,
                    color: theme.colors.textSecondary
                  }}>
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

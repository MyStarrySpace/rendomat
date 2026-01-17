import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { TextOnlyScene } from './TextOnlyScene';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export const PieChartScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);
  const layout = useResponsiveLayout();
  const { width: videoWidth, height: videoHeight } = useVideoConfig();

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

  // Responsive pie chart dimensions
  const radius = layout.isVertical ? 140 : layout.isSquare ? 160 : 200;
  const svgWidth = layout.isVertical ? videoWidth * 0.9 : 800;
  const svgHeight = layout.isVertical ? videoHeight * 0.35 : 600;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  let currentAngle = -90; // Start at top

  const animationDelay = 25;
  const animationProgress = frame > animationDelay
    ? Math.min(1, (frame - animationDelay) / 40)
    : 0;

  // In vertical mode, stack chart and legend
  const containerStyle = layout.isVertical
    ? { display: 'flex', flexDirection: 'column' as const, gap: 20, alignItems: 'center', justifyContent: 'center' }
    : { display: 'flex', flexDirection: 'row' as const, gap: 100, alignItems: 'center', justifyContent: 'center' };

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: layout.padding
    }}>
      {data.title && (
        <div style={{
          fontSize: layout.isVertical ? 36 : layout.isSquare ? 40 : 48,
          fontWeight: 700,
          color: theme.colors.textPrimary,
          opacity: titleOpacity,
          textAlign: 'center',
          marginBottom: layout.gap,
          fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
        }}>
          {data.title}
        </div>
      )}

      <div style={containerStyle}>
        <svg width={svgWidth} height={svgHeight} style={{ opacity }}>
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

        <div style={{
          display: 'flex',
          flexDirection: layout.isVertical ? 'row' : 'column',
          flexWrap: layout.isVertical ? 'wrap' : 'nowrap',
          gap: layout.isVertical ? 16 : 20,
          justifyContent: 'center'
        }}>
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
                  gap: layout.isVertical ? 8 : 15,
                  opacity: legendOpacity
                }}
              >
                <div style={{
                  width: layout.isVertical ? 20 : 30,
                  height: layout.isVertical ? 20 : 30,
                  backgroundColor: colors[idx % colors.length],
                  borderRadius: 4
                }} />
                <div>
                  <div style={{
                    fontSize: layout.isVertical ? 16 : 24,
                    color: theme.colors.textPrimary,
                    fontWeight: 500
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: layout.isVertical ? 12 : 18,
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

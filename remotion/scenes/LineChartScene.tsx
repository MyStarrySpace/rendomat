import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { TextOnlyScene } from './TextOnlyScene';

export const LineChartScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
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
  const minValue = Math.min(...chartData.data);
  const range = maxValue - minValue;

  const titleDelay = 10;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  const chartWidth = 1200;
  const chartHeight = 500;
  const padding = 60;
  const innerWidth = chartWidth - 2 * padding;
  const innerHeight = chartHeight - 2 * padding;

  const points = chartData.data.map((value: number, idx: number) => {
    const x = padding + (idx / (chartData.data.length - 1)) * innerWidth;
    const y = padding + ((maxValue - value) / range) * innerHeight;
    return { x, y };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const lineDelay = 30;
  const lineProgress = frame > lineDelay
    ? Math.min(1, (frame - lineDelay) / 40)
    : 0;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {data.title && (
        <div style={{
          position: 'absolute',
          top: 80,
          fontSize: 48,
          fontWeight: 700,
          color: theme.colors.textPrimary,
          opacity: titleOpacity,
          fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
        }}>
          {data.title}
        </div>
      )}

      <svg width={chartWidth} height={chartHeight} style={{ opacity }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            x2={chartWidth - padding}
            y1={padding + innerHeight * ratio}
            y2={padding + innerHeight * ratio}
            stroke={theme.colors.surfaceLight || 'rgba(255,255,255,0.1)'}
            strokeWidth="1"
          />
        ))}

        {/* Line */}
        <path
          d={pathD}
          stroke={theme.colors.accent}
          strokeWidth="4"
          fill="none"
          strokeDasharray="2000"
          strokeDashoffset={2000 * (1 - lineProgress)}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />

        {/* Points */}
        {points.map((point, idx) => {
          const pointDelay = lineDelay + 40 + (idx * 3);
          const pointOpacity = frame > pointDelay ? opacity : 0;

          return (
            <circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r="6"
              fill={theme.colors.accent}
              opacity={pointOpacity}
            />
          );
        })}

        {/* Labels */}
        {chartData.labels.map((label: string, idx: number) => (
          <text
            key={idx}
            x={points[idx].x}
            y={chartHeight - 20}
            fill={theme.colors.textSecondary}
            fontSize="14"
            textAnchor="middle"
            opacity={opacity}
          >
            {label}
          </text>
        ))}
      </svg>
    </AbsoluteFill>
  );
};

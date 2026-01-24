import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { SceneProps } from './types';
import { TextOnlyScene } from './TextOnlyScene';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import {
  usePresetSceneFade,
  springConfig,
} from '../lib/motion';
import {
  AnimationPreset,
  getElementConfig,
  PresetConfig,
} from '../lib/animationPresets';
import { AnimatedText } from '../components/AnimatedText';

export const BarChartScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'energetic'
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'energetic';

  // Get element-specific configs
  const titleConfig = getElementConfig('bar-chart', preset, 'title');
  const dataConfig = getElementConfig('bar-chart', preset, 'data');

  // Scene fade
  const sceneFade = usePresetSceneFade(titleConfig, durationInFrames);

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

  // Responsive chart sizing
  const chartHeight = layout.isVertical ? '50%' : layout.isSquare ? '55%' : '60%';
  const chartPadding = layout.isVertical ? '0 40px' : layout.isSquare ? '0 60px' : '0 100px';
  const valueFontSize = layout.isVertical ? 18 : layout.isSquare ? 20 : 24;
  const labelFontSize = layout.isVertical ? 14 : layout.isSquare ? 16 : 18;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: layout.padding * 1.5,
      opacity: sceneFade,
    }}>
      {data.title && (
        <div style={{
          fontSize: layout.isVertical ? 36 : layout.isSquare ? 40 : 48,
          fontWeight: layout.titleFontWeight,
          color: theme.colors.textPrimary,
          textAlign: 'center',
          marginBottom: layout.gap * 1.5,
          letterSpacing: layout.titleLetterSpacing,
          textShadow: layout.titleTextShadow,
          fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
        }}>
          <AnimatedText
            preset={preset}
            startDelay={titleConfig.startDelay}
            distance={titleConfig.distance}
          >
            {data.title}
          </AnimatedText>
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
        {chartData.data.map((value: number, idx: number) => (
          <BarItem
            key={idx}
            index={idx}
            value={value}
            maxValue={maxValue}
            label={chartData.labels[idx]}
            theme={theme}
            valueFontSize={valueFontSize}
            labelFontSize={labelFontSize}
            isVertical={layout.isVertical}
            config={dataConfig}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Separate component for bar items to use hooks properly
interface BarItemProps {
  index: number;
  value: number;
  maxValue: number;
  label: string;
  theme: any;
  valueFontSize: number;
  labelFontSize: number;
  isVertical: boolean;
  config: PresetConfig;
}

const BarItem: React.FC<BarItemProps> = ({
  index,
  value,
  maxValue,
  label,
  theme,
  valueFontSize,
  labelFontSize,
  isVertical,
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = config.startDelay + index * config.staggerDelay;
  const adjustedFrame = Math.max(0, frame - delay);

  // Spring-based height animation for bars using preset config
  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: springConfig[config.spring],
    durationInFrames: 60,
  });

  const barHeight = (value / maxValue) * 100;
  const animatedHeight = interpolate(progress, [0, 1], [0, barHeight]);

  // Fade and slide up for labels
  const labelProgress = spring({
    frame: Math.max(0, frame - delay - 5),
    fps,
    config: springConfig.gentle,
    durationInFrames: 45,
  });

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: progress,
      }}
    >
      <div style={{
        fontSize: valueFontSize,
        fontWeight: 600,
        color: theme.colors.textPrimary,
        marginBottom: 10,
        height: 30,
        opacity: labelProgress,
        transform: `translateY(${interpolate(labelProgress, [0, 1], [10, 0])}px)`,
      }}>
        {value}
      </div>
      <div style={{
        width: '100%',
        height: `${animatedHeight}%`,
        backgroundColor: theme.colors.accent,
        minHeight: 4,
        transformOrigin: 'bottom',
      }} />
      <div style={{
        fontSize: labelFontSize,
        color: theme.colors.textSecondary,
        marginTop: isVertical ? 10 : 20,
        textAlign: 'center',
        opacity: labelProgress,
        transform: `translateY(${interpolate(labelProgress, [0, 1], [10, 0])}px)`,
      }}>
        {label}
      </div>
    </div>
  );
};

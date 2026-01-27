import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { SceneProps } from './types';
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

export const ProgressBarsScene: React.FC<SceneProps> = ({ data, durationInFrames, theme, skipFadeOut = false }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'energetic'
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'energetic';

  // Get element-specific configs
  const titleConfig = getElementConfig('progress-bars', preset, 'title');
  const dataConfig = getElementConfig('progress-bars', preset, 'data');

  // Scene fade (skip fade-out when using external transitions)
  const sceneFade = usePresetSceneFade(titleConfig, durationInFrames, skipFadeOut);

  // Parse from stats_text format: "75 | Label"
  const bars = data.stats_text
    ? data.stats_text.split('\n').filter(Boolean).map(line => {
        const [value, label] = line.split('|').map(s => s.trim());
        return { value: parseInt(value) || 0, label };
      })
    : [];

  const labelFontSize = layout.isVertical ? 18 : layout.isSquare ? 20 : 24;
  const barHeight = layout.isVertical ? 18 : 24;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: layout.padding * 1.5,
      justifyContent: 'center',
      opacity: sceneFade,
    }}>
      {data.title && (
        <div style={{
          fontSize: layout.isVertical ? 36 : layout.isSquare ? 40 : 48,
          fontWeight: layout.titleFontWeight,
          color: theme.colors.textPrimary,
          textAlign: 'center',
          marginBottom: layout.gap * 2,
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
        flexDirection: 'column',
        gap: layout.gap,
        maxWidth: layout.maxWidth,
        margin: '0 auto',
        width: '100%'
      }}>
        {bars.map((bar, idx) => (
          <ProgressBarItem
            key={idx}
            index={idx}
            bar={bar}
            theme={theme}
            labelFontSize={labelFontSize}
            barHeight={barHeight}
            isVertical={layout.isVertical}
            config={dataConfig}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Separate component for progress bar items to use hooks properly
interface ProgressBarItemProps {
  index: number;
  bar: { value: number; label: string };
  theme: any;
  labelFontSize: number;
  barHeight: number;
  isVertical: boolean;
  config: PresetConfig;
}

const ProgressBarItem: React.FC<ProgressBarItemProps> = ({
  index,
  bar,
  theme,
  labelFontSize,
  barHeight,
  isVertical,
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = config.startDelay + index * config.staggerDelay;
  const adjustedFrame = Math.max(0, frame - delay);

  // Spring-based entrance animation using preset config
  const entranceProgress = spring({
    frame: adjustedFrame,
    fps,
    config: springConfig[config.spring],
    durationInFrames: 45,
  });

  // Spring-based progress bar fill
  const progressProgress = spring({
    frame: Math.max(0, frame - delay - 8),
    fps,
    config: springConfig.snappy,
    durationInFrames: 60,
  });

  const progressWidth = interpolate(progressProgress, [0, 1], [0, bar.value]);

  // Calculate entrance translation based on config direction
  const entranceX = config.direction === 'left' ? -config.distance :
                    config.direction === 'right' ? config.distance : 0;

  return (
    <div style={{
      opacity: entranceProgress,
      transform: `translateX(${interpolate(entranceProgress, [0, 1], [entranceX, 0])}px)`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: isVertical ? 8 : 12
      }}>
        <div style={{
          fontSize: labelFontSize,
          color: theme.colors.textPrimary,
          fontWeight: 500
        }}>
          {bar.label}
        </div>
        <div style={{
          fontSize: labelFontSize,
          color: theme.colors.accent,
          fontWeight: 600
        }}>
          {Math.round(progressWidth)}%
        </div>
      </div>
      <div style={{
        width: '100%',
        height: barHeight,
        backgroundColor: theme.colors.surfaceLight || 'rgba(255,255,255,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progressWidth}%`,
          height: '100%',
          backgroundColor: theme.colors.accent,
        }} />
      </div>
    </div>
  );
};

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SceneProps } from './types';
import { useResponsiveLayout, ResponsiveLayout } from '../hooks/useResponsiveLayout';
import {
  usePresetAnimation,
  usePresetSceneFade,
  buildTransform,
} from '../lib/motion';
import {
  AnimationPreset,
  getElementConfig,
  PresetConfig,
} from '../lib/animationPresets';
import { AnimatedText } from '../components/AnimatedText';

export const StatsScene: React.FC<SceneProps> = ({ data, durationInFrames, theme, skipFadeOut = false }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'energetic'
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'energetic';

  // Get element-specific configs
  const titleConfig = getElementConfig('stats', preset, 'title');
  const dataConfig = getElementConfig('stats', preset, 'data');

  // Scene fade (skip fade-out when using external transitions)
  const sceneFade = usePresetSceneFade(titleConfig, durationInFrames, skipFadeOut);

  // Parse stats from stats_text format: "75% | Description"
  const stats = data.stats_text
    ? data.stats_text.split('\n').filter(Boolean).map(line => {
        const [value, label] = line.split('|').map(s => s.trim());
        return { value, label };
      })
    : [];

  // In vertical mode, always stack stats vertically
  const shouldStackVertically = layout.isVertical || stats.length > 3;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: layout.padding * 1.5,
      opacity: sceneFade,
    }}>
      {data.title && (
        <div style={{
          fontSize: layout.isVertical ? 44 : layout.isSquare ? 48 : 56,
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
        flexDirection: shouldStackVertically ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: layout.gap * 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      }}>
        {stats.map((stat, idx) => (
          <StatItem
            key={idx}
            index={idx}
            stat={stat}
            theme={theme}
            layout={layout}
            config={dataConfig}
            preset={preset}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Separate component for stat items to use hooks properly
interface StatItemProps {
  index: number;
  stat: { value: string; label: string };
  theme: any;
  layout: ResponsiveLayout;
  config: PresetConfig;
  preset: AnimationPreset;
}

const StatItem: React.FC<StatItemProps> = ({ index, stat, theme, layout, config, preset }) => {
  const anim = usePresetAnimation(config, index);

  // Calculate staggered start delay for value and label
  const valueStartDelay = config.startDelay + index * config.staggerDelay;
  const labelStartDelay = valueStartDelay + 8;

  return (
    <div
      style={{
        opacity: anim.opacity,
        transform: buildTransform({
          translateX: anim.translateX,
          translateY: anim.translateY,
          scale: anim.scale,
        }),
        textAlign: 'center',
        minWidth: layout.isVertical ? 200 : 300,
      }}
    >
      <div style={{
        fontSize: layout.statValueFontSize,
        fontWeight: layout.displayFontWeight,
        color: theme.colors.accent,
        marginBottom: layout.isVertical ? 10 : 20,
        letterSpacing: layout.displayLetterSpacing,
        fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
      }}>
        <AnimatedText
          preset={preset}
          startDelay={valueStartDelay}
          unit="character"
          staggerFrames={1}
        >
          {stat.value}
        </AnimatedText>
      </div>
      <div style={{
        fontSize: layout.statLabelFontSize,
        fontWeight: layout.bodyFontWeight,
        color: theme.colors.textSecondary,
        lineHeight: 1.4,
        letterSpacing: layout.bodyLetterSpacing,
      }}>
        <AnimatedText
          preset={preset}
          startDelay={labelStartDelay}
          unit="word"
        >
          {stat.label}
        </AnimatedText>
      </div>
    </div>
  );
};

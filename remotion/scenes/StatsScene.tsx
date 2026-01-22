import React from 'react';
import { AbsoluteFill } from 'remotion';
import { SceneProps } from './types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import {
  usePresetAnimation,
  usePresetSceneFade,
  buildTransform,
} from '../lib/motion';
import {
  AnimationPreset,
  getElementConfig,
} from '../lib/animationPresets';

export const StatsScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'smooth'
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'smooth';

  // Get element-specific configs
  const titleConfig = getElementConfig('stats', preset, 'title');
  const dataConfig = getElementConfig('stats', preset, 'data');

  // Scene fade
  const sceneFade = usePresetSceneFade(titleConfig, durationInFrames);

  // Title animation
  const titleAnim = usePresetAnimation(titleConfig, 0);

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
          fontWeight: 700,
          color: theme.colors.textPrimary,
          opacity: titleAnim.opacity,
          transform: buildTransform({
            translateX: titleAnim.translateX,
            translateY: titleAnim.translateY,
            scale: titleAnim.scale,
          }),
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
  layout: any;
  config: any;
}

const StatItem: React.FC<StatItemProps> = ({ index, stat, theme, layout, config }) => {
  const anim = usePresetAnimation(config, index);

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
};

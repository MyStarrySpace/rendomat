import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
  TextOnlyScene,
  SingleImageScene,
  DualImagesScene,
  GridScene,
  QuoteScene,
  StatsScene,
  BarChartScene,
  LineChartScene,
  PieChartScene,
  ProgressBarsScene,
  AreaChartScene,
  ImageGalleryScene,
  EquationScene,
  SpotlightsScene,
} from './scenes';
import { getTheme, Theme } from './themes';
import { AnimationLayer, AnimationStyleId } from './animations';
import type { AnimationParams } from './animations/types';
import { ANIMATION_PRESETS } from './lib/animationPresets';

export interface DynamicSceneProps {
  sceneType: string;
  data: any;
  durationInFrames: number;
  themeId?: string;
  animationStyle?: AnimationStyleId;
  animationIntensity?: 'low' | 'medium' | 'high';
  animationParams?: AnimationParams;
}

export const DynamicSceneComposition: React.FC<DynamicSceneProps> = ({
  sceneType,
  data,
  durationInFrames,
  themeId,
  animationStyle,
  animationIntensity,
  animationParams,
}) => {
  const theme = getTheme(themeId);

  // Get animation settings from props or data
  const effectiveAnimationStyle: AnimationStyleId =
    animationStyle || data?.animation_style || 'none';
  const effectiveAnimationIntensity: 'low' | 'medium' | 'high' =
    animationIntensity || data?.animation_intensity || 'medium';
  const effectiveAnimationParams: AnimationParams | undefined =
    animationParams || data?.animation_params;

  // Derive drift direction from text animation preset
  const presetIn = data?.animation_preset_in || data?.animation_preset || 'smooth';
  const presetConfig = ANIMATION_PRESETS[presetIn as keyof typeof ANIMATION_PRESETS];
  const textDirection = presetConfig?.direction || 'up';

  // Auto-drift: background drifts same direction as text, attenuated
  const autoDriftAmount = 30; // subtle 30px default when bg animation is active
  const driftDirection = effectiveAnimationStyle !== 'none'
    ? (textDirection === 'center' || textDirection === 'random' ? 'none' : textDirection)
    : 'none';

  // Render scene content based on type
  const renderScene = () => {
    switch (sceneType) {
      case 'text-only':
        return <TextOnlyScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'single-image':
        return <SingleImageScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'dual-images':
        return <DualImagesScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'grid-2x2':
        return <GridScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'quote':
        return <QuoteScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'stats':
        return <StatsScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'bar-chart':
        return <BarChartScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'line-chart':
        return <LineChartScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'pie-chart':
        return <PieChartScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'progress-bars':
        return <ProgressBarsScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'area-chart':
        return <AreaChartScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'image-gallery':
        return <ImageGalleryScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'equation':
        return <EquationScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      case 'spotlights':
        return <SpotlightsScene data={data} durationInFrames={durationInFrames} theme={theme} />;

      default:
        return (
          <AbsoluteFill style={{
            backgroundColor: '#0a0a0a',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Arial, sans-serif',
            fontSize: 48,
          }}>
            <div>Unknown scene type: {sceneType}</div>
          </AbsoluteFill>
        );
    }
  };

  return (
    <AbsoluteFill>
      {/* Background animation layer */}
      {effectiveAnimationStyle !== 'none' && (
        <AnimationLayer
          animationStyle={effectiveAnimationStyle}
          durationInFrames={durationInFrames}
          theme={theme}
          intensity={effectiveAnimationIntensity}
          params={{
            ...effectiveAnimationParams,
            timeOffset: data?.bg_time_offset || 0,
            focusZoom: data?.bg_focus_zoom || 1,
            focusCenterX: data?.bg_focus_center_x || 0.5,
            focusCenterY: data?.bg_focus_center_y || 0.5,
            driftDirection: driftDirection as 'up' | 'down' | 'left' | 'right' | 'none',
            driftAmount: autoDriftAmount,
          }}
        />
      )}
      {/* Scene content */}
      {renderScene()}
    </AbsoluteFill>
  );
};

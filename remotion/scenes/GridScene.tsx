import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { SceneProps } from './types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import {
  usePresetAnimation,
  usePresetSceneFade,
  useSceneBlur,
  buildTransform,
} from '../lib/motion';
import {
  AnimationPreset,
  getElementConfig,
  resolvePresets,
  PresetConfig,
} from '../lib/animationPresets';
import { AnimatedText } from '../components/AnimatedText';

export const GridScene: React.FC<SceneProps> = ({ data, durationInFrames, theme, skipFadeOut = false }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'smooth'
  const { presetIn, presetOut } = resolvePresets(data, 'smooth');
  const preset = presetIn;

  // Get element-specific configs
  const imageConfig = getElementConfig('grid', preset, 'image');
  const titleConfig = getElementConfig('grid', preset, 'title');

  // Scene fade (skip fade-out when using external transitions)
  const sceneFade = usePresetSceneFade(imageConfig, durationInFrames, skipFadeOut);
  const sceneBlur = useSceneBlur(imageConfig, durationInFrames, skipFadeOut);
  const exitConfig = presetOut ? getElementConfig('grid', presetOut, 'title') : null;
  const exitFade = exitConfig ? usePresetSceneFade(exitConfig, durationInFrames, false) : 1;

  const images = [data.image_url, data.image_url_2, data.image_url_3, data.image_url_4].filter(Boolean);

  // Adjust grid layout based on aspect ratio
  const gridColumns = layout.isVertical ? '1fr' : '1fr 1fr';
  const gridRows = layout.isVertical ? 'repeat(4, 1fr)' : '1fr 1fr';
  const gridHeight = layout.isVertical ? '85%' : '80%';

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: layout.padding,
      opacity: sceneFade * exitFade,
      filter: sceneBlur || undefined,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gridTemplateRows: gridRows,
        gap: layout.gap * 0.75,
        height: gridHeight
      }}>
        {images.map((img, idx) => (
          <GridImage
            key={idx}
            index={idx}
            src={img}
            config={imageConfig}
          />
        ))}
      </div>

      {data.title && (
        <div style={{
          position: 'absolute',
          bottom: layout.padding,
          left: layout.padding,
          right: layout.padding,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: layout.isVertical ? 36 : layout.isSquare ? 44 : 56,
            fontWeight: layout.titleFontWeight,
            color: theme.colors.textPrimary,
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
        </div>
      )}
    </AbsoluteFill>
  );
};

// Separate component for grid images to use hooks properly
interface GridImageProps {
  index: number;
  src: string;
  config: PresetConfig;
}

const GridImage: React.FC<GridImageProps> = ({ index, src, config }) => {
  const anim = usePresetAnimation(config, index);

  return (
    <div style={{
      opacity: anim.opacity,
      transform: buildTransform({
        translateX: anim.translateX,
        translateY: anim.translateY,
        scale: anim.scale,
      }),
      width: '100%',
      height: '100%',
    }}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
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

export const DualImagesScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'smooth'
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'smooth';

  // Get element-specific configs
  const imageConfig = getElementConfig('dual-images', preset, 'image');
  const titleConfig = getElementConfig('dual-images', preset, 'title');

  // Scene fade
  const sceneFade = usePresetSceneFade(imageConfig, durationInFrames);

  // For dual images, override direction to slide from opposite sides
  const image1Config = { ...imageConfig, direction: 'left' as const };
  const image2Config = { ...imageConfig, direction: 'right' as const };

  // Element animations
  const image1Anim = usePresetAnimation(image1Config, 0);
  const image2Anim = usePresetAnimation(image2Config, 1);
  const titleAnim = usePresetAnimation(titleConfig, 2);

  // In vertical mode, stack images vertically
  const containerStyle = layout.isVertical
    ? { display: 'flex', flexDirection: 'column' as const, gap: layout.gap, height: '75%' }
    : { display: 'flex', flexDirection: 'row' as const, gap: layout.gap, height: '80%', alignItems: 'center' };

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: layout.padding,
      opacity: sceneFade,
    }}>
      <div style={containerStyle}>
        {data.image_url && (
          <div style={{
            flex: 1,
            height: layout.isVertical ? '48%' : '100%',
            opacity: image1Anim.opacity,
            transform: buildTransform({
              translateX: image1Anim.translateX,
              translateY: image1Anim.translateY,
              scale: image1Anim.scale,
            }),
          }}>
            <Img
              src={data.image_url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        )}
        {data.image_url_2 && (
          <div style={{
            flex: 1,
            height: layout.isVertical ? '48%' : '100%',
            opacity: image2Anim.opacity,
            transform: buildTransform({
              translateX: image2Anim.translateX,
              translateY: image2Anim.translateY,
              scale: image2Anim.scale,
            }),
          }}>
            <Img
              src={data.image_url_2}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        )}
      </div>

      {data.title && (
        <div style={{
          position: 'absolute',
          bottom: layout.padding,
          left: layout.padding,
          right: layout.padding,
          textAlign: 'center',
          opacity: titleAnim.opacity,
          transform: buildTransform({
            translateX: titleAnim.translateX,
            translateY: titleAnim.translateY,
          }),
        }}>
          <div style={{
            fontSize: layout.isVertical ? 40 : layout.isSquare ? 48 : 56,
            fontWeight: 700,
            color: theme.colors.textPrimary,
            fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
          }}>
            {data.title}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

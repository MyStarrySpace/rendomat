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

export const SingleImageScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'smooth'
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'smooth';

  // Get element-specific configs
  const imageConfig = getElementConfig('single-image', preset, 'image');
  const titleConfig = getElementConfig('single-image', preset, 'title');

  // Scene fade
  const sceneFade = usePresetSceneFade(imageConfig, durationInFrames);

  // Element animations
  const imageAnim = usePresetAnimation(imageConfig, 0);
  const titleAnim = usePresetAnimation(titleConfig, 1);

  // Adjust image size based on aspect ratio
  const imageWidth = layout.isVertical ? '85%' : '70%';
  const imageHeight = layout.isVertical ? '60%' : '70%';

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      opacity: sceneFade,
    }}>
      {data.image_url && (
        <div style={{
          position: 'absolute',
          top: layout.isVertical ? '35%' : '50%',
          left: '50%',
          transform: `translate(-50%, -50%) ${buildTransform({
            scale: imageAnim.scale,
            translateX: imageAnim.translateX,
            translateY: imageAnim.translateY,
          })}`,
          width: imageWidth,
          height: imageHeight,
          opacity: imageAnim.opacity,
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

      {data.title && (
        <div style={{
          position: 'absolute',
          bottom: layout.padding,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: `0 ${layout.padding}px`,
          opacity: titleAnim.opacity,
          transform: buildTransform({
            translateX: titleAnim.translateX,
            translateY: titleAnim.translateY,
          }),
        }}>
          <div style={{
            fontSize: layout.isVertical ? 48 : layout.isSquare ? 48 : 56,
            fontWeight: 700,
            color: theme.colors.textPrimary,
            backgroundColor: theme.colors.surface || 'rgba(10, 10, 10, 0.8)',
            padding: layout.isVertical ? '16px 24px' : '20px 40px',
            display: 'inline-block'
          }}>
            {data.title}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

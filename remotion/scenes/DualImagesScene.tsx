import React from 'react';
import { AbsoluteFill, useCurrentFrame, Img } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export const DualImagesScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);
  const layout = useResponsiveLayout();

  const image1Delay = 10;
  const image2Delay = 20;
  const titleDelay = 35;

  const image1Opacity = frame > image1Delay ? Math.min(1, (frame - image1Delay) / 15) * opacity : 0;
  const image2Opacity = frame > image2Delay ? Math.min(1, (frame - image2Delay) / 15) * opacity : 0;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  // In vertical mode, stack images vertically
  const containerStyle = layout.isVertical
    ? { display: 'flex', flexDirection: 'column' as const, gap: layout.gap, height: '75%' }
    : { display: 'flex', flexDirection: 'row' as const, gap: layout.gap, height: '80%', alignItems: 'center' };

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: layout.padding
    }}>
      <div style={containerStyle}>
        {data.image_url && (
          <div style={{ flex: 1, height: layout.isVertical ? '48%' : '100%', opacity: image1Opacity }}>
            <Img
              src={data.image_url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 16
              }}
            />
          </div>
        )}
        {data.image_url_2 && (
          <div style={{ flex: 1, height: layout.isVertical ? '48%' : '100%', opacity: image2Opacity }}>
            <Img
              src={data.image_url_2}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 16
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
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: layout.isVertical ? 40 : layout.isSquare ? 48 : 56,
            fontWeight: 700,
            color: theme.colors.textPrimary,
            opacity: titleOpacity,
            fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
          }}>
            {data.title}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

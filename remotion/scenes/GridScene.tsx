import React from 'react';
import { AbsoluteFill, useCurrentFrame, Img } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export const GridScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);
  const layout = useResponsiveLayout();

  const images = [data.image_url, data.image_url_2, data.image_url_3, data.image_url_4].filter(Boolean);
  const titleDelay = 40;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  // Adjust grid layout based on aspect ratio
  const gridColumns = layout.isVertical ? '1fr' : '1fr 1fr';
  const gridRows = layout.isVertical ? 'repeat(4, 1fr)' : '1fr 1fr';
  const gridHeight = layout.isVertical ? '85%' : '80%';

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`,
      padding: layout.padding
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: gridColumns,
        gridTemplateRows: gridRows,
        gap: layout.gap * 0.75,
        height: gridHeight
      }}>
        {images.map((img, idx) => {
          const delay = idx * 10;
          const imgOpacity = frame > delay ? Math.min(1, (frame - delay) / 15) * opacity : 0;

          return img ? (
            <div key={idx} style={{ opacity: imgOpacity }}>
              <Img
                src={img}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 12
                }}
              />
            </div>
          ) : null;
        })}
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
            fontSize: layout.isVertical ? 36 : layout.isSquare ? 44 : 56,
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

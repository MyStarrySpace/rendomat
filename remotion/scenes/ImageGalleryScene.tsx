import React from 'react';
import { AbsoluteFill, useCurrentFrame, Img } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { TextOnlyScene } from './TextOnlyScene';

export const ImageGalleryScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  const images = [data.image_url, data.image_url_2, data.image_url_3, data.image_url_4].filter(Boolean);

  if (images.length === 0) {
    return <TextOnlyScene data={{ title: 'No Images', body_text: 'Please add images' }} durationInFrames={durationInFrames} theme={theme} />;
  }

  const framesPerImage = Math.floor(durationInFrames / images.length);
  const currentImageIndex = Math.min(Math.floor(frame / framesPerImage), images.length - 1);
  const nextImageIndex = Math.min(currentImageIndex + 1, images.length - 1);

  const transitionStart = currentImageIndex * framesPerImage + framesPerImage - 15;
  const transitionProgress = frame > transitionStart
    ? Math.min(1, (frame - transitionStart) / 15)
    : 0;

  const currentOpacity = 1 - transitionProgress;
  const nextOpacity = transitionProgress;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
    }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '80%',
          height: '80%',
          opacity: currentOpacity * opacity
        }}>
          <Img
            src={images[currentImageIndex]}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 16
            }}
          />
        </div>

        {currentImageIndex !== nextImageIndex && (
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            opacity: nextOpacity * opacity
          }}>
            <Img
              src={images[nextImageIndex]}
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
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 48,
            fontWeight: 700,
            color: theme.colors.textPrimary,
            opacity,
            backgroundColor: theme.colors.surface || 'rgba(10, 10, 10, 0.8)',
            padding: '20px 40px',
            borderRadius: 12,
            display: 'inline-block',
            fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
          }}>
            {data.title}
          </div>
        </div>
      )}

      {/* Image indicators */}
      <div style={{
        position: 'absolute',
        bottom: 140,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 12
      }}>
        {images.map((_, idx) => (
          <div
            key={idx}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: idx === currentImageIndex ? theme.colors.accent : theme.colors.surfaceLight || 'rgba(255,255,255,0.3)',
              transition: 'background-color 0.3s'
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

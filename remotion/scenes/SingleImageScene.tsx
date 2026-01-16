import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Img } from 'remotion';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';

export const SingleImageScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);

  const imageScale = interpolate(frame, [0, 30], [0.95, 1], { extrapolateRight: 'clamp' });
  const titleDelay = 20;
  const titleOpacity = frame > titleDelay ? Math.min(1, (frame - titleDelay) / 15) * opacity : 0;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
    }}>
      {data.image_url && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${imageScale})`,
          width: '70%',
          height: '70%',
          opacity
        }}>
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

      {data.title && (
        <div style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
          textAlign: 'center',
          padding: '0 80px'
        }}>
          <div style={{
            fontSize: 56,
            fontWeight: 700,
            color: theme.colors.textPrimary,
            opacity: titleOpacity,
            backgroundColor: theme.colors.surface || 'rgba(10, 10, 10, 0.8)',
            padding: '20px 40px',
            borderRadius: 12,
            display: 'inline-block'
          }}>
            {data.title}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

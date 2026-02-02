import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { SceneProps, SpotlightPoint } from './types';
import { AnimatedText } from '../components/AnimatedText';
import { AnimationPreset } from '../lib/animationPresets';

export const SpotlightsScene: React.FC<SceneProps> = ({ data, durationInFrames, theme, skipFadeOut = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const points: SpotlightPoint[] = data.spotlights || [];
  const imageUrl = data.spotlight_image_url || data.image_url;
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'smooth';

  if (!imageUrl || points.length === 0) {
    return (
      <AbsoluteFill style={{
        background: theme.colors.backgroundGradient || theme.colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: `'${theme.fonts.body}', system-ui, sans-serif`,
        color: theme.colors.textPrimary,
        fontSize: 48,
      }}>
        <div>{!imageUrl ? 'No base image set' : 'No spotlight points set'}</div>
      </AbsoluteFill>
    );
  }

  const numPoints = points.length;
  const framesPerPoint = Math.floor(durationInFrames / numPoints);
  // Transition zone: first 20% of each segment for camera move, last 10% for card fade-out
  const transitionFrames = Math.floor(framesPerPoint * 0.2);
  const cardFadeOutFrames = Math.floor(framesPerPoint * 0.1);
  const cardDelayFrames = Math.floor(framesPerPoint * 0.3); // Card appears after camera settles

  // Scene-level fade
  const sceneFadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const sceneFadeOut = skipFadeOut ? 1 : interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const sceneOpacity = sceneFadeIn * sceneFadeOut;

  // Determine current segment and interpolation targets
  const currentSegmentRaw = frame / framesPerPoint;
  const currentSegment = Math.min(Math.floor(currentSegmentRaw), numPoints - 1);
  const segmentFrame = frame - currentSegment * framesPerPoint;

  // Get current and previous point for camera interpolation
  const currentPoint = points[currentSegment];
  const prevPoint = currentSegment > 0 ? points[currentSegment - 1] : currentPoint;

  // Use large virtual image dimensions for transform calculations
  const imgW = width * 4;
  const imgH = height * 4;

  // Camera target for a point
  const getCameraTarget = (pt: SpotlightPoint) => ({
    scale: pt.zoom,
    translateX: -(pt.x * imgW - width / 2),
    translateY: -(pt.y * imgH - height / 2),
  });

  const prevCamera = getCameraTarget(prevPoint);
  const currCamera = getCameraTarget(currentPoint);

  // Spring-based interpolation for camera movement at start of each segment
  const cameraProgress = currentSegment === 0 && segmentFrame < transitionFrames
    ? spring({ frame: segmentFrame, fps, config: { damping: 80, stiffness: 100 }, durationInFrames: transitionFrames })
    : segmentFrame < transitionFrames
      ? spring({ frame: segmentFrame, fps, config: { damping: 80, stiffness: 100 }, durationInFrames: transitionFrames })
      : 1;

  const camScale = currentSegment === 0
    ? interpolate(
        spring({ frame: Math.min(frame, transitionFrames), fps, config: { damping: 80, stiffness: 100 }, durationInFrames: transitionFrames }),
        [0, 1], [1, currCamera.scale]
      )
    : interpolate(cameraProgress, [0, 1], [prevCamera.scale, currCamera.scale]);

  const camTX = currentSegment === 0
    ? interpolate(
        spring({ frame: Math.min(frame, transitionFrames), fps, config: { damping: 80, stiffness: 100 }, durationInFrames: transitionFrames }),
        [0, 1], [-(points[0].x * imgW - width / 2), currCamera.translateX]
      )
    : interpolate(cameraProgress, [0, 1], [prevCamera.translateX, currCamera.translateX]);

  const camTY = currentSegment === 0
    ? interpolate(
        spring({ frame: Math.min(frame, transitionFrames), fps, config: { damping: 80, stiffness: 100 }, durationInFrames: transitionFrames }),
        [0, 1], [-(points[0].y * imgH - height / 2), currCamera.translateY]
      )
    : interpolate(cameraProgress, [0, 1], [prevCamera.translateY, currCamera.translateY]);

  // Card visibility: fade in after camera settles, fade out before next segment
  const cardFadeIn = interpolate(
    segmentFrame,
    [cardDelayFrames, cardDelayFrames + 15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const cardFadeOut = interpolate(
    segmentFrame,
    [framesPerPoint - cardFadeOutFrames, framesPerPoint],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const cardOpacity = cardFadeIn * cardFadeOut;

  // Card slide-up entrance
  const cardSlideY = interpolate(
    segmentFrame,
    [cardDelayFrames, cardDelayFrames + 20],
    [20, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Position the info card: auto-flip based on point position
  const cardOnRight = currentPoint.x < 0.5;
  const cardOnBottom = currentPoint.y < 0.5;
  const cardX = cardOnRight ? width * 0.55 : width * 0.05;
  const cardY = cardOnBottom ? height * 0.55 : height * 0.05;
  const cardWidth = width * 0.38;

  return (
    <AbsoluteFill style={{
      background: theme.colors.background,
      overflow: 'hidden',
      opacity: sceneOpacity,
    }}>
      {/* Camera container — pans and zooms via transform */}
      <div style={{
        position: 'absolute',
        width: imgW,
        height: imgH,
        transformOrigin: '0 0',
        transform: `translate(${camTX}px, ${camTY}px) scale(${camScale})`,
        willChange: 'transform',
      }}>
        <Img
          src={imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* Vignette overlay for depth */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        pointerEvents: 'none',
      }} />

      {/* Info card overlay */}
      {(currentPoint.title || currentPoint.description || currentPoint.image_url) && (
        <div style={{
          position: 'absolute',
          left: cardX,
          top: cardY,
          width: cardWidth,
          opacity: cardOpacity,
          transform: `translateY(${cardSlideY}px)`,
          background: theme.colors.surface || 'rgba(10, 10, 10, 0.85)',
          border: `1px solid ${theme.colors.accent || 'rgba(255,255,255,0.15)'}`,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          fontFamily: `'${theme.fonts.body}', system-ui, sans-serif`,
        }}>
          {/* Badge */}
          {currentPoint.badge && (
            <div style={{
              position: 'absolute',
              top: -16,
              left: cardOnRight ? -16 : undefined,
              right: cardOnRight ? undefined : -16,
              width: 40,
              height: 40,
              background: theme.colors.accent || '#d4a843',
              color: theme.colors.background || '#0a0a0a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
            }}>
              {currentPoint.badge}
            </div>
          )}

          {/* Point image */}
          {currentPoint.image_url && (
            <Img
              src={currentPoint.image_url}
              style={{
                width: '100%',
                height: 120,
                objectFit: 'cover',
              }}
            />
          )}

          {/* Title */}
          {currentPoint.title && (
            <div style={{
              fontSize: 32,
              fontWeight: 700,
              color: theme.colors.textPrimary,
              fontFamily: `'${theme.fonts.heading}', serif`,
              letterSpacing: '-0.02em',
            }}>
              <AnimatedText
                preset={preset}
                startDelay={cardDelayFrames + 5}
                distance={15}
              >
                {currentPoint.title}
              </AnimatedText>
            </div>
          )}

          {/* Description */}
          {currentPoint.description && (
            <div style={{
              fontSize: 20,
              lineHeight: 1.4,
              color: theme.colors.textSecondary || theme.colors.textPrimary,
              opacity: 0.85,
            }}>
              <AnimatedText
                preset={preset}
                startDelay={cardDelayFrames + 15}
                distance={10}
              >
                {currentPoint.description}
              </AnimatedText>
            </div>
          )}
        </div>
      )}

      {/* Point indicator dot */}
      <div style={{
        position: 'absolute',
        left: width / 2,
        top: height / 2,
        width: 16,
        height: 16,
        marginLeft: -8,
        marginTop: -8,
        borderRadius: '50%',
        border: `2px solid ${theme.colors.accent || '#d4a843'}`,
        background: 'rgba(255,255,255,0.2)',
        opacity: cardOpacity * 0.7,
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};

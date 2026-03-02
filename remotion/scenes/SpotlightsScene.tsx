import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { SceneProps, SpotlightPoint } from './types';
import { AnimatedText } from '../components/AnimatedText';
import { SpotlightMarker } from '../components/SpotlightMarker';
import { usePresetSceneFade, useSceneBlur } from '../lib/motion';
import { AnimationPreset, ANIMATION_PRESETS, resolvePresets } from '../lib/animationPresets';

/** Apply opacity to a hex color, returning rgba string */
function colorWithOpacity(color: string, opacity: number): string {
  // Handle hex colors
  const hex = color.replace('#', '');
  if (hex.length === 6 || hex.length === 3) {
    const full = hex.length === 3
      ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
      : hex;
    const r = parseInt(full.substring(0, 2), 16);
    const g = parseInt(full.substring(2, 4), 16);
    const b = parseInt(full.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // If already rgba/rgb, just return as-is (opacity applied via CSS opacity)
  return color;
}

export const SpotlightsScene: React.FC<SceneProps> = ({ data, durationInFrames, theme, skipFadeOut = false }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const points: SpotlightPoint[] = data.spotlights || [];
  const imageUrl = data.spotlight_image_url || data.image_url;
  const { presetIn, presetOut } = resolvePresets(data, 'smooth');
  const preset = presetIn;

  // Style overrides
  const markerColor = data.spotlight_marker_color;
  const markerOpacity = data.spotlight_marker_opacity;
  const cardBg = data.spotlight_card_bg;
  const cardBgOpacity = data.spotlight_card_bg_opacity;
  const cardBorderColor = data.spotlight_card_border_color;
  const cardBorderOpacity = data.spotlight_card_border_opacity;
  const textColor = data.spotlight_text_color;
  const badgeColor = data.spotlight_badge_color;
  const badgeTextColor = data.spotlight_badge_text_color;

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

  const sceneBlur = useSceneBlur(ANIMATION_PRESETS[preset], durationInFrames, skipFadeOut);
  const exitConfig = presetOut ? ANIMATION_PRESETS[presetOut] : null;
  const exitFade = exitConfig ? usePresetSceneFade(exitConfig, durationInFrames, false) : 1;

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
      opacity: sceneOpacity * exitFade,
      filter: sceneBlur || undefined,
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
          background: cardBg
            ? colorWithOpacity(cardBg, cardBgOpacity ?? 0.85)
            : theme.colors.surface || 'rgba(10, 10, 10, 0.85)',
          border: `1px solid ${cardBorderColor
            ? colorWithOpacity(cardBorderColor, cardBorderOpacity ?? 1)
            : theme.colors.accent || 'rgba(255,255,255,0.15)'}`,
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
              background: badgeColor || theme.colors.accent || '#d4a843',
              color: badgeTextColor || theme.colors.background || '#0a0a0a',
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
              color: textColor || theme.colors.textPrimary,
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
              color: textColor || theme.colors.textSecondary || theme.colors.textPrimary,
              opacity: textColor ? 1 : 0.85,
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

      {/* Animated marker */}
      <SpotlightMarker
        type={currentPoint.markerType || 'marker'}
        theme={theme}
        opacity={cardOpacity}
        segmentFrame={segmentFrame}
        cardDelayFrames={cardDelayFrames}
        screenWidth={width}
        screenHeight={height}
        cardX={cardX}
        cardY={cardY}
        cardOnRight={cardOnRight}
        cardOnBottom={cardOnBottom}
        markerWidth={currentPoint.markerWidth}
        markerHeight={currentPoint.markerHeight}
        markerColor={markerColor}
        markerOpacity={markerOpacity}
      />
    </AbsoluteFill>
  );
};

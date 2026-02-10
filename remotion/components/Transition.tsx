/**
 * Transition Component
 *
 * Renders transition effects between two scenes.
 * Takes screenshots/frames from scene A and scene B and applies the transition.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate } from 'remotion';
import {
  TransitionType,
  TransitionConfig,
  getTransitionProgress,
  getTransitionConfig,
} from '../lib/transitions';

export interface TransitionProps {
  transitionType: TransitionType;
  durationFrames: number;
  config?: Partial<TransitionConfig>;
  // Scene snapshots (base64 or URLs)
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  // Or background colors for simple transitions
  sceneAColor?: string;
  sceneBColor?: string;
  // Video dimensions
  width?: number;
  height?: number;
}

export const Transition: React.FC<TransitionProps> = ({
  transitionType,
  durationFrames,
  config: configOverrides,
  sceneASnapshot,
  sceneBSnapshot,
  sceneAColor = '#000000',
  sceneBColor = '#000000',
  width = 1920,
  height = 1080,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const config = getTransitionConfig(transitionType, {
    ...configOverrides,
    durationFrames,
  });

  const progress = getTransitionProgress(frame, fps, config);

  // Render based on transition type
  switch (transitionType) {
    case 'none':
      return <CutTransition sceneBSnapshot={sceneBSnapshot} sceneBColor={sceneBColor} />;

    case 'crossfade':
      return (
        <CrossfadeTransition
          progress={progress}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'fade-black':
    case 'fade-white':
      return (
        <FadeColorTransition
          progress={progress}
          color={config.color || (transitionType === 'fade-white' ? '#ffffff' : '#000000')}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'slide-left':
    case 'slide-right':
    case 'slide-up':
    case 'slide-down':
      return (
        <SlideTransition
          progress={progress}
          direction={transitionType.replace('slide-', '') as 'left' | 'right' | 'up' | 'down'}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
          width={width}
          height={height}
        />
      );

    case 'wipe-left':
    case 'wipe-right':
    case 'wipe-up':
    case 'wipe-down':
      return (
        <WipeTransition
          progress={progress}
          direction={transitionType.replace('wipe-', '') as 'left' | 'right' | 'up' | 'down'}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
          width={width}
          height={height}
        />
      );

    case 'zoom-in':
      return (
        <ZoomTransition
          progress={progress}
          direction="in"
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'zoom-out':
      return (
        <ZoomTransition
          progress={progress}
          direction="out"
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'blur':
      return (
        <BlurTransition
          progress={progress}
          intensity={config.intensity || 0.8}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'glitch':
      return (
        <GlitchTransition
          frame={frame}
          progress={progress}
          intensity={config.intensity || 0.6}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'morph':
      return (
        <MorphTransition
          progress={progress}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'flash':
      return (
        <FlashTransition
          progress={progress}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'spin':
      return (
        <SpinTransition
          progress={progress}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'flip':
      return (
        <FlipTransition
          progress={progress}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'pixelate':
      return (
        <PixelateTransition
          progress={progress}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'iris-close':
      return (
        <IrisCloseTransition
          progress={progress}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'clock-wipe':
      return (
        <ClockWipeTransition
          progress={progress}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
        />
      );

    case 'push-left':
      return (
        <PushTransition
          progress={progress}
          sceneASnapshot={sceneASnapshot}
          sceneBSnapshot={sceneBSnapshot}
          sceneAColor={sceneAColor}
          sceneBColor={sceneBColor}
          width={width}
        />
      );

    default:
      return <CutTransition sceneBSnapshot={sceneBSnapshot} sceneBColor={sceneBColor} />;
  }
};

// =============================================================================
// SCENE LAYER COMPONENT
// =============================================================================

interface SceneLayerProps {
  snapshot?: string;
  color: string;
  style?: React.CSSProperties;
}

const SceneLayer: React.FC<SceneLayerProps> = ({ snapshot, color, style }) => {
  if (snapshot) {
    return (
      <AbsoluteFill style={style}>
        <Img
          src={snapshot}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ background: color, ...style }} />;
};

// =============================================================================
// TRANSITION IMPLEMENTATIONS
// =============================================================================

// Cut (no transition)
const CutTransition: React.FC<{ sceneBSnapshot?: string; sceneBColor: string }> = ({
  sceneBSnapshot,
  sceneBColor,
}) => (
  <SceneLayer snapshot={sceneBSnapshot} color={sceneBColor} />
);

// Crossfade
const CrossfadeTransition: React.FC<{
  progress: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => (
  <AbsoluteFill>
    <SceneLayer snapshot={sceneASnapshot} color={sceneAColor} style={{ opacity: 1 - progress }} />
    <SceneLayer snapshot={sceneBSnapshot} color={sceneBColor} style={{ opacity: progress }} />
  </AbsoluteFill>
);

// Fade through color
const FadeColorTransition: React.FC<{
  progress: number;
  color: string;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, color, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => {
  // First half: fade scene A to color
  // Second half: fade color to scene B
  const sceneAOpacity = progress < 0.5 ? 1 - (progress * 2) : 0;
  const sceneBOpacity = progress > 0.5 ? (progress - 0.5) * 2 : 0;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: color }} />
      <SceneLayer snapshot={sceneASnapshot} color={sceneAColor} style={{ opacity: sceneAOpacity }} />
      <SceneLayer snapshot={sceneBSnapshot} color={sceneBColor} style={{ opacity: sceneBOpacity }} />
    </AbsoluteFill>
  );
};

// Slide transition
const SlideTransition: React.FC<{
  progress: number;
  direction: 'left' | 'right' | 'up' | 'down';
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
  width: number;
  height: number;
}> = ({ progress, direction, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor, width, height }) => {
  let sceneBTransform = '';

  switch (direction) {
    case 'left':
      sceneBTransform = `translateX(${(1 - progress) * width}px)`;
      break;
    case 'right':
      sceneBTransform = `translateX(${-(1 - progress) * width}px)`;
      break;
    case 'up':
      sceneBTransform = `translateY(${(1 - progress) * height}px)`;
      break;
    case 'down':
      sceneBTransform = `translateY(${-(1 - progress) * height}px)`;
      break;
  }

  return (
    <AbsoluteFill>
      <SceneLayer snapshot={sceneASnapshot} color={sceneAColor} />
      <SceneLayer snapshot={sceneBSnapshot} color={sceneBColor} style={{ transform: sceneBTransform }} />
    </AbsoluteFill>
  );
};

// Wipe transition
const WipeTransition: React.FC<{
  progress: number;
  direction: 'left' | 'right' | 'up' | 'down';
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
  width: number;
  height: number;
}> = ({ progress, direction, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor, width, height }) => {
  let clipPath = '';

  switch (direction) {
    case 'left':
      clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
      break;
    case 'right':
      clipPath = `inset(0 0 0 ${(1 - progress) * 100}%)`;
      break;
    case 'up':
      clipPath = `inset(0 0 ${(1 - progress) * 100}% 0)`;
      break;
    case 'down':
      clipPath = `inset(${(1 - progress) * 100}% 0 0 0)`;
      break;
  }

  return (
    <AbsoluteFill>
      <SceneLayer snapshot={sceneASnapshot} color={sceneAColor} />
      <SceneLayer snapshot={sceneBSnapshot} color={sceneBColor} style={{ clipPath }} />
    </AbsoluteFill>
  );
};

// Zoom transition
const ZoomTransition: React.FC<{
  progress: number;
  direction: 'in' | 'out';
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, direction, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => {
  const sceneAScale = direction === 'in' ? 1 + progress * 0.5 : 1;
  const sceneBScale = direction === 'out' ? 0.5 + progress * 0.5 : 1;
  const sceneAOpacity = 1 - progress;
  const sceneBOpacity = progress;

  return (
    <AbsoluteFill>
      <SceneLayer
        snapshot={sceneASnapshot}
        color={sceneAColor}
        style={{
          transform: `scale(${sceneAScale})`,
          opacity: sceneAOpacity,
        }}
      />
      <SceneLayer
        snapshot={sceneBSnapshot}
        color={sceneBColor}
        style={{
          transform: `scale(${sceneBScale})`,
          opacity: sceneBOpacity,
        }}
      />
    </AbsoluteFill>
  );
};

// Blur transition
const BlurTransition: React.FC<{
  progress: number;
  intensity: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, intensity, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => {
  const maxBlur = intensity * 20; // pixels
  const sceneABlur = progress * maxBlur;
  const sceneBBlur = (1 - progress) * maxBlur;

  return (
    <AbsoluteFill>
      <SceneLayer
        snapshot={sceneASnapshot}
        color={sceneAColor}
        style={{
          filter: `blur(${sceneABlur}px)`,
          opacity: 1 - progress,
        }}
      />
      <SceneLayer
        snapshot={sceneBSnapshot}
        color={sceneBColor}
        style={{
          filter: `blur(${sceneBBlur}px)`,
          opacity: progress,
        }}
      />
    </AbsoluteFill>
  );
};

// Glitch transition
const GlitchTransition: React.FC<{
  frame: number;
  progress: number;
  intensity: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ frame, progress, intensity, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => {
  // Create glitch effect with random offsets
  const seed = frame * 1.5;
  const glitchActive = Math.sin(seed * 10) > 0.3;
  const offsetX = glitchActive ? Math.sin(seed * 20) * intensity * 30 : 0;
  const offsetY = glitchActive ? Math.cos(seed * 15) * intensity * 10 : 0;

  // RGB split effect
  const rgbSplit = glitchActive ? intensity * 5 : 0;

  const showSceneB = progress > 0.5 || (glitchActive && Math.random() > 0.5);

  return (
    <AbsoluteFill>
      {/* Base layer */}
      <SceneLayer
        snapshot={showSceneB ? sceneBSnapshot : sceneASnapshot}
        color={showSceneB ? sceneBColor : sceneAColor}
      />

      {/* Glitch layers */}
      {glitchActive && (
        <>
          <SceneLayer
            snapshot={sceneASnapshot}
            color={sceneAColor}
            style={{
              transform: `translateX(${offsetX}px) translateY(${offsetY}px)`,
              opacity: 0.5,
              mixBlendMode: 'screen',
              filter: `hue-rotate(${Math.sin(seed) * 90}deg)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: `${Math.random() * 80}%`,
              left: 0,
              right: 0,
              height: `${5 + Math.random() * 10}%`,
              background: `rgba(255, 0, ${Math.random() * 255}, 0.3)`,
              transform: `translateX(${offsetX * 2}px)`,
            }}
          />
        </>
      )}
    </AbsoluteFill>
  );
};

// Morph transition (circle expand)
const MorphTransition: React.FC<{
  progress: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => {
  // Circle reveal from center
  const radius = progress * 150; // percentage
  const clipPath = `circle(${radius}% at 50% 50%)`;

  return (
    <AbsoluteFill>
      <SceneLayer snapshot={sceneASnapshot} color={sceneAColor} />
      <SceneLayer snapshot={sceneBSnapshot} color={sceneBColor} style={{ clipPath }} />
    </AbsoluteFill>
  );
};

// Flash transition
const FlashTransition: React.FC<{
  progress: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => {
  const flashOpacity = Math.sin(progress * Math.PI);

  return (
    <AbsoluteFill>
      {progress < 0.5 ? (
        <SceneLayer snapshot={sceneASnapshot} color={sceneAColor} />
      ) : (
        <SceneLayer snapshot={sceneBSnapshot} color={sceneBColor} />
      )}
      <AbsoluteFill style={{ background: '#ffffff', opacity: flashOpacity }} />
    </AbsoluteFill>
  );
};

// Spin transition
const SpinTransition: React.FC<{
  progress: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => (
  <AbsoluteFill>
    <SceneLayer
      snapshot={sceneASnapshot}
      color={sceneAColor}
      style={{
        transform: `rotate(${progress * 180}deg) scale(${1 - progress * 0.5})`,
        opacity: 1 - progress,
      }}
    />
    <SceneLayer
      snapshot={sceneBSnapshot}
      color={sceneBColor}
      style={{
        transform: `rotate(${(1 - progress) * -180}deg) scale(${0.5 + progress * 0.5})`,
        opacity: progress,
      }}
    />
  </AbsoluteFill>
);

// Flip transition (3D card flip)
const FlipTransition: React.FC<{
  progress: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => (
  <AbsoluteFill style={{ perspective: '1200px' }}>
    {progress < 0.5 ? (
      <SceneLayer
        snapshot={sceneASnapshot}
        color={sceneAColor}
        style={{
          transform: `rotateY(${progress * 180}deg)`,
          backfaceVisibility: 'hidden',
        }}
      />
    ) : (
      <SceneLayer
        snapshot={sceneBSnapshot}
        color={sceneBColor}
        style={{
          transform: `rotateY(${(1 - progress) * -180}deg)`,
          backfaceVisibility: 'hidden',
        }}
      />
    )}
  </AbsoluteFill>
);

// Pixelate transition
const PixelateTransition: React.FC<{
  progress: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => {
  const radius = Math.sin(progress * Math.PI) * 8;
  const filterId = 'pixelate-filter';

  return (
    <AbsoluteFill>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={filterId}>
            <feMorphology operator="dilate" radius={radius} />
          </filter>
        </defs>
      </svg>
      <SceneLayer
        snapshot={sceneASnapshot}
        color={sceneAColor}
        style={{
          opacity: 1 - progress,
          filter: `url(#${filterId})`,
        }}
      />
      <SceneLayer
        snapshot={sceneBSnapshot}
        color={sceneBColor}
        style={{
          opacity: progress,
          filter: `url(#${filterId})`,
        }}
      />
    </AbsoluteFill>
  );
};

// Iris Close transition
const IrisCloseTransition: React.FC<{
  progress: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => {
  const radius = (1 - progress) * 150;

  return (
    <AbsoluteFill>
      <SceneLayer snapshot={sceneBSnapshot} color={sceneBColor} />
      <SceneLayer
        snapshot={sceneASnapshot}
        color={sceneAColor}
        style={{ clipPath: `circle(${radius}% at 50% 50%)` }}
      />
    </AbsoluteFill>
  );
};

// Clock Wipe transition
const ClockWipeTransition: React.FC<{
  progress: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
}> = ({ progress, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor }) => {
  const angle = progress * 360;

  return (
    <AbsoluteFill>
      <SceneLayer snapshot={sceneASnapshot} color={sceneAColor} />
      <SceneLayer
        snapshot={sceneBSnapshot}
        color={sceneBColor}
        style={{
          WebkitMaskImage: `conic-gradient(from 0deg, black ${angle}deg, transparent ${angle}deg)`,
          maskImage: `conic-gradient(from 0deg, black ${angle}deg, transparent ${angle}deg)`,
        }}
      />
    </AbsoluteFill>
  );
};

// Push transition (both scenes slide left)
const PushTransition: React.FC<{
  progress: number;
  sceneASnapshot?: string;
  sceneBSnapshot?: string;
  sceneAColor: string;
  sceneBColor: string;
  width: number;
}> = ({ progress, sceneASnapshot, sceneBSnapshot, sceneAColor, sceneBColor, width }) => (
  <AbsoluteFill>
    <SceneLayer
      snapshot={sceneASnapshot}
      color={sceneAColor}
      style={{ transform: `translateX(${-progress * width}px)` }}
    />
    <SceneLayer
      snapshot={sceneBSnapshot}
      color={sceneBColor}
      style={{ transform: `translateX(${(1 - progress) * width}px)` }}
    />
  </AbsoluteFill>
);

export default Transition;

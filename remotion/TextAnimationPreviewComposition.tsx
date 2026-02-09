import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AnimatedText } from './components/AnimatedText';
import { SpiralTextAnimation } from './components/SpiralTextAnimation';
import { EchoTextAnimation } from './components/EchoTextAnimation';
import type { AnimationPreset } from './lib/animationPresets';
import type { TextModifierType } from './lib/textModifiers';

export interface TextAnimationPreviewProps {
  preset: AnimationPreset;
  durationFrames?: number;
  modifier?: TextModifierType;
}

const SPIRAL_TEXT =
  'Rendomat generates stunning video sales letters with AI-powered scenes and animations that captivate your audience and drive conversions like never before seen in the industry';

export const TextAnimationPreviewComposition: React.FC<TextAnimationPreviewProps> = ({
  preset,
  durationFrames = 90,
  modifier,
}) => {
  // Echo preset uses a fully custom component
  if (preset === 'echo') {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#0a0a0a',
        }}
      >
        {/* Preset label */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'sans-serif',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            zIndex: 10,
          }}
        >
          {modifier ? `${preset} + ${modifier}` : preset}
        </div>

        <EchoTextAnimation
          text="Rendomat"
          fontSize={56}
          fontFamily="sans-serif"
          fontWeight={700}
          color="#ffffff"
        />
      </AbsoluteFill>
    );
  }

  // Spiral preset uses a fully custom component
  if (preset === 'spiral') {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#0a0a0a',
        }}
      >
        {/* Preset label */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'sans-serif',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            zIndex: 10,
          }}
        >
          {modifier ? `${preset} + ${modifier}` : preset}
        </div>

        <SpiralTextAnimation
          text={SPIRAL_TEXT}
          fontSize={36}
          fontFamily="sans-serif"
          fontWeight={700}
          color="#ffffff"
          modifier={modifier}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      {/* Preset label */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 24,
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'sans-serif',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {modifier ? `${preset} + ${modifier}` : preset}
      </div>

      {/* Animated title text */}
      <AnimatedText
        preset={preset}
        startDelay={8}
        modifier={modifier}
        style={{
          color: '#ffffff',
          fontFamily: 'sans-serif',
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1.2,
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        Rendomat
      </AnimatedText>

      {/* Animated body text */}
      <AnimatedText
        preset={preset}
        startDelay={25}
        modifier={modifier}
        style={{
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'sans-serif',
          fontSize: 18,
          fontWeight: 400,
          lineHeight: 1.5,
          textAlign: 'center',
          maxWidth: 480,
          overflowWrap: 'break-word',
        }}
      >
        Generate stunning video sales letters with AI-powered scenes and animations
      </AnimatedText>
    </AbsoluteFill>
  );
};

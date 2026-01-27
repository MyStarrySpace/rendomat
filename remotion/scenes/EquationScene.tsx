import React, { useMemo } from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import katex from 'katex';
import { SceneProps } from './types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import {
  usePresetSceneFade,
  springConfig,
} from '../lib/motion';
import {
  AnimationPreset,
  getElementConfig,
  PresetConfig,
} from '../lib/animationPresets';
import { AnimatedText } from '../components/AnimatedText';

// KaTeX CSS styles embedded
const katexStyles = `
.katex {
  font: normal 1.21em KaTeX_Main, Times New Roman, serif;
  line-height: 1.2;
  text-indent: 0;
  text-rendering: auto;
}
.katex * {
  -ms-high-contrast-adjust: none !important;
  border-color: currentColor;
}
.katex .katex-mathml {
  position: absolute;
  clip: rect(1px, 1px, 1px, 1px);
  padding: 0;
  border: 0;
  height: 1px;
  width: 1px;
  overflow: hidden;
}
.katex .katex-html > .newline {
  display: block;
}
.katex .base {
  position: relative;
  display: inline-block;
  white-space: nowrap;
  width: min-content;
}
.katex .strut {
  display: inline-block;
}
.katex .mord, .katex .mop, .katex .mbin, .katex .mrel, .katex .minner, .katex .mpunct, .katex .mopen, .katex .mclose {
  display: inline-block;
}
.katex .mfrac {
  display: inline-block;
}
.katex .mfrac > span {
  text-align: center;
}
.katex .mfrac .frac-line {
  display: inline-block;
  width: 100%;
  border-bottom-style: solid;
}
.katex .msupsub {
  text-align: left;
}
.katex .msup, .katex .msub, .katex .msupsub {
  display: inline-block;
}
.katex .sqrt {
  display: inline-block;
}
.katex .sqrt > .root {
  margin-left: 0.27777778em;
  margin-right: -0.55555556em;
}
`;

interface RenderedEquation {
  html: string;
  error: boolean;
}

function renderLatex(latex: string): RenderedEquation {
  try {
    const html = katex.renderToString(latex, {
      throwOnError: false,
      displayMode: true,
      output: 'html',
    });
    return { html, error: false };
  } catch (e) {
    return { html: `<span style="color: red;">Error: ${latex}</span>`, error: true };
  }
}

export const EquationScene: React.FC<SceneProps> = ({ data, durationInFrames, theme, skipFadeOut = false }) => {
  const layout = useResponsiveLayout();

  // Get animation preset from data or default to 'dramatic' for equations
  const preset: AnimationPreset = (data.animation_preset as AnimationPreset) || 'dramatic';

  // Get element-specific configs
  const titleConfig = getElementConfig('equation', preset, 'title');
  const bodyConfig = getElementConfig('equation', preset, 'body');
  const dataConfig = getElementConfig('equation', preset, 'data');

  // Scene fade (skip fade-out when using external transitions)
  const sceneFade = usePresetSceneFade(titleConfig, durationInFrames, skipFadeOut);

  // Parse equations - support both single equation and array of equations
  const equations = useMemo(() => {
    if (data.equations && Array.isArray(data.equations)) {
      return data.equations;
    }
    if (data.equation) {
      return [data.equation];
    }
    return ['E = mc^2']; // Default example equation
  }, [data.equation, data.equations]);

  // Render all equations
  const renderedEquations = useMemo(() => {
    return equations.map(eq => renderLatex(eq));
  }, [equations]);

  // Calculate equation size based on layout
  const equationFontSize = layout.isVertical ? '2rem' : '2.5rem';
  const multipleEquationFontSize = equations.length > 2
    ? (layout.isVertical ? '1.5rem' : '1.8rem')
    : equationFontSize;

  return (
    <AbsoluteFill style={{
      background: theme.colors.backgroundGradient || theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: layout.padding,
      opacity: sceneFade,
    }}>
      <style>{katexStyles}</style>
      <div style={{
        textAlign: 'center',
        maxWidth: layout.maxWidth,
        width: '100%',
        fontFamily: `'${theme.fonts.body}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
      }}>
        {/* Title */}
        {data.title && (
          <div style={{
            fontSize: layout.titleFontSize,
            fontWeight: layout.titleFontWeight,
            color: theme.colors.textPrimary,
            marginBottom: layout.gap,
            lineHeight: 1.2,
            letterSpacing: layout.titleLetterSpacing,
            textShadow: layout.titleTextShadow,
            fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
          }}>
            <AnimatedText
              preset={preset}
              startDelay={titleConfig.startDelay}
              distance={titleConfig.distance}
            >
              {data.title}
            </AnimatedText>
          </div>
        )}

        {/* Description */}
        {data.equation_description && (
          <div style={{
            fontSize: layout.bodyFontSize * 0.9,
            fontWeight: layout.bodyFontWeight,
            color: theme.colors.textSecondary,
            marginBottom: layout.gap * 1.5,
            lineHeight: 1.5,
            fontStyle: 'italic',
            letterSpacing: layout.bodyLetterSpacing,
          }}>
            <AnimatedText
              preset={preset}
              startDelay={bodyConfig.startDelay}
              distance={bodyConfig.distance}
            >
              {data.equation_description}
            </AnimatedText>
          </div>
        )}

        {/* Equations */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: layout.gap,
        }}>
          {renderedEquations.map((rendered, index) => (
            <EquationItem
              key={index}
              index={index}
              rendered={rendered}
              theme={theme}
              fontSize={multipleEquationFontSize}
              isVertical={layout.isVertical}
              config={dataConfig}
            />
          ))}
        </div>

        {/* Step indicator for multiple equations */}
        {equations.length > 1 && (
          <EquationIndicators
            total={equations.length}
            theme={theme}
            gap={layout.gap}
            config={dataConfig}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

// Separate component for equation items to use hooks properly
interface EquationItemProps {
  index: number;
  rendered: RenderedEquation;
  theme: any;
  fontSize: string;
  isVertical: boolean;
  config: PresetConfig;
}

const EquationItem: React.FC<EquationItemProps> = ({
  index,
  rendered,
  theme,
  fontSize,
  isVertical,
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = config.startDelay + index * config.staggerDelay;
  const adjustedFrame = Math.max(0, frame - delay);

  // Spring-based scale and opacity using preset config
  const progress = spring({
    frame: adjustedFrame,
    fps,
    config: springConfig[config.spring],
    durationInFrames: 45,
  });

  const scale = interpolate(progress, [0, 1], [config.scaleFrom, 1]);
  const translateY = interpolate(progress, [0, 1], [config.distance, 0]);

  return (
    <div
      style={{
        opacity: progress,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        background: `${theme.colors.accent}15`,
        padding: isVertical ? '16px 24px' : '24px 40px',
        border: `2px solid ${theme.colors.accent}30`,
        fontSize: fontSize,
        color: theme.colors.textPrimary,
      }}
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
};

// Separate component for indicators
interface EquationIndicatorsProps {
  total: number;
  theme: any;
  gap: number;
  config: PresetConfig;
}

const EquationIndicators: React.FC<EquationIndicatorsProps> = ({
  total,
  theme,
  gap,
  config,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      marginTop: gap,
    }}>
      {Array.from({ length: total }).map((_, index) => {
        const delay = config.startDelay + index * config.staggerDelay;
        const adjustedFrame = Math.max(0, frame - delay);
        const progress = spring({
          frame: adjustedFrame,
          fps,
          config: springConfig[config.spring],
          durationInFrames: 30,
        });

        return (
          <div
            key={index}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: progress > 0.5 ? theme.colors.accent : `${theme.colors.textSecondary}40`,
              transform: `scale(${interpolate(progress, [0, 1], [0.5, 1])})`,
              opacity: 0.7,
            }}
          />
        );
      })}
    </div>
  );
};

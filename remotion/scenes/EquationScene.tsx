import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import katex from 'katex';
import { SceneProps } from './types';
import { useFadeAnimation } from './utils';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

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

export const EquationScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  const frame = useCurrentFrame();
  const opacity = useFadeAnimation(durationInFrames);
  const layout = useResponsiveLayout();

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

  // Calculate animation timings
  const titleDelay = 10;
  const titleDuration = 15;
  const descriptionDelay = titleDelay + titleDuration + 5;
  const descriptionDuration = 15;
  const equationStartDelay = descriptionDelay + (data.equation_description ? descriptionDuration : 0) + 5;
  const equationStaggerDelay = 20; // Frames between each equation

  const titleOpacity = interpolate(
    frame,
    [titleDelay, titleDelay + titleDuration],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  ) * opacity;

  const descriptionOpacity = data.equation_description
    ? interpolate(
        frame,
        [descriptionDelay, descriptionDelay + descriptionDuration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      ) * opacity
    : 0;

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
      padding: layout.padding
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
            fontWeight: 700,
            color: theme.colors.textPrimary,
            opacity: titleOpacity,
            marginBottom: layout.gap,
            lineHeight: 1.2,
            fontFamily: `'${theme.fonts.heading}', system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
          }}>
            {data.title}
          </div>
        )}

        {/* Description */}
        {data.equation_description && (
          <div style={{
            fontSize: layout.bodyFontSize * 0.9,
            fontWeight: 400,
            color: theme.colors.textSecondary,
            opacity: descriptionOpacity,
            marginBottom: layout.gap * 1.5,
            lineHeight: 1.5,
            fontStyle: 'italic',
          }}>
            {data.equation_description}
          </div>
        )}

        {/* Equations */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: layout.gap,
        }}>
          {renderedEquations.map((rendered, index) => {
            const eqDelay = equationStartDelay + index * equationStaggerDelay;
            const eqOpacity = interpolate(
              frame,
              [eqDelay, eqDelay + 15],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            ) * opacity;

            const eqScale = interpolate(
              frame,
              [eqDelay, eqDelay + 20],
              [0.8, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            return (
              <div
                key={index}
                style={{
                  opacity: eqOpacity,
                  transform: `scale(${eqScale})`,
                  background: `${theme.colors.accent}15`,
                  borderRadius: '12px',
                  padding: layout.isVertical ? '16px 24px' : '24px 40px',
                  border: `2px solid ${theme.colors.accent}30`,
                  fontSize: multipleEquationFontSize,
                  color: theme.colors.textPrimary,
                }}
                dangerouslySetInnerHTML={{ __html: rendered.html }}
              />
            );
          })}
        </div>

        {/* Step indicator for multiple equations */}
        {equations.length > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: layout.gap,
            opacity: opacity * 0.7,
          }}>
            {equations.map((_, index) => {
              const eqDelay = equationStartDelay + index * equationStaggerDelay;
              const isVisible = frame > eqDelay;
              return (
                <div
                  key={index}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isVisible ? theme.colors.accent : `${theme.colors.textSecondary}40`,
                    transition: 'background 0.3s ease',
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

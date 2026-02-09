/**
 * EchoTextAnimation Component
 *
 * Hero text at full opacity in the center with faded ghost copies stacked
 * above and below, scrolling horizontally in alternating directions.
 * Creates a modern kinetic stacked marquee effect.
 *
 * - 2 * echoRows + 1 total rows (default: 7 = 3 above + hero + 3 below)
 * - Ghost rows: text repeated 4x with separator for seamless tiling
 * - Alternating scroll directions; speed increases with distance from center
 * - Opacity decreases with distance from center
 * - Hero row fades in with a spring entrance animation
 */

import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { springConfig } from '../lib/motion';

export interface EchoTextAnimationProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  echoRows?: number;       // rows above AND below hero (default 3)
  rowGap?: number;          // vertical spacing factor relative to fontSize (default 1.2)
  scrollSpeed?: number;     // base px/frame for nearest echo (default 1.5)
  ghostOpacity?: number;    // opacity of nearest echo row (default 0.15)
  style?: React.CSSProperties;
}

const SEPARATOR = '   \u00b7   '; // spaced middle dot
const REPEATS = 4;

export const EchoTextAnimation: React.FC<EchoTextAnimationProps> = ({
  text,
  fontSize = 56,
  fontFamily = 'sans-serif',
  fontWeight = 700,
  color = '#ffffff',
  echoRows = 3,
  rowGap = 1.2,
  scrollSpeed = 1.5,
  ghostOpacity = 0.15,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Build the repeated ghost string
  const ghostText = useMemo(() => {
    const parts: string[] = [];
    for (let i = 0; i < REPEATS; i++) {
      parts.push(text);
    }
    return parts.join(SEPARATOR);
  }, [text]);

  // Measure the ghost text width for seamless looping
  const measureRef = useRef<HTMLSpanElement>(null);
  const [repeatWidth, setRepeatWidth] = useState(0);

  useLayoutEffect(() => {
    if (measureRef.current) {
      // Measure one "text + separator" unit width
      setRepeatWidth(measureRef.current.getBoundingClientRect().width);
    }
  }, [ghostText, fontSize, fontFamily, fontWeight]);

  // Hero row spring entrance
  const heroProgress = spring({
    frame,
    fps,
    config: springConfig.smooth,
    durationInFrames: 45,
  });

  // Row spacing in pixels
  const rowSpacing = fontSize * rowGap;

  // Build row configs: distance from center, direction sign, opacity, speed
  const rows = useMemo(() => {
    const result: {
      distance: number;
      directionSign: number;
      opacity: number;
      speed: number;
    }[] = [];

    for (let d = echoRows; d >= 1; d--) {
      result.push({
        distance: -d,
        directionSign: d % 2 === 1 ? -1 : 1,
        opacity: ghostOpacity / d,
        speed: scrollSpeed * d,
      });
    }
    // Hero row placeholder (rendered separately)
    result.push({ distance: 0, directionSign: 0, opacity: 1, speed: 0 });
    for (let d = 1; d <= echoRows; d++) {
      result.push({
        distance: d,
        directionSign: d % 2 === 1 ? 1 : -1,
        opacity: ghostOpacity / d,
        speed: scrollSpeed * d,
      });
    }
    return result;
  }, [echoRows, ghostOpacity, scrollSpeed]);

  // One "unit" width = width of "text + separator" for modulo wrapping
  // We use repeatWidth which measures the full ghost string, so one unit = repeatWidth / REPEATS
  const unitWidth = repeatWidth / REPEATS;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {/* Hidden measurement span for the full ghost text */}
      <span
        ref={measureRef}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          fontSize,
          fontFamily,
          fontWeight,
          lineHeight: 1,
        }}
      >
        {ghostText}
      </span>

      {/* Rows */}
      {rows.map((row, i) => {
        const yOffset = row.distance * rowSpacing;

        // Hero row
        if (row.distance === 0) {
          return (
            <div
              key="hero"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) translateY(${yOffset}px)`,
                whiteSpace: 'nowrap',
                fontSize,
                fontFamily,
                fontWeight,
                color,
                opacity: heroProgress,
                lineHeight: 1,
                zIndex: 1,
              }}
            >
              {text}
            </div>
          );
        }

        // Ghost row: continuous scroll via translateX modulo
        const rawOffset = frame * row.speed * row.directionSign;
        // Modulo wrap to keep within one unit for seamless tiling
        const wrappedOffset = unitWidth > 0
          ? ((rawOffset % unitWidth) + unitWidth) % unitWidth
          : rawOffset;

        // Double the ghost text so we always have enough to fill viewport
        return (
          <div
            key={`echo-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              whiteSpace: 'nowrap',
              fontSize,
              fontFamily,
              fontWeight,
              color,
              opacity: row.opacity,
              lineHeight: 1,
              transform: `translateY(calc(-50% + ${yOffset}px)) translateX(${wrappedOffset - unitWidth}px)`,
              willChange: 'transform',
            }}
          >
            {ghostText}{SEPARATOR}{ghostText}
          </div>
        );
      })}
    </div>
  );
};

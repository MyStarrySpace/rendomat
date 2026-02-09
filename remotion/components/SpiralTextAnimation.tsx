/**
 * SpiralTextAnimation Component
 *
 * Each ~30-char chunk slides in from the right while spinning 90° into place.
 * Chunks connect end-to-end: each chunk's left edge meets the previous chunk's
 * right edge, with 90° turns forming a spiral path.
 *
 * During the container's -90° rotation, the focus offset slides so the previous
 * chunk continues displacing in its slide direction, making room for the next.
 *
 * Visual modifiers (chromatic, glow, glitch, etc.) can be applied via the
 * modifier prop using the composable text modifier system.
 * Uses refs + getBoundingClientRect for precise text measurement.
 */

import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { springConfig } from '../lib/motion';
import type { TextModifierType } from '../lib/textModifiers';
import { getTextModifier, getGlitchWordJitter } from '../lib/textModifiers';

export interface SpiralTextAnimationProps {
  text: string;
  targetCharsPerChunk?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: string;
  /** Optional visual modifier to apply on top of the animation */
  modifier?: TextModifierType;
}

const SLIDE_FRAMES = 18;
const ROTATE_FRAMES = 17;
const STEP_FRAMES = SLIDE_FRAMES + ROTATE_FRAMES; // 35

function chunkText(text: string, target: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > target) {
      chunks.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export const SpiralTextAnimation: React.FC<SpiralTextAnimationProps> = ({
  text,
  targetCharsPerChunk = 30,
  fontSize = 32,
  fontFamily = 'sans-serif',
  fontWeight = 700,
  color = '#ffffff',
  modifier,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: viewportW, height: viewportH } = useVideoConfig();

  const chunks = useMemo(
    () => chunkText(text, targetCharsPerChunk),
    [text, targetCharsPerChunk],
  );

  // ---------------------------------------------------------------------------
  // Measure actual text dimensions via hidden spans
  // ---------------------------------------------------------------------------
  const measureRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const [dims, setDims] = useState<{ w: number; h: number }[]>([]);

  useLayoutEffect(() => {
    const next: { w: number; h: number }[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const el = measureRefs.current.get(i);
      if (el) {
        const rect = el.getBoundingClientRect();
        next.push({ w: rect.width, h: rect.height });
      }
    }
    if (next.length === chunks.length) setDims(next);
  }, [chunks, fontSize, fontFamily, fontWeight]);

  const measured = dims.length === chunks.length;

  // ---------------------------------------------------------------------------
  // Spiral layout — precompute end-to-end center positions.
  //
  // Each chunk's reading direction is rotated i*90°.  The "junction" between
  // chunk i-1 and chunk i is the right-end of chunk i-1 = left-end of chunk i.
  //
  //   chunk direction vector  = (cos(i·π/2), sin(i·π/2))
  //   right-end of chunk i    = center_i + (w_i/2) · dir_i
  //   left-end  of chunk i    = center_i − (w_i/2) · dir_i
  //
  // We chain: left-end_i = right-end_{i-1}
  //   ⟹ center_i = right-end_{i-1} + (w_i/2) · dir_i
  // ---------------------------------------------------------------------------
  // Gap at each junction so the text height doesn't overlap at corners
  const junctionGap = fontSize * 0.8;

  const spiralCenters = useMemo(() => {
    if (!measured) return [];
    const pos: { x: number; y: number }[] = [{ x: 0, y: 0 }];

    for (let i = 1; i < chunks.length; i++) {
      const prev = pos[i - 1];
      const prevW = dims[i - 1].w;
      const prevAngle = ((i - 1) * Math.PI) / 2;
      const currW = dims[i].w;
      const currAngle = (i * Math.PI) / 2;

      // Junction: end of previous chunk + gap
      const jx = prev.x + (prevW / 2 + junctionGap) * Math.cos(prevAngle);
      const jy = prev.y + (prevW / 2 + junctionGap) * Math.sin(prevAngle);

      // Current center: junction + gap + half current width along current direction
      pos.push({
        x: jx + (currW / 2 + junctionGap) * Math.cos(currAngle),
        y: jy + (currW / 2 + junctionGap) * Math.sin(currAngle),
      });
    }
    return pos;
  }, [measured, dims, chunks.length, junctionGap]);

  // ---------------------------------------------------------------------------
  // Container rotation — accumulates -90° after each chunk's slide phase
  // ---------------------------------------------------------------------------
  const currentStep = Math.min(
    Math.floor(frame / STEP_FRAMES),
    chunks.length - 1,
  );

  let containerRotation = 0;
  // Skip the final rotation — only rotate after chunks 0..n-2
  for (let s = 0; s < chunks.length - 1; s++) {
    const rotStart = s * STEP_FRAMES + SLIDE_FRAMES;
    if (frame >= rotStart) {
      const local = frame - rotStart;
      const p = spring({
        frame: Math.min(local, ROTATE_FRAMES),
        fps,
        config: springConfig.smooth,
        durationInFrames: ROTATE_FRAMES,
      });
      containerRotation -= 90 * p;
    }
  }

  // ---------------------------------------------------------------------------
  // Focus offset — keeps the current chunk centred in the viewport.
  //
  // Transitions during each rotation phase (same spring as the container
  // rotation) so the previous chunk visually "keeps sliding" in its arrival
  // direction while the world spins.
  // ---------------------------------------------------------------------------
  let focusX = 0;
  let focusY = 0;

  if (spiralCenters.length > 0) {
    // Fractional focus index — moves from s → s+1 during step s's rotation
    let focusIdx = 0;
    for (let s = 0; s < chunks.length - 1; s++) {
      const rotStart = s * STEP_FRAMES + SLIDE_FRAMES;
      if (frame >= rotStart) {
        const rotLocal = frame - rotStart;
        const t = spring({
          frame: Math.min(rotLocal, ROTATE_FRAMES),
          fps,
          config: springConfig.smooth,
          durationInFrames: ROTATE_FRAMES,
        });
        focusIdx = s + t;
      }
    }

    const fl = Math.floor(focusIdx);
    const fc = Math.min(fl + 1, spiralCenters.length - 1);
    const frac = focusIdx - fl;
    focusX =
      spiralCenters[fl].x +
      (spiralCenters[fc].x - spiralCenters[fl].x) * frac;
    focusY =
      spiralCenters[fl].y +
      (spiralCenters[fc].y - spiralCenters[fl].y) * frac;
  }

  // ---------------------------------------------------------------------------
  // Build chunk layers
  // ---------------------------------------------------------------------------
  const modifierFn = modifier ? getTextModifier(modifier) : undefined;
  const layers: React.ReactNode[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const stepStart = i * STEP_FRAMES;
    const localFrame = frame - stepStart;
    if (localFrame < 0) continue;

    const dist = currentStep - i;
    if (dist > 2) continue;

    // ---- slide entrance + independent 90° spin ----
    const slideProgress = spring({
      frame: Math.min(localFrame, SLIDE_FRAMES),
      fps,
      config: springConfig.snappy,
      durationInFrames: SLIDE_FRAMES,
    });
    const slideX = interpolate(slideProgress, [0, 1], [viewportW * 0.6, 0]);
    const chunkRotation =
      i * 90 + interpolate(slideProgress, [0, 1], [90, 0]);

    // ---- opacity / fade ----
    let opacity = slideProgress;
    if (dist >= 2) {
      const fadeStart = (i + 2) * STEP_FRAMES;
      const fadeLocal = frame - fadeStart;
      if (fadeLocal >= 0) {
        const fp = spring({
          frame: Math.min(fadeLocal, SLIDE_FRAMES),
          fps,
          config: springConfig.smooth,
          durationInFrames: SLIDE_FRAMES,
        });
        opacity = interpolate(fp, [0, 1], [1, 0]);
      }
    } else if (dist === 1) {
      const fadeStart = (i + 1) * STEP_FRAMES + SLIDE_FRAMES * 0.5;
      const fadeLocal = frame - fadeStart;
      if (fadeLocal > 0) {
        const fp = Math.min(fadeLocal / (STEP_FRAMES * 1.5), 1);
        opacity = interpolate(fp, [0, 1], [1, 0.35]);
      }
    }

    // ---- position: spiral center minus focus offset ----
    const posX =
      spiralCenters.length > i ? spiralCenters[i].x - focusX : 0;
    const posY =
      spiralCenters.length > i ? spiralCenters[i].y - focusY : 0;
    const w = measured ? dims[i].w : 0;

    const base: React.CSSProperties = {
      position: 'absolute',
      left: posX - w / 2,
      top: posY - fontSize / 2,
      whiteSpace: 'nowrap',
      fontSize,
      fontFamily,
      fontWeight,
      lineHeight: 1,
      transformOrigin: 'center center',
      willChange: 'transform, opacity',
    };

    // Post-settle glitch: after entrance completes, add sporadic jitter
    const postGlitch = modifier === 'glitch' && slideProgress > 0.95
      ? getGlitchWordJitter(frame, i)
      : undefined;
    const glitchOffset = postGlitch
      ? postGlitch.replace('translateX(', '').replace('px)', '')
      : '0';

    const chunkStyle: React.CSSProperties = {
      ...base,
      color,
      opacity,
      transform: `translateX(${slideX + Number(glitchOffset)}px) rotate(${chunkRotation}deg)`,
    };

    if (modifierFn) {
      layers.push(
        <React.Fragment key={`chunk-${i}`}>
          {modifierFn({
            children: chunks[i],
            progress: slideProgress,
            baseStyle: chunkStyle,
            keyPrefix: `chunk-${i}`,
            intensity: 3.5,
          })}
        </React.Fragment>,
      );
    } else {
      layers.push(
        <span key={`w-${i}`} style={chunkStyle}>
          {chunks[i]}
        </span>,
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      {/* Hidden measurement spans */}
      {chunks.map((chunk, i) => (
        <span
          key={`m-${i}`}
          ref={(el) => {
            if (el) measureRefs.current.set(i, el);
          }}
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
          {chunk}
        </span>
      ))}

      {measured && spiralCenters.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform:
              `translate(${viewportW / 2}px, ${viewportH / 2}px) ` +
              `rotate(${containerRotation}deg)`,
          }}
        >
          {layers}
        </div>
      )}
    </div>
  );
};

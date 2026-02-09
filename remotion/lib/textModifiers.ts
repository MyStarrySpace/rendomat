/**
 * Text Visual Modifiers
 *
 * Composable visual effects that can be applied on top of any text animation.
 * Each modifier wraps rendered text content with additional visual layers.
 *
 * === MODIFIER CONTRACT ===
 *
 * `progress` (0→1): The animation TIMELINE, not opacity. This is the spring
 *   progress that drives modifier visual effects over time (chromatic offset
 *   converging, blur clearing, glow peaking, glitch settling). For snap mode
 *   this is still the underlying spring value, even though opacity is binary.
 *
 * `baseStyle.opacity`: Controls the character's VISIBILITY. Modifiers MUST
 *   propagate this opacity to ALL rendered layers — including overlay layers
 *   in inline mode. Characters with opacity 0 should not be called through
 *   modifiers at all (callers should gate on visibility).
 *
 * Multi-layer modifiers (chromatic, glitch) detect `position: 'absolute'`
 * in baseStyle to choose between sibling spans (absolute) or a relative
 * container with absolute overlays (inline).
 */

import React from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type TextModifierType = 'chromatic' | 'blur-in' | 'glow' | 'glitch';

export interface TextModifierContext {
  /** The text content (string or ReactNode) to render */
  children: React.ReactNode;
  /** Animation timeline progress 0→1 (NOT opacity — use baseStyle.opacity for visibility) */
  progress: number;
  /** Base CSS styles already computed by the animation (includes opacity for visibility) */
  baseStyle: React.CSSProperties;
  /** Unique key prefix for generated elements */
  keyPrefix: string;
  /** Intensity multiplier (default 1.0). >1 = stronger effect, <1 = subtler */
  intensity?: number;
}

export type TextModifierRenderFn = (ctx: TextModifierContext) => React.ReactNode;

// =============================================================================
// HELPERS
// =============================================================================

/** Prepend a translateX to an existing CSS transform string */
function addTranslateX(existingTransform: string | undefined, dx: number): string {
  const tx = `translateX(${dx}px)`;
  if (!existingTransform || existingTransform === 'none') return tx;
  return `${tx} ${existingTransform}`;
}

// =============================================================================
// MODIFIER IMPLEMENTATIONS
// =============================================================================

/**
 * Chromatic aberration — 3 layers (red left, blue right, white center).
 * Offset converges from 24px→0 as progress increases.
 */
const chromaticModifier: TextModifierRenderFn = ({ children, progress, baseStyle, keyPrefix, intensity = 1 }) => {
  const offset = 10 * intensity * (1 - progress);
  const isAbsolute = baseStyle.position === 'absolute';
  const baseOpacity = baseStyle.opacity;

  const redStyle: React.CSSProperties = {
    ...baseStyle,
    color: 'rgba(255, 60, 60, 0.5)',
    mixBlendMode: 'screen' as const,
    transform: addTranslateX(baseStyle.transform as string | undefined, -offset),
  };

  const blueStyle: React.CSSProperties = {
    ...baseStyle,
    color: 'rgba(60, 120, 255, 0.5)',
    mixBlendMode: 'screen' as const,
    transform: addTranslateX(baseStyle.transform as string | undefined, offset),
  };

  const centerStyle: React.CSSProperties = {
    ...baseStyle,
  };

  if (isAbsolute) {
    return React.createElement(React.Fragment, null,
      React.createElement('span', { key: `${keyPrefix}-r`, style: redStyle }, children),
      React.createElement('span', { key: `${keyPrefix}-b`, style: blueStyle }, children),
      React.createElement('span', { key: `${keyPrefix}-c`, style: centerStyle }, children),
    );
  }

  // Inline: wrap in relative container with absolute overlays
  const containerStyle: React.CSSProperties = {
    position: 'relative' as const,
    display: 'inline-block',
  };

  const overlayBase: React.CSSProperties = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: baseOpacity,
  };

  return React.createElement('span', { style: containerStyle },
    React.createElement('span', {
      key: `${keyPrefix}-r`,
      style: { ...overlayBase, color: 'rgba(255, 60, 60, 0.5)', mixBlendMode: 'screen' as const, transform: `translateX(${-offset}px)` },
    }, children),
    React.createElement('span', {
      key: `${keyPrefix}-b`,
      style: { ...overlayBase, color: 'rgba(60, 120, 255, 0.5)', mixBlendMode: 'screen' as const, transform: `translateX(${offset}px)` },
    }, children),
    React.createElement('span', {
      key: `${keyPrefix}-c`,
      style: { ...baseStyle, position: 'relative' as const },
    }, children),
  );
};

/**
 * Blur-in — text starts blurred and sharpens as progress→1.
 */
const blurInModifier: TextModifierRenderFn = ({ children, progress, baseStyle, keyPrefix, intensity = 1 }) => {
  const blur = 6 * intensity * (1 - progress);
  const style: React.CSSProperties = {
    ...baseStyle,
    filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
  };

  return React.createElement('span', { key: `${keyPrefix}-blur`, style }, children);
};

/**
 * Glow — luminous text shadow that intensifies 0→0.5 then fades 0.5→1.
 */
const glowModifier: TextModifierRenderFn = ({ children, progress, baseStyle, keyPrefix, intensity = 1 }) => {
  // Glow envelope peaks at progress=0.5, fades by progress=1
  const envelope = progress < 0.5
    ? progress * 2        // 0→1 over first half
    : 2 * (1 - progress); // 1→0 over second half

  const glowRadius = 10 * intensity * envelope;
  const glowAlpha = 0.6 * Math.min(intensity, 2) * envelope;

  const style: React.CSSProperties = {
    ...baseStyle,
    textShadow: glowRadius > 0.5
      ? `0 0 ${glowRadius}px rgba(255, 255, 255, ${glowAlpha}), 0 0 ${glowRadius * 2}px rgba(200, 220, 255, ${glowAlpha * 0.5})`
      : undefined,
  };

  return React.createElement('span', { key: `${keyPrefix}-glow`, style }, children);
};

/**
 * Extract a numeric seed from a keyPrefix like "char-5" or "chunk-2"
 */
function seedFromKey(keyPrefix: string): number {
  const match = keyPrefix.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Deterministic snap hash — returns a value that holds for `hold` steps
 * then snaps to a new value. Each seed produces an independent sequence.
 * Range: roughly -1 to 1.
 */
function snapHash(seed: number, progress: number, hold: number): number {
  const slot = Math.floor(progress * hold);
  return Math.sin(slot * 7919 + seed * 3571);
}

/**
 * Glitch — clip-path sliced layers with independent small offsets.
 *
 * Modeled after real CSS/AE glitch effects:
 * - 3 layers: red slice, cyan slice, main text (each clipped to a
 *   different horizontal band and shifted independently by 1-3px)
 * - Discrete snap states (holds then jumps, never smooth interpolation)
 * - Brief bursts: ~20% of time slots are active, rest is clean
 * - Each layer uses a different hash seed so they move asynchronously
 * - Small offsets (1-3px * intensity) — authentic digital corruption
 *
 * Uses deterministic sin hashing (no Math.random) for Remotion compat.
 */
const glitchModifier: TextModifierRenderFn = ({ children, progress, baseStyle, keyPrefix, intensity = 1 }) => {
  const isAbsolute = baseStyle.position === 'absolute';
  const baseOpacity = baseStyle.opacity;
  const seed = seedFromKey(keyPrefix);

  // --- Burst gating: only glitch in the post-entrance window, ~20% of slots ---
  const inWindow = progress > 0.15 && progress < 0.85;
  const burstSlot = Math.floor(progress * 20);
  const burstHash = Math.sin(burstSlot * 7919 + seed * 131);
  const inBurst = inWindow && Math.abs(burstHash) > 0.75;

  // When not in burst, render clean (just the main text)
  if (!inBurst) {
    if (isAbsolute) {
      return React.createElement('span', { key: `${keyPrefix}-gm`, style: baseStyle }, children);
    }
    return React.createElement('span', { key: `${keyPrefix}-gm`, style: baseStyle }, children);
  }

  // --- During burst: 3 independently-sliced, independently-shifted layers ---
  const maxOffset = 3 * intensity;

  // Each layer gets its own snap hash at different rates for async movement
  const offset1 = snapHash(seed + 10, progress, 30) * maxOffset;
  const offset2 = snapHash(seed + 20, progress, 25) * maxOffset;
  const offsetMain = snapHash(seed + 30, progress, 35) * maxOffset * 0.3;

  // Clip-path slices: divide into 3 horizontal bands with varying boundaries
  // Each slice boundary snaps independently
  const boundary1 = 25 + snapHash(seed + 40, progress, 22) * 15; // ~10-40%
  const boundary2 = 65 + snapHash(seed + 50, progress, 18) * 15; // ~50-80%

  // Layer 1: top slice (red)
  const slice1Clip = `inset(0% 0 ${100 - boundary1}% 0)`;
  // Layer 2: bottom slice (cyan)
  const slice2Clip = `inset(${boundary2}% 0 0% 0)`;
  // Main: full text with tiny offset

  const layer1Style: React.CSSProperties = {
    ...baseStyle,
    color: 'rgba(255, 40, 40, 0.8)',
    mixBlendMode: 'screen' as const,
    transform: addTranslateX(baseStyle.transform as string | undefined, offset1),
    clipPath: slice1Clip,
  };

  const layer2Style: React.CSSProperties = {
    ...baseStyle,
    color: 'rgba(40, 220, 255, 0.8)',
    mixBlendMode: 'screen' as const,
    transform: addTranslateX(baseStyle.transform as string | undefined, offset2),
    clipPath: slice2Clip,
  };

  const mainStyle: React.CSSProperties = {
    ...baseStyle,
    transform: addTranslateX(baseStyle.transform as string | undefined, offsetMain),
  };

  if (isAbsolute) {
    return React.createElement(React.Fragment, null,
      React.createElement('span', { key: `${keyPrefix}-g1`, style: layer1Style }, children),
      React.createElement('span', { key: `${keyPrefix}-g2`, style: layer2Style }, children),
      React.createElement('span', { key: `${keyPrefix}-gm`, style: mainStyle }, children),
    );
  }

  // Inline: relative container with absolute color overlays
  const containerStyle: React.CSSProperties = {
    position: 'relative' as const,
    display: 'inline-block',
  };

  const overlayBase: React.CSSProperties = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: baseOpacity,
  };

  return React.createElement('span', { style: containerStyle },
    React.createElement('span', {
      key: `${keyPrefix}-g1`,
      style: { ...overlayBase, color: 'rgba(255, 40, 40, 0.8)', mixBlendMode: 'screen' as const, transform: `translateX(${offset1}px)`, clipPath: slice1Clip },
    }, children),
    React.createElement('span', {
      key: `${keyPrefix}-g2`,
      style: { ...overlayBase, color: 'rgba(40, 220, 255, 0.8)', mixBlendMode: 'screen' as const, transform: `translateX(${offset2}px)`, clipPath: slice2Clip },
    }, children),
    React.createElement('span', {
      key: `${keyPrefix}-gm`,
      style: { ...baseStyle, position: 'relative' as const, transform: `translateX(${offsetMain}px)` },
    }, children),
  );
};

// =============================================================================
// WORD-LEVEL GLITCH JITTER
// =============================================================================

/**
 * Computes an occasional horizontal jitter transform for a word wrapper.
 * Returns a CSS transform string or undefined (no jitter this frame).
 * Uses frame + wordIndex for deterministic per-word variation.
 */
export function getGlitchWordJitter(frame: number, wordIndex: number): string | undefined {
  // Quantize into 3-frame blocks (holds ~100ms at 30fps then snaps)
  const block = Math.floor(frame / 3);
  // Only jitter ~6% of blocks for rare, brief disruptions
  const hash = Math.sin(block * 7919 + wordIndex * 131);
  if (Math.abs(hash) < 0.94) return undefined;
  // Small offset: 1-2px, authentic digital corruption
  const offset = Math.sin(block * 3571 + wordIndex * 53) * 2;
  return `translateX(${offset}px)`;
}

// =============================================================================
// REGISTRY
// =============================================================================

export const TEXT_MODIFIERS: Record<TextModifierType, TextModifierRenderFn> = {
  chromatic: chromaticModifier,
  'blur-in': blurInModifier,
  glow: glowModifier,
  glitch: glitchModifier,
};

export const MODIFIER_LABELS: Record<TextModifierType, string> = {
  chromatic: 'Chromatic Aberration',
  'blur-in': 'Blur In',
  glow: 'Glow',
  glitch: 'Glitch',
};

export function getTextModifier(type: TextModifierType): TextModifierRenderFn {
  return TEXT_MODIFIERS[type];
}

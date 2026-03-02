/**
 * Text Layout Presets System
 *
 * Controls where text sits on screen — independent from animation presets.
 * Any layout composes with any animation. Layout = pure CSS positioning.
 */

import type { CSSProperties } from 'react';
import type { AspectRatioKey } from '../aspect-ratios';

// =============================================================================
// TYPES
// =============================================================================

export type TextLayoutPreset =
  | 'centered'
  | 'bottom-left'
  | 'lower-third'
  | 'split'
  | 'top-right'
  | 'full-bleed'
  | 'stacked'
  | 'offset'
  | 'diagonal';

export interface TextLayoutConfig {
  /** Styles for the AbsoluteFill container */
  container: CSSProperties;
  /** Styles for the inner content wrapper */
  content: CSSProperties;
  /** Styles for the title element */
  title: CSSProperties;
  /** Styles for the body/quote element */
  body: CSSProperties;
  /** Multiplier on layout.titleFontSize */
  titleScale?: number;
  /** Multiplier on layout.bodyFontSize */
  bodyScale?: number;
  /** Override layout.maxWidth */
  maxWidth?: number | string;
  /** px offset per title line (diagonal only) */
  diagonalLineOffset?: number;
}

// =============================================================================
// LAYOUT DEFINITIONS
// =============================================================================

const TEXT_LAYOUTS: Record<TextLayoutPreset, (ar: AspectRatioKey) => TextLayoutConfig> = {
  centered: () => ({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      textAlign: 'center',
    },
    title: {},
    body: {},
  }),

  'bottom-left': (ar) => ({
    container: {
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
    },
    content: {
      textAlign: 'left',
    },
    title: {},
    body: {},
    maxWidth: ar === '16:9' ? 900 : ar === '1:1' ? 800 : undefined,
  }),

  'lower-third': (ar) => ({
    container: {
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      paddingBottom: ar === '9:16' ? 120 : 60,
    },
    content: {
      textAlign: 'left',
    },
    title: {},
    body: {},
    titleScale: 0.7,
    bodyScale: 0.85,
    maxWidth: ar === '9:16' ? '90%' : ar === '1:1' ? '85%' : '60%',
  }),

  split: (ar) => {
    // Portrait is too narrow for side-by-side — degrade to vertical stack
    if (ar === '9:16') {
      return {
        container: {
          justifyContent: 'center',
          alignItems: 'flex-start',
        },
        content: {
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 30,
        },
        title: {},
        body: {},
      };
    }
    return {
      container: {
        justifyContent: 'center',
        alignItems: 'center',
      },
      content: {
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: ar === '1:1' ? 40 : 60,
      },
      title: {
        flex: '0 0 55%',
      },
      body: {
        flex: '0 0 40%',
      },
      maxWidth: ar === '1:1' ? '95%' : '90%',
    };
  },

  'top-right': (ar) => ({
    container: {
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
    },
    content: {
      textAlign: 'right',
    },
    title: {},
    body: {},
    maxWidth: ar === '16:9' ? 900 : ar === '1:1' ? 800 : undefined,
  }),

  'full-bleed': (ar) => ({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      textAlign: 'center',
      position: 'relative',
    },
    title: {},
    body: {
      position: 'absolute',
      bottom: ar === '9:16' ? -120 : -80,
      right: 0,
      textAlign: 'right',
      maxWidth: ar === '16:9' ? 400 : 300,
    },
    titleScale: ar === '9:16' ? 1.4 : 2.0,
    bodyScale: 0.8,
    maxWidth: '95%',
  }),

  stacked: (ar) => ({
    container: {
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
    },
    content: {
      textAlign: 'left',
    },
    title: {
      lineHeight: 0.95,
    },
    body: {
      marginTop: ar === '9:16' ? 16 : 24,
    },
    titleScale: 1.3,
    maxWidth: '100%',
  }),

  offset: (ar) => ({
    container: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingTop: ar === '9:16' ? 200 : ar === '1:1' ? 160 : 140,
    },
    content: {
      textAlign: 'left',
    },
    title: {},
    body: {
      paddingLeft: ar === '9:16' ? 20 : 40,
    },
    maxWidth: ar === '16:9' ? '55%' : ar === '1:1' ? '70%' : '85%',
  }),

  diagonal: (ar) => ({
    container: {
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    content: {
      textAlign: 'left',
    },
    title: {},
    body: {
      paddingLeft: ar === '9:16' ? 60 : ar === '1:1' ? 100 : 140,
    },
    titleScale: 1.1,
    diagonalLineOffset: ar === '9:16' ? 30 : ar === '1:1' ? 50 : 70,
    maxWidth: '90%',
  }),
};

// =============================================================================
// HELPERS
// =============================================================================

export function getTextLayout(
  preset: TextLayoutPreset | undefined,
  aspectRatio: AspectRatioKey,
): TextLayoutConfig {
  const key = preset ?? 'centered';
  const resolver = TEXT_LAYOUTS[key] ?? TEXT_LAYOUTS.centered;
  return resolver(aspectRatio);
}

// =============================================================================
// UI LABELS & DESCRIPTIONS
// =============================================================================

export const LAYOUT_LABELS: Record<TextLayoutPreset, string> = {
  centered: 'Centered',
  'bottom-left': 'Bottom Left',
  'lower-third': 'Lower Third',
  split: 'Split',
  'top-right': 'Top Right',
  'full-bleed': 'Full Bleed',
  stacked: 'Stacked',
  offset: 'Offset',
  diagonal: 'Diagonal',
};

export const LAYOUT_DESCRIPTIONS: Record<TextLayoutPreset, string> = {
  centered: 'Classic centered text',
  'bottom-left': 'Editorial magazine anchored bottom-left',
  'lower-third': 'Broadcast-style bottom strip',
  split: 'Title and body side by side',
  'top-right': 'Unexpected top-right float',
  'full-bleed': 'Oversized title, body in corner',
  stacked: 'Brutalist poster with tight leading',
  offset: 'Rule-of-thirds composition',
  diagonal: 'Progressive line offset staircase',
};

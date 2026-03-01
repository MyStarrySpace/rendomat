import { Theme } from '../themes';

export interface AnimationParams {
  speed?: number;        // Multiplier (default 1.0). Affects all motion speeds.
  colorOverride?: string; // Hex color to use instead of theme accent
  blur?: number;         // Glow/blur stdDeviation multiplier (default 1.0)
  opacity?: number;      // Master opacity multiplier (default 1.0)
  scale?: number;        // Element size multiplier (default 1.0)
  density?: number;      // Element count multiplier (default 1.0)
  entranceDuration?: number; // Fade-in frames (default 20)
  // Background continuity
  timeOffset?: number;       // Frame offset for background continuity (default 0)
  // Focus zoom
  focusZoom?: number;        // Target scale for focus zoom (1.0 = none, 1.5 = 50% zoom)
  focusCenterX?: number;     // Zoom origin X, 0-1 (default 0.5)
  focusCenterY?: number;     // Zoom origin Y, 0-1 (default 0.5)
  // Attenuated drift
  driftDirection?: 'up' | 'down' | 'left' | 'right' | 'none';
  driftAmount?: number;      // Pixels to drift over scene duration (default 0)
}

export const DEFAULT_ANIMATION_PARAMS: Required<AnimationParams> = {
  speed: 1,
  colorOverride: '',
  blur: 1,
  opacity: 1,
  scale: 1,
  density: 1,
  entranceDuration: 20,
  timeOffset: 0,
  focusZoom: 1,
  focusCenterX: 0.5,
  focusCenterY: 0.5,
  driftDirection: 'none',
  driftAmount: 0,
};

export function resolveParams(params?: AnimationParams): Required<AnimationParams> {
  return { ...DEFAULT_ANIMATION_PARAMS, ...params };
}

export type AnimationStyleId =
  | 'none'
  | 'particles'
  | 'floating-shapes'
  | 'waves'
  | 'grid-pulse'
  | 'bokeh'
  | 'geometric'
  | 'matrix'
  | 'aurora'
  | 'confetti';

export interface AnimationStyle {
  id: AnimationStyleId;
  name: string;
  description: string;
  category: 'subtle' | 'dynamic' | 'playful' | 'tech';
}

export interface AnimationProps {
  durationInFrames: number;
  theme: Theme;
  intensity?: 'low' | 'medium' | 'high';
  params?: AnimationParams;
}

export const ANIMATION_STYLES: Record<AnimationStyleId, AnimationStyle> = {
  'none': {
    id: 'none',
    name: 'None',
    description: 'No background animation',
    category: 'subtle',
  },
  'particles': {
    id: 'particles',
    name: 'Particles',
    description: 'Floating particles that drift upward',
    category: 'subtle',
  },
  'floating-shapes': {
    id: 'floating-shapes',
    name: 'Floating Shapes',
    description: 'Soft geometric shapes floating in the background',
    category: 'subtle',
  },
  'waves': {
    id: 'waves',
    name: 'Waves',
    description: 'Smooth wave patterns that flow across the screen',
    category: 'subtle',
  },
  'grid-pulse': {
    id: 'grid-pulse',
    name: 'Grid Pulse',
    description: 'Pulsing grid lines with tech aesthetic',
    category: 'tech',
  },
  'bokeh': {
    id: 'bokeh',
    name: 'Bokeh',
    description: 'Soft glowing circles like out-of-focus lights',
    category: 'subtle',
  },
  'geometric': {
    id: 'geometric',
    name: 'Geometric',
    description: 'Rotating geometric patterns',
    category: 'dynamic',
  },
  'matrix': {
    id: 'matrix',
    name: 'Matrix',
    description: 'Digital rain effect with falling characters',
    category: 'tech',
  },
  'aurora': {
    id: 'aurora',
    name: 'Aurora',
    description: 'Smooth flowing gradient waves',
    category: 'subtle',
  },
  'confetti': {
    id: 'confetti',
    name: 'Confetti',
    description: 'Celebratory falling confetti',
    category: 'playful',
  },
};

export function getAnimationsByCategory(category: AnimationStyle['category']): AnimationStyle[] {
  return Object.values(ANIMATION_STYLES).filter(style => style.category === category);
}

export function getAllAnimationStyles(): AnimationStyle[] {
  return Object.values(ANIMATION_STYLES);
}

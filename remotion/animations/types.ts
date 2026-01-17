import { Theme } from '../themes';

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

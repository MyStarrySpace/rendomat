import { Theme } from '../themes';
import { AnimationStyleId, AnimationParams } from '../animations/types';

export interface SpotlightPoint {
  id: string;
  x: number;            // 0-1 normalized position on image
  y: number;            // 0-1 normalized position on image
  zoom: number;         // zoom level (1.5-4x, default 2.5)
  title?: string;
  description?: string;
  image_url?: string;   // optional small image shown at the point
  badge?: string;       // optional badge text (e.g. "1", "A")
}

export interface SceneData {
  title?: string;
  body_text?: string;
  style?: string;
  image_url?: string;
  image_url_2?: string;
  image_url_3?: string;
  image_url_4?: string;
  quote?: string;
  author?: string;
  stats_text?: string;
  chart_data?: string;
  // Equation scene data
  equation?: string; // LaTeX equation string
  equations?: string[]; // Multiple equations for step-by-step
  equation_description?: string; // Description of what the equation represents
  // Spotlights scene data
  spotlights?: SpotlightPoint[];
  spotlight_image_url?: string; // The base/background image
  // Animation settings
  animation_style?: AnimationStyleId;
  animation_intensity?: 'low' | 'medium' | 'high';
  animation_params?: AnimationParams;
  [key: string]: any;
}

export interface SceneProps {
  data: SceneData;
  durationInFrames: number;
  theme: Theme;
  /** Skip fade-out effect (when using external transitions) */
  skipFadeOut?: boolean;
}

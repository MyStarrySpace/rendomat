import { Theme } from '../themes';
import { AnimationStyleId } from '../animations/types';

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
  // Animation settings
  animation_style?: AnimationStyleId;
  animation_intensity?: 'low' | 'medium' | 'high';
  [key: string]: any;
}

export interface SceneProps {
  data: SceneData;
  durationInFrames: number;
  theme: Theme;
}

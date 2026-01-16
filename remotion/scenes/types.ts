import { Theme } from '../themes';

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
  [key: string]: any;
}

export interface SceneProps {
  data: SceneData;
  durationInFrames: number;
  theme: Theme;
}

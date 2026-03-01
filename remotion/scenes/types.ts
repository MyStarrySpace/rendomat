import { Theme } from '../themes';
import { AnimationStyleId, AnimationParams } from '../animations/types';
import type { TextLayoutPreset } from '../lib/textLayouts';

export type SpotlightMarkerType = 'marker' | 'circle' | 'rectangle' | 'x-circle' | 'alert' | 'question';

export interface SpotlightPoint {
  id: string;
  x: number;            // 0-1 normalized position on image
  y: number;            // 0-1 normalized position on image
  zoom: number;         // zoom level (1.5-4x, default 2.5)
  title?: string;
  description?: string;
  image_url?: string;   // optional small image shown at the point
  badge?: string;       // optional badge text (e.g. "1", "A")
  markerType?: SpotlightMarkerType;
  markerWidth?: number;   // marker width in px (default 80)
  markerHeight?: number;  // marker height in px (defaults to markerWidth)
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
  // Spotlight style overrides
  spotlight_marker_color?: string;         // Marker stroke color (default: theme accent)
  spotlight_marker_opacity?: number;       // Marker opacity 0-1 (default: 1)
  spotlight_card_bg?: string;              // Card background color (default: theme surface)
  spotlight_card_bg_opacity?: number;      // Card background opacity 0-1 (default: 0.85)
  spotlight_card_border_color?: string;    // Card border color (default: theme accent)
  spotlight_card_border_opacity?: number;  // Card border opacity 0-1 (default: 1)
  spotlight_text_color?: string;           // Text color for title + description (default: theme text)
  spotlight_badge_color?: string;          // Badge background color (default: theme accent)
  spotlight_badge_text_color?: string;     // Badge text color (default: theme background)
  // Animation settings
  animation_style?: AnimationStyleId;
  animation_intensity?: 'low' | 'medium' | 'high';
  animation_params?: AnimationParams;
  animation_preset?: string;      // entrance animation (backward compat)
  animation_preset_in?: string;   // explicit entrance override
  animation_preset_out?: string;  // exit animation
  // Background continuity
  bg_group?: string;          // Group ID — scenes sharing this animate continuously
  bg_time_offset?: number;    // Auto-calculated frame offset within group
  // Focus zoom
  bg_focus_zoom?: number;     // 1.0 = normal, 2.0 = 2x zoom. Animates in over scene.
  bg_focus_center_x?: number; // 0-1, default 0.5
  bg_focus_center_y?: number; // 0-1, default 0.5
  // Text layout
  text_layout?: TextLayoutPreset;
  [key: string]: any;
}

export interface SceneProps {
  data: SceneData;
  durationInFrames: number;
  theme: Theme;
  /** Skip fade-out effect (when using external transitions) */
  skipFadeOut?: boolean;
}

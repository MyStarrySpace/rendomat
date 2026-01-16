// Theme system for VSL videos based on 2026 design trends

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    backgroundGradient?: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentSecondary?: string;
    surface: string;
    surfaceLight: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  effects: {
    glassmorphism?: boolean;
    gradientOverlay?: boolean;
    shadow?: string;
  };
}

export const THEMES: Record<string, Theme> = {
  'tech-dark': {
    id: 'tech-dark',
    name: 'Tech Dark',
    description: 'Modern dark mode with blue-green accents and glassmorphism',
    colors: {
      background: '#0A0A0A',
      backgroundGradient: 'linear-gradient(135deg, #0A0A0A 0%, #1A1F2E 100%)',
      textPrimary: '#FFFFFF',
      textSecondary: '#A0AEC0',
      accent: '#00D9A3', // Blue-green trend
      accentSecondary: '#00F5FF', // Neon cyan
      surface: 'rgba(255, 255, 255, 0.05)',
      surfaceLight: 'rgba(255, 255, 255, 0.1)',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    effects: {
      glassmorphism: true,
      shadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
    },
  },

  'artisanal-light': {
    id: 'artisanal-light',
    name: 'Artisanal Light',
    description: 'Warm, organic feel with natural tones',
    colors: {
      background: '#FAF9F6',
      backgroundGradient: 'linear-gradient(135deg, #FAF9F6 0%, #F5E6D3 100%)',
      textPrimary: '#2D2D2D',
      textSecondary: '#6B6B6B',
      accent: '#D4845F', // Terracotta
      accentSecondary: '#8B7355', // Warm brown
      surface: 'rgba(0, 0, 0, 0.03)',
      surfaceLight: 'rgba(0, 0, 0, 0.05)',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Source Sans Pro',
    },
    effects: {
      shadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    },
  },

  'clinical-light': {
    id: 'clinical-light',
    name: 'Clinical Light',
    description: 'Clean, professional medical/healthcare aesthetic',
    colors: {
      background: '#FFFFFF',
      backgroundGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0F4F8 100%)',
      textPrimary: '#1A202C',
      textSecondary: '#718096',
      accent: '#3182CE', // Medical blue
      accentSecondary: '#00B5D8', // Cyan
      surface: 'rgba(49, 130, 206, 0.05)',
      surfaceLight: 'rgba(49, 130, 206, 0.08)',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Open Sans',
    },
    effects: {
      shadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
  },

  'corporate-blue': {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional business aesthetic with navy and gold',
    colors: {
      background: '#0F1D3D',
      backgroundGradient: 'linear-gradient(135deg, #0F1D3D 0%, #1E3A5F 100%)',
      textPrimary: '#FFFFFF',
      textSecondary: '#CBD5E0',
      accent: '#F6AD55', // Gold
      accentSecondary: '#FBD38D', // Light gold
      surface: 'rgba(255, 255, 255, 0.06)',
      surfaceLight: 'rgba(255, 255, 255, 0.1)',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Inter',
    },
    effects: {
      shadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
    },
  },

  'minimal-mono': {
    id: 'minimal-mono',
    name: 'Minimal Monochrome',
    description: 'Ultra-clean black and white with subtle grays',
    colors: {
      background: '#FAFAFA',
      backgroundGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%)',
      textPrimary: '#000000',
      textSecondary: '#666666',
      accent: '#000000',
      accentSecondary: '#333333',
      surface: 'rgba(0, 0, 0, 0.02)',
      surfaceLight: 'rgba(0, 0, 0, 0.04)',
    },
    fonts: {
      heading: 'Poppins',
      body: 'Inter',
    },
    effects: {
      shadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
    },
  },

  'vibrant-gradient': {
    id: 'vibrant-gradient',
    name: 'Vibrant Gradient',
    description: 'Bold colors with cinematic fades and neon accents',
    colors: {
      background: '#1A1A2E',
      backgroundGradient: 'linear-gradient(135deg, #16213E 0%, #0F3460 50%, #533483 100%)',
      textPrimary: '#FFFFFF',
      textSecondary: '#E0E0E0',
      accent: '#FF00FF', // Neon magenta
      accentSecondary: '#00FFD1', // Neon cyan
      surface: 'rgba(255, 255, 255, 0.08)',
      surfaceLight: 'rgba(255, 255, 255, 0.12)',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Poppins',
    },
    effects: {
      glassmorphism: true,
      gradientOverlay: true,
      shadow: '0 8px 32px rgba(255, 0, 255, 0.2)',
    },
  },

  'ocean-blue-green': {
    id: 'ocean-blue-green',
    name: 'Ocean Blue-Green',
    description: '2026 trend: Natural mystery meets clean tech',
    colors: {
      background: '#0D1B2A',
      backgroundGradient: 'linear-gradient(135deg, #0D1B2A 0%, #1B263B 50%, #0F4C5C 100%)',
      textPrimary: '#FFFFFF',
      textSecondary: '#9FB4C7',
      accent: '#00D9A3', // Blue-green
      accentSecondary: '#5EEAD4', // Teal
      surface: 'rgba(0, 217, 163, 0.08)',
      surfaceLight: 'rgba(0, 217, 163, 0.12)',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    effects: {
      glassmorphism: true,
      shadow: '0 8px 32px rgba(0, 217, 163, 0.15)',
    },
  },
};

// Google Fonts options
export const GOOGLE_FONTS = [
  { id: 'inter', name: 'Inter', weight: '400,600,700,800', category: 'sans-serif' },
  { id: 'montserrat', name: 'Montserrat', weight: '400,600,700,800', category: 'sans-serif' },
  { id: 'poppins', name: 'Poppins', weight: '400,600,700,800', category: 'sans-serif' },
  { id: 'open-sans', name: 'Open Sans', weight: '400,600,700,800', category: 'sans-serif' },
  { id: 'source-sans-pro', name: 'Source Sans Pro', weight: '400,600,700,900', category: 'sans-serif' },
  { id: 'roboto', name: 'Roboto', weight: '400,500,700,900', category: 'sans-serif' },
  { id: 'lato', name: 'Lato', weight: '400,700,900', category: 'sans-serif' },
  { id: 'playfair-display', name: 'Playfair Display', weight: '400,600,700,800', category: 'serif' },
  { id: 'merriweather', name: 'Merriweather', weight: '400,700,900', category: 'serif' },
];

// Helper to get Google Fonts URL
export function getGoogleFontsUrl(fontIds: string[]): string {
  const fonts = GOOGLE_FONTS.filter(f => fontIds.includes(f.id));
  const fontParams = fonts.map(f => `${f.name.replace(/ /g, '+')}:wght@${f.weight}`).join('&family=');
  return `https://fonts.googleapis.com/css2?family=${fontParams}&display=swap`;
}

// Get theme by ID with fallback
export function getTheme(themeId?: string): Theme {
  return THEMES[themeId || 'tech-dark'] || THEMES['tech-dark'];
}

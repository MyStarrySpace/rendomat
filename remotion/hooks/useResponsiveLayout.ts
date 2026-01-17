import { useVideoConfig } from 'remotion';
import { getAspectRatioFromDimensions, type AspectRatioKey } from '../aspect-ratios';

export interface ResponsiveLayout {
  // Aspect ratio info
  aspectRatio: AspectRatioKey;
  isVertical: boolean;
  isSquare: boolean;
  isLandscape: boolean;

  // Spacing
  padding: number;
  gap: number;

  // Typography
  titleFontSize: number;
  bodyFontSize: number;
  statValueFontSize: number;
  statLabelFontSize: number;
  quoteFontSize: number;

  // Dimensions
  maxWidth: number;
  imageHeight: string;

  // Layout hints
  stackDirection: 'row' | 'column';
  gridColumns: number;
}

// Base values for 16:9 (1920x1080)
const BASE_LAYOUT = {
  padding: 80,
  gap: 40,
  titleFontSize: 72,
  bodyFontSize: 36,
  statValueFontSize: 96,
  statLabelFontSize: 28,
  quoteFontSize: 48,
  maxWidth: 1000,
  imageHeight: '80%',
  gridColumns: 2,
};

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useVideoConfig();
  const aspectRatio = getAspectRatioFromDimensions(width, height);

  const isVertical = aspectRatio === '9:16';
  const isSquare = aspectRatio === '1:1';
  const isLandscape = aspectRatio === '16:9';

  // Calculate scale factor based on dimensions
  // We use width as the primary scaling factor
  const scaleFactor = width / 1920;

  // Layout adjustments based on aspect ratio
  let layout: ResponsiveLayout;

  if (isVertical) {
    // 9:16 (1080x1920) - Vertical/Portrait mode
    layout = {
      aspectRatio,
      isVertical,
      isSquare,
      isLandscape,
      padding: 60,
      gap: 30,
      titleFontSize: 64,
      bodyFontSize: 32,
      statValueFontSize: 80,
      statLabelFontSize: 24,
      quoteFontSize: 40,
      maxWidth: width - 120, // Full width minus padding
      imageHeight: '45%',
      stackDirection: 'column',
      gridColumns: 1, // Stack vertically in portrait
    };
  } else if (isSquare) {
    // 1:1 (1080x1080) - Square mode
    layout = {
      aspectRatio,
      isVertical,
      isSquare,
      isLandscape,
      padding: 60,
      gap: 30,
      titleFontSize: 56,
      bodyFontSize: 28,
      statValueFontSize: 72,
      statLabelFontSize: 22,
      quoteFontSize: 36,
      maxWidth: width - 120,
      imageHeight: '70%',
      stackDirection: 'row',
      gridColumns: 2,
    };
  } else {
    // 16:9 (1920x1080) - Landscape mode (default)
    layout = {
      aspectRatio,
      isVertical,
      isSquare,
      isLandscape,
      padding: Math.round(BASE_LAYOUT.padding * scaleFactor),
      gap: Math.round(BASE_LAYOUT.gap * scaleFactor),
      titleFontSize: Math.round(BASE_LAYOUT.titleFontSize * scaleFactor),
      bodyFontSize: Math.round(BASE_LAYOUT.bodyFontSize * scaleFactor),
      statValueFontSize: Math.round(BASE_LAYOUT.statValueFontSize * scaleFactor),
      statLabelFontSize: Math.round(BASE_LAYOUT.statLabelFontSize * scaleFactor),
      quoteFontSize: Math.round(BASE_LAYOUT.quoteFontSize * scaleFactor),
      maxWidth: Math.round(BASE_LAYOUT.maxWidth * scaleFactor),
      imageHeight: BASE_LAYOUT.imageHeight,
      stackDirection: 'row',
      gridColumns: BASE_LAYOUT.gridColumns,
    };
  }

  return layout;
}

// Helper function for getting chart-specific layout
export function useChartLayout() {
  const layout = useResponsiveLayout();

  return {
    ...layout,
    chartHeight: layout.isVertical ? '50%' : layout.isSquare ? '60%' : '70%',
    legendPosition: layout.isVertical ? 'bottom' : 'right',
    barWidth: layout.isVertical ? 40 : layout.isSquare ? 50 : 60,
    axisFontSize: layout.isVertical ? 14 : layout.isSquare ? 16 : 18,
  };
}

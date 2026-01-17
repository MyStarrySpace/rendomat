// Aspect ratio configuration for multi-platform export

export type AspectRatioKey = '16:9' | '1:1' | '9:16';

export interface AspectRatioConfig {
  width: number;
  height: number;
  platforms: string[];
  compositionSuffix: string;
}

export const ASPECT_RATIOS: Record<AspectRatioKey, AspectRatioConfig> = {
  '16:9': {
    width: 1920,
    height: 1080,
    platforms: ['YouTube', 'Website', 'LinkedIn Video'],
    compositionSuffix: '16x9',
  },
  '1:1': {
    width: 1080,
    height: 1080,
    platforms: ['Instagram Feed', 'LinkedIn Feed'],
    compositionSuffix: '1x1',
  },
  '9:16': {
    width: 1080,
    height: 1920,
    platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts'],
    compositionSuffix: '9x16',
  },
};

export function getAspectRatioFromDimensions(width: number, height: number): AspectRatioKey {
  const ratio = width / height;

  if (Math.abs(ratio - 16/9) < 0.01) return '16:9';
  if (Math.abs(ratio - 1) < 0.01) return '1:1';
  if (Math.abs(ratio - 9/16) < 0.01) return '9:16';

  // Default to 16:9 if unknown
  return '16:9';
}

export function getCompositionId(baseId: string, aspectRatio: AspectRatioKey): string {
  const config = ASPECT_RATIOS[aspectRatio];
  return `${baseId}-${config.compositionSuffix}`;
}

export function getDimensionsForAspectRatio(aspectRatio: AspectRatioKey): { width: number; height: number } {
  const config = ASPECT_RATIOS[aspectRatio];
  return { width: config.width, height: config.height };
}

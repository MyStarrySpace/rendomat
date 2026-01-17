// Platform configuration for multi-platform export

export const ASPECT_RATIOS = {
  '16:9': { width: 1920, height: 1080, compositionSuffix: '16x9' },
  '1:1':  { width: 1080, height: 1080, compositionSuffix: '1x1' },
  '9:16': { width: 1080, height: 1920, compositionSuffix: '9x16' },
};

export const PLATFORMS = {
  youtube: {
    id: 'youtube',
    name: 'YouTube / Website',
    aspectRatio: '16:9',
    bitrate: '12M',
    description: 'Standard landscape video for YouTube and websites',
  },
  instagram_feed: {
    id: 'instagram_feed',
    name: 'Instagram Feed',
    aspectRatio: '1:1',
    bitrate: '8M',
    description: 'Square video for Instagram feed posts',
  },
  instagram_reels: {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    aspectRatio: '9:16',
    bitrate: '10M',
    description: 'Vertical video for Instagram Reels',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    aspectRatio: '9:16',
    bitrate: '10M',
    description: 'Vertical video for TikTok',
  },
  linkedin_feed: {
    id: 'linkedin_feed',
    name: 'LinkedIn Feed',
    aspectRatio: '1:1',
    bitrate: '8M',
    description: 'Square video for LinkedIn feed',
  },
  linkedin_video: {
    id: 'linkedin_video',
    name: 'LinkedIn Video',
    aspectRatio: '16:9',
    bitrate: '12M',
    description: 'Landscape video for LinkedIn',
  },
  youtube_shorts: {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    aspectRatio: '9:16',
    bitrate: '10M',
    description: 'Vertical video for YouTube Shorts',
  },
};

export function getPlatformsByAspectRatio(aspectRatio) {
  return Object.values(PLATFORMS).filter(p => p.aspectRatio === aspectRatio);
}

export function groupPlatformsByAspectRatio(platformIds) {
  const grouped = {};

  for (const platformId of platformIds) {
    const platform = PLATFORMS[platformId];
    if (!platform) continue;

    const aspectRatio = platform.aspectRatio;
    if (!grouped[aspectRatio]) {
      grouped[aspectRatio] = [];
    }
    grouped[aspectRatio].push(platform);
  }

  return grouped;
}

export function getCompositionIdForAspectRatio(baseCompositionId, aspectRatio) {
  const config = ASPECT_RATIOS[aspectRatio];
  if (!config) return baseCompositionId;

  // For legacy DynamicScene, use the new aspect ratio compositions
  if (baseCompositionId === 'DynamicScene') {
    return `DynamicScene-${config.compositionSuffix}`;
  }

  // For other compositions, return as-is (they may not support multiple aspect ratios)
  return baseCompositionId;
}

export function getDimensionsForAspectRatio(aspectRatio) {
  const config = ASPECT_RATIOS[aspectRatio];
  return config ? { width: config.width, height: config.height } : { width: 1920, height: 1080 };
}

import { useCurrentFrame } from 'remotion';

/**
 * Helper function for fade in/out animations
 * Fades in during first 15 frames, fades out during last 15 frames
 */
export const useFadeAnimation = (durationInFrames: number) => {
  const frame = useCurrentFrame();
  const fadeInDuration = 15;
  const fadeOutStart = durationInFrames - 15;

  let opacity = 1;
  if (frame < fadeInDuration) {
    opacity = frame / fadeInDuration;
  } else if (frame > fadeOutStart) {
    opacity = 1 - ((frame - fadeOutStart) / 15);
  }

  return opacity;
};

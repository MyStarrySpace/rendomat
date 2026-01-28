/**
 * Smart scene duration calculation based on content
 * Returns duration in frames (30fps)
 */

const FPS = 30;
const WORDS_PER_SECOND = 1.5; // Reading speed optimized for video comprehension
const MIN_DURATION = 4; // Minimum 4 seconds
const MAX_DURATION = 25; // Maximum 25 seconds

export interface SlideData {
  scene_type?: string;
  data?: Record<string, any> | string;
}

export function calculateSceneDuration(slide: SlideData): number {
  const data = typeof slide.data === 'string' ? JSON.parse(slide.data) : (slide.data || {});
  const sceneType = slide.scene_type || 'text-only';
  const preset = data?.animation_preset || 'smooth';

  // Calculate text content length
  let totalWords = 0;
  const title = data?.title || '';
  const bodyText = data?.body_text || '';
  const quote = data?.quote || '';
  const statsText = data?.stats_text || '';

  totalWords += title.split(/\s+/).filter(Boolean).length;
  totalWords += bodyText.split(/\s+/).filter(Boolean).length;
  totalWords += quote.split(/\s+/).filter(Boolean).length;
  totalWords += statsText.split(/\s+/).filter(Boolean).length;

  // Base duration from text (minimum 3 seconds for reading)
  let textDuration = Math.max(3, totalWords / WORDS_PER_SECOND);

  // Scene type adjustments
  let typeDuration = 0;
  switch (sceneType) {
    case 'text-only':
      typeDuration = 0;
      break;
    case 'quote':
      typeDuration = 2;
      break;
    case 'single-image':
      typeDuration = 2;
      break;
    case 'dual-images':
      typeDuration = 3;
      break;
    case 'grid':
    case 'grid-2x2':
      typeDuration = 4;
      break;
    case 'stats':
      const statLines = statsText.split('\n').filter(Boolean).length;
      typeDuration = Math.max(2, statLines * 1.5);
      break;
    case 'bar-chart':
    case 'progress-bars':
      try {
        const chartData = data?.chart_data ? JSON.parse(data.chart_data) : null;
        const barCount = chartData?.labels?.length || chartData?.data?.length || 4;
        typeDuration = Math.max(3, barCount * 1);
      } catch {
        typeDuration = 4;
      }
      break;
    case 'equation':
      typeDuration = 3;
      break;
    default:
      typeDuration = 0;
  }

  // Animation preset adjustments
  let animationMultiplier = 1;
  switch (preset) {
    case 'lyric':
    case 'stacking':
    case 'cascade':
      animationMultiplier = 1.4;
      break;
    case 'burst':
      animationMultiplier = 1.3;
      break;
    case 'cinematic':
      animationMultiplier = 1.3;
      break;
    case 'typewriter':
      animationMultiplier = 1.2;
      break;
    case 'minimal':
    case 'smooth':
    default:
      animationMultiplier = 1;
  }

  // Calculate total duration
  let totalSeconds = (textDuration + typeDuration) * animationMultiplier;

  // Add entrance/exit animation time
  totalSeconds += 1.5;

  // Clamp between min and max
  totalSeconds = Math.max(MIN_DURATION, Math.min(MAX_DURATION, totalSeconds));

  // Round to nearest 0.5 second and convert to frames
  totalSeconds = Math.round(totalSeconds * 2) / 2;
  return Math.round(totalSeconds * FPS);
}

/**
 * Calculate smart durations for an array of slides
 */
export function calculateSceneDurations(slides: SlideData[]): number[] {
  return slides.map(slide => calculateSceneDuration(slide));
}

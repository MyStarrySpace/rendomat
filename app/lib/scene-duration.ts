/**
 * Smart scene duration calculation based on content
 * Returns duration in frames (30fps)
 */

const FPS = 30;
const WORDS_PER_SECOND = 2.5; // ~150 WPM — standard presentation speaking rate
const MIN_DURATION = 3; // Minimum 3 seconds
const MAX_DURATION = 20; // Maximum 20 seconds

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

  // Base duration from text (minimum 2 seconds for reading)
  let textDuration = Math.max(2, totalWords / WORDS_PER_SECOND);

  // Scene type adjustments
  let typeDuration = 0;
  switch (sceneType) {
    case 'text-only':
      typeDuration = 0;
      break;
    case 'quote':
      typeDuration = 1;
      break;
    case 'single-image':
      typeDuration = 1;
      break;
    case 'dual-images':
      typeDuration = 1.5;
      break;
    case 'grid':
    case 'grid-2x2':
      typeDuration = 2;
      break;
    case 'stats':
      const statLines = statsText.split('\n').filter(Boolean).length;
      typeDuration = Math.max(1, statLines * 1);
      break;
    case 'bar-chart':
    case 'progress-bars':
      try {
        const chartData = data?.chart_data ? JSON.parse(data.chart_data) : null;
        const barCount = chartData?.labels?.length || chartData?.data?.length || 4;
        typeDuration = Math.max(2, barCount * 0.7);
      } catch {
        typeDuration = 3;
      }
      break;
    case 'equation':
      typeDuration = 2;
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
  totalSeconds += 1;

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

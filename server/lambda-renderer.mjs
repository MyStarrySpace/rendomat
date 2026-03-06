import { renderMediaOnLambda, getRenderProgress } from '@remotion/lambda/client';
import { userDb, sceneDb, transitionDb, videoDb } from './database.mjs';

const FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME;
const SERVE_URL = process.env.REMOTION_SERVE_URL;
const REGION = process.env.REMOTION_AWS_REGION || 'us-east-1';

// Active cloud renders: videoId -> { renderId, userId }
const activeRenders = new Map();

export function isLambdaConfigured() {
  return !!(FUNCTION_NAME && SERVE_URL);
}

export async function renderOnLambda(videoId, userId, onProgress) {
  if (!isLambdaConfigured()) {
    throw new Error('Lambda rendering not configured');
  }

  const video = videoDb.getById(videoId);
  if (!video) throw new Error('Video not found');

  const scenes = sceneDb.getAllForVideo(videoId);
  const transitions = transitionDb.getAllForVideo(videoId);

  if (!scenes.length) throw new Error('No scenes to render');

  // Deduct credits: 1 per 10 seconds, minimum 1 per scene
  const creditCost = scenes.reduce((sum, s) => {
    const durationSeconds = (s.end_frame - s.start_frame) / 30;
    return sum + Math.max(1, Math.ceil(durationSeconds / 10));
  }, 0);
  userDb.adjustCredits(userId, -creditCost, 'render', { video_id: videoId });

  // Build input props for FullVideoComposition
  const sceneProps = scenes.map(scene => {
    const data = scene.data ? JSON.parse(scene.data) : {};
    return {
      sceneType: scene.scene_type || 'text-only',
      data,
      durationInFrames: scene.end_frame - scene.start_frame,
      themeId: video.theme_id || 'tech-dark',
    };
  });

  const transitionProps = transitions.map(t => ({
    fromSceneNumber: t.from_scene_number,
    toSceneNumber: t.to_scene_number,
    transitionType: t.transition_type || 'crossfade',
    durationFrames: t.duration_frames || 20,
    config: t.config ? JSON.parse(t.config) : undefined,
  }));

  // Calculate total duration accounting for transition overlaps
  let totalDuration = sceneProps.reduce((sum, s) => sum + s.durationInFrames, 0);
  for (const t of transitionProps) {
    totalDuration -= t.durationFrames;
  }
  totalDuration = Math.max(totalDuration, 1);

  const inputProps = {
    scenes: sceneProps,
    transitions: transitionProps,
    totalDurationInFrames: totalDuration,
    themeId: video.theme_id || 'tech-dark',
  };

  // Determine aspect ratio composition
  const aspectRatio = video.aspect_ratio || '16:9';
  const compositionId = `FullVideo-${aspectRatio.replace(':', 'x')}`;

  onProgress?.({ stage: 'starting', progress: 0 });

  const { renderId, bucketName } = await renderMediaOnLambda({
    region: REGION,
    functionName: FUNCTION_NAME,
    serveUrl: SERVE_URL,
    composition: compositionId,
    inputProps,
    codec: 'h264',
    imageFormat: 'jpeg',
    maxRetries: 1,
    framesPerLambda: 40,
  });

  activeRenders.set(videoId, { renderId, bucketName, userId });

  // Poll for progress
  let complete = false;
  while (!complete) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName: FUNCTION_NAME,
        region: REGION,
      });

      if (progress.fatalErrorEncountered) {
        activeRenders.delete(videoId);
        throw new Error(progress.errors?.[0]?.message || 'Lambda render failed');
      }

      if (progress.done) {
        complete = true;
        activeRenders.delete(videoId);

        // Update video record with S3 output URL
        const outputUrl = progress.outputFile;
        videoDb.update(videoId, {
          status: 'completed',
          output_path: outputUrl,
        });

        onProgress?.({
          stage: 'complete',
          progress: 100,
          outputUrl,
          outputSize: progress.outputSizeInBytes,
        });

        return { outputUrl, outputSize: progress.outputSizeInBytes };
      }

      const overallProgress = Math.round((progress.overallProgress || 0) * 100);
      onProgress?.({
        stage: 'rendering',
        progress: overallProgress,
        framesRendered: progress.framesRendered || 0,
        totalFrames: totalDuration,
        renderId,
      });
    } catch (err) {
      if (err.message === 'Lambda render failed') throw err;
      console.error('[lambda] Progress poll error:', err.message);
    }
  }
}

export function getActiveRender(videoId) {
  return activeRenders.get(videoId) || null;
}

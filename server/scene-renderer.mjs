import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import crypto from 'node:crypto';
import { fork } from 'node:child_process';
import { sceneDb } from './database.mjs';
import { getCompositionIdForAspectRatio, ASPECT_RATIOS } from './platform-config.mjs';

// Cache directory for rendered scenes
const CACHE_DIR = path.join(process.cwd(), 'cache', 'scenes');

// Ensure cache directory exists
async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

// Generate hash for scene data to detect changes
function generateSceneHash(sceneData) {
  const content = JSON.stringify(sceneData);
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// Render a single scene
// aspectRatio parameter is optional - defaults to '16:9' for backward compatibility
export async function renderScene(sceneId, serveUrl, compositionId, inputProps, onProgress, aspectRatio = '16:9') {
  await ensureCacheDir();

  const scene = sceneDb.getById(sceneId);
  if (!scene) {
    throw new Error(`Scene ${sceneId} not found`);
  }

  // Get the correct composition ID for the aspect ratio
  const actualCompositionId = getCompositionIdForAspectRatio(compositionId, aspectRatio);

  // Generate hash for this scene (include scene_type and aspectRatio so changes invalidate cache)
  const sceneHash = generateSceneHash({
    scene_number: scene.scene_number,
    scene_type: scene.scene_type,
    start_frame: scene.start_frame,
    end_frame: scene.end_frame,
    data: scene.data,
    inputProps,
    aspectRatio // Include aspect ratio in hash
  });

  // Cache key includes aspect ratio for separate caches per aspect ratio
  const cacheKey = `scene-${sceneId}-${aspectRatio.replace(':', 'x')}-${sceneHash}`;

  // Check if we have a valid cache for this specific aspect ratio
  const cachedPath = path.join(CACHE_DIR, `${cacheKey}.mp4`);
  try {
    await fs.access(cachedPath);
    console.log(`[scene-renderer] Using cached scene ${scene.scene_number} (${aspectRatio}): ${cachedPath}`);
    return cachedPath;
  } catch (err) {
    // Cache miss, need to render
  }

  // Need to render the scene
  console.log(`[scene-renderer] Rendering scene ${scene.scene_number}: ${scene.name} (${aspectRatio})`);

  const outputPath = cachedPath;
  const jobId = `scene-${sceneId}-${Date.now()}`;

  // Get browser executable path
  const browserExecutable = path.join(
    process.cwd(),
    'node_modules',
    '.remotion',
    'chrome-headless-shell',
    'win64',
    'chrome-headless-shell-win64',
    'chrome-headless-shell.exe'
  );

  // Parse scene data and prepare input props with scene type
  let sceneData;
  try {
    sceneData = scene.data ? JSON.parse(scene.data) : {};
  } catch (err) {
    console.error(`[scene-renderer] Failed to parse scene data for scene ${sceneId}:`, err);
    sceneData = {};
  }

  // Inject bg_time_offset if provided via inputProps (set by render-server pre-calc)
  if (inputProps?._bgTimeOffset !== undefined) {
    sceneData.bg_time_offset = inputProps._bgTimeOffset;
  }

  // Merge scene-specific props with input props
  const sceneInputProps = {
    ...inputProps,
    sceneType: scene.scene_type || 'text-only',
    data: sceneData,
    durationInFrames: scene.end_frame - scene.start_frame,
    // Animation settings from scene data
    animationStyle: sceneData.animation_style || 'none',
    animationIntensity: sceneData.animation_intensity || 'medium',
  };

  // Write scene-specific input props
  const inputJsonPath = path.join(os.tmpdir(), `scene-${sceneId}-${Date.now()}.json`);
  await fs.writeFile(inputJsonPath, JSON.stringify(sceneInputProps), 'utf8');

  // Render the scene using a worker process
  await new Promise((resolve, reject) => {
    const worker = fork(path.join(process.cwd(), 'server', 'render-worker.cjs'), [], {
      env: {
        ...process.env,
        JOB_ID: jobId,
        SERVE_URL: serveUrl,
        OUT_PATH: outputPath,
        INPUT_JSON: inputJsonPath,
        COMPOSITION_ID: actualCompositionId, // Use aspect-ratio-specific composition
        RENDER_DEBUG: 'true',
        BROWSER_EXECUTABLE: browserExecutable,
        // Scene-specific rendering
        START_FRAME: scene.start_frame.toString(),
        END_FRAME: scene.end_frame.toString(),
      },
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });

    worker.on('message', (msg) => {
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'progress' && onProgress) {
        onProgress(msg.progress || 0);
      }
      if (msg.type === 'done') {
        resolve();
      }
      if (msg.type === 'error') {
        reject(new Error(msg.error || 'Scene render failed'));
      }
    });

    worker.on('exit', (code) => {
      if (code === 0) return;
      reject(new Error(`Scene render worker exited with code ${code}`));
    });
  }).finally(async () => {
    await fs.unlink(inputJsonPath).catch(() => undefined);
  });

  // Only update scene cache for default aspect ratio (16:9) to maintain backward compatibility
  if (aspectRatio === '16:9') {
    sceneDb.updateCache(sceneId, outputPath, sceneHash);
  }

  console.log(`[scene-renderer] Scene ${scene.scene_number} (${aspectRatio}) rendered: ${outputPath}`);
  return outputPath;
}

// Stitch multiple scenes together into final video
export async function stitchScenes(scenePaths, outputPath) {
  console.log(`[scene-renderer] Stitching ${scenePaths.length} scenes into final video`);

  // Create a concat file for ffmpeg
  const concatFilePath = path.join(os.tmpdir(), `concat-${Date.now()}.txt`);
  const concatContent = scenePaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
  await fs.writeFile(concatFilePath, concatContent, 'utf8');

  // Use ffmpeg to concatenate videos
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync('ffmpeg', [
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFilePath,
    '-c', 'copy',
    outputPath
  ], { encoding: 'utf8' });

  await fs.unlink(concatFilePath).catch(() => undefined);

  if (result.status !== 0) {
    throw new Error(`FFmpeg concat failed: ${result.stderr}`);
  }

  console.log(`[scene-renderer] Final video stitched: ${outputPath}`);
  return outputPath;
}

// Mux audio clips into a stitched video
export async function muxAudio(videoPath, audioClips, outputPath) {
  const { spawnSync } = await import('node:child_process');

  if (!audioClips || audioClips.length === 0) {
    // No audio clips, just copy the file
    await fs.copyFile(videoPath, outputPath);
    return outputPath;
  }

  console.log(`[scene-renderer] Muxing ${audioClips.length} audio clip(s) into video`);

  // Build FFmpeg filter_complex for mixing audio clips
  // Input 0 = video file
  const inputs = ['-i', videoPath];
  const filterParts = [];

  for (let i = 0; i < audioClips.length; i++) {
    const clip = audioClips[i];
    inputs.push('-i', clip.file_path);

    const inputIdx = i + 1; // 0 is video
    const delayMs = Math.round((clip.start_frame / 30) * 1000);
    const trimStart = (clip.trim_start_frame || 0) / 30;
    const trimEnd = clip.trim_end_frame ? clip.trim_end_frame / 30 : (clip.source_duration_frames / 30);
    const volume = clip.volume ?? 1.0;

    // atrim -> adelay -> volume for each clip
    filterParts.push(
      `[${inputIdx}:a]atrim=start=${trimStart}:end=${trimEnd},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${volume}[a${i}]`
    );
  }

  // Mix all audio streams
  const mixInputs = audioClips.map((_, i) => `[a${i}]`).join('');
  filterParts.push(`${mixInputs}amix=inputs=${audioClips.length}:duration=first:dropout_transition=0[aout]`);

  const filterComplex = filterParts.join(';');

  const args = [
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-y',
    outputPath
  ];

  const result = spawnSync('ffmpeg', args, { encoding: 'utf8' });

  if (result.status !== 0) {
    console.error('[scene-renderer] muxAudio ffmpeg stderr:', result.stderr);
    throw new Error(`FFmpeg audio mux failed: ${result.stderr?.slice(-500)}`);
  }

  console.log(`[scene-renderer] Audio muxed: ${outputPath}`);
  return outputPath;
}

// Overlay video clips (B-roll) on top of a base video
export async function overlayVideoClips(videoPath, videoClips, outputPath) {
  const { spawnSync } = await import('node:child_process');

  if (!videoClips || videoClips.length === 0) {
    await fs.copyFile(videoPath, outputPath);
    return outputPath;
  }

  console.log(`[scene-renderer] Overlaying ${videoClips.length} video clip(s) onto video`);

  const inputs = ['-i', videoPath];
  const filterParts = [];
  const audioFilterParts = [];
  let hasClipAudio = false;

  for (let i = 0; i < videoClips.length; i++) {
    const clip = videoClips[i];
    const clipPath = clip.normalized_path || clip.file_path;
    inputs.push('-i', clipPath);

    const inputIdx = i + 1;
    const trimStartSec = (clip.trim_start_frame || 0) / 30;
    const trimEndSec = clip.trim_end_frame
      ? clip.trim_end_frame / 30
      : clip.source_duration_frames / 30;
    const startSec = clip.start_frame / 30;
    const endSec = startSec + (clip.duration_frames / 30);

    // Video: trim the clip, then overlay at the right time
    filterParts.push(
      `[${inputIdx}:v]trim=start=${trimStartSec}:end=${trimEndSec},setpts=PTS-STARTPTS[v${i}]`
    );

    // Audio from clip (if not muted)
    if (!clip.mute_audio) {
      const delayMs = Math.round(startSec * 1000);
      const volume = clip.volume ?? 1.0;
      audioFilterParts.push(
        `[${inputIdx}:a]atrim=start=${trimStartSec}:end=${trimEndSec},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${volume}[ca${i}]`
      );
      hasClipAudio = true;
    }
  }

  // Chain overlay filters
  let prevLabel = '0:v';
  for (let i = 0; i < videoClips.length; i++) {
    const clip = videoClips[i];
    const startSec = clip.start_frame / 30;
    const endSec = startSec + (clip.duration_frames / 30);
    const outLabel = i < videoClips.length - 1 ? `tmp${i}` : 'vout';

    filterParts.push(
      `[${prevLabel}][v${i}]overlay=0:0:enable='between(t,${startSec},${endSec})'[${outLabel}]`
    );
    prevLabel = outLabel;
  }

  // Build final filter complex
  let filterComplex = filterParts.join(';');
  const mapArgs = ['-map', '[vout]'];

  if (hasClipAudio) {
    // Mix clip audio with base audio
    filterComplex += ';' + audioFilterParts.join(';');
    const clipAudioLabels = audioFilterParts.map((_, i) => `[ca${i}]`).join('');
    // Mix base audio with clip audio
    filterComplex += `;[0:a]${clipAudioLabels}amix=inputs=${audioFilterParts.length + 1}:duration=first:dropout_transition=0[aout]`;
    mapArgs.push('-map', '[aout]');
  } else {
    // Keep base audio as-is
    mapArgs.push('-map', '0:a?');
  }

  const args = [
    ...inputs,
    '-filter_complex', filterComplex,
    ...mapArgs,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-y',
    outputPath
  ];

  const result = spawnSync('ffmpeg', args, { encoding: 'utf8' });

  if (result.status !== 0) {
    console.error('[scene-renderer] overlayVideoClips ffmpeg stderr:', result.stderr);
    throw new Error(`FFmpeg video overlay failed: ${result.stderr?.slice(-500)}`);
  }

  console.log(`[scene-renderer] Video clips overlaid: ${outputPath}`);
  return outputPath;
}

// Clean old cache files
export async function cleanCache(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  await ensureCacheDir();
  const files = await fs.readdir(CACHE_DIR);
  const now = Date.now();
  let cleaned = 0;

  for (const file of files) {
    const filePath = path.join(CACHE_DIR, file);
    const stats = await fs.stat(filePath);
    const age = now - stats.mtimeMs;

    if (age > maxAgeMs) {
      await fs.unlink(filePath);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[scene-renderer] Cleaned ${cleaned} old cache files`);
  }
}

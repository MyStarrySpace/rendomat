import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import crypto from 'node:crypto';
import { fork } from 'node:child_process';
import { sceneDb } from './database.mjs';

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
export async function renderScene(sceneId, serveUrl, compositionId, inputProps, onProgress) {
  await ensureCacheDir();

  const scene = sceneDb.getById(sceneId);
  if (!scene) {
    throw new Error(`Scene ${sceneId} not found`);
  }

  // Generate hash for this scene
  const sceneHash = generateSceneHash({
    scene_number: scene.scene_number,
    start_frame: scene.start_frame,
    end_frame: scene.end_frame,
    data: scene.data,
    inputProps
  });

  // Check if we have a valid cache
  if (scene.cache_path && scene.cache_hash === sceneHash) {
    try {
      await fs.access(scene.cache_path);
      console.log(`[scene-renderer] Using cached scene ${scene.scene_number}: ${scene.cache_path}`);
      return scene.cache_path;
    } catch (err) {
      console.log(`[scene-renderer] Cache file missing for scene ${scene.scene_number}, re-rendering`);
    }
  }

  // Need to render the scene
  console.log(`[scene-renderer] Rendering scene ${scene.scene_number}: ${scene.name}`);

  const outputPath = path.join(CACHE_DIR, `scene-${sceneId}-${sceneHash}.mp4`);
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

  // Write scene-specific input props
  const inputJsonPath = path.join(os.tmpdir(), `scene-${sceneId}-${Date.now()}.json`);
  await fs.writeFile(inputJsonPath, JSON.stringify(inputProps), 'utf8');

  // Render the scene using a worker process
  await new Promise((resolve, reject) => {
    const worker = fork(path.join(process.cwd(), 'server', 'render-worker.cjs'), [], {
      env: {
        ...process.env,
        JOB_ID: jobId,
        SERVE_URL: serveUrl,
        OUT_PATH: outputPath,
        INPUT_JSON: inputJsonPath,
        COMPOSITION_ID: compositionId,
        RENDER_DEBUG: 'false',
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

  // Update scene cache in database
  sceneDb.updateCache(sceneId, outputPath, sceneHash);

  console.log(`[scene-renderer] Scene ${scene.scene_number} rendered: ${outputPath}`);
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

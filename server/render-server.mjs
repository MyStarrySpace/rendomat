import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fork } from 'node:child_process';

import { bundle } from '@remotion/bundler';
import { clientDb, videoDb, sceneDb, transitionDb, audioClipDb, videoClipDb, userDb, creditTransactionDb } from './database.mjs';
import { authenticateToken, optionalAuth } from './auth-middleware.mjs';
import { createCheckoutSession, handleWebhookEvent, constructWebhookEvent, CREDIT_PACKAGES } from './stripe-service.mjs';
import { renderOnLambda, isLambdaConfigured } from './lambda-renderer.mjs';
import { renderScene, stitchScenes, muxAudio, overlayVideoClips, cleanCache } from './scene-renderer.mjs';
import { getAllTemplates, getTemplate, createScenesFromTemplate } from './templates.mjs';
import { generateSlidesFromDescription, generateChartData, generateEquation, improveSceneContent, searchTopicData, analyzeUrl } from './ai-service.mjs';
import { PLATFORMS, ASPECT_RATIOS, groupPlatformsByAspectRatio, getDimensionsForAspectRatio } from './platform-config.mjs';
import { searchPhotos, getPhoto, getCuratedPhotos } from './pexels-service.mjs';
import { getAllPersonas, getPersona, getPersonasGroupedByCategory } from './personas.mjs';
import { previewBlendedPrompt, getEffectivePersonas, validatePersonaIds } from './persona-blender.mjs';
import { performResearch, generateSlidesWithResearch, verifyClaim } from './research-service.mjs';
import { generateAEManifest, generateSelfContainedScript } from './ae-exporter.mjs';
import { parseDocument, parseMarkdownContent, parseDocxBuffer, generateVideoSeed } from './document-parser.mjs';
import archiver from 'archiver';

const PORT = Number(process.env.PORT || 4321);
const DEBUG = String(process.env.RENDER_DEBUG || '').toLowerCase() === 'true';
const ALLOWED_ORIGINS = (process.env.RENDER_ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const entryPoint = path.join(process.cwd(), 'remotion', 'index.ts');
const bundleLocation = path.join(process.cwd(), '.remotion-bundle-server');
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Ensure uploads directory exists
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create uploads directory:', error);
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

const audioUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|webm|ogg|m4a|aac|flac/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only audio files are allowed (mp3, wav, webm, ogg, m4a, aac, flac)'));
  }
});

const videoUpload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only video files are allowed (mp4, mov, avi, mkv, webm)'));
  }
});

// Get video metadata using ffprobe
function getVideoMetadata(filePath) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate,duration',
    '-show_entries', 'format=duration',
    '-of', 'json',
    filePath
  ], { encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(`ffprobe failed: ${result.stderr}`);
  }

  const data = JSON.parse(result.stdout);
  const stream = data.streams?.[0] || {};
  const format = data.format || {};

  // Parse frame rate (can be "30/1" format)
  let fps = 30;
  if (stream.r_frame_rate) {
    const parts = stream.r_frame_rate.split('/');
    fps = parts.length === 2 ? parseInt(parts[0]) / parseInt(parts[1]) : parseFloat(stream.r_frame_rate);
  }

  const durationSeconds = parseFloat(stream.duration || format.duration || '0');
  const durationFrames = Math.ceil(durationSeconds * 30); // normalize to 30fps

  return {
    width: parseInt(stream.width) || 0,
    height: parseInt(stream.height) || 0,
    fps,
    durationSeconds,
    durationFrames,
  };
}

// Normalize video clip to project resolution (1920x1080, 30fps, h264+aac)
function normalizeVideoClip(inputPath, outputPath) {
  const result = spawnSync('ffmpeg', [
    '-i', inputPath,
    '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1',
    '-r', '30',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-y',
    outputPath
  ], { encoding: 'utf8', timeout: 300000 });

  if (result.status !== 0) {
    throw new Error(`FFmpeg normalize failed: ${result.stderr?.slice(-500)}`);
  }
}

// Get audio duration in frames (at 30fps) using ffprobe
function getAudioDurationFrames(filePath) {
  const result = spawnSync('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath
  ], { encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(`ffprobe failed: ${result.stderr}`);
  }

  const durationSeconds = parseFloat(result.stdout.trim());
  return Math.ceil(durationSeconds * 30); // 30fps
}

let serveUrlPromise = null;
async function getServeUrl() {
  if (!serveUrlPromise) {
    const t0 = Date.now();
    // eslint-disable-next-line no-console
    console.log(`[render-server] bundling Remotion project… entry=${entryPoint}`);
    serveUrlPromise = bundle({
      entryPoint,
      outDir: bundleLocation,
    });
    await serveUrlPromise;
    // eslint-disable-next-line no-console
    console.log(`[render-server] bundle ready in ${Date.now() - t0}ms`);
  }
  return serveUrlPromise;
}

function invalidateBundle() {
  serveUrlPromise = null;
  console.log('[render-server] bundle cache invalidated — will re-bundle on next render');
}

function clampArray(arr, max) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, max);
}

function sanitizePayload(body) {
  // Expected shape matches `remotion/types.ts` (PolicyWrappedRenderProps).
  const displayName = typeof body?.displayName === 'string' ? body.displayName.slice(0, 80) : 'Your Key Issues';
  const label = typeof body?.label === 'string' ? body.label.slice(0, 80) : 'Consensus Seeker';
  const avgScore =
    typeof body?.avgScore === 'number' ? Math.max(0, Math.min(100, Math.round(body.avgScore))) : 0;
  const scoreLabel = typeof body?.scoreLabel === 'string' ? body.scoreLabel.slice(0, 40) : 'Avg score';
  const urlText = typeof body?.urlText === 'string' ? body.urlText.slice(0, 120) : undefined;

  const policies = clampArray(body?.policies, 10).map((p) => ({
    id: typeof p?.id === 'string' ? p.id.slice(0, 120) : '',
    title: typeof p?.title === 'string' ? p.title.slice(0, 120) : '',
    category: typeof p?.category === 'string' ? p.category.slice(0, 40) : 'other',
    averageSupport:
      typeof p?.averageSupport === 'number' ? Math.max(0, Math.min(100, Math.round(p.averageSupport))) : 0,
  })).filter((p) => p.id && p.title);

  return { displayName, label, avgScore, scoreLabel, policies, urlText };
}

const app = express();

// Stripe webhook MUST be before express.json() for signature verification
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  try {
    const event = constructWebhookEvent(req.body, sig);
    handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error('[stripe] Webhook error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

app.use(express.json({ limit: '2mb' }));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Basic request logging
app.use((req, _res, next) => {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(`[render-server] ${req.method} ${req.url}`);
  }
  next();
});

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes('*')) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed by CORS'));
    },
  })
);

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

function logBinary(name, args = ['-version']) {
  try {
    const r = spawnSync(name, args, { encoding: 'utf8' });
    if (r.status === 0) {
      const firstLine = String(r.stdout || r.stderr || '').split('\n')[0]?.trim();
      // eslint-disable-next-line no-console
      console.log(`[render-server] ${name} OK: ${firstLine || '(no output)'}`);
      return true;
    }
    // eslint-disable-next-line no-console
    console.log(`[render-server] ${name} NOT OK (status=${r.status}): ${(r.stderr || r.stdout || '').trim()}`);
    return false;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`[render-server] ${name} check failed: ${e instanceof Error ? e.message : 'unknown error'}`);
    return false;
  }
}

// -----------------------------
// Video Render Progress SSE System
// -----------------------------
const videoRenderSubscribers = new Map(); // videoId -> Set(res)
const videoRenderState = new Map(); // videoId -> render state

function getVideoRenderState(videoId) {
  return videoRenderState.get(videoId) ?? null;
}

function setVideoRenderState(videoId, state) {
  videoRenderState.set(videoId, { ...state, updatedAt: new Date().toISOString() });
  broadcastVideoRenderProgress(videoId, state);
}

function broadcastVideoRenderProgress(videoId, state) {
  const subs = videoRenderSubscribers.get(videoId);
  if (subs && subs.size) {
    const data = `event: progress\ndata: ${JSON.stringify(state)}\n\n`;
    for (const res of subs) {
      try {
        res.write(data);
        res.flush?.();
      } catch {
        // ignore closed connections
      }
    }
  }
}

function subscribeVideoRender(videoId, res) {
  const set = videoRenderSubscribers.get(videoId) ?? new Set();
  set.add(res);
  videoRenderSubscribers.set(videoId, set);
}

function unsubscribeVideoRender(videoId, res) {
  const set = videoRenderSubscribers.get(videoId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) videoRenderSubscribers.delete(videoId);
}

function cleanupVideoRenderState(videoId) {
  videoRenderState.delete(videoId);
  videoRenderSubscribers.delete(videoId);
}

// -----------------------------
// Job system (progress + SSE)
// -----------------------------
const JOB_TTL_MS = 10 * 60 * 1000;
const jobs = new Map(); // jobId -> {status, stage, progress, createdAt, updatedAt, error, filePath}
const jobSubscribers = new Map(); // jobId -> Set(res)

function nowIso() {
  return new Date().toISOString();
}

function getJob(jobId) {
  return jobs.get(jobId) ?? null;
}

function setJob(jobId, patch) {
  const cur = jobs.get(jobId) ?? {
    status: 'queued',
    stage: 'queued',
    progress: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    error: null,
    filePath: null,
  };
  const next = { ...cur, ...patch, updatedAt: nowIso() };
  jobs.set(jobId, next);

  const subs = jobSubscribers.get(jobId);
  if (subs && subs.size) {
    const data = `event: progress\ndata: ${JSON.stringify(next)}\n\n`;
    for (const res of subs) {
      try {
        res.write(data);
        res.flush?.();
      } catch {
        // ignore
      }
    }
  }
  return next;
}

function subscribe(jobId, res) {
  const set = jobSubscribers.get(jobId) ?? new Set();
  set.add(res);
  jobSubscribers.set(jobId, set);
}

function unsubscribe(jobId, res) {
  const set = jobSubscribers.get(jobId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) jobSubscribers.delete(jobId);
}

async function cleanupJob(jobId) {
  const job = getJob(jobId);
  if (!job) return;
  if (job.filePath) {
    await fs.unlink(job.filePath).catch(() => undefined);
  }
  jobs.delete(jobId);
  jobSubscribers.delete(jobId);
}

async function renderJob(jobId, inputProps) {
  const t0 = Date.now();
  try {
    setJob(jobId, { status: 'running', stage: 'bundling', progress: 0.02 });

    const serveUrl = await getServeUrl();
    setJob(jobId, { stage: 'starting', progress: 0.06 });
    if (DEBUG) logBinary('ffmpeg', ['-version']);

    const outPath = path.join(os.tmpdir(), `policy-wrapped-${jobId}.mp4`);
    // eslint-disable-next-line no-console
    console.log(`[render:${jobId}] start render → ${outPath}`);

    // Write inputProps to a temp JSON file for the worker
    const inputJsonPath = path.join(os.tmpdir(), `policy-wrapped-${jobId}.json`);
    await fs.writeFile(inputJsonPath, JSON.stringify(inputProps), 'utf8');

    setJob(jobId, { stage: 'starting-browser', progress: 0.08 });

    // If the ensured browser exists, pass it explicitly (Windows path).
    const browserExecutable = path.join(
      process.cwd(),
      'node_modules',
      '.remotion',
      'chrome-headless-shell',
      'win64',
      'chrome-headless-shell-win64',
      'chrome-headless-shell.exe'
    );

    // Run rendering in a separate process so the HTTP server stays responsive.
    await new Promise((resolve, reject) => {
      const worker = fork(path.join(process.cwd(), 'server', 'render-worker.cjs'), [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          SERVE_URL: serveUrl,
          OUT_PATH: outPath,
          INPUT_JSON: inputJsonPath,
          RENDER_DEBUG: process.env.RENDER_DEBUG,
          BROWSER_EXECUTABLE: browserExecutable,
        },
        stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      });

      worker.on('message', (msg) => {
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'progress') {
          setJob(jobId, { stage: msg.stage || 'rendering', progress: msg.progress ?? 0.08 });
        }
        if (msg.type === 'stage') {
          setJob(jobId, { stage: msg.stage || 'rendering' });
        }
        if (msg.type === 'log' && DEBUG) {
          // eslint-disable-next-line no-console
          console.log(`[render:${jobId}] ${msg.level || 'info'}: ${msg.message || ''}`);
        }
        if (msg.type === 'done') {
          resolve();
        }
        if (msg.type === 'error') {
          reject(new Error(msg.error || 'Render failed'));
        }
      });

      worker.on('exit', (code) => {
        if (code === 0) return;
        reject(new Error(`Render worker exited with code ${code}`));
      });
    }).finally(async () => {
      await fs.unlink(inputJsonPath).catch(() => undefined);
    });

    setJob(jobId, { stage: 'finalizing', progress: 0.98, filePath: outPath });
    setJob(jobId, { status: 'done', stage: 'done', progress: 1.0 });
    // eslint-disable-next-line no-console
    console.log(`[render:${jobId}] done in ${Date.now() - t0}ms`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    setJob(jobId, { status: 'error', stage: 'error', error: msg });
    // eslint-disable-next-line no-console
    console.log(`[render:${jobId}] error: ${msg}`);
  } finally {
    setTimeout(() => cleanupJob(jobId), JOB_TTL_MS).unref?.();
  }
}

app.post('/jobs/policy-wrapped-square', async (req, res) => {
  const inputProps = sanitizePayload(req.body);
  if (!inputProps.policies.length) {
    res.status(400).json({ error: 'No policies provided' });
    return;
  }

  const jobId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  setJob(jobId, { status: 'queued', stage: 'queued', progress: 0 });

  // eslint-disable-next-line no-console
  console.log(`[render:${jobId}] queued (policies=${inputProps.policies.length})`);
  renderJob(jobId, inputProps);

  res.json({ jobId });
});

app.get('/jobs/:jobId', (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(job);
});

app.get('/jobs/:jobId/events', (req, res) => {
  const jobId = req.params.jobId;
  const job = getJob(jobId);
  if (!job) {
    res.status(404).end();
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  subscribe(jobId, res);
  res.write(`: connected\n\n`);
  res.write(`event: progress\ndata: ${JSON.stringify(job)}\n\n`);
  res.flush?.();

  req.on('close', () => {
    unsubscribe(jobId, res);
  });
});

app.get('/jobs/:jobId/file', async (req, res) => {
  const jobId = req.params.jobId;
  const job = getJob(jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  if (job.status !== 'done' || !job.filePath) {
    res.status(409).json({ error: 'Job not finished yet' });
    return;
  }

  const file = await fs.readFile(job.filePath);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', 'attachment; filename="policy-wrapped.mp4"');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(file);
});

app.post('/render/policy-wrapped-square', async (req, res) => {
  try {
    const inputProps = sanitizePayload(req.body);
    if (!inputProps.policies.length) {
      res.status(400).json({ error: 'No policies provided' });
      return;
    }

    // Keep the sync endpoint, but internally delegate to the job system.
    const jobId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setJob(jobId, { status: 'queued', stage: 'queued', progress: 0 });
    renderJob(jobId, inputProps);

    // Wait until done (poll internally, but keep event loop free thanks to worker).
    for (;;) {
      const job = getJob(jobId);
      if (!job) throw new Error('Job disappeared');
      if (job.status === 'done') break;
      if (job.status === 'error') throw new Error(job.error || 'Render failed');
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 500));
    }

    const job = getJob(jobId);
    const file = await fs.readFile(job.filePath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="policy-wrapped.mp4"');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(file);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({
      error:
        `Render failed: ${msg}. ` +
        'Ensure FFmpeg is installed and available on PATH for this render server.',
    });
  }
});

// Ultrahuman VSL endpoint (no input props needed)
app.post('/render/ultrahuman-vsl', async (req, res) => {
  try {
    const jobId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setJob(jobId, { status: 'queued', stage: 'queued', progress: 0 });

    // Start render job for UltrahumanVSL
    renderJobGeneric(jobId, 'UltrahumanVSL', {});

    // Wait until done
    for (;;) {
      const job = getJob(jobId);
      if (!job) throw new Error('Job disappeared');
      if (job.status === 'done') break;
      if (job.status === 'error') throw new Error(job.error || 'Render failed');
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 500));
    }

    const job = getJob(jobId);
    const file = await fs.readFile(job.filePath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="ultrahuman-vsl.mp4"');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(file);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    res.status(500).json({
      error:
        `Render failed: ${msg}. ` +
        'Ensure FFmpeg is installed and available on PATH for this render server.',
    });
  }
});

// Generic render job function
async function renderJobGeneric(jobId, compositionId, inputProps) {
  const t0 = Date.now();
  try {
    setJob(jobId, { status: 'running', stage: 'bundling', progress: 0.02 });

    const serveUrl = await getServeUrl();
    setJob(jobId, { stage: 'starting', progress: 0.06 });
    if (DEBUG) logBinary('ffmpeg', ['-version']);

    const outPath = path.join(os.tmpdir(), `${compositionId}-${jobId}.mp4`);
    // eslint-disable-next-line no-console
    console.log(`[render:${jobId}] start render → ${outPath}`);

    // Write inputProps to a temp JSON file for the worker
    const inputJsonPath = path.join(os.tmpdir(), `${compositionId}-${jobId}.json`);
    await fs.writeFile(inputJsonPath, JSON.stringify(inputProps), 'utf8');

    setJob(jobId, { stage: 'starting-browser', progress: 0.08 });

    // If the ensured browser exists, pass it explicitly (Windows path).
    const browserExecutable = path.join(
      process.cwd(),
      'node_modules',
      '.remotion',
      'chrome-headless-shell',
      'win64',
      'chrome-headless-shell-win64',
      'chrome-headless-shell.exe'
    );

    // Run rendering in a separate process so the HTTP server stays responsive.
    await new Promise((resolve, reject) => {
      const worker = fork(path.join(process.cwd(), 'server', 'render-worker.cjs'), [], {
        env: {
          ...process.env,
          JOB_ID: jobId,
          SERVE_URL: serveUrl,
          OUT_PATH: outPath,
          INPUT_JSON: inputJsonPath,
          COMPOSITION_ID: compositionId,
          RENDER_DEBUG: process.env.RENDER_DEBUG,
          BROWSER_EXECUTABLE: browserExecutable,
        },
        stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      });

      worker.on('message', (msg) => {
        if (!msg || typeof msg !== 'object') return;
        if (msg.type === 'progress') {
          setJob(jobId, { stage: msg.stage || 'rendering', progress: msg.progress ?? 0.08 });
        }
        if (msg.type === 'stage') {
          setJob(jobId, { stage: msg.stage || 'rendering' });
        }
        if (msg.type === 'log' && DEBUG) {
          // eslint-disable-next-line no-console
          console.log(`[render:${jobId}] ${msg.level || 'info'}: ${msg.message || ''}`);
        }
        if (msg.type === 'done') {
          resolve();
        }
        if (msg.type === 'error') {
          reject(new Error(msg.error || 'Render failed'));
        }
      });

      worker.on('exit', (code) => {
        if (code === 0) return;
        reject(new Error(`Render worker exited with code ${code}`));
      });
    }).finally(async () => {
      await fs.unlink(inputJsonPath).catch(() => undefined);
    });

    setJob(jobId, { stage: 'finalizing', progress: 0.98, filePath: outPath });
    setJob(jobId, { status: 'done', stage: 'done', progress: 1.0 });
    // eslint-disable-next-line no-console
    console.log(`[render:${jobId}] done in ${Date.now() - t0}ms`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    setJob(jobId, { status: 'error', stage: 'error', error: msg });
    // eslint-disable-next-line no-console
    console.log(`[render:${jobId}] error: ${msg}`);
  } finally {
    setTimeout(() => cleanupJob(jobId), JOB_TTL_MS).unref?.();
  }
}

// =============================
// Client Management API
// =============================

app.get('/api/clients', (_req, res) => {
  try {
    const clients = clientDb.getAll();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clients/:id', (req, res) => {
  try {
    const client = clientDb.getById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/clients', (req, res) => {
  try {
    const { name, company, industry } = req.body;
    if (!company) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    const id = clientDb.create({ name: name || '', company, industry: industry || null });
    res.json(clientDb.getById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/clients/:id', (req, res) => {
  try {
    const updated = clientDb.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/clients/:id', (req, res) => {
  try {
    clientDb.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Template API
// =============================

app.get('/api/templates', (_req, res) => {
  try {
    const templates = getAllTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/templates/:id', (req, res) => {
  try {
    const template = getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Persona API
// =============================

// Get all personas with behaviors
app.get('/api/personas', (_req, res) => {
  try {
    const personas = getAllPersonas();
    const grouped = getPersonasGroupedByCategory();
    res.json({ personas, grouped });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single persona details
app.get('/api/personas/:id', (req, res) => {
  try {
    const persona = getPersona(req.params.id);
    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }
    res.json(persona);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview blended prompt
app.post('/api/personas/preview', (req, res) => {
  try {
    const { personas, behaviorOverrides } = req.body;

    if (!personas || !Array.isArray(personas) || personas.length === 0) {
      return res.status(400).json({ error: 'Personas array is required' });
    }

    // Validate persona IDs
    const validation = validatePersonaIds(personas);
    if (!validation.isValid) {
      return res.status(400).json({
        error: `Invalid persona IDs: ${validation.invalid.join(', ')}`
      });
    }

    const preview = previewBlendedPrompt(personas, behaviorOverrides || {});
    res.json(preview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get effective personas for a video (considering inheritance from client)
app.get('/api/videos/:videoId/effective-personas', (req, res) => {
  try {
    const video = videoDb.getById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const client = clientDb.getById(video.client_id);
    const effective = getEffectivePersonas(video, client);

    // Also include the preview of the blended prompt
    const preview = previewBlendedPrompt(effective.personaIds, effective.behaviorOverrides);

    res.json({
      ...effective,
      preview
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Video Management API
// =============================

app.get('/api/videos', (req, res) => {
  try {
    const clientId = req.query.client_id;
    const videos = videoDb.getAll(clientId);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/videos/:id', (req, res) => {
  try {
    const video = videoDb.getById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/videos', (req, res) => {
  try {
    const { template_id, ...videoData } = req.body;

    // If template_id is provided, get template defaults
    let templateDefaults = {};
    if (template_id) {
      const template = getTemplate(template_id);
      if (template) {
        templateDefaults = {
          composition_id: template.composition_id,
          duration_seconds: template.duration_seconds,
          aspect_ratio: template.aspect_ratio,
        };
      }
    }

    // Create video with template defaults merged with provided data
    const id = videoDb.create({
      ...templateDefaults,
      ...videoData,
    });

    // Auto-create scenes if template is specified
    if (template_id) {
      const scenesData = createScenesFromTemplate(template_id, id);
      scenesData.forEach(sceneData => {
        sceneDb.create(sceneData);
      });
    }

    res.json(videoDb.getById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/videos/:id', (req, res) => {
  try {
    const updated = videoDb.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/videos/:id', (req, res) => {
  try {
    videoDb.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Scene Management API
// =============================

app.get('/api/videos/:videoId/scenes', (req, res) => {
  try {
    const scenes = sceneDb.getAllForVideo(req.params.videoId);
    res.json(scenes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/videos/:videoId/scenes', (req, res) => {
  try {
    const sceneData = { ...req.body, video_id: req.params.videoId };
    const id = sceneDb.create(sceneData);
    res.json(sceneDb.getById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/scenes/:id', (req, res) => {
  try {
    const updated = sceneDb.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reorder a scene within a video
app.put('/api/videos/:videoId/scenes/reorder', (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId, 10);
    const { sceneId, newSceneNumber } = req.body;
    console.log('[scene-reorder] Request body:', JSON.stringify(req.body), 'videoId:', videoId);

    if (!sceneId || newSceneNumber === undefined) {
      console.log('[scene-reorder] Validation failed - sceneId:', sceneId, 'newSceneNumber:', newSceneNumber);
      return res.status(400).json({ error: 'sceneId and newSceneNumber are required' });
    }

    console.log('[scene-reorder] Reordering scene', { videoId, sceneId, newSceneNumber });
    const scenes = sceneDb.reorderScene(sceneId, newSceneNumber);
    const transitions = transitionDb.getAllForVideo(videoId);
    console.log('[scene-reorder] Success, scenes:', scenes.length);
    res.json({ scenes, transitions });
  } catch (error) {
    console.error('[scene-reorder] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Resize a scene edge and ripple subsequent scenes
app.put('/api/scenes/:id/resize', (req, res) => {
  try {
    const sceneId = parseInt(req.params.id, 10);
    const { edge, newFrame } = req.body;

    if (!edge || newFrame === undefined) {
      return res.status(400).json({ error: 'edge and newFrame are required' });
    }

    const scene = sceneDb.getById(sceneId);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    console.log('[scene-resize] Resizing scene', { sceneId, edge, newFrame });

    if (edge === 'start') {
      const minStart = 0;
      const maxStart = scene.end_frame - 15;
      const clampedStart = Math.min(Math.max(newFrame, minStart), maxStart);
      sceneDb.update(sceneId, { start_frame: clampedStart });
    } else {
      const minEnd = scene.start_frame + 15;
      const clampedEnd = Math.max(newFrame, minEnd);
      sceneDb.update(sceneId, { end_frame: clampedEnd });
    }

    const scenes = sceneDb.recalculateFrames(scene.video_id);
    console.log('[scene-resize] Success, recalculated frames');
    res.json({ scenes });
  } catch (error) {
    console.error('[scene-resize] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/scenes/:id', (req, res) => {
  try {
    const scene = sceneDb.getById(req.params.id);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }
    sceneDb.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// File Upload API
// =============================

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete uploaded file
app.delete('/api/uploads/:filename', async (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.filename);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// AI Integration API
// =============================

app.post('/api/ai/generate-slides', async (req, res) => {
  try {
    const { description, templateId, sceneCount, companyDetails, personas, behaviorOverrides } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Validate persona IDs if provided
    if (personas && Array.isArray(personas) && personas.length > 0) {
      const validation = validatePersonaIds(personas);
      if (!validation.isValid) {
        return res.status(400).json({
          error: `Invalid persona IDs: ${validation.invalid.join(', ')}`
        });
      }
    }

    const slides = await generateSlidesFromDescription(
      description,
      templateId,
      sceneCount,
      companyDetails,
      personas,
      behaviorOverrides
    );
    res.json({ slides });
  } catch (error) {
    console.error('[ai] Failed to generate slides:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/generate-chart-data', async (req, res) => {
  try {
    const { description, chartType } = req.body;

    if (!description || !chartType) {
      return res.status(400).json({ error: 'Description and chartType are required' });
    }

    const chartData = await generateChartData(description, chartType);
    res.json(chartData);
  } catch (error) {
    console.error('[ai] Failed to generate chart data:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/generate-equation', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const equationData = await generateEquation(description);
    res.json(equationData);
  } catch (error) {
    console.error('[ai] Failed to generate equation:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/improve-scene', async (req, res) => {
  try {
    const { sceneData } = req.body;

    if (!sceneData) {
      return res.status(400).json({ error: 'Scene data is required' });
    }

    const improved = await improveSceneContent(sceneData);
    res.json(improved);
  } catch (error) {
    console.error('[ai] Failed to improve scene:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/search-topic', async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const data = await searchTopicData(topic);
    res.json(data);
  } catch (error) {
    console.error('[ai] Failed to search topic:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Research Mode API
// =============================

// Perform research on a topic with citations
app.post('/api/research/perform', async (req, res) => {
  try {
    const { topic, portfolioUrl, websiteUrl, companyName, industry, searchWeb } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log(`[research] Starting research on: ${topic}`);

    const research = await performResearch(topic, {
      portfolioUrl,
      websiteUrl,
      companyName,
      industry,
      searchWeb: searchWeb !== false, // Default to true
    });

    res.json(research);
  } catch (error) {
    console.error('[research] Research failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extract case studies from a portfolio URL
app.post('/api/research/extract-portfolio', async (req, res) => {
  try {
    const { portfolioUrl, companyName, industry } = req.body;

    if (!portfolioUrl) {
      return res.status(400).json({ error: 'Portfolio URL is required' });
    }

    console.log(`[research] Extracting case studies from: ${portfolioUrl}`);

    const research = await performResearch('case studies and success stories', {
      portfolioUrl,
      companyName,
      industry,
      searchWeb: false, // Only analyze the portfolio
    });

    res.json({
      case_studies: research.case_studies,
      summary: research.summary,
    });
  } catch (error) {
    console.error('[research] Portfolio extraction failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate slides with research mode (includes citations)
app.post('/api/ai/generate-slides-with-research', async (req, res) => {
  try {
    const {
      description,
      researchTopic,
      portfolioUrl,
      websiteUrl,
      companyDetails,
      personas,
      behaviorOverrides,
      sceneCount,
      searchWeb,
    } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Validate persona IDs if provided
    if (personas && Array.isArray(personas) && personas.length > 0) {
      const validation = validatePersonaIds(personas);
      if (!validation.isValid) {
        return res.status(400).json({
          error: `Invalid persona IDs: ${validation.invalid.join(', ')}`
        });
      }
    }

    // First, perform research
    const topic = researchTopic || description;
    console.log(`[research] Performing research for slide generation: ${topic}`);

    const research = await performResearch(topic, {
      portfolioUrl,
      websiteUrl,
      companyName: companyDetails?.companyName,
      industry: companyDetails?.industry,
      searchWeb: searchWeb !== false,
    });

    console.log(`[research] Found ${research.citations.length} citations, ${research.case_studies.length} case studies`);

    // Then generate slides with research context
    const result = await generateSlidesWithResearch(description, {
      research,
      personas: personas || ['vsl-expert'],
      behaviorOverrides: behaviorOverrides || {},
      sceneCount,
      companyDetails,
    });

    res.json({
      slides: result.scenes,
      research: {
        citations_used: result.citations_used,
        case_studies_used: result.case_studies_used,
        summary: result.research_summary,
        all_citations: research.citations,
        all_case_studies: research.case_studies,
        search_queries: research.search_queries_used,
      },
    });
  } catch (error) {
    console.error('[research] Research slide generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify a claim against sources
app.post('/api/research/verify-claim', async (req, res) => {
  try {
    const { claim, sourceUrls } = req.body;

    if (!claim) {
      return res.status(400).json({ error: 'Claim is required' });
    }

    if (!sourceUrls || !Array.isArray(sourceUrls) || sourceUrls.length === 0) {
      return res.status(400).json({ error: 'Source URLs are required' });
    }

    const verification = await verifyClaim(claim, sourceUrls);
    res.json(verification);
  } catch (error) {
    console.error('[research] Claim verification failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Scene-Based Rendering API
// =============================

// Render a single scene and return the video file or preview URL
app.post('/api/scenes/:sceneId/render', async (req, res) => {
  try {
    const sceneId = parseInt(req.params.sceneId, 10);
    const scene = sceneDb.getById(sceneId);

    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const video = videoDb.getById(scene.video_id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const { forceRender = false } = req.body;

    // Check if we have a valid cache and don't need to force render
    if (!forceRender && scene.cache_path) {
      try {
        await fs.access(scene.cache_path);
        // Return cached file info
        return res.json({
          success: true,
          cached: true,
          scene_id: sceneId,
          cache_path: scene.cache_path,
          preview_url: `/api/scenes/${sceneId}/preview`,
        });
      } catch {
        // Cache file doesn't exist, need to render
      }
    }

    console.log(`[scene-render] Rendering scene ${scene.scene_number}: ${scene.name}`);

    const serveUrl = await getServeUrl();

    // Build input props
    const inputProps = {};
    if (video.theme_id) {
      inputProps.themeId = video.theme_id;
    }

    // Render the scene
    const scenePath = await renderScene(
      sceneId,
      serveUrl,
      'DynamicScene',
      inputProps,
      (progress) => {
        console.log(`[scene-render] Scene ${scene.scene_number} progress: ${(progress * 100).toFixed(1)}%`);
      }
    );

    // Update scene with cache path
    sceneDb.updateCache(sceneId, scenePath, null);

    console.log(`[scene-render] Scene ${scene.scene_number} rendered: ${scenePath}`);

    res.json({
      success: true,
      cached: false,
      scene_id: sceneId,
      cache_path: scenePath,
      preview_url: `/api/scenes/${sceneId}/preview`,
    });

  } catch (error) {
    console.error('[scene-render] Error:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Serve a rendered scene preview
app.get('/api/scenes/:sceneId/preview', async (req, res) => {
  try {
    const sceneId = parseInt(req.params.sceneId, 10);
    const scene = sceneDb.getById(sceneId);

    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    if (!scene.cache_path) {
      return res.status(404).json({ error: 'Scene not rendered yet' });
    }

    try {
      await fs.access(scene.cache_path);
    } catch {
      return res.status(404).json({ error: 'Scene cache file not found' });
    }

    const file = await fs.readFile(scene.cache_path);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(file);

  } catch (error) {
    console.error('[scene-preview] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear scene cache (invalidate when scene is edited)
app.delete('/api/scenes/:sceneId/cache', async (req, res) => {
  try {
    const sceneId = parseInt(req.params.sceneId, 10);
    const scene = sceneDb.getById(sceneId);

    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    // Clear the cache path in database
    sceneDb.updateCache(sceneId, null, null);

    res.json({ success: true, message: 'Scene cache cleared' });

  } catch (error) {
    console.error('[scene-cache-clear] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// Test Render API — render a scene from raw data without an existing video
// =============================================================================

// Helper: get-or-create a "Test Renders" client for test endpoints
function getTestClientId() {
  const existing = clientDb.getAll().find(c => c.name === '__test_renders__');
  if (existing) return existing.id;
  return clientDb.create({ name: '__test_renders__', company: 'Test Renders', industry: 'test' });
}

app.post('/api/rebundle', (req, res) => {
  invalidateBundle();
  res.json({ success: true, message: 'Bundle cache invalidated. Next render will re-bundle.' });
});

app.post('/api/test/render-scene', async (req, res) => {
  try {
    const {
      scene_type = 'text-only',
      data = {},
      theme_id,
      duration_frames,
    } = req.body;

    console.log(`[test-render] Rendering test scene: type=${scene_type}`);

    // Calculate duration if not provided
    const FPS = 30;
    let finalDurationFrames = duration_frames;
    if (!finalDurationFrames) {
      // Simple default: 5 seconds, or use spotlights heuristic
      if (scene_type === 'spotlights') {
        const numPoints = (data.spotlights || []).length || 1;
        finalDurationFrames = Math.max(3, numPoints * 3) * FPS;
      } else {
        finalDurationFrames = 5 * FPS;
      }
    }

    // Create a temporary video for this test render
    const testClientId = getTestClientId();
    const tempVideoId = videoDb.create({
      client_id: testClientId,
      title: `Test Render - ${scene_type} - ${Date.now()}`,
      composition_id: 'DynamicScene',
      status: 'draft',
      duration_seconds: finalDurationFrames / FPS,
      aspect_ratio: '16:9',
      data: null,
      theme_id: theme_id || null,
    });

    // Create the scene
    const sceneId = sceneDb.create({
      video_id: tempVideoId,
      scene_number: 0,
      name: `Test ${scene_type}`,
      scene_type,
      start_frame: 0,
      end_frame: finalDurationFrames,
      data: typeof data === 'string' ? data : JSON.stringify(data),
    });

    console.log(`[test-render] Created temp video=${tempVideoId}, scene=${sceneId}`);

    // Render the scene
    const serveUrl = await getServeUrl();
    const inputProps = {};
    if (theme_id) inputProps.themeId = theme_id;

    const scenePath = await renderScene(
      sceneId,
      serveUrl,
      'DynamicScene',
      inputProps,
      (progress) => {
        console.log(`[test-render] Progress: ${(progress * 100).toFixed(1)}%`);
      }
    );

    // Update scene with cache path
    sceneDb.updateCache(sceneId, scenePath, null);

    console.log(`[test-render] Rendered: ${scenePath}`);

    res.json({
      success: true,
      scene_id: sceneId,
      video_id: tempVideoId,
      cache_path: scenePath,
      preview_url: `/api/scenes/${sceneId}/preview`,
      message: `Test scene rendered. Preview at: /api/scenes/${sceneId}/preview`,
    });

  } catch (error) {
    console.error('[test-render] Error:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Convenience endpoint: render a spotlights scene with sample data
app.post('/api/test/render-spotlights', async (req, res) => {
  try {
    const {
      image_url,
      spotlights,
      theme_id,
      title = 'Spotlights Test',
      animation_preset = 'smooth',
    } = req.body;

    // Build scene data
    const sceneData = {
      title,
      spotlight_image_url: image_url || null,
      spotlights: spotlights || [],
      animation_preset,
    };

    // Validate
    if (!sceneData.spotlight_image_url) {
      return res.status(400).json({
        error: 'image_url is required',
        example: {
          image_url: 'http://localhost:4321/uploads/your-image.jpg',
          spotlights: [
            { id: '1', x: 0.3, y: 0.4, zoom: 2.5, title: 'Point A', description: 'First spotlight', badge: '1' },
            { id: '2', x: 0.7, y: 0.6, zoom: 3.0, title: 'Point B', description: 'Second spotlight', badge: '2' },
          ],
          theme_id: 'midnight',
          title: 'My Spotlights Scene',
        },
      });
    }

    if (sceneData.spotlights.length === 0) {
      return res.status(400).json({
        error: 'spotlights array is required and must contain at least one point',
        example_point: { id: '1', x: 0.5, y: 0.5, zoom: 2.5, title: 'Center', description: 'Description', badge: '1' },
      });
    }

    // Assign IDs to points that don't have them
    sceneData.spotlights = sceneData.spotlights.map((pt, i) => ({
      id: pt.id || String(i + 1),
      x: pt.x ?? 0.5,
      y: pt.y ?? 0.5,
      zoom: pt.zoom ?? 2.5,
      title: pt.title,
      description: pt.description,
      image_url: pt.image_url,
      badge: pt.badge || String(i + 1),
      markerType: pt.markerType || 'marker',
      markerWidth: pt.markerWidth,
      markerHeight: pt.markerHeight,
    }));

    const FPS = 30;
    const numPoints = sceneData.spotlights.length;
    const durationFrames = Math.max(3, numPoints * 3) * FPS;

    // Create temp video
    const testClientId = getTestClientId();
    const tempVideoId = videoDb.create({
      client_id: testClientId,
      title: `Spotlights Test - ${Date.now()}`,
      composition_id: 'DynamicScene',
      status: 'draft',
      duration_seconds: durationFrames / FPS,
      aspect_ratio: '16:9',
      data: null,
      theme_id: theme_id || null,
    });

    // Create scene
    const sceneId = sceneDb.create({
      video_id: tempVideoId,
      scene_number: 0,
      name: title,
      scene_type: 'spotlights',
      start_frame: 0,
      end_frame: durationFrames,
      data: JSON.stringify(sceneData),
    });

    console.log(`[test-spotlights] Created temp video=${tempVideoId}, scene=${sceneId}, points=${numPoints}, duration=${durationFrames}frames`);

    // Render
    const serveUrl = await getServeUrl();
    const inputProps = {};
    if (theme_id) inputProps.themeId = theme_id;

    const scenePath = await renderScene(
      sceneId,
      serveUrl,
      'DynamicScene',
      inputProps,
      (progress) => {
        console.log(`[test-spotlights] Progress: ${(progress * 100).toFixed(1)}%`);
      }
    );

    sceneDb.updateCache(sceneId, scenePath, null);

    console.log(`[test-spotlights] Rendered: ${scenePath}`);

    res.json({
      success: true,
      scene_id: sceneId,
      video_id: tempVideoId,
      cache_path: scenePath,
      preview_url: `/api/scenes/${sceneId}/preview`,
      duration_seconds: durationFrames / FPS,
      num_points: numPoints,
      message: `Spotlights scene rendered with ${numPoints} points. Preview at: /api/scenes/${sceneId}/preview`,
    });

  } catch (error) {
    console.error('[test-spotlights] Error:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// =============================================================================
// TRANSITION API
// =============================================================================

// Get all transitions for a video
app.get('/api/videos/:videoId/transitions', (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId, 10);
    const video = videoDb.getById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    const transitions = transitionDb.getAllForVideo(videoId);
    res.json(transitions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update a transition between two scenes
app.post('/api/videos/:videoId/transitions', (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId, 10);
    const video = videoDb.getById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const { from_scene_number, to_scene_number, transition_type, duration_frames, config } = req.body;

    if (from_scene_number === undefined || to_scene_number === undefined) {
      return res.status(400).json({ error: 'from_scene_number and to_scene_number are required' });
    }

    // Check if transition already exists
    const existing = transitionDb.getByScenes(videoId, from_scene_number, to_scene_number);
    if (existing) {
      // Update existing transition
      const updated = transitionDb.update(existing.id, {
        transition_type,
        duration_frames,
        config,
      });
      return res.json(updated);
    }

    // Create new transition
    const id = transitionDb.create({
      video_id: videoId,
      from_scene_number,
      to_scene_number,
      transition_type: transition_type || 'crossfade',
      duration_frames: duration_frames || 20,
      config,
    });
    res.json(transitionDb.getById(id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a specific transition
app.put('/api/transitions/:transitionId', (req, res) => {
  try {
    const transitionId = parseInt(req.params.transitionId, 10);
    const transition = transitionDb.getById(transitionId);
    if (!transition) {
      return res.status(404).json({ error: 'Transition not found' });
    }

    const updated = transitionDb.update(transitionId, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a transition
app.delete('/api/transitions/:transitionId', (req, res) => {
  try {
    const transitionId = parseInt(req.params.transitionId, 10);
    const transition = transitionDb.getById(transitionId);
    if (!transition) {
      return res.status(404).json({ error: 'Transition not found' });
    }

    transitionDb.delete(transitionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create default transitions for all scene gaps in a video
app.post('/api/videos/:videoId/transitions/defaults', (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId, 10);
    const video = videoDb.getById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const { type = 'crossfade', duration_frames = 20 } = req.body;
    const created = transitionDb.createDefaultsForVideo(videoId, type, duration_frames);
    const transitions = transitionDb.getAllForVideo(videoId);

    res.json({
      created_count: created.length,
      transitions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available transition types
app.get('/api/transitions/types', (req, res) => {
  res.json({
    types: [
      { id: 'none', label: 'Cut', description: 'Instant cut with no transition effect', category: 'Basic' },
      { id: 'crossfade', label: 'Crossfade', description: 'Smooth dissolve between scenes', category: 'Basic' },
      { id: 'fade-black', label: 'Fade to Black', description: 'Fade out to black, then fade in', category: 'Basic' },
      { id: 'fade-white', label: 'Fade to White', description: 'Fade out to white, then fade in', category: 'Basic' },
      { id: 'slide-left', label: 'Slide Left', description: 'New scene slides in from the right', category: 'Slide' },
      { id: 'slide-right', label: 'Slide Right', description: 'New scene slides in from the left', category: 'Slide' },
      { id: 'slide-up', label: 'Slide Up', description: 'New scene slides in from the bottom', category: 'Slide' },
      { id: 'slide-down', label: 'Slide Down', description: 'New scene slides in from the top', category: 'Slide' },
      { id: 'wipe-left', label: 'Wipe Left', description: 'Reveal new scene with a left-moving wipe', category: 'Wipe' },
      { id: 'wipe-right', label: 'Wipe Right', description: 'Reveal new scene with a right-moving wipe', category: 'Wipe' },
      { id: 'wipe-up', label: 'Wipe Up', description: 'Reveal new scene with an upward wipe', category: 'Wipe' },
      { id: 'wipe-down', label: 'Wipe Down', description: 'Reveal new scene with a downward wipe', category: 'Wipe' },
      { id: 'zoom-in', label: 'Zoom In', description: 'Zoom into current scene, reveal new scene', category: 'Cinematic' },
      { id: 'zoom-out', label: 'Zoom Out', description: 'New scene zooms out into view', category: 'Cinematic' },
      { id: 'blur', label: 'Blur', description: 'Blur transition between scenes', category: 'Cinematic' },
      { id: 'glitch', label: 'Glitch', description: 'Digital glitch effect', category: 'Cinematic' },
      { id: 'morph', label: 'Morph', description: 'Organic shape morphing', category: 'Cinematic' },
    ],
    categories: ['Basic', 'Slide', 'Wipe', 'Cinematic'],
  });
});

app.post('/api/videos/:videoId/render-scenes', async (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId, 10);
    const video = videoDb.getById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const scenes = sceneDb.getAllForVideo(videoId);
    if (scenes.length === 0) {
      return res.status(400).json({ error: 'No scenes found for this video' });
    }

    // Build initial scene state with cache status
    const sceneStates = scenes.map(scene => ({
      id: scene.id,
      scene_number: scene.scene_number,
      name: scene.name,
      status: scene.cache_path ? 'cached' : 'pending',
      progress: scene.cache_path ? 100 : 0,
      cache_path: scene.cache_path || null,
    }));

    const cachedCount = sceneStates.filter(s => s.status === 'cached').length;
    const toRenderCount = sceneStates.filter(s => s.status === 'pending').length;

    // Initialize render state and broadcast
    const updateRenderState = (updates) => {
      const state = {
        status: 'rendering',
        total_scenes: scenes.length,
        cached_scenes: cachedCount,
        scenes_to_render: toRenderCount,
        completed_scenes: sceneStates.filter(s => s.status === 'completed' || s.status === 'cached').length,
        current_scene_index: null,
        overall_progress: 0,
        stage: 'preparing',
        scenes: sceneStates,
        ...updates,
      };
      setVideoRenderState(videoId, state);
      // Also update DB for polling fallback
      videoDb.update(videoId, {
        status: 'rendering',
        render_progress: JSON.stringify(state)
      });
      return state;
    };

    updateRenderState({ stage: 'bundling' });

    const serveUrl = await getServeUrl();
    const scenePaths = [];
    let completedRenders = 0;

    // Pre-calculate bg_time_offset for scenes sharing a bg_group
    const bgGroupOffsets = {};
    for (const scene of scenes) {
      try {
        const sd = scene.data ? JSON.parse(scene.data) : {};
        const group = sd.bg_group;
        if (group) {
          if (!bgGroupOffsets[group]) bgGroupOffsets[group] = 0;
          scene._bgTimeOffset = bgGroupOffsets[group];
          bgGroupOffsets[group] += (scene.end_frame - scene.start_frame);
        }
      } catch (_) {
        // skip invalid JSON
      }
    }

    // Render each scene (using cache when possible)
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const sceneState = sceneStates[i];

      if (sceneState.status === 'cached') {
        // Use cached scene
        scenePaths.push(sceneState.cache_path);
        updateRenderState({
          current_scene_index: i,
          overall_progress: Math.round(((i + 1) / scenes.length) * 90),
          stage: 'rendering',
        });
        continue;
      }

      // Mark scene as rendering
      sceneState.status = 'rendering';
      sceneState.progress = 0;
      updateRenderState({
        current_scene_index: i,
        stage: 'rendering',
      });

      // Build input props
      const inputProps = {};
      if (video.theme_id) {
        inputProps.themeId = video.theme_id;
      }
      // Pass bg_time_offset if pre-calculated for this scene's bg_group
      if (scene._bgTimeOffset !== undefined) {
        inputProps._bgTimeOffset = scene._bgTimeOffset;
      }

      // Render the scene with progress callback
      const scenePath = await renderScene(
        scene.id,
        serveUrl,
        'DynamicScene',
        inputProps,
        (progress) => {
          sceneState.progress = Math.round(progress * 100);
          const baseProgress = (i / scenes.length) * 90;
          const sceneContribution = (progress / scenes.length) * 90;
          updateRenderState({
            overall_progress: Math.round(baseProgress + sceneContribution),
          });
        }
      );

      // Mark scene as completed and update cache path
      sceneState.status = 'completed';
      sceneState.progress = 100;
      sceneState.cache_path = scenePath;
      completedRenders++;

      scenePaths.push(scenePath);

      updateRenderState({
        completed_scenes: cachedCount + completedRenders,
        overall_progress: Math.round(((i + 1) / scenes.length) * 90),
      });
    }

    // Stitching phase
    updateRenderState({
      stage: 'stitching',
      overall_progress: 92,
      current_scene_index: null,
    });

    // Stitch scenes together
    const audioClips = audioClipDb.getAllForVideo(videoId);
    const videoClips = videoClipDb.getAllForVideo(videoId);
    let outputPath;

    // Step 1: Stitch scenes
    const stitchedPath = path.join(os.tmpdir(), `video-${videoId}-stitched-${Date.now()}.mp4`);
    await stitchScenes(scenePaths, stitchedPath);
    let currentPath = stitchedPath;

    // Step 2: Mux audio if present
    if (audioClips.length > 0) {
      const audioMuxedPath = path.join(os.tmpdir(), `video-${videoId}-audiomuxed-${Date.now()}.mp4`);
      await muxAudio(currentPath, audioClips, audioMuxedPath);
      await fs.unlink(currentPath).catch(() => {});
      currentPath = audioMuxedPath;
    }

    // Step 3: Overlay video clips (B-roll) if present
    if (videoClips.length > 0) {
      const overlayPath = path.join(os.tmpdir(), `video-${videoId}-overlay-${Date.now()}.mp4`);
      await overlayVideoClips(currentPath, videoClips, overlayPath);
      await fs.unlink(currentPath).catch(() => {});
      currentPath = overlayPath;
    }

    outputPath = currentPath;

    // Final state: completed
    updateRenderState({
      status: 'completed',
      stage: 'complete',
      overall_progress: 100,
    });

    // Update video with output path
    videoDb.update(videoId, {
      output_path: outputPath,
      status: 'completed',
      render_progress: null
    });

    // Cleanup SSE state after a delay (allow clients to receive final update)
    setTimeout(() => cleanupVideoRenderState(videoId), 5000);

    // Read and send the video file
    const file = await fs.readFile(outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${video.title}.mp4"`);
    res.status(200).send(file);

  } catch (error) {
    console.error('[render-scenes] Error:', error);
    const videoId = parseInt(req.params.videoId, 10);

    // Broadcast error state
    setVideoRenderState(videoId, {
      status: 'error',
      stage: 'error',
      error: error.message,
    });

    videoDb.update(videoId, {
      status: 'error',
      render_progress: null
    });

    // Cleanup SSE state after a delay
    setTimeout(() => cleanupVideoRenderState(videoId), 5000);

    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// =============================
// Audio Clips API
// =============================

// List audio clips for a video
app.get('/api/videos/:videoId/audio-clips', (req, res) => {
  try {
    const clips = audioClipDb.getAllForVideo(parseInt(req.params.videoId, 10));
    res.json(clips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload audio clip
app.post('/api/videos/:videoId/audio-clips', audioUpload.single('audio'), (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId, 10);
    const video = videoDb.getById(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const durationFrames = getAudioDurationFrames(req.file.path);
    const name = req.body.name || req.file.originalname.replace(/\.[^/.]+$/, '');
    const startFrame = parseInt(req.body.start_frame, 10) || 0;

    const id = audioClipDb.create({
      video_id: videoId,
      name,
      file_path: req.file.path,
      original_filename: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      start_frame: startFrame,
      duration_frames: durationFrames,
      source_duration_frames: durationFrames,
      volume: parseFloat(req.body.volume) || 1.0,
    });

    const clip = audioClipDb.getById(id);
    res.status(201).json(clip);
  } catch (error) {
    console.error('[audio-clips] Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single audio clip
app.get('/api/audio-clips/:clipId', (req, res) => {
  try {
    const clip = audioClipDb.getById(parseInt(req.params.clipId, 10));
    if (!clip) return res.status(404).json({ error: 'Audio clip not found' });
    res.json(clip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update audio clip properties
app.put('/api/audio-clips/:clipId', (req, res) => {
  try {
    const clip = audioClipDb.update(parseInt(req.params.clipId, 10), req.body);
    if (!clip) return res.status(404).json({ error: 'Audio clip not found' });
    res.json(clip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete audio clip
app.delete('/api/audio-clips/:clipId', async (req, res) => {
  try {
    const clipId = parseInt(req.params.clipId, 10);
    const clip = audioClipDb.getById(clipId);
    if (!clip) return res.status(404).json({ error: 'Audio clip not found' });

    // Delete the file
    try {
      await fs.unlink(clip.file_path);
    } catch (err) {
      console.warn('[audio-clips] Failed to delete file:', err.message);
    }

    audioClipDb.delete(clipId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve audio clip file for playback
app.get('/api/audio-clips/:clipId/stream', async (req, res) => {
  try {
    const clip = audioClipDb.getById(parseInt(req.params.clipId, 10));
    if (!clip) return res.status(404).json({ error: 'Audio clip not found' });

    res.setHeader('Content-Type', clip.mime_type || 'audio/mpeg');
    const fileBuffer = await fs.readFile(clip.file_path);
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Video Clips (B-Roll) API
// =============================

// List video clips for a video
app.get('/api/videos/:videoId/video-clips', (req, res) => {
  try {
    const clips = videoClipDb.getAllForVideo(parseInt(req.params.videoId, 10));
    res.json(clips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload video clip
app.post('/api/videos/:videoId/video-clips', videoUpload.single('video'), async (req, res) => {
  try {
    const videoId = parseInt(req.params.videoId, 10);
    const video = videoDb.getById(videoId);
    if (!video) return res.status(404).json({ error: 'Video not found' });

    if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });

    // Get source metadata
    const metadata = getVideoMetadata(req.file.path);
    const name = req.body.name || req.file.originalname.replace(/\.[^/.]+$/, '');
    const startFrame = parseInt(req.body.start_frame, 10) || 0;

    // Normalize to project resolution
    const normalizedFilename = `normalized-${Date.now()}-${Math.round(Math.random() * 1E9)}.mp4`;
    const normalizedPath = path.join(uploadsDir, normalizedFilename);

    console.log(`[video-clips] Normalizing ${req.file.originalname} to 1920x1080 @ 30fps...`);
    normalizeVideoClip(req.file.path, normalizedPath);

    // Get normalized duration (may differ slightly due to fps conversion)
    const normalizedMeta = getVideoMetadata(normalizedPath);

    const id = videoClipDb.create({
      video_id: videoId,
      name,
      file_path: req.file.path,
      normalized_path: normalizedPath,
      original_filename: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      source_width: metadata.width,
      source_height: metadata.height,
      source_fps: metadata.fps,
      start_frame: startFrame,
      duration_frames: normalizedMeta.durationFrames,
      source_duration_frames: normalizedMeta.durationFrames,
    });

    const clip = videoClipDb.getById(id);
    console.log(`[video-clips] Uploaded and normalized: ${name} (${normalizedMeta.durationFrames} frames)`);
    res.status(201).json(clip);
  } catch (error) {
    console.error('[video-clips] Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single video clip
app.get('/api/video-clips/:clipId', (req, res) => {
  try {
    const clip = videoClipDb.getById(parseInt(req.params.clipId, 10));
    if (!clip) return res.status(404).json({ error: 'Video clip not found' });
    res.json(clip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update video clip properties
app.put('/api/video-clips/:clipId', (req, res) => {
  try {
    const clip = videoClipDb.update(parseInt(req.params.clipId, 10), req.body);
    if (!clip) return res.status(404).json({ error: 'Video clip not found' });
    res.json(clip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete video clip
app.delete('/api/video-clips/:clipId', async (req, res) => {
  try {
    const clipId = parseInt(req.params.clipId, 10);
    const clip = videoClipDb.getById(clipId);
    if (!clip) return res.status(404).json({ error: 'Video clip not found' });

    // Delete files (original + normalized)
    for (const filePath of [clip.file_path, clip.normalized_path]) {
      if (filePath) {
        try { await fs.unlink(filePath); } catch (err) {
          console.warn('[video-clips] Failed to delete file:', err.message);
        }
      }
    }

    videoClipDb.delete(clipId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve normalized video clip for preview
app.get('/api/video-clips/:clipId/stream', async (req, res) => {
  try {
    const clip = videoClipDb.getById(parseInt(req.params.clipId, 10));
    if (!clip) return res.status(404).json({ error: 'Video clip not found' });

    const filePath = clip.normalized_path || clip.file_path;
    res.setHeader('Content-Type', 'video/mp4');
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Multi-Platform Export API
// =============================

// Get available platforms
app.get('/api/platforms', (_req, res) => {
  res.json({
    platforms: PLATFORMS,
    aspectRatios: ASPECT_RATIOS
  });
});

// Render video for multiple platforms
app.post('/api/videos/:videoId/render-multi', async (req, res) => {
  try {
    const video = videoDb.getById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const scenes = sceneDb.getAllForVideo(req.params.videoId);
    if (scenes.length === 0) {
      return res.status(400).json({ error: 'No scenes found for this video' });
    }

    const { platforms: platformIds } = req.body;
    if (!platformIds || !Array.isArray(platformIds) || platformIds.length === 0) {
      return res.status(400).json({ error: 'Platforms array is required' });
    }

    // Validate platform IDs
    const invalidPlatforms = platformIds.filter(id => !PLATFORMS[id]);
    if (invalidPlatforms.length > 0) {
      return res.status(400).json({ error: `Invalid platform IDs: ${invalidPlatforms.join(', ')}` });
    }

    // Group platforms by aspect ratio for efficient rendering
    const groupedPlatforms = groupPlatformsByAspectRatio(platformIds);
    const aspectRatiosToRender = Object.keys(groupedPlatforms);

    console.log(`[render-multi] Starting multi-platform render for ${platformIds.length} platforms across ${aspectRatiosToRender.length} aspect ratios`);

    // Initialize progress tracking
    videoDb.update(video.id, {
      status: 'rendering',
      render_progress: JSON.stringify({
        type: 'multi-platform',
        total_aspect_ratios: aspectRatiosToRender.length,
        completed_aspect_ratios: 0,
        current_aspect_ratio: null,
        platforms: platformIds,
        percentage: 0
      })
    });

    const serveUrl = await getServeUrl();
    const outputs = {};

    // Pre-calculate bg_time_offset for scenes sharing a bg_group
    const bgGroupOffsetsMulti = {};
    for (const scene of scenes) {
      try {
        const sd = scene.data ? JSON.parse(scene.data) : {};
        const group = sd.bg_group;
        if (group) {
          if (!bgGroupOffsetsMulti[group]) bgGroupOffsetsMulti[group] = 0;
          scene._bgTimeOffset = bgGroupOffsetsMulti[group];
          bgGroupOffsetsMulti[group] += (scene.end_frame - scene.start_frame);
        }
      } catch (_) {
        // skip invalid JSON
      }
    }

    // Render for each aspect ratio
    for (let arIdx = 0; arIdx < aspectRatiosToRender.length; arIdx++) {
      const aspectRatio = aspectRatiosToRender[arIdx];
      const platformsForAspect = groupedPlatforms[aspectRatio];

      console.log(`[render-multi] Rendering aspect ratio ${aspectRatio} for platforms: ${platformsForAspect.map(p => p.id).join(', ')}`);

      // Update progress
      videoDb.update(video.id, {
        render_progress: JSON.stringify({
          type: 'multi-platform',
          total_aspect_ratios: aspectRatiosToRender.length,
          completed_aspect_ratios: arIdx,
          current_aspect_ratio: aspectRatio,
          platforms: platformIds,
          percentage: Math.round((arIdx / aspectRatiosToRender.length) * 100)
        })
      });

      const scenePaths = [];

      // Render each scene for this aspect ratio
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        // Build input props for rendering (video.data contains metadata, not render props)
        const inputProps = {};
        if (video.theme_id) {
          inputProps.themeId = video.theme_id;
        }
        // Pass bg_time_offset if pre-calculated for this scene's bg_group
        if (scene._bgTimeOffset !== undefined) {
          inputProps._bgTimeOffset = scene._bgTimeOffset;
        }

        const scenePath = await renderScene(
          scene.id,
          serveUrl,
          'DynamicScene',
          inputProps,
          (progress) => {
            console.log(`[render-multi] Scene ${scene.scene_number} (${aspectRatio}) progress: ${(progress * 100).toFixed(1)}%`);
          },
          aspectRatio // Pass aspect ratio to use correct composition
        );
        scenePaths.push(scenePath);
      }

      // Stitch scenes for this aspect ratio
      const audioClips = audioClipDb.getAllForVideo(video.id);
      const videoClips = videoClipDb.getAllForVideo(video.id);
      const arKey = aspectRatio.replace(':', 'x');

      // Step 1: Stitch
      const stitchedPath = path.join(os.tmpdir(), `video-${video.id}-${arKey}-stitched-${Date.now()}.mp4`);
      await stitchScenes(scenePaths, stitchedPath);
      let currentPath = stitchedPath;

      // Step 2: Mux audio
      if (audioClips.length > 0) {
        const audioMuxedPath = path.join(os.tmpdir(), `video-${video.id}-${arKey}-audiomuxed-${Date.now()}.mp4`);
        await muxAudio(currentPath, audioClips, audioMuxedPath);
        await fs.unlink(currentPath).catch(() => {});
        currentPath = audioMuxedPath;
      }

      // Step 3: Overlay video clips
      if (videoClips.length > 0) {
        const overlayPath = path.join(os.tmpdir(), `video-${video.id}-${arKey}-overlay-${Date.now()}.mp4`);
        await overlayVideoClips(currentPath, videoClips, overlayPath);
        await fs.unlink(currentPath).catch(() => {});
        currentPath = overlayPath;
      }

      const outputPath = currentPath;

      // Store output path for each platform with this aspect ratio
      for (const platform of platformsForAspect) {
        outputs[platform.id] = {
          path: outputPath,
          platform: platform,
          aspectRatio: aspectRatio
        };
      }
    }

    // Update video status
    videoDb.update(video.id, {
      status: 'completed',
      render_progress: null
    });

    // Return the outputs info
    res.json({
      success: true,
      outputs: Object.fromEntries(
        Object.entries(outputs).map(([platformId, output]) => [
          platformId,
          {
            platform: output.platform.name,
            aspectRatio: output.aspectRatio,
            downloadUrl: `/api/videos/${video.id}/download/${platformId}`
          }
        ])
      )
    });

  } catch (error) {
    console.error('[render-multi] Error:', error);
    videoDb.update(req.params.videoId, {
      status: 'error',
      render_progress: null
    });
    res.status(500).json({ error: error.message });
  }
});

// Download rendered video for specific platform
app.get('/api/videos/:videoId/download/:platformId', async (req, res) => {
  try {
    const video = videoDb.getById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const platform = PLATFORMS[req.params.platformId];
    if (!platform) {
      return res.status(404).json({ error: 'Platform not found' });
    }

    // Find the rendered file for this platform's aspect ratio
    const cacheDir = path.join(process.cwd(), 'cache', 'exports');
    const aspectRatioSuffix = platform.aspectRatio.replace(':', 'x');

    // Look for the most recent render for this video and aspect ratio
    const tempDir = os.tmpdir();
    const files = await fs.readdir(tempDir);
    const matchingFiles = files.filter(f =>
      f.startsWith(`video-${video.id}-${aspectRatioSuffix}`) && f.endsWith('.mp4')
    );

    if (matchingFiles.length === 0) {
      return res.status(404).json({ error: 'Rendered video not found. Please render first.' });
    }

    // Get the most recent file
    const sortedFiles = matchingFiles.sort().reverse();
    const filePath = path.join(tempDir, sortedFiles[0]);

    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'Rendered video file not found on disk' });
    }

    const file = await fs.readFile(filePath);
    const filename = `${video.title}-${platform.name.replace(/[^a-zA-Z0-9]/g, '-')}.mp4`;

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(file);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Video Preview API
// =============================

// SSE endpoint for real-time render progress
app.get('/api/videos/:videoId/render-progress', optionalAuth, (req, res) => {
  const videoId = parseInt(req.params.videoId, 10);

  // If render is cloud-mode, require authentication
  const currentState = getVideoRenderState(videoId);
  if (currentState?.renderMode === 'cloud' && !req.user) {
    return res.status(401).json({ error: 'Authentication required for cloud render progress' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  subscribeVideoRender(videoId, res);
  res.write(`: connected\n\n`);

  // Send current state if available (reuse from auth check above)
  if (currentState) {
    res.write(`event: progress\ndata: ${JSON.stringify(currentState)}\n\n`);
  }
  res.flush?.();

  req.on('close', () => {
    unsubscribeVideoRender(videoId, res);
  });
});

// Serve completed video
app.get('/api/videos/:videoId/preview', async (req, res) => {
  try {
    const video = videoDb.getById(req.params.videoId);
    if (!video || !video.output_path) {
      return res.status(404).json({ error: 'Video not found or not rendered yet' });
    }

    // Check if file exists
    try {
      await fs.access(video.output_path);
    } catch {
      return res.status(404).json({ error: 'Video file not found on disk' });
    }

    const stat = await fs.stat(video.output_path);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Accept-Ranges', 'bytes');

    const stream = (await import('node:fs')).createReadStream(video.output_path);
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve scene preview
app.get('/api/scenes/:sceneId/preview', async (req, res) => {
  try {
    const scene = sceneDb.getById(req.params.sceneId);
    if (!scene || !scene.cache_path) {
      return res.status(404).json({ error: 'Scene not found or not cached' });
    }

    // Check if file exists
    try {
      await fs.access(scene.cache_path);
    } catch {
      return res.status(404).json({ error: 'Scene file not found on disk' });
    }

    const stat = await fs.stat(scene.cache_path);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Accept-Ranges', 'bytes');

    const stream = (await import('node:fs')).createReadStream(scene.cache_path);
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============================
// After Effects Export API
// =============================

// Get theme by ID helper
function getThemeById(themeId) {
  // All 7 themes synced from app/lib/themes.ts
  const THEMES = {
    'tech-dark': {
      id: 'tech-dark',
      name: 'Tech Dark',
      colors: {
        background: '#0A0A0A',
        backgroundGradient: 'linear-gradient(135deg, #0A0A0A 0%, #1A1F2E 100%)',
        textPrimary: '#FFFFFF',
        textSecondary: '#A0AEC0',
        accent: '#00D9A3',
        accentSecondary: '#00F5FF',
        surface: 'rgba(255, 255, 255, 0.05)',
        surfaceLight: 'rgba(255, 255, 255, 0.1)',
      },
      fonts: { heading: 'Inter', body: 'Inter' },
    },
    'artisanal-light': {
      id: 'artisanal-light',
      name: 'Artisanal Light',
      colors: {
        background: '#FAF9F6',
        backgroundGradient: 'linear-gradient(135deg, #FAF9F6 0%, #F5E6D3 100%)',
        textPrimary: '#2D2D2D',
        textSecondary: '#6B6B6B',
        accent: '#D4845F',
        accentSecondary: '#8B7355',
        surface: 'rgba(0, 0, 0, 0.03)',
        surfaceLight: 'rgba(0, 0, 0, 0.05)',
      },
      fonts: { heading: 'Montserrat', body: 'Source Sans Pro' },
    },
    'clinical-light': {
      id: 'clinical-light',
      name: 'Clinical Light',
      colors: {
        background: '#FFFFFF',
        backgroundGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0F4F8 100%)',
        textPrimary: '#1A202C',
        textSecondary: '#718096',
        accent: '#3182CE',
        accentSecondary: '#00B5D8',
        surface: 'rgba(49, 130, 206, 0.05)',
        surfaceLight: 'rgba(49, 130, 206, 0.08)',
      },
      fonts: { heading: 'Poppins', body: 'Open Sans' },
    },
    'corporate-blue': {
      id: 'corporate-blue',
      name: 'Corporate Blue',
      colors: {
        background: '#0F1D3D',
        backgroundGradient: 'linear-gradient(135deg, #0F1D3D 0%, #1E3A5F 100%)',
        textPrimary: '#FFFFFF',
        textSecondary: '#CBD5E0',
        accent: '#F6AD55',
        accentSecondary: '#FBD38D',
        surface: 'rgba(255, 255, 255, 0.06)',
        surfaceLight: 'rgba(255, 255, 255, 0.1)',
      },
      fonts: { heading: 'Montserrat', body: 'Inter' },
    },
    'minimal-mono': {
      id: 'minimal-mono',
      name: 'Minimal Monochrome',
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
      fonts: { heading: 'Poppins', body: 'Inter' },
    },
    'vibrant-gradient': {
      id: 'vibrant-gradient',
      name: 'Vibrant Gradient',
      colors: {
        background: '#1A1A2E',
        backgroundGradient: 'linear-gradient(135deg, #16213E 0%, #0F3460 50%, #533483 100%)',
        textPrimary: '#FFFFFF',
        textSecondary: '#E0E0E0',
        accent: '#FF00FF',
        accentSecondary: '#00FFD1',
        surface: 'rgba(255, 255, 255, 0.08)',
        surfaceLight: 'rgba(255, 255, 255, 0.12)',
      },
      fonts: { heading: 'Montserrat', body: 'Poppins' },
    },
    'ocean-blue-green': {
      id: 'ocean-blue-green',
      name: 'Ocean Blue-Green',
      colors: {
        background: '#0D1B2A',
        backgroundGradient: 'linear-gradient(135deg, #0D1B2A 0%, #1B263B 50%, #0F4C5C 100%)',
        textPrimary: '#FFFFFF',
        textSecondary: '#9FB4C7',
        accent: '#00D9A3',
        accentSecondary: '#5EEAD4',
        surface: 'rgba(0, 217, 163, 0.08)',
        surfaceLight: 'rgba(0, 217, 163, 0.12)',
      },
      fonts: { heading: 'Inter', body: 'Inter' },
    },
  };
  return THEMES[themeId] || THEMES['tech-dark'];
}

// Export video to After Effects JSON manifest format
app.get('/api/videos/:videoId/export-ae', async (req, res) => {
  try {
    const video = videoDb.getById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const scenes = sceneDb.getAllForVideo(req.params.videoId);
    if (scenes.length === 0) {
      return res.status(400).json({ error: 'No scenes found for this video' });
    }

    // Get dimensions from aspect ratio
    const aspectRatio = video.aspect_ratio || '16:9';
    const dimensions = getDimensionsForAspectRatio(aspectRatio);

    // Get theme
    const theme = getThemeById(video.theme_id);

    // Generate the manifest
    const manifest = generateAEManifest({
      video,
      scenes,
      fps: 30,
      width: dimensions.width,
      height: dimensions.height,
      theme,
    });

    res.json(manifest);
  } catch (error) {
    console.error('[ae-export] Error generating manifest:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export video as self-contained After Effects JSX script
app.get('/api/videos/:videoId/export-ae/script', async (req, res) => {
  try {
    const video = videoDb.getById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const scenes = sceneDb.getAllForVideo(req.params.videoId);
    if (scenes.length === 0) {
      return res.status(400).json({ error: 'No scenes found for this video' });
    }

    // Get dimensions
    const aspectRatio = video.aspect_ratio || '16:9';
    const dimensions = getDimensionsForAspectRatio(aspectRatio);

    // Get theme
    const theme = getThemeById(video.theme_id);

    // Generate the manifest
    const manifest = generateAEManifest({
      video,
      scenes,
      fps: 30,
      width: dimensions.width,
      height: dimensions.height,
      theme,
    });

    // Generate self-contained script
    const script = generateSelfContainedScript(manifest);

    // Sanitize filename
    const filename = (video.title || 'remotion-export')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}-ae-import.jsx"`);
    res.send(script);
  } catch (error) {
    console.error('[ae-export] Error generating script:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PEXELS STOCK IMAGE ROUTES =====

// Search for stock images
app.get('/api/stock-images/search', async (req, res) => {
  try {
    const { query, per_page = 10, page = 1 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const results = await searchPhotos(query, parseInt(per_page), parseInt(page));
    res.json(results);
  } catch (error) {
    console.error('[pexels] Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get curated stock images
app.get('/api/stock-images/curated', async (req, res) => {
  try {
    const { per_page = 15, page = 1 } = req.query;
    const results = await getCuratedPhotos(parseInt(per_page), parseInt(page));
    res.json(results);
  } catch (error) {
    console.error('[pexels] Curated error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single photo by ID
app.get('/api/stock-images/:photoId', async (req, res) => {
  try {
    const photo = await getPhoto(parseInt(req.params.photoId));
    res.json(photo);
  } catch (error) {
    console.error('[pexels] Get photo error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =====================
// Document Import Endpoints
// =====================

// Configure multer for document uploads
const documentStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const docsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    try {
      await fs.mkdir(docsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create documents directory:', error);
    }
    cb(null, docsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for documents
  fileFilter: (req, file, cb) => {
    const allowedTypes = /md|markdown|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMimes = [
      'text/markdown',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const mimeOk = allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('text/');

    if (mimeOk || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only markdown (.md), Word (.docx), and text (.txt) files are allowed'));
    }
  }
});

// Upload and parse a document
app.post('/api/documents/upload', documentUpload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const filePath = req.file.path;
    console.log(`[document] Parsing uploaded document: ${req.file.originalname}`);

    // Parse the document
    const parsed = await parseDocument(filePath);

    // Optionally clean up the uploaded file
    // await fs.unlink(filePath);

    res.json({
      success: true,
      filename: req.file.originalname,
      parsed,
    });
  } catch (error) {
    console.error('[document] Upload/parse error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Parse markdown content directly (no file upload)
app.post('/api/documents/parse-markdown', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    const parsed = parseMarkdownContent(content);
    res.json({ success: true, parsed });
  } catch (error) {
    console.error('[document] Parse markdown error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate video seed from parsed document
app.post('/api/documents/generate-video-seed', async (req, res) => {
  try {
    const { parsedDocument, options } = req.body;
    if (!parsedDocument) {
      return res.status(400).json({ error: 'No parsed document provided' });
    }

    const videoSeed = generateVideoSeed(parsedDocument, options || {});
    res.json({ success: true, videoSeed });
  } catch (error) {
    console.error('[document] Generate video seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Combined endpoint: Upload document and generate video seed
app.post('/api/documents/to-video-seed', documentUpload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    // Parse options from request body
    let options = {};
    if (req.body.options) {
      try {
        options = JSON.parse(req.body.options);
      } catch (e) {
        // Ignore invalid JSON
      }
    }

    const filePath = req.file.path;
    console.log(`[document] Processing document to video seed: ${req.file.originalname}`);

    // Parse the document
    const parsed = await parseDocument(filePath);

    // Generate video seed
    const videoSeed = generateVideoSeed(parsed, options);

    res.json({
      success: true,
      filename: req.file.originalname,
      parsed,
      videoSeed,
    });
  } catch (error) {
    console.error('[document] Document to video seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create video from video seed
app.post('/api/documents/create-video-from-seed', async (req, res) => {
  try {
    const { videoSeed, clientId, templateId, themeId } = req.body;

    if (!videoSeed || !videoSeed.scenes) {
      return res.status(400).json({ error: 'Invalid video seed provided' });
    }

    // Create the video record
    const video = videoDb.create({
      title: videoSeed.title || 'Imported Video',
      description: videoSeed.description || '',
      client_id: clientId || null,
      template_id: templateId || 'basic-explainer',
      theme_id: themeId || 'modern-dark',
    });

    // Convert video seed scenes to database scenes
    const createdScenes = [];
    for (let i = 0; i < videoSeed.scenes.length; i++) {
      const seedScene = videoSeed.scenes[i];

      // Map scene type to template scene type
      let sceneType = 'text-only';
      if (seedScene.type === 'intro' || seedScene.type === 'outro') {
        sceneType = 'text-only';
      } else if (seedScene.type === 'stats') {
        sceneType = 'stats';
      } else if (seedScene.type === 'quote') {
        sceneType = 'quote';
      } else if (seedScene.type === 'bullet-list') {
        sceneType = 'text-only';
      }

      // Build scene content
      const content = {
        headline: seedScene.title,
        supportingText: Array.isArray(seedScene.content)
          ? seedScene.content.join('\n')
          : seedScene.content,
        narration: seedScene.narration,
      };

      // Add scene-type specific content
      if (sceneType === 'stats' && seedScene.content.length > 0) {
        // Try to extract numbers from content
        const numbers = seedScene.content.join(' ').match(/\d+/g);
        if (numbers && numbers.length > 0) {
          content.stats = numbers.slice(0, 3).map((num, idx) => ({
            value: parseInt(num),
            label: seedScene.content[idx] || `Stat ${idx + 1}`,
          }));
        }
      }

      if (sceneType === 'quote' && seedScene.content.length > 0) {
        content.quote = seedScene.content[0];
        content.attribution = seedScene.title;
      }

      const scene = sceneDb.create({
        video_id: video.id,
        type: sceneType,
        order_index: i,
        duration_frames: Math.round(seedScene.estimatedDuration * 30), // 30fps
        content,
      });

      createdScenes.push(scene);
    }

    res.json({
      success: true,
      video,
      scenes: createdScenes,
    });
  } catch (error) {
    console.error('[document] Create video from seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================
// After Effects Plugin Download
// =============================

// Download AE plugin as a zip file
app.get('/api/ae-plugin', async (req, res) => {
  try {
    const pluginDir = path.join(process.cwd(), 'ae-plugin');

    // Check if plugin directory exists
    try {
      await fs.access(pluginDir);
    } catch {
      return res.status(404).json({ error: 'AE plugin not found' });
    }

    // Set response headers for zip download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="rendomat-ae-plugin.zip"');

    // Create zip archive
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('[ae-plugin] Archive error:', err);
      res.status(500).json({ error: 'Failed to create zip archive' });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add the ae-plugin directory contents to the zip
    archive.directory(pluginDir, 'rendomat-ae-plugin');

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error('[ae-plugin] Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Auth & User API
// =============================

// Sync user from NextAuth callback (server-to-server only)
app.post('/api/auth/sync-user', (req, res) => {
  // Verify shared secret to prevent unauthorized account creation
  const syncSecret = process.env.NEXTAUTH_SECRET;
  const providedSecret = req.headers['x-auth-sync-secret'];
  if (!syncSecret || providedSecret !== syncSecret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { email, name, image, provider, provider_id } = req.body;
    if (!email || !provider || !provider_id) {
      return res.status(400).json({ error: 'Missing required fields: email, provider, provider_id' });
    }
    const user = userDb.upsert({ email, name, image, provider, provider_id });
    res.json(user);
  } catch (error) {
    console.error('[auth] Sync user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
app.get('/api/users/me', authenticateToken, (req, res) => {
  const user = userDb.getById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Get credit transaction history
app.get('/api/users/me/transactions', authenticateToken, (req, res) => {
  const transactions = creditTransactionDb.getAllForUser(req.user.id);
  res.json(transactions);
});

// =============================
// Billing API
// =============================

// Get available credit packages
app.get('/api/billing/packages', (_req, res) => {
  res.json({ packages: CREDIT_PACKAGES });
});

// Create checkout session
app.post('/api/billing/checkout', authenticateToken, async (req, res) => {
  try {
    const { packageId } = req.body;
    const session = await createCheckoutSession(req.user.id, packageId);
    res.json({ url: session.url });
  } catch (error) {
    console.error('[billing] Checkout error:', error);
    res.status(400).json({ error: error.message });
  }
});

// =============================
// URL-to-Video Pipeline
// =============================

// Step 1: Analyze a URL (returns analysis + recommendations, user can override)
app.post('/api/videos/analyze-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`[url-to-video] Analyzing: ${url}`);
    const analysis = await analyzeUrl(url);
    console.log(`[url-to-video] Analysis complete: "${analysis.title}" (${analysis.contentType}), recommended template: ${analysis.recommendedTemplate}`);

    res.json(analysis);
  } catch (error) {
    console.error('[url-to-video] Analysis failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Step 2: Generate video from URL (uses analysis + optional overrides)
app.post('/api/videos/generate-from-url', async (req, res) => {
  try {
    const {
      url,
      clientId,
      // All overridable — if omitted, auto-analyzed
      title: overrideTitle,
      templateId: overrideTemplate,
      sceneCount: overrideSceneCount,
      companyDetails: overrideCompanyDetails,
      description: overrideDescription,
      personas,
      behaviorOverrides,
      themeId,
      aspectRatio,
      useResearch,     // whether to do web research beyond the URL
    } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate persona IDs if provided
    if (personas && Array.isArray(personas) && personas.length > 0) {
      const validation = validatePersonaIds(personas);
      if (!validation.isValid) {
        return res.status(400).json({
          error: `Invalid persona IDs: ${validation.invalid.join(', ')}`
        });
      }
    }

    // Step 1: Analyze the URL
    console.log(`[url-to-video] Analyzing URL: ${url}`);
    const analysis = await analyzeUrl(url);
    console.log(`[url-to-video] Detected: "${analysis.title}" (${analysis.contentType})`);

    // Merge overrides with analysis
    const finalTitle = overrideTitle || analysis.title;
    const finalTemplate = overrideTemplate || analysis.recommendedTemplate;
    const finalSceneCount = overrideSceneCount || analysis.sceneCount;
    const finalCompanyDetails = overrideCompanyDetails || analysis.companyDetails;
    const finalDescription = overrideDescription || analysis.description;

    // Step 2: Generate scenes (with or without research)
    let scenes;
    let researchData = null;

    if (useResearch) {
      const { performResearch } = await import('./research-service.mjs');
      const { generateSlidesWithResearch } = await import('./research-service.mjs');

      console.log(`[url-to-video] Performing research for: ${finalDescription}`);
      const research = await performResearch(finalDescription, {
        websiteUrl: url,
        companyName: finalCompanyDetails.companyName,
        industry: finalCompanyDetails.industry,
        searchWeb: true,
      });

      const result = await generateSlidesWithResearch(finalDescription, {
        research,
        personas: personas || ['vsl-expert'],
        behaviorOverrides: behaviorOverrides || {},
        sceneCount: finalSceneCount,
        companyDetails: finalCompanyDetails,
      });

      scenes = result.scenes;
      researchData = {
        citations_used: result.citations_used,
        case_studies_used: result.case_studies_used,
        summary: result.research_summary,
      };
    } else {
      console.log(`[url-to-video] Generating ${finalSceneCount} scenes with template: ${finalTemplate}`);
      scenes = await generateSlidesFromDescription(
        finalDescription,
        finalTemplate,
        finalSceneCount,
        finalCompanyDetails,
        personas,
        behaviorOverrides
      );
    }

    console.log(`[url-to-video] Generated ${scenes.length} scenes`);

    // Step 3: Create video in DB
    const FPS = 30;
    const template = getTemplate(finalTemplate);
    const templateDefaults = template ? {
      composition_id: template.composition_id,
      duration_seconds: template.duration_seconds,
      aspect_ratio: template.aspect_ratio,
    } : {};

    const videoId = videoDb.create({
      client_id: clientId || null,
      title: finalTitle,
      composition_id: templateDefaults.composition_id || 'FullVideo',
      status: 'draft',
      aspect_ratio: aspectRatio || templateDefaults.aspect_ratio || '16:9',
      theme_id: themeId || 'tech-dark',
      data: JSON.stringify({
        source_url: url,
        content_type: analysis.contentType,
        template_used: finalTemplate,
        generated_at: new Date().toISOString(),
      }),
    });

    // Step 4: Create scenes in DB
    let currentFrame = 0;
    for (const scene of scenes) {
      const durationFrames = template?.scenes?.[scene.scene_number]
        ? (template.scenes[scene.scene_number].end_frame - template.scenes[scene.scene_number].start_frame)
        : 5 * FPS; // default 5 seconds per scene

      sceneDb.create({
        video_id: videoId,
        scene_number: scene.scene_number,
        name: scene.name,
        scene_type: scene.scene_type,
        start_frame: currentFrame,
        end_frame: currentFrame + durationFrames,
        data: JSON.stringify(scene.data),
      });
      currentFrame += durationFrames;
    }

    // Update video duration
    videoDb.update(videoId, { duration_seconds: Math.ceil(currentFrame / FPS) });

    const video = videoDb.getById(videoId);
    const createdScenes = sceneDb.getAllForVideo(videoId);

    console.log(`[url-to-video] Created video #${videoId} with ${createdScenes.length} scenes (${Math.ceil(currentFrame / FPS)}s)`);

    res.json({
      video,
      scenes: createdScenes,
      analysis: {
        sourceUrl: url,
        contentType: analysis.contentType,
        recommendedTemplate: analysis.recommendedTemplate,
        templateUsed: finalTemplate,
        templateReasoning: analysis.templateReasoning,
        companyDetails: finalCompanyDetails,
      },
      research: researchData,
    });
  } catch (error) {
    console.error('[url-to-video] Generation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================
// Cloud Render API
// =============================

// Check if Lambda is configured
app.get('/api/render/capabilities', (_req, res) => {
  res.json({
    local: true,
    cloud: isLambdaConfigured(),
  });
});

// Trigger cloud render
app.post('/api/videos/:videoId/render-cloud', authenticateToken, async (req, res) => {
  const videoId = parseInt(req.params.videoId, 10);

  if (!isLambdaConfigured()) {
    return res.status(400).json({ error: 'Cloud rendering not configured' });
  }

  // Validate video exists and has scenes before accepting
  const video = videoDb.getById(videoId);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  const scenes = sceneDb.getAllForVideo(videoId);
  if (!scenes.length) {
    return res.status(400).json({ error: 'Video has no scenes to render' });
  }

  // Calculate credit cost: 1 credit per 10 seconds, minimum 1 per scene
  const creditCost = scenes.reduce((sum, s) => {
    const durationSeconds = (s.end_frame - s.start_frame) / 30;
    return sum + Math.max(1, Math.ceil(durationSeconds / 10));
  }, 0);

  // Check credits
  const user = userDb.getById(req.user.id);
  if (!user || user.credits < creditCost) {
    return res.status(402).json({ error: `Insufficient credits. This render costs ${creditCost} credits, you have ${user?.credits ?? 0}.` });
  }

  try {
    // Start render in background, send immediate response
    res.json({ started: true, videoId });

    // Set up SSE state for progress
    setVideoRenderState(videoId, {
      stage: 'starting',
      progress: 0,
      renderMode: 'cloud',
    });

    const result = await renderOnLambda(videoId, req.user.id, (progress) => {
      setVideoRenderState(videoId, {
        ...progress,
        renderMode: 'cloud',
      });
    });

    setVideoRenderState(videoId, {
      stage: 'complete',
      progress: 100,
      renderMode: 'cloud',
      outputUrl: result.outputUrl,
    });

    setTimeout(() => cleanupVideoRenderState(videoId), 30000);
  } catch (error) {
    console.error('[cloud-render] Error:', error);
    setVideoRenderState(videoId, {
      stage: 'error',
      error: error.message,
      renderMode: 'cloud',
    });
    setTimeout(() => cleanupVideoRenderState(videoId), 30000);
  }
});

// Clean old cache periodically (once per hour)
setInterval(() => {
  cleanCache().catch(console.error);
}, 60 * 60 * 1000);

export function startServer(port = PORT) {
  return new Promise((resolve) => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Remotion render server listening on http://localhost:${port}`);
      console.log(`Database and API routes initialized`);
      if (DEBUG) logBinary('ffmpeg', ['-version']);
      resolve(app);
    });
  });
}

// Auto-start when run directly (not imported by Electron)
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('render-server.mjs') ||
  process.argv[1].endsWith('render-server')
);

if (isDirectRun) {
  startServer();
}



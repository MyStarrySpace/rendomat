import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fork } from 'node:child_process';

import { bundle } from '@remotion/bundler';
import { clientDb, videoDb, sceneDb } from './database.mjs';
import { renderScene, stitchScenes, cleanCache } from './scene-renderer.mjs';

const PORT = Number(process.env.PORT || 8787);
const DEBUG = String(process.env.RENDER_DEBUG || '').toLowerCase() === 'true';
const ALLOWED_ORIGINS = (process.env.RENDER_ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const entryPoint = path.join(process.cwd(), 'remotion', 'index.ts');
const bundleLocation = path.join(process.cwd(), '.remotion-bundle-server');

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
app.use(express.json({ limit: '2mb' }));

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
    const id = videoDb.create(req.body);
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

// =============================
// Scene-Based Rendering API
// =============================

app.post('/api/videos/:videoId/render-scenes', async (req, res) => {
  try {
    const video = videoDb.getById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const scenes = sceneDb.getAllForVideo(req.params.videoId);
    if (scenes.length === 0) {
      return res.status(400).json({ error: 'No scenes found for this video' });
    }

    const serveUrl = await getServeUrl();
    const scenePaths = [];

    // Render each scene (using cache when possible)
    for (const scene of scenes) {
      const inputProps = video.data ? JSON.parse(video.data) : {};
      const scenePath = await renderScene(
        scene.id,
        serveUrl,
        video.composition_id,
        inputProps,
        (progress) => {
          console.log(`Scene ${scene.scene_number} progress: ${(progress * 100).toFixed(1)}%`);
        }
      );
      scenePaths.push(scenePath);
    }

    // Stitch scenes together
    const outputPath = path.join(os.tmpdir(), `video-${video.id}-${Date.now()}.mp4`);
    await stitchScenes(scenePaths, outputPath);

    // Update video with output path
    videoDb.update(video.id, { output_path: outputPath, status: 'completed' });

    // Read and send the video file
    const file = await fs.readFile(outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${video.title}.mp4"`);
    res.status(200).send(file);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clean old cache periodically (once per hour)
setInterval(() => {
  cleanCache().catch(console.error);
}, 60 * 60 * 1000);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Remotion render server listening on http://localhost:${PORT}`);
  console.log(`Database and API routes initialized`);
  if (DEBUG) logBinary('ffmpeg', ['-version']);
});



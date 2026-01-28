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
import { clientDb, videoDb, sceneDb, transitionDb } from './database.mjs';
import { renderScene, stitchScenes, cleanCache } from './scene-renderer.mjs';
import { getAllTemplates, getTemplate, createScenesFromTemplate } from './templates.mjs';
import { generateSlidesFromDescription, generateChartData, generateEquation, improveSceneContent, searchTopicData } from './ai-service.mjs';
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
    const outputPath = path.join(os.tmpdir(), `video-${videoId}-${Date.now()}.mp4`);
    await stitchScenes(scenePaths, outputPath);

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
      const outputPath = path.join(os.tmpdir(), `video-${video.id}-${aspectRatio.replace(':', 'x')}-${Date.now()}.mp4`);
      await stitchScenes(scenePaths, outputPath);

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
app.get('/api/videos/:videoId/render-progress', (req, res) => {
  const videoId = parseInt(req.params.videoId, 10);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  subscribeVideoRender(videoId, res);
  res.write(`: connected\n\n`);

  // Send current state if available
  const currentState = getVideoRenderState(videoId);
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
  // Import themes inline to avoid circular dependencies
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
        textPrimary: '#2D2D2D',
        textSecondary: '#6B6B6B',
        accent: '#D4845F',
      },
      fonts: { heading: 'Montserrat', body: 'Source Sans Pro' },
    },
    'corporate-blue': {
      id: 'corporate-blue',
      name: 'Corporate Blue',
      colors: {
        background: '#0F1D3D',
        textPrimary: '#FFFFFF',
        textSecondary: '#CBD5E0',
        accent: '#F6AD55',
      },
      fonts: { heading: 'Montserrat', body: 'Inter' },
    },
    'vibrant-gradient': {
      id: 'vibrant-gradient',
      name: 'Vibrant Gradient',
      colors: {
        background: '#1A1A2E',
        textPrimary: '#FFFFFF',
        textSecondary: '#E0E0E0',
        accent: '#FF00FF',
      },
      fonts: { heading: 'Montserrat', body: 'Poppins' },
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



/* eslint-disable no-console */
// Worker process to run Remotion renderMedia() without blocking the HTTP server event loop.

const fs = require('node:fs/promises');
const fssync = require('node:fs');
const path = require('node:path');
const { renderMedia, selectComposition } = require('@remotion/renderer');

async function main() {
  const jobId = process.env.JOB_ID;
  const serveUrl = process.env.SERVE_URL;
  const outPath = process.env.OUT_PATH;
  const inputPath = process.env.INPUT_JSON;
  const compositionId = process.env.COMPOSITION_ID || 'PolicyWrappedSquare';
  const debug = String(process.env.RENDER_DEBUG || '').toLowerCase() === 'true';
  const browserExecutableFromEnv = process.env.BROWSER_EXECUTABLE || null;

  if (!jobId || !serveUrl || !outPath || !inputPath) {
    throw new Error('Missing env vars: JOB_ID, SERVE_URL, OUT_PATH, INPUT_JSON');
  }

  const raw = await fs.readFile(inputPath, 'utf8');
  const inputProps = JSON.parse(raw);

  const send = (msg) => {
    if (process.send) process.send(msg);
  };

  const tryGuessBrowserExecutable = () => {
    // Default location of Chrome Headless Shell downloaded by `remotion browser ensure`
    // This is Windows-specific, but if it doesn't exist we just return null and let Remotion decide.
    const guess = path.join(
      process.cwd(),
      'node_modules',
      '.remotion',
      'chrome-headless-shell',
      'win64',
      'chrome-headless-shell-win64',
      'chrome-headless-shell.exe'
    );
    return fssync.existsSync(guess) ? guess : null;
  };

  const browserExecutable = browserExecutableFromEnv || tryGuessBrowserExecutable();

  if (debug) {
    send({
      type: 'log',
      level: 'info',
      message: `worker starting. browserExecutable=${browserExecutable || '(auto)'}`,
    });
  }

  send({ type: 'stage', stage: 'starting-browser' });

  // First, get the composition metadata to ensure proper frame calculations
  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    browserExecutable: browserExecutable || undefined,
    chromeMode: 'headless-shell',
    chromiumOptions: {
      gl: null,
      args: ['--disable-dev-shm-usage'],
    },
    logLevel: 'error', // Only log errors to avoid console flooding
    inputProps,
  });

  if (debug) {
    send({
      type: 'log',
      level: 'info',
      message: `composition selected: ${composition.width}x${composition.height}, ${composition.durationInFrames} frames @ ${composition.fps}fps`,
    });
  }

  // Note: Each scene is rendered independently from frame 0 with its own durationInFrames
  // The composition uses calculateMetadata to set duration from inputProps.durationInFrames
  // START_FRAME and END_FRAME env vars are no longer used for frameRange

  let lastPercent = -1;
  await renderMedia({
    serveUrl,
    composition,  // Pass the full composition object instead of just the ID string
    codec: 'h264',
    outputLocation: outPath,
    inputProps,
    // Start conservative to avoid Windows headless GPU / resource issues.
    concurrency: 1,
    logLevel: 'error', // Only log errors to avoid console flooding
    timeoutInMilliseconds: 120000,
    chromeMode: 'headless-shell',
    browserExecutable: browserExecutable || undefined,
    // Match what the CLI uses on Windows: gl = null.
    chromiumOptions: {
      gl: null,
      // These flags are generally safe and can help in locked-down environments.
      // (Remotion will merge with its defaults.)
      args: ['--disable-dev-shm-usage'],
    },
    dumpBrowserLogs: false, // Disable browser log dumping to reduce console spam
    onStart: () => {
      send({ type: 'stage', stage: 'started' });
      if (debug) send({ type: 'log', level: 'info', message: 'renderMedia() started' });
    },
    onBrowserLog: (log) => {
      // Log all browser messages for debugging
      send({ type: 'log', level: log.type || 'info', message: String(log.text ?? '') });
    },
    // IMPORTANT: ffmpegOverride in Remotion v4 receives {type, args} object
    ffmpegOverride: ({ type, args }) => {
      if (!Array.isArray(args) || args.length === 0) return args;
      // Add bitrate options before the output file (last argument)
      const out = args[args.length - 1];
      const rest = args.slice(0, -1);
      return [...rest, '-b:v', '12M', '-maxrate', '18M', '-bufsize', '24M', out];
    },
    onProgress: (p) => {
      const total = Math.max(1, p.totalFrames ?? 1);
      const rendered = p.renderedFrames ?? 0;
      const encoded = p.encodedFrames ?? 0;
      const prog = Math.max(0, Math.min(1, (rendered + encoded) / (2 * total)));
      const mapped = 0.06 + prog * 0.90;
      const percent = Math.floor(mapped * 100);
      if (percent !== lastPercent) {
        lastPercent = percent;
        send({ type: 'progress', stage: prog > 0 ? 'rendering' : 'starting-browser', progress: mapped, rendered, encoded, total });
      }
    },
  });

  send({ type: 'done', outPath });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    if (process.send) process.send({ type: 'error', error: err?.message || String(err) });
    process.exit(1);
  });



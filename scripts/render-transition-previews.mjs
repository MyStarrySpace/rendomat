import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

// Hardcoded list — must match remotion/lib/transitions.ts TransitionType
const TRANSITION_TYPES = [
  'crossfade',
  'fade-black',
  'fade-white',
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'wipe-left',
  'wipe-right',
  'wipe-up',
  'wipe-down',
  'zoom-in',
  'zoom-out',
  'blur',
  'glitch',
  'morph',
  'flash',
  'spin',
  'flip',
  'pixelate',
  'iris-close',
  'clock-wipe',
  'push-left',
];

// Duration presets matching TRANSITION_PRESETS in transitions.ts
const DURATION_FRAMES = {
  'crossfade': 20,
  'fade-black': 30,
  'fade-white': 30,
  'slide-left': 20,
  'slide-right': 20,
  'slide-up': 20,
  'slide-down': 20,
  'wipe-left': 18,
  'wipe-right': 18,
  'wipe-up': 18,
  'wipe-down': 18,
  'zoom-in': 24,
  'zoom-out': 24,
  'blur': 24,
  'glitch': 12,
  'morph': 30,
  'flash': 12,
  'spin': 24,
  'flip': 24,
  'pixelate': 20,
  'iris-close': 24,
  'clock-wipe': 24,
  'push-left': 20,
};

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const singleType = getArg('--type');
  const typesToRender = singleType ? [singleType] : TRANSITION_TYPES;

  // Validate requested type
  if (singleType && !TRANSITION_TYPES.includes(singleType)) {
    console.error(`Unknown transition type: ${singleType}`);
    console.error(`Available types: ${TRANSITION_TYPES.join(', ')}`);
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'public', 'transitions');
  await fs.mkdir(outDir, { recursive: true });

  const entryPoint = path.join(process.cwd(), 'remotion', 'index.ts');
  const bundleLocation = path.join(process.cwd(), '.remotion-bundle');

  console.log('Bundling Remotion project...');
  const serveUrl = await bundle({
    entryPoint,
    outDir: bundleLocation,
  });
  console.log('Bundle complete.\n');

  const total = typesToRender.length;
  for (let i = 0; i < total; i++) {
    const type = typesToRender[i];
    const durationFrames = DURATION_FRAMES[type] || 30;
    const outputPath = path.join(outDir, `${type}.mp4`);

    console.log(`Rendering ${type}... (${i + 1}/${total})`);

    const inputProps = { transitionType: type, durationFrames };

    const composition = await selectComposition({
      serveUrl,
      id: 'TransitionPreview',
      inputProps,
    });

    await renderMedia({
      serveUrl,
      composition,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    });

    console.log(`  → ${outputPath}`);
  }

  console.log(`\nDone! Rendered ${total} transition preview(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const ANIMATION_TYPES = [
  'particles',
  'floating-shapes',
  'waves',
  'grid-pulse',
  'bokeh',
  'geometric',
  'matrix',
  'aurora',
  'confetti',
];

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const singleType = getArg('--type');
  const themeId = getArg('--theme') || 'tech-dark';
  const speedOverride = getArg('--speed');
  const typesToRender = singleType ? [singleType] : ANIMATION_TYPES;

  if (singleType && !ANIMATION_TYPES.includes(singleType)) {
    console.error(`Unknown animation type: ${singleType}`);
    console.error(`Available types: ${ANIMATION_TYPES.join(', ')}`);
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'public', 'animations');
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
    const durationFrames = 300;
    const outputPath = path.join(outDir, `${type}.mp4`);

    console.log(`Rendering ${type}... (${i + 1}/${total})`);

    const inputProps = {
      animationStyle: type,
      animationIntensity: 'medium',
      themeId,
      durationFrames,
      ...(speedOverride
        ? { animationParams: { speed: parseFloat(speedOverride) } }
        : {}),
    };

    const composition = await selectComposition({
      serveUrl,
      id: 'AnimationPreview',
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

  console.log(`\nDone! Rendered ${total} animation preview(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

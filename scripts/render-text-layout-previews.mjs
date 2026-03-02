import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

// Must match TextLayoutPreset in remotion/lib/textLayouts.ts
const LAYOUTS = [
  'centered',
  'bottom-left',
  'lower-third',
  'split',
  'top-right',
  'full-bleed',
  'stacked',
  'offset',
  'diagonal',
];

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const singleLayout = getArg('--layout');
  const layoutsToRender = singleLayout ? [singleLayout] : LAYOUTS;

  if (singleLayout && !LAYOUTS.includes(singleLayout)) {
    console.error(`Unknown layout: ${singleLayout}`);
    console.error(`Available layouts: ${LAYOUTS.join(', ')}`);
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'public', 'text-layouts');
  await fs.mkdir(outDir, { recursive: true });

  const entryPoint = path.join(process.cwd(), 'remotion', 'index.ts');
  const bundleLocation = path.join(process.cwd(), '.remotion-bundle');

  console.log('Bundling Remotion project...');
  const serveUrl = await bundle({
    entryPoint,
    outDir: bundleLocation,
  });
  console.log('Bundle complete.\n');

  const total = layoutsToRender.length;
  for (let i = 0; i < total; i++) {
    const layout = layoutsToRender[i];
    const durationFrames = 120;
    const outputPath = path.join(outDir, `${layout}.mp4`);

    console.log(`Rendering ${layout}... (${i + 1}/${total})`);

    const inputProps = {
      layout,
      durationFrames,
      themeId: 'tech-dark',
    };

    const composition = await selectComposition({
      serveUrl,
      id: 'TextLayoutPreview',
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

  console.log(`\nDone! Rendered ${total} text layout preview(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

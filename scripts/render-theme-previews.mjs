import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const THEMES = [
  'tech-dark',
  'artisanal-light',
  'clinical-light',
  'corporate-blue',
  'minimal-mono',
  'vibrant-gradient',
  'ocean-blue-green',
];

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const singleTheme = getArg('--theme');
  const themesToRender = singleTheme ? [singleTheme] : THEMES;

  if (singleTheme && !THEMES.includes(singleTheme)) {
    console.error(`Unknown theme: ${singleTheme}`);
    console.error(`Available themes: ${THEMES.join(', ')}`);
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'public', 'themes');
  await fs.mkdir(outDir, { recursive: true });

  const entryPoint = path.join(process.cwd(), 'remotion', 'index.ts');
  const bundleLocation = path.join(process.cwd(), '.remotion-bundle');

  console.log('Bundling Remotion project...');
  const serveUrl = await bundle({
    entryPoint,
    outDir: bundleLocation,
  });
  console.log('Bundle complete.\n');

  const durationFrames = 300;
  const total = themesToRender.length;

  for (let i = 0; i < total; i++) {
    const themeId = themesToRender[i];
    const outputPath = path.join(outDir, `${themeId}.mp4`);

    console.log(`Rendering ${themeId}... (${i + 1}/${total})`);

    const inputProps = { themeId, durationFrames };

    const composition = await selectComposition({
      serveUrl,
      id: 'ThemePreview',
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

  console.log(`\nDone! Rendered ${total} theme preview(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

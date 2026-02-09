import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const PRESETS = [
  'minimal',
  'smooth',
  'energetic',
  'dramatic',
  'elegant',
  'kinetic',
  'typewriter',
  'cinematic',
  'spiral',
  'stacking',
  'cascade',
  'burst',
  'echo',
];

const MODIFIERS = ['chromatic', 'blur-in', 'glow', 'glitch'];

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  const singlePreset = getArg('--preset');
  const singleModifier = getArg('--modifier');
  const presetsToRender = singlePreset ? [singlePreset] : PRESETS;

  if (singlePreset && !PRESETS.includes(singlePreset)) {
    console.error(`Unknown preset: ${singlePreset}`);
    console.error(`Available presets: ${PRESETS.join(', ')}`);
    process.exit(1);
  }

  if (singleModifier && !MODIFIERS.includes(singleModifier)) {
    console.error(`Unknown modifier: ${singleModifier}`);
    console.error(`Available modifiers: ${MODIFIERS.join(', ')}`);
    process.exit(1);
  }

  const outDir = path.join(process.cwd(), 'public', 'text-animations');
  await fs.mkdir(outDir, { recursive: true });

  const entryPoint = path.join(process.cwd(), 'remotion', 'index.ts');
  const bundleLocation = path.join(process.cwd(), '.remotion-bundle');

  console.log('Bundling Remotion project...');
  const serveUrl = await bundle({
    entryPoint,
    outDir: bundleLocation,
  });
  console.log('Bundle complete.\n');

  // Presets that get modifier variant renders
  const MODIFIER_PRESETS = ['spiral', 'typewriter'];

  function getDuration(preset) {
    if (preset === 'spiral') return 300;
    if (preset === 'typewriter') return 210;
    if (preset === 'echo') return 150;
    // Character-level presets need longer duration for stagger
    if (preset === 'elegant' || preset === 'stacking') return 120;
    return 90;
  }

  // Build list of renders: preset + optional modifier combos
  const renders = [];

  if (singleModifier) {
    // Render only the specified preset(s) with the specified modifier
    for (const preset of presetsToRender) {
      renders.push({ preset, modifier: singleModifier });
    }
  } else {
    // Render plain presets
    for (const preset of presetsToRender) {
      renders.push({ preset, modifier: undefined });
    }
    // Render modifier variants for special presets
    for (const modPreset of MODIFIER_PRESETS) {
      if (!singlePreset || singlePreset === modPreset) {
        for (const mod of MODIFIERS) {
          renders.push({ preset: modPreset, modifier: mod });
        }
      }
    }
  }

  const total = renders.length;
  for (let i = 0; i < total; i++) {
    const { preset, modifier } = renders[i];
    const durationFrames = getDuration(preset);
    const filename = modifier ? `${preset}-${modifier}.mp4` : `${preset}.mp4`;
    const outputPath = path.join(outDir, filename);
    const label = modifier ? `${preset} + ${modifier}` : preset;

    console.log(`Rendering ${label}... (${i + 1}/${total})`);

    const inputProps = {
      preset,
      durationFrames,
      modifier: modifier ?? undefined,
    };

    const composition = await selectComposition({
      serveUrl,
      id: 'TextAnimationPreview',
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

  console.log(`\nDone! Rendered ${total} text animation preview(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TextOnlyScene } from './scenes';
import { getTheme } from './themes';
import type { TextLayoutPreset } from './lib/textLayouts';
import { LAYOUT_LABELS } from './lib/textLayouts';

export interface TextLayoutPreviewProps {
  layout: TextLayoutPreset;
  durationFrames?: number;
  themeId?: string;
}

const TITLE_TEXT = 'The Future\nof Video';
const BODY_TEXT =
  'Generate stunning video sales letters with AI-powered scenes and animations that captivate your audience.';

export const TextLayoutPreviewComposition: React.FC<TextLayoutPreviewProps> = ({
  layout,
  durationFrames = 120,
  themeId = 'tech-dark',
}) => {
  const theme = getTheme(themeId);

  return (
    <AbsoluteFill>
      <TextOnlyScene
        data={{
          title: TITLE_TEXT,
          body_text: BODY_TEXT,
          text_layout: layout,
          animation_preset: 'minimal',
        }}
        durationInFrames={durationFrames}
        theme={theme}
      />

      {/* Layout label overlay */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 20,
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'sans-serif',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          zIndex: 10,
        }}
      >
        {LAYOUT_LABELS[layout] ?? layout}
      </div>
    </AbsoluteFill>
  );
};

import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { TextOnlyScene, QuoteScene, StatsScene, BarChartScene } from './scenes';
import { getTheme, GOOGLE_FONTS, getGoogleFontsUrl } from './themes';

export interface ThemePreviewProps {
  themeId: string;
  durationFrames?: number;
}

const SCENE_DURATION = 75; // 2.5s per scene at 30fps

export const ThemePreviewComposition: React.FC<ThemePreviewProps> = ({
  themeId,
  durationFrames = 300,
}) => {
  const theme = getTheme(themeId);

  // Load fonts for this theme
  const fontNames = [theme.fonts.heading, theme.fonts.body];
  const uniqueFonts = [...new Set(fontNames)];
  const fontIds = uniqueFonts
    .map((name) => {
      const match = GOOGLE_FONTS.find(
        (f) => f.name.toLowerCase() === name.toLowerCase()
      );
      return match?.id;
    })
    .filter(Boolean) as string[];

  const fontsUrl = fontIds.length > 0 ? getGoogleFontsUrl(fontIds) : null;

  return (
    <AbsoluteFill>
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}

      {/* Scene 1: Text Only */}
      <Sequence from={0} durationInFrames={SCENE_DURATION}>
        <TextOnlyScene
          data={{
            title: 'Professional Videos',
            body_text: 'Create stunning content that captivates your audience and drives results.',
            animation_preset: 'static',
          }}
          durationInFrames={SCENE_DURATION}
          theme={theme}
          skipFadeOut
        />
      </Sequence>

      {/* Scene 2: Quote */}
      <Sequence from={SCENE_DURATION} durationInFrames={SCENE_DURATION}>
        <QuoteScene
          data={{
            quote: 'Design is intelligence made visible.',
            author: 'Alina Wheeler',
            animation_preset: 'static',
          }}
          durationInFrames={SCENE_DURATION}
          theme={theme}
          skipFadeOut
        />
      </Sequence>

      {/* Scene 3: Stats */}
      <Sequence from={SCENE_DURATION * 2} durationInFrames={SCENE_DURATION}>
        <StatsScene
          data={{
            stats_text: '85% | Client Satisfaction\n10K+ | Videos Created',
            animation_preset: 'static',
          }}
          durationInFrames={SCENE_DURATION}
          theme={theme}
          skipFadeOut
        />
      </Sequence>

      {/* Scene 4: Bar Chart */}
      <Sequence from={SCENE_DURATION * 3} durationInFrames={durationFrames - SCENE_DURATION * 3}>
        <BarChartScene
          data={{
            title: 'Growth Metrics',
            chart_data: JSON.stringify({
              labels: ['Q1', 'Q2', 'Q3', 'Q4'],
              values: [35, 52, 68, 89],
            }),
            animation_preset: 'static',
          }}
          durationInFrames={durationFrames - SCENE_DURATION * 3}
          theme={theme}
          skipFadeOut
        />
      </Sequence>

      {/* Theme name label overlay */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 20,
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'sans-serif',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          zIndex: 10,
        }}
      >
        {theme.name}
      </div>
    </AbsoluteFill>
  );
};

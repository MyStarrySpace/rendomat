import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
  TextOnlyScene,
  SingleImageScene,
  DualImagesScene,
  GridScene,
  QuoteScene,
  StatsScene,
  BarChartScene,
  LineChartScene,
  PieChartScene,
  ProgressBarsScene,
  AreaChartScene,
  ImageGalleryScene,
} from './scenes';
import { getTheme, Theme } from './themes';

export interface DynamicSceneProps {
  sceneType: string;
  data: any;
  durationInFrames: number;
  themeId?: string;
}

export const DynamicSceneComposition: React.FC<DynamicSceneProps> = ({
  sceneType,
  data,
  durationInFrames,
  themeId,
}) => {
  const theme = getTheme(themeId);

  // Select the appropriate scene component based on sceneType
  switch (sceneType) {
    case 'text-only':
      return <TextOnlyScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'single-image':
      return <SingleImageScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'dual-images':
      return <DualImagesScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'grid-2x2':
      return <GridScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'quote':
      return <QuoteScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'stats':
      return <StatsScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'bar-chart':
      return <BarChartScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'line-chart':
      return <LineChartScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'pie-chart':
      return <PieChartScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'progress-bars':
      return <ProgressBarsScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'area-chart':
      return <AreaChartScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    case 'image-gallery':
      return <ImageGalleryScene data={data} durationInFrames={durationInFrames} theme={theme} />;

    default:
      // Fallback to text-only if unknown scene type
      return (
        <AbsoluteFill style={{
          backgroundColor: '#0a0a0a',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          fontSize: 48,
        }}>
          <div>Unknown scene type: {sceneType}</div>
        </AbsoluteFill>
      );
  }
};

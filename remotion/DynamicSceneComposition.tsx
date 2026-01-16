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
} from './SceneComponents';

export interface DynamicSceneProps {
  sceneType: string;
  data: any;
  durationInFrames: number;
}

export const DynamicSceneComposition: React.FC<DynamicSceneProps> = ({
  sceneType,
  data,
  durationInFrames,
}) => {
  // Select the appropriate scene component based on sceneType
  switch (sceneType) {
    case 'text-only':
      return <TextOnlyScene data={data} durationInFrames={durationInFrames} />;

    case 'single-image':
      return <SingleImageScene data={data} durationInFrames={durationInFrames} />;

    case 'dual-images':
      return <DualImagesScene data={data} durationInFrames={durationInFrames} />;

    case 'grid-2x2':
      return <GridScene data={data} durationInFrames={durationInFrames} />;

    case 'quote':
      return <QuoteScene data={data} durationInFrames={durationInFrames} />;

    case 'stats':
      return <StatsScene data={data} durationInFrames={durationInFrames} />;

    case 'bar-chart':
      return <BarChartScene data={data} durationInFrames={durationInFrames} />;

    case 'line-chart':
      return <LineChartScene data={data} durationInFrames={durationInFrames} />;

    case 'pie-chart':
      return <PieChartScene data={data} durationInFrames={durationInFrames} />;

    case 'progress-bars':
      return <ProgressBarsScene data={data} durationInFrames={durationInFrames} />;

    case 'area-chart':
      return <AreaChartScene data={data} durationInFrames={durationInFrames} />;

    case 'image-gallery':
      return <ImageGalleryScene data={data} durationInFrames={durationInFrames} />;

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

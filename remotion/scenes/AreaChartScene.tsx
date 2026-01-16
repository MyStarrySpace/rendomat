import React from 'react';
import { SceneProps } from './types';
import { LineChartScene } from './LineChartScene';

// Area Chart (similar to line chart but filled)
export const AreaChartScene: React.FC<SceneProps> = ({ data, durationInFrames, theme }) => {
  // Reuse line chart logic but add fill
  return <LineChartScene data={data} durationInFrames={durationInFrames} theme={theme} />;
};

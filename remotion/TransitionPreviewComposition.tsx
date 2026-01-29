import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Transition } from './components/Transition';
import type { TransitionType } from './lib/transitions';

export interface TransitionPreviewProps {
  transitionType: TransitionType;
  durationFrames: number;
}

export const TransitionPreviewComposition: React.FC<TransitionPreviewProps> = ({
  transitionType,
  durationFrames,
}) => {
  return (
    <AbsoluteFill>
      <Transition
        transitionType={transitionType}
        durationFrames={durationFrames}
        sceneAColor="#E8636A"
        sceneBColor="#3BA5A8"
        width={320}
        height={180}
      />
    </AbsoluteFill>
  );
};

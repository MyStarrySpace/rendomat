import React from 'react';
import { AbsoluteFill, Series, useVideoConfig } from 'remotion';
import { DynamicSceneComposition, DynamicSceneProps } from './DynamicSceneComposition';
import { Transition } from './components/Transition';
import type { TransitionType } from './lib/transitions';

interface SceneInput {
  sceneType: string;
  data: any;
  durationInFrames: number;
  themeId?: string;
}

interface TransitionInput {
  fromSceneNumber: number;
  toSceneNumber: number;
  transitionType: string;
  durationFrames: number;
  config?: any;
}

export interface FullVideoProps {
  scenes: SceneInput[];
  transitions: TransitionInput[];
  totalDurationInFrames: number;
  themeId?: string;
}

export const FullVideoComposition: React.FC<FullVideoProps> = ({
  scenes,
  transitions,
  themeId,
}) => {
  // Build a map of transitions keyed by "from->to"
  const transitionMap = new Map<string, TransitionInput>();
  for (const t of transitions) {
    transitionMap.set(`${t.fromSceneNumber}->${t.toSceneNumber}`, t);
  }

  // Build series entries: scene, transition, scene, transition, ...
  const seriesEntries: React.ReactNode[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const key = `${i}->${i + 1}`;
    const transition = transitionMap.get(key);

    // Reduce scene duration by transition overlap
    let effectiveDuration = scene.durationInFrames;
    if (i > 0) {
      const prevKey = `${i - 1}->${i}`;
      const prevTransition = transitionMap.get(prevKey);
      if (prevTransition) {
        effectiveDuration -= Math.floor(prevTransition.durationFrames / 2);
      }
    }
    if (transition) {
      effectiveDuration -= Math.floor(transition.durationFrames / 2);
    }
    effectiveDuration = Math.max(effectiveDuration, 1);

    seriesEntries.push(
      <Series.Sequence durationInFrames={effectiveDuration} key={`scene-${i}`}>
        <DynamicSceneComposition
          sceneType={scene.sceneType}
          data={scene.data}
          durationInFrames={effectiveDuration}
          themeId={scene.themeId || themeId}
        />
      </Series.Sequence>
    );

    // Add transition between scenes
    if (transition && i < scenes.length - 1) {
      seriesEntries.push(
        <Series.Sequence
          durationInFrames={transition.durationFrames}
          key={`transition-${i}`}
        >
          <Transition
            transitionType={transition.transitionType as TransitionType}
            durationFrames={transition.durationFrames}
            config={transition.config}
          />
        </Series.Sequence>
      );
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Series>{seriesEntries}</Series>
    </AbsoluteFill>
  );
};

export const calculateFullVideoMetadata = ({ props }: { props: FullVideoProps }) => {
  return {
    durationInFrames: props.totalDurationInFrames || 300,
  };
};

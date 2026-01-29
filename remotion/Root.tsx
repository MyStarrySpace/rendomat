import React from 'react';
import { Composition } from 'remotion';
import { PolicyWrappedSquare } from './PolicyWrappedSquare';
import { CivicProfileVideo } from './CivicProfileVideo';
import { ClassProfileVideo } from './ClassProfileVideo';
import { UltrahumanVSL } from './UltrahumanVSL';
import { DynamicSceneComposition, DynamicSceneProps } from './DynamicSceneComposition';
import { ASPECT_RATIOS, type AspectRatioKey } from './aspect-ratios';
import { TransitionPreviewComposition, TransitionPreviewProps } from './TransitionPreviewComposition';
import { AnimationPreviewComposition, AnimationPreviewProps } from './AnimationPreviewComposition';
import type { PolicyWrappedRenderProps, CivicProfileRenderProps, ClassProfileRenderProps } from './types';

const defaultDynamicSceneProps: DynamicSceneProps = {
  sceneType: 'text-only',
  data: {
    title: 'Sample Title',
    body_text: 'Sample body text',
  },
  durationInFrames: 450,
  themeId: 'tech-dark',
  animationStyle: 'none' as const,
  animationIntensity: 'medium' as const,
};

// Calculate metadata to allow dynamic duration from inputProps
const calculateDynamicSceneMetadata = ({ props }: { props: DynamicSceneProps }) => {
  return {
    durationInFrames: props.durationInFrames || 450,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Legacy DynamicScene composition (16:9) - kept for backwards compatibility */}
      <Composition
        id="DynamicScene"
        component={DynamicSceneComposition}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultDynamicSceneProps}
        calculateMetadata={calculateDynamicSceneMetadata}
      />

      {/* DynamicScene-16x9 (1920x1080) - Landscape/YouTube/Website */}
      <Composition
        id="DynamicScene-16x9"
        component={DynamicSceneComposition}
        durationInFrames={450}
        fps={30}
        width={ASPECT_RATIOS['16:9'].width}
        height={ASPECT_RATIOS['16:9'].height}
        defaultProps={defaultDynamicSceneProps}
        calculateMetadata={calculateDynamicSceneMetadata}
      />

      {/* DynamicScene-1x1 (1080x1080) - Square/Instagram Feed/LinkedIn */}
      <Composition
        id="DynamicScene-1x1"
        component={DynamicSceneComposition}
        durationInFrames={450}
        fps={30}
        width={ASPECT_RATIOS['1:1'].width}
        height={ASPECT_RATIOS['1:1'].height}
        defaultProps={defaultDynamicSceneProps}
        calculateMetadata={calculateDynamicSceneMetadata}
      />

      {/* DynamicScene-9x16 (1080x1920) - Vertical/TikTok/Reels/Shorts */}
      <Composition
        id="DynamicScene-9x16"
        component={DynamicSceneComposition}
        durationInFrames={450}
        fps={30}
        width={ASPECT_RATIOS['9:16'].width}
        height={ASPECT_RATIOS['9:16'].height}
        defaultProps={defaultDynamicSceneProps}
        calculateMetadata={calculateDynamicSceneMetadata}
      />
      <Composition
        id="UltrahumanVSL"
        component={UltrahumanVSL}
        durationInFrames={345 * 30} // 5:45 at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PolicyWrappedSquare"
        component={PolicyWrappedSquare}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          displayName: 'Your Key Issues',
          label: 'Consensus Seeker',
          avgScore: 75,
          policies: [],
          urlText: 'example.com/wrapped',
        }}
      />
      <Composition
        id="CivicProfile"
        component={CivicProfileVideo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          studentName: 'Alex',
          topPriorities: [
            { id: '1', title: '$17 Minimum Wage' },
            { id: '2', title: 'Affordable Housing Supply' },
            { id: '3', title: 'Mental Health 988 Lifeline' },
          ],
          quote: 'These three issues are all connected for me. My older sister works full-time but still can\'t afford her own place. She has to juggle multiple jobs and still struggles to pay for healthcare. I think if we addressed housing and wages together, it would help so many families like mine.',
          stats: {
            policiesExplored: 8,
            discussionsJoined: 6,
            positionsRevised: 2,
          },
          urlText: 'civic-engine.app',
        }}
      />
      <Composition
        id="ClassProfile"
        component={ClassProfileVideo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          teacherName: 'Ms. Johnson',
          className: 'AP Government Period 3',
          topPolicies: [
            { id: '1', title: '$17 Minimum Wage', studentCount: 18 },
            { id: '2', title: 'Universal Background Checks', studentCount: 15 },
            { id: '3', title: 'Medicare Drug Negotiation', studentCount: 12 },
          ],
          stats: {
            totalStudents: 28,
            positionsSubmitted: 168,
            discussionPosts: 94,
            positionsRevised: 23,
          },
          urlText: 'civic-engine.app',
        }}
      />
      <Composition
        id="TransitionPreview"
        component={TransitionPreviewComposition}
        durationInFrames={30}
        fps={30}
        width={320}
        height={180}
        defaultProps={{ transitionType: 'crossfade' as const, durationFrames: 20 }}
        calculateMetadata={({ props }: { props: TransitionPreviewProps }) => ({
          durationInFrames: props.durationFrames || 30,
        })}
      />
      <Composition
        id="AnimationPreview"
        component={AnimationPreviewComposition}
        durationInFrames={90}
        fps={30}
        width={640}
        height={360}
        defaultProps={{
          animationStyle: 'particles' as const,
          animationIntensity: 'medium' as const,
          themeId: 'tech-dark',
          durationFrames: 90,
        }}
        calculateMetadata={({ props }: { props: AnimationPreviewProps }) => ({
          durationInFrames: props.durationFrames || 90,
        })}
      />
    </>
  );
};

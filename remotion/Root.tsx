import React from 'react';
import { Composition } from 'remotion';
import { PolicyWrappedSquare } from './PolicyWrappedSquare';
import { CivicProfileVideo } from './CivicProfileVideo';
import { ClassProfileVideo } from './ClassProfileVideo';
import { UltrahumanVSL } from './UltrahumanVSL';
import type { PolicyWrappedRenderProps, CivicProfileRenderProps, ClassProfileRenderProps } from './types';

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
    </>
  );
};



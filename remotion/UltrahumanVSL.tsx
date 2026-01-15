import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Sequence } from 'remotion';

// Font families
const FONT_BODY = "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

// Colors
const ULTRAHUMAN_GREEN = '#00D9A3';
const BG_DARK = '#0A0A0A';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#A0A0A0';

// Timing constants (in frames at 30fps)
const SCENE_0_START = 0;
const SCENE_0_END = 10 * 30; // 0:10

const SCENE_1_START = SCENE_0_END;
const SCENE_1_END = 50 * 30; // 0:50

const SCENE_2_START = SCENE_1_END;
const SCENE_2_END = 100 * 30; // 1:40

const SCENE_3_START = SCENE_2_END;
const SCENE_3_END = 160 * 30; // 2:40

const SCENE_4_START = SCENE_3_END;
const SCENE_4_END = 200 * 30; // 3:20

const SCENE_5_START = SCENE_4_END;
const SCENE_5_END = 260 * 30; // 4:20

const SCENE_6_START = SCENE_5_END;
const SCENE_6_END = 310 * 30; // 5:10

const SCENE_7_START = SCENE_6_END;
const SCENE_7_END = 345 * 30; // 5:45

// Scene 0: Cold Open
const Scene0: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeInDuration = 10;
  const fadeOutStart = (SCENE_0_END - SCENE_0_START) - 10;

  let opacity = 0;
  if (frame < fadeInDuration) {
    opacity = frame / fadeInDuration;
  } else if (frame > fadeOutStart) {
    opacity = 1 - ((frame - fadeOutStart) / 10);
  } else {
    opacity = 1;
  }

  return (
    <AbsoluteFill style={{ background: BG_DARK, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity, fontFamily: FONT_BODY, fontSize: 56, color: TEXT_PRIMARY, textAlign: 'center', maxWidth: 1000, lineHeight: 1.3, fontWeight: 400 }}>
        When health data multiplies, design changes.
      </div>
    </AbsoluteFill>
  );
};

// Scene 1: Respect the Ambition
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nodes = ['Ring', 'CGM', 'Blood', 'Environment'];
  const nodeDelay = 20; // frames between each node appearing

  return (
    <AbsoluteFill style={{ background: BG_DARK, justifyContent: 'center', alignItems: 'center', fontFamily: FONT_BODY }}>
      <div style={{ display: 'flex', gap: 80, marginBottom: 100 }}>
        {nodes.map((node, idx) => {
          const startFrame = idx * nodeDelay;
          const progress = Math.max(0, Math.min(1, (frame - startFrame) / 20));
          const opacity = progress;
          const translateY = interpolate(progress, [0, 1], [6, 0]);

          return (
            <div
              key={node}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                fontSize: 32,
                color: TEXT_PRIMARY,
                fontWeight: 300,
                textAlign: 'center',
              }}
            >
              <div style={{
                width: 120,
                height: 120,
                border: `2px solid ${ULTRAHUMAN_GREEN}`,
                borderRadius: '50%',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 217, 163, 0.05)'
              }} />
              {node}
            </div>
          );
        })}
      </div>

      <div style={{
        position: 'absolute',
        bottom: 80,
        fontSize: 28,
        color: TEXT_SECONDARY,
        opacity: frame > 60 ? 1 : 0,
        transition: 'opacity 0.5s'
      }}>
        A unified view of the human body
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: The Inflection Point
const Scene2: React.FC = () => {
  const frame = useCurrentFrame();

  const signals = [
    { label: 'Sleep ↓', y: -40, color: '#FF6B6B', delay: 15 },
    { label: 'Glucose spike ↑', y: 40, color: '#FFD93D', delay: 30 },
    { label: 'Blood marker borderline', y: -20, color: '#FFA07A', delay: 45 },
    { label: 'Poor air quality', y: 60, color: '#A0A0A0', delay: 60 },
  ];

  const questionDelay = 80;

  return (
    <AbsoluteFill style={{ background: BG_DARK, justifyContent: 'center', alignItems: 'center', fontFamily: FONT_BODY }}>
      {/* Timeline axis */}
      <div style={{
        position: 'absolute',
        width: 800,
        height: 2,
        backgroundColor: TEXT_SECONDARY,
        opacity: frame > 10 ? 0.3 : 0
      }} />

      {/* Signals */}
      <div style={{ display: 'flex', gap: 60, position: 'relative' }}>
        {signals.map((signal, idx) => {
          const progress = Math.max(0, Math.min(1, (frame - signal.delay) / 20));
          const opacity = progress;
          const translateX = interpolate(progress, [0, 1], [-30, 0]);
          const translateY = signal.y * (1 - progress);

          return (
            <div
              key={idx}
              style={{
                opacity,
                transform: `translate(${translateX}px, ${translateY}px)`,
                fontSize: 22,
                color: TEXT_PRIMARY,
                padding: '16px 24px',
                border: `2px solid ${signal.color}`,
                borderRadius: 8,
                backgroundColor: `${signal.color}15`,
              }}
            >
              {signal.label}
            </div>
          );
        })}
      </div>

      {/* Question */}
      <div style={{
        position: 'absolute',
        bottom: 100,
        fontSize: 32,
        color: TEXT_PRIMARY,
        opacity: frame > questionDelay ? interpolate(frame - questionDelay, [0, 20], [0, 1]) : 0,
        fontWeight: 300
      }}>
        Which signal should matter most right now?
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Naming the Hidden Problem
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();

  const cards = ['Sleep Score: 65', 'Glucose: 142 mg/dL', 'HRV: 42 ms', 'Steps: 3,200'];

  return (
    <AbsoluteFill style={{ background: BG_DARK, fontFamily: FONT_BODY }}>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Left: Signal cards */}
        <div style={{ flex: 1, padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontSize: 20, color: TEXT_SECONDARY, marginBottom: 20 }}>Current state</div>
          {cards.map((card, idx) => {
            const delay = idx * 10;
            const progress = Math.max(0, Math.min(1, (frame - delay) / 15));
            const opacity = progress;
            const translateY = interpolate(progress, [0, 1], [20, 0]);

            return (
              <div
                key={idx}
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  padding: '20px 24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 8,
                  fontSize: 20,
                  color: TEXT_PRIMARY,
                }}
              >
                {card}
              </div>
            );
          })}
        </div>

        {/* Right: Empty space */}
        <div style={{ flex: 1, padding: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            fontSize: 20,
            color: TEXT_SECONDARY,
            opacity: frame > 40 ? 1 : 0,
            marginBottom: 60
          }}>
            User synthesis
          </div>
          <div style={{
            fontSize: 28,
            color: TEXT_PRIMARY,
            textAlign: 'center',
            maxWidth: 400,
            lineHeight: 1.5,
            opacity: frame > 60 ? interpolate(frame - 60, [0, 20], [0, 1]) : 0,
            fontWeight: 300
          }}>
            The system still asks the user to reconcile meaning.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: Dashboard-of-Dashboards Risk
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();

  const dashboards = [
    { x: -300, y: -150, label: 'Activity' },
    { x: 300, y: -150, label: 'Metabolic' },
    { x: -300, y: 150, label: 'Recovery' },
    { x: 300, y: 150, label: 'Environment' },
  ];

  const zoomProgress = Math.min(1, frame / 40);
  const scale = interpolate(zoomProgress, [0, 1], [1, 0.92]);
  const driftAmount = Math.min(20, frame * 0.15);

  return (
    <AbsoluteFill style={{ background: BG_DARK, justifyContent: 'center', alignItems: 'center', fontFamily: FONT_BODY }}>
      <div style={{ transform: `scale(${scale})`, transition: 'transform 0.3s ease-out' }}>
        {dashboards.map((dash, idx) => {
          const drift = idx % 2 === 0 ? driftAmount : -driftAmount;
          const opacity = Math.min(1, frame / 20);

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `calc(50% + ${dash.x + (idx % 2 === 0 ? drift : -drift)}px)`,
                top: `calc(50% + ${dash.y}px)`,
                width: 280,
                height: 180,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 20,
                opacity,
              }}
            >
              <div style={{ fontSize: 18, color: TEXT_PRIMARY, marginBottom: 10 }}>{dash.label}</div>
              <div style={{ fontSize: 14, color: TEXT_SECONDARY }}>Dashboard</div>
            </div>
          );
        })}
      </div>

      <div style={{
        position: 'absolute',
        bottom: 80,
        fontSize: 24,
        color: TEXT_PRIMARY,
        opacity: frame > 50 ? interpolate(frame - 50, [0, 20], [0, 1]) : 0,
        fontWeight: 300,
        letterSpacing: '0.5px'
      }}>
        Dashboard-of-dashboards risk
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: Reframing the Opportunity
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();

  const stages = ['Signals', 'Interpretation', 'Decision', 'Action'];
  const callouts = ['Why this insight?', 'Why now?', 'How confident is it?'];

  return (
    <AbsoluteFill style={{ background: BG_DARK, justifyContent: 'center', alignItems: 'center', fontFamily: FONT_BODY }}>
      {/* Flow diagram */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        {stages.map((stage, idx) => {
          const delay = idx * 15;
          const isHighlighted = idx === 1 || idx === 2; // Interpretation and Decision
          const progress = Math.max(0, Math.min(1, (frame - delay) / 15));
          const opacity = progress;

          return (
            <React.Fragment key={idx}>
              <div
                style={{
                  opacity,
                  padding: '24px 40px',
                  backgroundColor: isHighlighted ? `${ULTRAHUMAN_GREEN}20` : 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${isHighlighted ? ULTRAHUMAN_GREEN : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: 8,
                  fontSize: 24,
                  color: isHighlighted ? ULTRAHUMAN_GREEN : TEXT_PRIMARY,
                  fontWeight: isHighlighted ? 500 : 300,
                }}
              >
                {stage}
              </div>
              {idx < stages.length - 1 && (
                <div style={{ fontSize: 32, color: TEXT_SECONDARY, opacity: progress }}>→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Callouts */}
      <div style={{
        position: 'absolute',
        bottom: 100,
        display: 'flex',
        gap: 60,
      }}>
        {callouts.map((callout, idx) => {
          const delay = 70 + (idx * 20);
          const opacity = frame > delay ? interpolate(frame - delay, [0, 15], [0, 1]) : 0;

          return (
            <div
              key={idx}
              style={{
                opacity,
                fontSize: 18,
                color: TEXT_SECONDARY,
                fontStyle: 'italic',
              }}
            >
              {callout}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene 6: Why You're Reaching Out
const Scene6: React.FC = () => {
  const frame = useCurrentFrame();

  const panAmount = interpolate(frame, [0, 90], [0, 100]);

  return (
    <AbsoluteFill style={{ background: BG_DARK, justifyContent: 'center', alignItems: 'center', fontFamily: FONT_BODY, overflow: 'hidden' }}>
      {/* Abstract system map */}
      <div style={{
        position: 'relative',
        width: '120%',
        height: '80%',
        transform: `translateX(-${panAmount}px)`,
      }}>
        {/* Nodes representing system connections */}
        {[...Array(12)].map((_, idx) => {
          const x = (idx % 4) * 300 + 100;
          const y = Math.floor(idx / 4) * 200 + 100;
          const size = 40 + (idx % 3) * 20;
          const delay = idx * 5;
          const opacity = Math.max(0, Math.min(0.3, (frame - delay) / 20));

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: '50%',
                border: '2px solid rgba(0, 217, 163, 0.3)',
                backgroundColor: 'rgba(0, 217, 163, 0.05)',
                opacity,
              }}
            />
          );
        })}

        {/* Connection lines */}
        {[...Array(8)].map((_, idx) => {
          const opacity = Math.max(0, Math.min(0.15, (frame - idx * 8) / 20));
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: 100 + (idx % 3) * 300,
                top: 150 + Math.floor(idx / 3) * 200,
                width: 250,
                height: 2,
                backgroundColor: ULTRAHUMAN_GREEN,
                opacity,
                transform: `rotate(${idx * 15}deg)`,
              }}
            />
          );
        })}
      </div>

      {/* Caption */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        right: 60,
        fontSize: 16,
        color: TEXT_SECONDARY,
        opacity: frame > 60 ? 0.7 : 0,
      }}>
        Multi-source health systems we've worked on
      </div>
    </AbsoluteFill>
  );
};

// Scene 7: Soft Close
const Scene7: React.FC = () => {
  const frame = useCurrentFrame();

  const line1Opacity = Math.min(1, frame / 20);
  const line2Delay = 30;
  const line2Opacity = frame > line2Delay ? Math.min(1, (frame - line2Delay) / 20) : 0;
  const fadeOutStart = 70;
  const finalOpacity = frame > fadeOutStart ? Math.max(0, 1 - ((frame - fadeOutStart) / 20)) : 1;

  return (
    <AbsoluteFill style={{ background: BG_DARK, justifyContent: 'center', alignItems: 'center', fontFamily: FONT_BODY }}>
      <div style={{ textAlign: 'center', maxWidth: 800 }}>
        <div style={{
          fontSize: 40,
          color: TEXT_PRIMARY,
          opacity: line1Opacity * finalOpacity,
          marginBottom: 40,
          fontWeight: 300,
          lineHeight: 1.4
        }}>
          You may already be working on this.
        </div>
        <div style={{
          fontSize: 40,
          color: TEXT_PRIMARY,
          opacity: line2Opacity * finalOpacity,
          fontWeight: 300,
          lineHeight: 1.4
        }}>
          If useful, happy to share the framework.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Main component
export const UltrahumanVSL: React.FC = () => {
  return (
    <>
      <Sequence from={SCENE_0_START} durationInFrames={SCENE_0_END - SCENE_0_START}>
        <Scene0 />
      </Sequence>

      <Sequence from={SCENE_1_START} durationInFrames={SCENE_1_END - SCENE_1_START}>
        <Scene1 />
      </Sequence>

      <Sequence from={SCENE_2_START} durationInFrames={SCENE_2_END - SCENE_2_START}>
        <Scene2 />
      </Sequence>

      <Sequence from={SCENE_3_START} durationInFrames={SCENE_3_END - SCENE_3_START}>
        <Scene3 />
      </Sequence>

      <Sequence from={SCENE_4_START} durationInFrames={SCENE_4_END - SCENE_4_START}>
        <Scene4 />
      </Sequence>

      <Sequence from={SCENE_5_START} durationInFrames={SCENE_5_END - SCENE_5_START}>
        <Scene5 />
      </Sequence>

      <Sequence from={SCENE_6_START} durationInFrames={SCENE_6_END - SCENE_6_START}>
        <Scene6 />
      </Sequence>

      <Sequence from={SCENE_7_START} durationInFrames={SCENE_7_END - SCENE_7_START}>
        <Scene7 />
      </Sequence>
    </>
  );
};

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PolicyWrappedRenderProps } from './types';

const bg = 'linear-gradient(180deg, #121212 0%, #0b1a3a 100%)';

// Font families - use actual font names instead of CSS variables (which aren't available in Remotion)
const FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

// Google Fonts CSS import URL
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap';

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const PolicyWrappedSquare: React.FC<PolicyWrappedRenderProps> = ({
  displayName,
  label,
  avgScore,
  scoreLabel = 'Avg score',
  policies,
  urlText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({ frame: frame - 5, fps, config: { damping: 200, mass: 0.8 } });
  const titleProgress = spring({ frame: frame - 18, fps, config: { damping: 180, mass: 0.9 } });
  const statsProgress = spring({ frame: frame - 30, fps, config: { damping: 200, mass: 0.8 } });

  const listBase = frame - 45;
  const listReveal = clamp(listBase / 50, 0, 1);

  const headerY = interpolate(headerProgress, [0, 1], [18, 0]);
  const headerA = interpolate(headerProgress, [0, 1], [0, 1]);

  const titleY = interpolate(titleProgress, [0, 1], [26, 0]);
  const titleA = interpolate(titleProgress, [0, 1], [0, 1]);

  const statsScale = interpolate(statsProgress, [0, 1], [0.94, 1]);
  const statsA = interpolate(statsProgress, [0, 1], [0, 1]);

  // Show all policies (up to 10)
  const displayPolicies = policies.slice(0, 10);

  return (
    <AbsoluteFill style={{ background: bg, color: 'white' }}>
      {/* Load Google Fonts */}
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>
      <div
        style={{
          padding: 56,
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONT_BODY,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transform: `translateY(${headerY}px)`,
            opacity: headerA,
          }}
        >
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 26, opacity: 0.92 }}>
            Policy Wrapped
          </div>
          <div style={{ fontWeight: 900, fontSize: 18, opacity: 0.85 }}>
            {new Date().getFullYear()}
          </div>
        </div>

        <div style={{ marginTop: 32, transform: `translateY(${titleY}px)`, opacity: titleA }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 48, lineHeight: 1.05 }}>
            {displayName}
          </div>
          <div style={{ marginTop: 12, fontWeight: 900, fontSize: 20, opacity: 0.9 }}>
            Label: <span style={{ opacity: 1 }}>{label}</span>
          </div>
        </div>

        <div
          style={{
            marginTop: 32,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            transform: `scale(${statsScale})`,
            opacity: statsA,
            transformOrigin: 'top left',
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.10)', border: '2px solid rgba(255,255,255,0.18)', padding: 20 }}>
            <div style={{ fontSize: 40, fontWeight: 900 }}>{policies.length}</div>
            <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.8 }}>Key issues</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.10)', border: '2px solid rgba(255,255,255,0.18)', padding: 20 }}>
            <div style={{ fontSize: 40, fontWeight: 900 }}>{avgScore}</div>
            <div style={{ fontSize: 16, fontWeight: 800, opacity: 0.8 }}>{scoreLabel}</div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>Your key issues</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {displayPolicies.map((p, idx) => {
              const step = idx / Math.max(1, displayPolicies.length);
              const pProg = clamp((listReveal - step * 0.55) / 0.45, 0, 1);
              const y = interpolate(pProg, [0, 1], [12, 0]);
              const a = interpolate(pProg, [0, 1], [0, 1]);
              return (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, transform: `translateY(${y}px)`, opacity: a }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idx + 1}. {p.title}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{p.averageSupport}%</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 32, paddingTop: 24, opacity: interpolate(frame, [70, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          <div style={{ fontSize: 16, fontWeight: 900, opacity: 0.72 }}>Build yours at</div>
          <div style={{ fontSize: 18, fontWeight: 900, wordBreak: 'break-all' }}>{urlText || '…'}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};



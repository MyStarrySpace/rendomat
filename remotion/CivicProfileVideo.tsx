import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CivicProfileRenderProps } from './types';

// Font families
const FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";
const FONT_BODY = "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

// Google Fonts CSS import URL
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap';

// Brand colors
const BRAND_BLUE = '#2F3BBD';

export const CivicProfileVideo: React.FC<CivicProfileRenderProps> = ({
  studentName,
  topPriorities,
  quote,
  stats,
  urlText = 'civic-engine.app',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation timeline (150 frames = 5 seconds at 30fps)
  // Header: frames 0-15
  // Title: frames 9-27
  // Priorities: frames 21-57 (staggered)
  // Quote expands: frames 52-78
  // Quote collapses + stats: frames 82-112
  // Footer: frames 108-132

  const headerProgress = spring({ frame: frame - 0, fps, config: { damping: 200, mass: 0.8 } });
  const titleProgress = spring({ frame: frame - 9, fps, config: { damping: 180, mass: 0.9 } });

  // Quote appears full first
  const quoteInProgress = spring({ frame: frame - 52, fps, config: { damping: 200, mass: 0.8 } });
  // Then collapses
  const quoteCollapseProgress = spring({ frame: frame - 82, fps, config: { damping: 200, mass: 0.8 } });

  const statsProgress = spring({ frame: frame - 90, fps, config: { damping: 200, mass: 0.8 } });
  const footerProgress = spring({ frame: frame - 108, fps, config: { damping: 200, mass: 0.8 } });

  // Interpolations
  const headerY = interpolate(headerProgress, [0, 1], [15, 0]);
  const headerA = interpolate(headerProgress, [0, 1], [0, 1]);

  const titleY = interpolate(titleProgress, [0, 1], [20, 0]);
  const titleA = interpolate(titleProgress, [0, 1], [0, 1]);

  // Quote: opacity fades in, then collapses vertically via maxHeight
  const quoteA = interpolate(quoteInProgress, [0, 1], [0, 1]);
  const quoteMaxHeight = interpolate(quoteCollapseProgress, [0, 1], [120, 56]);
  const quoteFontSize = interpolate(quoteCollapseProgress, [0, 1], [15, 12]);
  const quotePadding = interpolate(quoteCollapseProgress, [0, 1], [14, 10]);
  const quoteLineHeight = interpolate(quoteCollapseProgress, [0, 1], [1.5, 1.3]);

  const statsY = interpolate(statsProgress, [0, 1], [10, 0]);
  const statsA = interpolate(statsProgress, [0, 1], [0, 1]);

  const footerA = interpolate(footerProgress, [0, 1], [0, 1]);

  const displayPriorities = topPriorities.slice(0, 3);

  return (
    <AbsoluteFill style={{ background: '#FAFAFA', color: '#1a1a1a' }}>
      {/* Load Google Fonts */}
      <style>{`@import url('${GOOGLE_FONTS_URL}');`}</style>

      <div
        style={{
          padding: 32,
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: FONT_BODY,
          overflow: 'hidden',
        }}
      >
        {/* Header with checkmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transform: `translateY(${headerY}px)`,
            opacity: headerA,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: '#dcfce7',
              border: '2px solid black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 12, opacity: 0.6, letterSpacing: 0.5 }}>
            DELIBERATION COMPLETE
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            marginTop: 16,
            transform: `translateY(${titleY}px)`,
            opacity: titleA,
            flexShrink: 0,
          }}
        >
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 36, lineHeight: 1.1 }}>
            {studentName}&apos;s
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 900, fontSize: 22, color: BRAND_BLUE, marginTop: 2 }}>
            CIVIC PROFILE
          </div>
        </div>

        {/* Top Priorities */}
        <div style={{ marginTop: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, marginBottom: 8, letterSpacing: 1 }}>
            TOP PRIORITIES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {displayPriorities.map((priority, idx) => {
              const delay = idx * 8;
              const itemProgress = spring({ frame: frame - 21 - delay, fps, config: { damping: 200, mass: 0.8 } });
              const itemX = interpolate(itemProgress, [0, 1], [-20, 0]);
              const itemA = interpolate(itemProgress, [0, 1], [0, 1]);

              return (
                <div
                  key={priority.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 10,
                    background: 'white',
                    border: '2px solid black',
                    boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                    transform: `translateX(${itemX}px)`,
                    opacity: itemA,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      background: BRAND_BLUE,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 900,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {priority.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quote - expands then collapses with text wrapping */}
        {quote && (
          <div
            style={{
              marginTop: 12,
              padding: quotePadding,
              background: '#f5f5f5',
              border: '2px solid black',
              fontStyle: 'italic',
              fontSize: quoteFontSize,
              lineHeight: quoteLineHeight,
              opacity: quoteA,
              maxHeight: quoteMaxHeight,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            &ldquo;{quote}&rdquo;
          </div>
        )}

        {/* Stats - smaller and compact */}
        <div
          style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
            opacity: statsA,
            transform: `translateY(${statsY}px)`,
            flexShrink: 0,
          }}
        >
          <StatBox value={stats.policiesExplored} label="Policies" />
          <StatBox value={stats.discussionsJoined} label="Discussions" />
          <StatBox value={stats.positionsRevised} label="Revised" />
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 12,
            borderTop: '2px solid black',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: footerA,
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 12 }}>
            {urlText}
          </div>
          <div style={{ fontWeight: 700, fontSize: 11, opacity: 0.6 }}>
            {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StatBox: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div
    style={{
      textAlign: 'center',
      padding: 8,
      background: 'white',
      border: '2px solid black',
      boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
    }}
  >
    <div style={{ fontSize: 24, fontWeight: 900, color: BRAND_BLUE }}>{value}</div>
    <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.7, textTransform: 'uppercase' }}>{label}</div>
  </div>
);

export default CivicProfileVideo;

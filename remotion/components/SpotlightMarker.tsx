import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { SpotlightMarkerType } from '../scenes/types';
import { Theme } from '../themes';

interface SpotlightMarkerProps {
  type: SpotlightMarkerType;
  theme: Theme;
  opacity: number;
  segmentFrame: number;
  cardDelayFrames: number;
  screenWidth: number;
  screenHeight: number;
  cardX: number;
  cardY: number;
  cardOnRight: boolean;
  cardOnBottom: boolean;
  markerWidth?: number;
  markerHeight?: number;
}

const DEFAULT_SIZE = 80;
const DRAW_DURATION = 20;

export const SpotlightMarker: React.FC<SpotlightMarkerProps> = ({
  type,
  theme,
  opacity,
  segmentFrame,
  cardDelayFrames,
  screenWidth,
  screenHeight,
  cardX,
  cardY,
  cardOnRight,
  cardOnBottom,
  markerWidth = DEFAULT_SIZE,
  markerHeight: markerHeightProp,
}) => {
  const { fps } = useVideoConfig();
  const accentColor = theme.colors.accent || '#d4a843';
  const drawStartFrame = cardDelayFrames - 10;
  const drawFrame = Math.max(0, segmentFrame - drawStartFrame);

  const mW = markerWidth;
  const mH = markerHeightProp ?? markerWidth;
  const halfW = mW / 2;
  const halfH = mH / 2;

  // Draw progress 0-1 over DRAW_DURATION frames
  const drawProgress = interpolate(drawFrame, [0, DRAW_DURATION], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Icon pop (for alert/question/x-circle) — starts after draw completes
  const iconFrame = Math.max(0, drawFrame - DRAW_DURATION);
  const iconScale = spring({
    frame: iconFrame,
    fps,
    config: { damping: 14, stiffness: 200 },
  });

  const cx = screenWidth / 2;
  const cy = screenHeight / 2;

  const strokeStyle: React.CSSProperties = {
    fill: 'none',
    stroke: accentColor,
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const renderMarker = () => {
    switch (type) {
      case 'circle': {
        const rx = mW / 2 - 4;
        const ry = mH / 2 - 4;
        // Approximate ellipse circumference (Ramanujan)
        const circumference = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
        const dashOffset = circumference * (1 - drawProgress);
        return (
          <svg
            width={mW}
            height={mH}
            viewBox={`0 0 ${mW} ${mH}`}
            style={{ position: 'absolute', left: cx - halfW, top: cy - halfH }}
          >
            <ellipse
              cx={halfW}
              cy={halfH}
              rx={rx}
              ry={ry}
              {...strokeStyle}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
        );
      }

      case 'rectangle': {
        const pad = 4;
        const w = mW - pad * 2;
        const h = mH - pad * 2;
        const perimeter = 2 * (w + h);
        const dashOffset = perimeter * (1 - drawProgress);
        return (
          <svg
            width={mW}
            height={mH}
            viewBox={`0 0 ${mW} ${mH}`}
            style={{ position: 'absolute', left: cx - halfW, top: cy - halfH }}
          >
            <rect
              x={pad}
              y={pad}
              width={w}
              height={h}
              {...strokeStyle}
              strokeDasharray={perimeter}
              strokeDashoffset={dashOffset}
            />
          </svg>
        );
      }

      case 'x-circle': {
        const rx = mW / 2 - 4;
        const ry = mH / 2 - 4;
        const circumference = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
        const dashOffset = circumference * (1 - drawProgress);
        // X lines draw after circle, staggered by 5 frames
        const xFrame1 = Math.max(0, drawFrame - DRAW_DURATION);
        const xFrame2 = Math.max(0, drawFrame - DRAW_DURATION - 5);
        const xProgress1 = interpolate(xFrame1, [0, 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const xProgress2 = interpolate(xFrame2, [0, 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        // X lines inset from the ellipse edge
        const xInset = 0.35;
        const x1 = halfW - rx * xInset;
        const y1 = halfH - ry * xInset;
        const x2 = halfW + rx * xInset;
        const y2 = halfH + ry * xInset;
        const line1Len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const line2Len = Math.sqrt((x1 - x2) ** 2 + (y2 - y1) ** 2);
        return (
          <svg
            width={mW}
            height={mH}
            viewBox={`0 0 ${mW} ${mH}`}
            style={{ position: 'absolute', left: cx - halfW, top: cy - halfH }}
          >
            <ellipse
              cx={halfW}
              cy={halfH}
              rx={rx}
              ry={ry}
              {...strokeStyle}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              {...strokeStyle}
              strokeDasharray={line1Len}
              strokeDashoffset={line1Len * (1 - xProgress1)}
            />
            <line
              x1={x2} y1={y1} x2={x1} y2={y2}
              {...strokeStyle}
              strokeDasharray={line2Len}
              strokeDashoffset={line2Len * (1 - xProgress2)}
            />
          </svg>
        );
      }

      case 'alert': {
        const rx = mW / 2 - 4;
        const ry = mH / 2 - 4;
        const circumference = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
        const dashOffset = circumference * (1 - drawProgress);
        return (
          <svg
            width={mW}
            height={mH}
            viewBox={`0 0 ${mW} ${mH}`}
            style={{ position: 'absolute', left: cx - halfW, top: cy - halfH }}
          >
            <ellipse
              cx={halfW}
              cy={halfH}
              rx={rx}
              ry={ry}
              {...strokeStyle}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
            <g
              style={{
                transformOrigin: `${halfW}px ${halfH}px`,
                transform: `scale(${iconScale})`,
              }}
            >
              <rect
                x={halfW - 2}
                y={halfH - 16}
                width={4}
                height={20}
                rx={2}
                fill={accentColor}
              />
              <circle cx={halfW} cy={halfH + 12} r={3} fill={accentColor} />
            </g>
          </svg>
        );
      }

      case 'question': {
        const rx = mW / 2 - 4;
        const ry = mH / 2 - 4;
        const circumference = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
        const dashOffset = circumference * (1 - drawProgress);
        return (
          <svg
            width={mW}
            height={mH}
            viewBox={`0 0 ${mW} ${mH}`}
            style={{ position: 'absolute', left: cx - halfW, top: cy - halfH }}
          >
            <ellipse
              cx={halfW}
              cy={halfH}
              rx={rx}
              ry={ry}
              {...strokeStyle}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
            <text
              x={halfW}
              y={halfH + 10}
              textAnchor="middle"
              fill={accentColor}
              fontSize={32}
              fontWeight={700}
              fontFamily="system-ui, sans-serif"
              style={{
                transformOrigin: `${halfW}px ${halfH}px`,
                transform: `scale(${iconScale})`,
              }}
            >
              ?
            </text>
          </svg>
        );
      }

      case 'marker':
      default: {
        const dotOpacity = interpolate(drawFrame, [0, 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const pulseScale = interpolate(
          drawFrame % 30,
          [0, 15, 30],
          [1, 1.8, 1],
        );
        // Leader line from center toward card
        const cardEdgeX = cardOnRight ? cardX : cardX + screenWidth * 0.38;
        const cardEdgeY = cardOnBottom ? cardY : cardY + screenHeight * 0.4;
        const lineProgress = interpolate(drawFrame, [5, DRAW_DURATION], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const lineEndX = cx + (cardEdgeX - cx) * lineProgress;
        const lineEndY = cy + (cardEdgeY - cy) * lineProgress;

        return (
          <>
            {/* Leader line */}
            <svg
              width={screenWidth}
              height={screenHeight}
              style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
            >
              <line
                x1={cx}
                y1={cy}
                x2={lineEndX}
                y2={lineEndY}
                stroke={accentColor}
                strokeWidth={1.5}
                strokeOpacity={0.5}
                strokeDasharray="6 4"
              />
            </svg>
            {/* Center dot + pulse ring */}
            <svg
              width={mW}
              height={mH}
              viewBox={`0 0 ${mW} ${mH}`}
              style={{ position: 'absolute', left: cx - halfW, top: cy - halfH }}
            >
              <circle
                cx={halfW}
                cy={halfH}
                r={16}
                fill="none"
                stroke={accentColor}
                strokeWidth={1.5}
                strokeOpacity={0.4}
                style={{
                  transformOrigin: `${halfW}px ${halfH}px`,
                  transform: `scale(${pulseScale})`,
                }}
              />
              <circle
                cx={halfW}
                cy={halfH}
                r={6}
                fill={accentColor}
                opacity={dotOpacity}
              />
            </svg>
          </>
        );
      }
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity }}>
      {renderMarker()}
    </div>
  );
};

"use client";

import React, { useMemo } from 'react';
import { frameToPixel, generateRulerMarkers } from './lib/timeline-utils';

interface TimeRulerProps {
  totalFrames: number;
  zoom: number;
  onClick?: (frame: number) => void;
}

export function TimeRuler({ totalFrames, zoom, onClick }: TimeRulerProps) {
  const markers = useMemo(
    () => generateRulerMarkers(totalFrames, zoom),
    [totalFrames, zoom]
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frame = Math.round((x / zoom) * 30);
    onClick(frame);
  };

  return (
    <div
      className="relative h-6 bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))] cursor-pointer select-none"
      style={{ width: frameToPixel(totalFrames, zoom) + 100 }}
      onClick={handleClick}
    >
      {markers.map((marker, index) => (
        <div
          key={index}
          className="absolute top-0"
          style={{ left: frameToPixel(marker.frame, zoom) }}
        >
          {/* Tick mark */}
          <div
            className={`w-px ${
              marker.isMajor
                ? 'h-4 bg-[hsl(var(--foreground-muted))]'
                : 'h-2 bg-[hsl(var(--border))]'
            }`}
          />
          {/* Label */}
          {marker.label && (
            <span className="absolute top-3 left-1 text-[10px] font-mono text-[hsl(var(--foreground-subtle))] whitespace-nowrap">
              {marker.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

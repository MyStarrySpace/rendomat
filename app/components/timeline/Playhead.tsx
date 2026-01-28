"use client";

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { frameToPixel, pixelToFrame, frameToTimeWithFrames } from './lib/timeline-utils';

interface PlayheadProps {
  frame: number;
  zoom: number;
  height: number;
  onSeek: (frame: number) => void;
  isPlaying: boolean;
}

export function Playhead({ frame, zoom, height, onSeek, isPlaying }: PlayheadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const playheadRef = useRef<HTMLDivElement>(null);

  const position = frameToPixel(frame, zoom);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!playheadRef.current) return;

      const container = playheadRef.current.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + container.scrollLeft;
      const newFrame = pixelToFrame(Math.max(0, x), zoom);
      onSeek(newFrame);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, zoom, onSeek]);

  return (
    <div
      ref={playheadRef}
      className="absolute top-0 z-30 pointer-events-none"
      style={{
        left: position,
        height,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Head */}
      <div
        className={`relative pointer-events-auto cursor-grab ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div
          className={`w-4 h-4 ${
            isPlaying
              ? 'bg-[hsl(var(--success))]'
              : 'bg-[hsl(var(--accent))]'
          }`}
          style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 50% 100%, 0 50%)',
            marginLeft: '-8px',
          }}
        />
        {/* Time tooltip on drag */}
        {isDragging && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 px-2 py-1 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[10px] font-mono whitespace-nowrap">
            {frameToTimeWithFrames(frame)}
          </div>
        )}
      </div>

      {/* Line */}
      <div
        className={`w-px ${
          isPlaying
            ? 'bg-[hsl(var(--success))]'
            : 'bg-[hsl(var(--accent))]'
        }`}
        style={{ height: height - 16 }}
      />
    </div>
  );
}

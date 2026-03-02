"use client";

import React, { useState, useRef, useCallback } from 'react';
import { AudioClip } from '@/lib/api';
import {
  frameToPixel,
  pixelToFrame,
  formatDuration,
} from './lib/timeline-utils';
import { Music } from 'lucide-react';

interface AudioClipBlockProps {
  clip: AudioClip;
  zoom: number;
  isSelected: boolean;
  onClick: () => void;
  onDragStart?: (clipId: number) => void;
  onDragEnd?: (clipId: number, newStartFrame: number) => void;
  onResizeEnd?: (clipId: number, newDurationFrames: number) => void;
  trackHeight: number;
  containerOffset?: number;
}

export function AudioClipBlock({
  clip,
  zoom,
  isSelected,
  onClick,
  onDragStart,
  onDragEnd,
  onResizeEnd,
  trackHeight,
  containerOffset = 80,
}: AudioClipBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [resizeDelta, setResizeDelta] = useState(0);
  const dragStartX = useRef(0);
  const hasDragged = useRef(false);
  const DRAG_THRESHOLD = 6;

  const left = frameToPixel(clip.start_frame, zoom) + dragOffset;
  const width = frameToPixel(clip.duration_frames + (isResizing ? pixelToFrame(resizeDelta, zoom) : 0), zoom);
  const height = trackHeight - 8;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const startX = e.clientX;
    dragStartX.current = startX;
    hasDragged.current = false;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      if (!hasDragged.current && Math.abs(dx) < DRAG_THRESHOLD) return;

      if (!hasDragged.current) {
        hasDragged.current = true;
        setIsDragging(true);
        onDragStart?.(clip.id);
      }

      setDragOffset(dx);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (hasDragged.current) {
        const dx = upEvent.clientX - startX;
        const frameDelta = pixelToFrame(dx, zoom);
        const newStart = Math.max(0, clip.start_frame + frameDelta);
        onDragEnd?.(clip.id, newStart);
      } else {
        onClick();
      }

      setIsDragging(false);
      setDragOffset(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [clip.id, clip.start_frame, zoom, onClick, onDragStart, onDragEnd]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      setIsResizing(true);
      setResizeDelta(dx);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      const dx = upEvent.clientX - startX;
      const frameDelta = pixelToFrame(dx, zoom);
      const newDuration = clip.duration_frames + frameDelta;
      onResizeEnd?.(clip.id, newDuration);

      setIsResizing(false);
      setResizeDelta(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [clip.id, clip.duration_frames, zoom, onResizeEnd]);

  return (
    <div
      className={`group absolute flex items-center gap-1 px-2 cursor-pointer select-none ${
        isDragging ? 'opacity-70 z-50' : ''
      }`}
      style={{
        left: Math.max(0, left),
        width: Math.max(30, width),
        height,
        top: 4,
        background: isSelected
          ? 'hsl(200 60% 50% / 0.4)'
          : 'hsl(200 60% 50% / 0.25)',
        border: `1px solid ${isSelected ? 'hsl(200 60% 50%)' : 'hsl(200 60% 50% / 0.5)'}`,
        boxShadow: isSelected ? '0 0 0 1px hsl(200 60% 50%)' : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      <Music className="w-3 h-3 flex-shrink-0" style={{ color: 'hsl(200 60% 65%)' }} />
      <span
        className="text-[9px] truncate"
        style={{ color: 'hsl(200 80% 80%)' }}
      >
        {clip.name}
      </span>
      <span
        className="text-[8px] ml-auto flex-shrink-0"
        style={{ color: 'hsl(200 60% 60%)' }}
      >
        {formatDuration(clip.duration_frames)}
      </span>

      {/* Right resize handle */}
      <div
        className="absolute top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-[hsl(200_60%_50%/0.5)]"
        style={{ right: 0 }}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}

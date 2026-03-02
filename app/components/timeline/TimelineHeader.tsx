"use client";

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  RefreshCw,
  Sparkles,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { frameToTime, frameToTimeWithFrames, MIN_ZOOM, MAX_ZOOM } from './lib/timeline-utils';

interface TimelineHeaderProps {
  zoom: number;
  playheadFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  snapToGrid: boolean;
  hasUnrenderedScenes: boolean;
  hasChangedScenes: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (zoom: number) => void;
  onToggleSnap: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  onRenderChanged: () => void;
  onRegenerateFromPrompt?: () => void;
  onAddScene?: () => void;
}

export function TimelineHeader({
  zoom,
  playheadFrame,
  totalFrames,
  isPlaying,
  snapToGrid,
  hasUnrenderedScenes,
  hasChangedScenes,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onToggleSnap,
  onPlay,
  onPause,
  onStop,
  onSeekStart,
  onSeekEnd,
  onRenderChanged,
  onRegenerateFromPrompt,
  onAddScene,
}: TimelineHeaderProps) {
  // Calculate zoom percentage for display
  const zoomPercent = Math.round((zoom / 80) * 100);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))]">
      {/* Left: Playback controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSeekStart}
          title="Go to start (Home)"
        >
          <SkipBack className="w-4 h-4" />
        </Button>

        {isPlaying ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPause}
            title="Pause (Space)"
          >
            <Pause className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onPlay}
            title="Play (Space)"
          >
            <Play className="w-4 h-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onStop}
          title="Stop"
        >
          <Square className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onSeekEnd}
          title="Go to end (End)"
        >
          <SkipForward className="w-4 h-4" />
        </Button>

        {/* Time display */}
        <div className="ml-2 px-3 py-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] font-mono text-sm">
          <span className="text-[hsl(var(--foreground))]">
            {frameToTimeWithFrames(playheadFrame)}
          </span>
          <span className="text-[hsl(var(--foreground-muted))] mx-2">/</span>
          <span className="text-[hsl(var(--foreground-muted))]">
            {frameToTime(totalFrames)}
          </span>
        </div>
      </div>

      {/* Center: Add scene + Render buttons */}
      <div className="flex items-center gap-2">
        {onAddScene && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddScene}
            icon={<Plus className="w-4 h-4" />}
            title="Add a new scene"
          >
            Add Scene
          </Button>
        )}
        {(hasUnrenderedScenes || hasChangedScenes) && (
          <Button
            variant={hasChangedScenes ? 'secondary' : 'default'}
            size="sm"
            onClick={onRenderChanged}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            {hasChangedScenes ? 'Re-render Changed' : 'Render All'}
          </Button>
        )}
      </div>

      {/* Right: Zoom & snap controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={snapToGrid ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleSnap}
          title="Toggle snap to grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-2 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            title="Zoom out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          {/* Zoom slider */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              value={zoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="w-24 h-1 bg-[hsl(var(--border))] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[hsl(var(--accent))] [&::-webkit-slider-thumb]:cursor-pointer"
              title={`Zoom: ${zoomPercent}%`}
            />
            <span className="w-12 text-center text-xs font-mono text-[hsl(var(--foreground-muted))]">
              {zoomPercent}%
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            title="Zoom in (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

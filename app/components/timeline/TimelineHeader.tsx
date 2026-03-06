"use client";

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Magnet,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Zap,
  RefreshCw,
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
  renderCreditCost: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (zoom: number) => void;
  onToggleSnap: () => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  autoRender: boolean;
  onRenderChanged: () => void;
  onToggleAutoRender: () => void;
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
  renderCreditCost,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  onToggleSnap,
  onPlay,
  onPause,
  onStop,
  onSeekStart,
  onSeekEnd,
  autoRender,
  onRenderChanged,
  onToggleAutoRender,
  onRegenerateFromPrompt,
  onAddScene,
}: TimelineHeaderProps) {
  // Calculate zoom percentage for display
  const zoomPercent = Math.round((zoom / 80) * 100);

  // Map zoom value to slider position (0-1000) so 100% zoom (80) is centered at 500
  const zoomToSlider = (z: number): number => {
    if (z <= 80) return ((z - MIN_ZOOM) / (80 - MIN_ZOOM)) * 500;
    return 500 + ((z - 80) / (MAX_ZOOM - 80)) * 500;
  };
  const sliderToZoom = (s: number): number => {
    if (s <= 500) return MIN_ZOOM + (s / 500) * (80 - MIN_ZOOM);
    return 80 + ((s - 500) / 500) * (MAX_ZOOM - 80);
  };
  const sliderValue = zoomToSlider(zoom);

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
        {(hasUnrenderedScenes || hasChangedScenes) && !autoRender && (
          <Button
            variant={hasChangedScenes ? 'secondary' : 'default'}
            size="sm"
            onClick={onRenderChanged}
            icon={<Zap className="w-4 h-4" />}
          >
            {hasChangedScenes ? 'Re-render Changed' : 'Render All'}{renderCreditCost > 0 ? ` (${renderCreditCost} cr)` : ''}
          </Button>
        )}
        <Button
          variant={autoRender ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleAutoRender}
          title="Auto-render on change"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Right: Zoom & snap controls */}
      <div className="flex items-center gap-2">
        <Button
          variant={snapToGrid ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleSnap}
          title="Toggle snap to grid"
        >
          <Magnet className="w-4 h-4" />
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
              min={0}
              max={1000}
              value={sliderValue}
              onChange={(e) => onZoomChange(sliderToZoom(parseFloat(e.target.value)))}
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

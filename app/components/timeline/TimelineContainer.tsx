"use client";

import React, { useRef, useCallback, useEffect } from 'react';
import { Scene, Transition } from '@/lib/api';
import { TimeRuler } from './TimeRuler';
import { Playhead } from './Playhead';
import { TimelineTrack } from './TimelineTrack';
import {
  frameToPixel,
  calculateTotalFrames,
  pixelToFrame,
  TRACKS,
} from './lib/timeline-utils';
import { DragPreview, ResizePreview } from './hooks/useTimeline';

const RULER_HEIGHT = 24;
const TRACK_LABEL_WIDTH = 80;

interface TimelineContainerProps {
  scenes: Scene[];
  previewScenes?: Scene[];
  transitions: Transition[];
  zoom: number;
  playheadFrame: number;
  selectedSceneId: number | null;
  selectedTransitionId: number | null;
  isPlaying: boolean;
  snapEnabled: boolean;
  dragPreview?: DragPreview | null;
  resizePreview?: ResizePreview | null;
  onSeek: (frame: number) => void;
  onSceneSelect: (sceneId: number | null) => void;
  onTransitionSelect: (transitionId: number | null) => void;
  onSceneDragStart?: (sceneId: number, startFrame: number) => void;
  onSceneDragMove?: (sceneId: number, cursorFrame: number) => void;
  onSceneDragEnd?: (sceneId: number, cursorFrame: number) => void;
  onSceneResizeStart?: (sceneId: number, edge: 'start' | 'end') => void;
  onSceneResizeMove?: (sceneId: number, edge: 'start' | 'end', newFrame: number) => void;
  onSceneResizeEnd?: (sceneId: number, edge: 'start' | 'end', newFrame: number) => void;
  onRenderScene?: (sceneId: number) => void;
  onScrollChange?: (scrollLeft: number) => void;
  getTransitionLabel: (typeId: string) => string;
  changedSceneIds?: Set<number>;
  sceneRenderProgress?: Map<number, number>;
}

export function TimelineContainer({
  scenes,
  previewScenes,
  transitions,
  zoom,
  playheadFrame,
  selectedSceneId,
  selectedTransitionId,
  isPlaying,
  snapEnabled,
  dragPreview,
  resizePreview,
  onSeek,
  onSceneSelect,
  onTransitionSelect,
  onSceneDragStart,
  onSceneDragMove,
  onSceneDragEnd,
  onSceneResizeStart,
  onSceneResizeMove,
  onSceneResizeEnd,
  onRenderScene,
  onScrollChange,
  getTransitionLabel,
  changedSceneIds,
  sceneRenderProgress,
}: TimelineContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalFrames = calculateTotalFrames(scenes);
  const contentWidth = frameToPixel(totalFrames, zoom) + 200;
  const totalTrackHeight = TRACKS.reduce((sum, t) => sum + t.height, 0);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current && onScrollChange) {
      onScrollChange(containerRef.current.scrollLeft);
    }
  }, [onScrollChange]);

  // Auto-scroll to keep playhead in view during playback
  useEffect(() => {
    if (!isPlaying || !containerRef.current) return;

    const container = containerRef.current;
    const playheadX = frameToPixel(playheadFrame, zoom);
    const viewportRight = container.scrollLeft + container.clientWidth;

    if (playheadX > viewportRight - 100) {
      container.scrollLeft = playheadX - container.clientWidth * 0.7;
    }
  }, [playheadFrame, zoom, isPlaying]);

  // Handle click on empty area to seek
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only seek if clicking on track area background, not on scene blocks
    if (target.closest('[data-timeline-track]') && !target.closest('.group')) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0) - TRACK_LABEL_WIDTH;
      const frame = pixelToFrame(Math.max(0, x), zoom);
      onSeek(frame);
    }
  }, [zoom, onSeek]);

  return (
    <div
      ref={containerRef}
      data-timeline-container
      className="relative overflow-x-auto overflow-y-hidden bg-[hsl(var(--background))]"
      style={{ height: RULER_HEIGHT + totalTrackHeight + 8 }}
      onScroll={handleScroll}
      onClick={handleContainerClick}
    >
      {/* Content wrapper */}
      <div
        className="relative"
        style={{ width: contentWidth + TRACK_LABEL_WIDTH, minWidth: '100%' }}
      >
        {/* Time ruler - offset by track label width */}
        <div style={{ marginLeft: TRACK_LABEL_WIDTH }}>
          <TimeRuler
            totalFrames={totalFrames}
            zoom={zoom}
            onClick={onSeek}
          />
        </div>

        {/* Track area */}
        <div className="relative">
          <TimelineTrack
            scenes={scenes}
            previewScenes={previewScenes}
            transitions={transitions}
            zoom={zoom}
            selectedSceneId={selectedSceneId}
            selectedTransitionId={selectedTransitionId}
            dragPreview={dragPreview}
            resizePreview={resizePreview}
            onSceneSelect={onSceneSelect}
            onTransitionSelect={onTransitionSelect}
            onSceneDragStart={onSceneDragStart}
            onSceneDragMove={onSceneDragMove}
            onSceneDragEnd={onSceneDragEnd}
            onSceneResizeStart={onSceneResizeStart}
            onSceneResizeMove={onSceneResizeMove}
            onSceneResizeEnd={onSceneResizeEnd}
            onRenderScene={onRenderScene}
            getTransitionLabel={getTransitionLabel}
            snapEnabled={snapEnabled}
            changedSceneIds={changedSceneIds}
            sceneRenderProgress={sceneRenderProgress}
          />
        </div>

        {/* Playhead - offset by track label width */}
        <div
          className="absolute top-0"
          style={{ left: TRACK_LABEL_WIDTH, height: RULER_HEIGHT + totalTrackHeight }}
        >
          <Playhead
            frame={playheadFrame}
            zoom={zoom}
            height={RULER_HEIGHT + totalTrackHeight}
            onSeek={onSeek}
            isPlaying={isPlaying}
          />
        </div>
      </div>
    </div>
  );
}

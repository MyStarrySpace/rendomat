"use client";

import React from 'react';
import { Scene, Transition } from '@/lib/api';
import { SceneBlock } from './SceneBlock';
import { TransitionIndicator } from './TransitionIndicator';
import {
  frameToPixel,
  calculateTotalFrames,
  TRACKS,
} from './lib/timeline-utils';
import { DragPreview, ResizePreview } from './hooks/useTimeline';

interface TimelineTrackProps {
  scenes: Scene[];
  previewScenes?: Scene[];
  transitions: Transition[];
  zoom: number;
  selectedSceneId: number | null;
  selectedTransitionId: number | null;
  dragPreview?: DragPreview | null;
  resizePreview?: ResizePreview | null;
  onSceneSelect: (sceneId: number | null) => void;
  onTransitionSelect: (transitionId: number | null) => void;
  onSceneDragStart?: (sceneId: number, startFrame: number) => void;
  onSceneDragMove?: (sceneId: number, cursorFrame: number) => void;
  onSceneDragEnd?: (sceneId: number, cursorFrame: number) => void;
  onSceneResizeStart?: (sceneId: number, edge: 'start' | 'end') => void;
  onSceneResizeMove?: (sceneId: number, edge: 'start' | 'end', newFrame: number) => void;
  onSceneResizeEnd?: (sceneId: number, edge: 'start' | 'end', newFrame: number) => void;
  onRenderScene?: (sceneId: number) => void;
  getTransitionLabel: (typeId: string) => string;
  snapEnabled: boolean;
  changedSceneIds?: Set<number>;
  sceneRenderProgress?: Map<number, number>;
}

export function TimelineTrack({
  scenes,
  previewScenes,
  transitions,
  zoom,
  selectedSceneId,
  selectedTransitionId,
  dragPreview,
  resizePreview,
  onSceneSelect,
  onTransitionSelect,
  onSceneDragStart,
  onSceneDragMove,
  onSceneDragEnd,
  onSceneResizeStart,
  onSceneResizeMove,
  onSceneResizeEnd,
  onRenderScene,
  getTransitionLabel,
  snapEnabled,
  changedSceneIds = new Set(),
  sceneRenderProgress,
}: TimelineTrackProps) {
  const totalFrames = calculateTotalFrames(scenes);
  const trackWidth = frameToPixel(totalFrames, zoom) + 200;

  const isPreviewActive = !!(dragPreview || resizePreview);

  // Build maps of scene id -> preview position and preview width during drag or resize
  const previewPositionMap = new Map<number, number>();
  const previewWidthMap = new Map<number, number>();
  if (isPreviewActive && previewScenes) {
    for (const ps of previewScenes) {
      if (dragPreview && ps.id === dragPreview.sceneId) {
        // Dragged scene follows the cursor, offset so the block centers on cursor
        const draggedScene = scenes.find(s => s.id === dragPreview.sceneId);
        const duration = draggedScene ? draggedScene.end_frame - draggedScene.start_frame : 0;
        const cursorPixel = frameToPixel(dragPreview.cursorFrame, zoom);
        previewPositionMap.set(ps.id, cursorPixel - frameToPixel(duration / 2, zoom));
      } else {
        previewPositionMap.set(ps.id, frameToPixel(ps.start_frame, zoom));
      }
      // Set preview width for resized scenes
      const previewDuration = ps.end_frame - ps.start_frame;
      previewWidthMap.set(ps.id, frameToPixel(previewDuration, zoom));
    }
  }

  // Get in/out transition frames for a scene
  const getSceneTransitions = (scene: Scene) => {
    const inTransition = transitions.find(t => t.to_scene_number === scene.scene_number);
    const outTransition = transitions.find(t => t.from_scene_number === scene.scene_number);

    return {
      inFrames: inTransition?.duration_frames || 0,
      outFrames: outTransition?.duration_frames || 0,
    };
  };

  // Compute insertion line position during drag
  const insertionLineLeft = (() => {
    if (!dragPreview || !previewScenes) return null;
    // The dragged scene in previewScenes has start_frame set to the insertion point
    const draggedPreview = previewScenes.find(s => s.id === dragPreview.sceneId);
    if (!draggedPreview) return null;
    return frameToPixel(draggedPreview.start_frame, zoom);
  })();

  const totalHeight = TRACKS.reduce((sum, track) => sum + track.height, 0);
  const TRACK_LABEL_WIDTH = 80;

  return (
    <div
      className="relative"
      style={{ width: trackWidth + TRACK_LABEL_WIDTH, height: totalHeight }}
      data-timeline-track
    >
      {/* Track labels */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-[hsl(var(--surface))] border-r border-[hsl(var(--border))] z-30"
        style={{ width: TRACK_LABEL_WIDTH }}
      >
        {TRACKS.map((track, index) => {
          const top = TRACKS.slice(0, index).reduce((sum, t) => sum + t.height, 0);
          return (
            <div
              key={track.id}
              className="absolute left-0 right-0 flex items-center px-2 text-[10px] font-medium text-[hsl(var(--foreground-muted))] border-b border-[hsl(var(--border))]"
              style={{ top, height: track.height }}
            >
              {track.label}
            </div>
          );
        })}
      </div>

      {/* Track content area */}
      <div className="relative" style={{ marginLeft: TRACK_LABEL_WIDTH, height: totalHeight }}>
        {TRACKS.map((track, trackIndex) => {
          const top = TRACKS.slice(0, trackIndex).reduce((sum, t) => sum + t.height, 0);

          return (
            <div
              key={track.id}
              className="absolute left-0 right-0 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]"
              style={{ top, height: track.height }}
            >
              {/* Track background grid */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px)
                  `,
                  backgroundSize: `${frameToPixel(30, zoom)}px 100%`,
                  opacity: 0.3,
                }}
              />

              {/* Video track: Scene blocks */}
              {track.id === 'video' && scenes.map((scene) => {
                const { inFrames, outFrames } = getSceneTransitions(scene);
                const isDraggedScene = dragPreview?.sceneId === scene.id;
                const previewLeft = previewPositionMap.get(scene.id);
                const previewWidth = previewWidthMap.get(scene.id);

                return (
                  <SceneBlock
                    key={scene.id}
                    scene={scene}
                    zoom={zoom}
                    isSelected={selectedSceneId === scene.id}
                    isDraggedScene={isDraggedScene}
                    previewLeft={previewLeft}
                    previewWidth={previewWidth}
                    onClick={() => onSceneSelect(scene.id)}
                    onDragStart={onSceneDragStart}
                    onDragMove={onSceneDragMove}
                    onDragEnd={onSceneDragEnd}
                    onResizeStart={onSceneResizeStart}
                    onResizeMove={onSceneResizeMove}
                    onResizeEnd={onSceneResizeEnd}
                    onRenderScene={onRenderScene}
                    trackHeight={track.height}
                    snapEnabled={snapEnabled}
                    hasChanges={changedSceneIds.has(scene.id)}
                    inTransitionFrames={inFrames}
                    outTransitionFrames={outFrames}
                    containerOffset={TRACK_LABEL_WIDTH}
                    renderProgress={sceneRenderProgress?.get(scene.id)}
                  />
                );
              })}

              {/* Insertion line during drag */}
              {track.id === 'video' && dragPreview && insertionLineLeft !== null && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[hsl(var(--accent))] z-40 pointer-events-none"
                  style={{
                    left: insertionLineLeft,
                    boxShadow: '0 0 6px hsl(var(--accent))',
                  }}
                />
              )}

              {/* Audio track: Show audio representation when we have audio */}
              {track.id === 'audio' && (
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[hsl(var(--foreground-subtle))]">
                  {/* Audio waveform placeholder */}
                </div>
              )}

              {/* Background FX track: Show animation indicators */}
              {track.id === 'background' && scenes.map((scene) => {
                const sceneData = scene.data ? JSON.parse(scene.data) : {};
                if (!sceneData.animation_style || sceneData.animation_style === 'none') return null;

                const left = frameToPixel(scene.start_frame, zoom);
                const width = frameToPixel(scene.end_frame - scene.start_frame, zoom);

                return (
                  <div
                    key={`bg-${scene.id}`}
                    className="absolute bg-[hsl(var(--accent))]/30 border border-[hsl(var(--accent))]/50 flex items-center px-2"
                    style={{
                      left,
                      width: Math.max(width, 30),
                      height: track.height - 8,
                      top: 4,
                    }}
                  >
                    <span className="text-[9px] text-[hsl(var(--accent))] truncate">
                      {sceneData.animation_style}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Transition indicators (on video track) */}
        {scenes.map((scene, index) => {
          if (index === scenes.length - 1) return null;
          const nextScene = scenes[index + 1];
          if (!nextScene) return null;

          const transition = transitions.find(t =>
            t.from_scene_number === scene.scene_number &&
            t.to_scene_number === nextScene.scene_number
          );
          if (!transition) return null;

          return (
            <TransitionIndicator
              key={transition.id}
              transition={transition}
              fromSceneEndFrame={scene.end_frame}
              zoom={zoom}
              trackHeight={TRACKS[0].height}
              isSelected={selectedTransitionId === transition.id}
              onClick={() => onTransitionSelect(transition.id)}
              transitionLabel={getTransitionLabel(transition.transition_type)}
            />
          );
        })}
      </div>
    </div>
  );
}

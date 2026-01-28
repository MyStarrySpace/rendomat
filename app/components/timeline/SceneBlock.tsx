"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Scene } from '@/lib/api';
import {
  frameToPixel,
  pixelToFrame,
  getSceneDuration,
  formatDuration,
  getSceneTypeColor,
  getZebraStripeStyle,
  getSnapGridSize,
  snapToGrid,
} from './lib/timeline-utils';
import { GripVertical, Database, AlertCircle, Play } from 'lucide-react';

interface SceneBlockProps {
  scene: Scene;
  zoom: number;
  isSelected: boolean;
  onClick: () => void;
  onDragStart?: (sceneId: number, startFrame: number) => void;
  onDragMove?: (sceneId: number, newStartFrame: number) => void;
  onDragEnd?: (sceneId: number, newStartFrame: number) => void;
  onResizeStart?: (sceneId: number, edge: 'start' | 'end') => void;
  onResizeMove?: (sceneId: number, edge: 'start' | 'end', newFrame: number) => void;
  onResizeEnd?: (sceneId: number, edge: 'start' | 'end', newFrame: number) => void;
  onRenderScene?: (sceneId: number) => void;
  trackHeight: number;
  snapEnabled?: boolean;
  hasChanges?: boolean;
  inTransitionFrames?: number;
  outTransitionFrames?: number;
  containerOffset?: number; // Offset for track labels
}

export function SceneBlock({
  scene,
  zoom,
  isSelected,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  onRenderScene,
  trackHeight,
  snapEnabled = true,
  hasChanges = false,
  inTransitionFrames = 0,
  outTransitionFrames = 0,
  containerOffset = 80,
}: SceneBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
  const dragStartX = useRef<number>(0);
  const dragStartFrame = useRef<number>(0);
  const originalStartFrame = useRef<number>(0);
  const originalEndFrame = useRef<number>(0);
  const hasDragged = useRef<boolean>(false);

  const isUnrendered = !scene.cache_path;
  const duration = getSceneDuration(scene);

  const left = frameToPixel(scene.start_frame, zoom);
  const width = frameToPixel(duration, zoom);
  const color = getSceneTypeColor(scene.scene_type);
  const zebraStyle = getZebraStripeStyle(isUnrendered, hasChanges);

  // Handle drag start (for reordering)
  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (isResizing) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    dragStartFrame.current = scene.start_frame;
    originalStartFrame.current = scene.start_frame;
    originalEndFrame.current = scene.end_frame;
    onDragStart?.(scene.id, scene.start_frame);
  }, [scene.id, scene.start_frame, scene.end_frame, isResizing, onDragStart]);

  // Handle resize start
  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    edge: 'start' | 'end'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(edge);
    originalStartFrame.current = scene.start_frame;
    originalEndFrame.current = scene.end_frame;
    onResizeStart?.(scene.id, edge);
  }, [scene.id, scene.start_frame, scene.end_frame, onResizeStart]);

  // Mouse move and up handlers
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector('[data-timeline-container]');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft || 0;
      const gridSize = getSnapGridSize(zoom, snapEnabled);

      if (isDragging && onDragMove) {
        // Calculate delta from drag start
        const deltaX = e.clientX - dragStartX.current;
        // Mark as dragged if moved more than 3 pixels
        if (Math.abs(deltaX) > 3) {
          hasDragged.current = true;
        }
        const deltaFrames = pixelToFrame(deltaX, zoom);
        const snappedDelta = snapEnabled ? snapToGrid(deltaFrames, gridSize) : deltaFrames;
        const newStartFrame = Math.max(0, dragStartFrame.current + snappedDelta);
        onDragMove(scene.id, newStartFrame);
      } else if (isResizing && onResizeMove) {
        // Calculate absolute position in timeline
        const x = e.clientX - rect.left + scrollLeft - containerOffset;
        const rawFrame = pixelToFrame(Math.max(0, x), zoom);
        const snappedFrame = snapEnabled ? snapToGrid(rawFrame, gridSize) : rawFrame;
        onResizeMove(scene.id, isResizing, snappedFrame);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging && onDragEnd) {
        const deltaX = e.clientX - dragStartX.current;
        const deltaFrames = pixelToFrame(deltaX, zoom);
        const gridSize = getSnapGridSize(zoom, snapEnabled);
        const snappedDelta = snapEnabled ? snapToGrid(deltaFrames, gridSize) : deltaFrames;
        const newStartFrame = Math.max(0, dragStartFrame.current + snappedDelta);
        onDragEnd(scene.id, newStartFrame);
        setIsDragging(false);
      }
      if (isResizing && onResizeEnd) {
        const container = document.querySelector('[data-timeline-container]');
        if (container) {
          const rect = container.getBoundingClientRect();
          const scrollLeft = container.scrollLeft || 0;
          const x = e.clientX - rect.left + scrollLeft - containerOffset;
          const rawFrame = pixelToFrame(Math.max(0, x), zoom);
          const gridSize = getSnapGridSize(zoom, snapEnabled);
          const snappedFrame = snapEnabled ? snapToGrid(rawFrame, gridSize) : rawFrame;
          onResizeEnd(scene.id, isResizing, snappedFrame);
        }
        setIsResizing(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, scene.id, zoom, snapEnabled, containerOffset, onDragMove, onDragEnd, onResizeMove, onResizeEnd]);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        width: Math.max(width, 30),
        height: trackHeight - 8,
        top: 4,
        zIndex: isDragging || isResizing || isSelected ? 50 : 10,
      }}
      className="group"
    >
      {/* Main block - entire block is draggable */}
      <div
        onMouseDown={(e) => {
          // Only start drag if not clicking on resize handles or buttons
          const target = e.target as HTMLElement;
          if (target.closest('[data-resize-handle]') || target.closest('button')) {
            return;
          }
          handleDragMouseDown(e);
        }}
        onClick={(e) => {
          // Only trigger click/select if we didn't actually drag
          if (!hasDragged.current) {
            onClick();
          }
          hasDragged.current = false;
        }}
        className={`h-full flex items-center overflow-hidden transition-shadow relative cursor-grab ${
          isSelected
            ? 'ring-2 ring-[hsl(var(--accent))] ring-offset-1 ring-offset-[hsl(var(--background))]'
            : ''
        } ${isDragging ? 'opacity-90 shadow-lg cursor-grabbing' : ''} ${isResizing ? 'opacity-90' : ''}`}
        style={{
          backgroundColor: color,
          ...zebraStyle,
        }}
      >
        {/* In-transition indicator */}
        {inTransitionFrames > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 bg-black/30 pointer-events-none"
            style={{ width: frameToPixel(inTransitionFrames, zoom) }}
          />
        )}

        {/* Out-transition indicator */}
        {outTransitionFrames > 0 && (
          <div
            className="absolute right-0 top-0 bottom-0 bg-black/30 pointer-events-none"
            style={{ width: frameToPixel(outTransitionFrames, zoom) }}
          />
        )}

        {/* Drag indicator */}
        <div className="flex-shrink-0 p-1 opacity-50 group-hover:opacity-100 z-10 pointer-events-none">
          <GripVertical className="w-3 h-3 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 px-1 z-10 pointer-events-none">
          <div className="text-xs font-medium text-white truncate flex items-center gap-1">
            {scene.scene_number}. {scene.name}
            {isUnrendered && (
              <AlertCircle className="w-3 h-3 text-white/70" />
            )}
          </div>
          {width > 80 && (
            <div className="text-[10px] text-white/70 flex items-center gap-1">
              {formatDuration(duration)}
              {scene.cache_path && !hasChanges && (
                <Database className="w-2.5 h-2.5" />
              )}
              {hasChanges && (
                <span className="text-yellow-200">modified</span>
              )}
            </div>
          )}
        </div>

        {/* Render button for unrendered scenes */}
        {(isUnrendered || hasChanges) && onRenderScene && width > 60 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRenderScene(scene.id);
            }}
            className="flex-shrink-0 p-1 mr-1 bg-white/20 hover:bg-white/30 transition-colors z-10"
            title="Render this scene"
          >
            <Play className="w-3 h-3 text-white" />
          </button>
        )}

        {/* Resize handles */}
        {(onResizeMove || onResizeEnd) && (
          <>
            {/* Left resize handle */}
            <div
              data-resize-handle="start"
              className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors z-20 ${
                isResizing === 'start' ? 'bg-white/40' : ''
              }`}
              onMouseDown={(e) => handleResizeMouseDown(e, 'start')}
            />
            {/* Right resize handle */}
            <div
              data-resize-handle="end"
              className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors z-20 ${
                isResizing === 'end' ? 'bg-white/40' : ''
              }`}
              onMouseDown={(e) => handleResizeMouseDown(e, 'end')}
            />
          </>
        )}
      </div>
    </div>
  );
}

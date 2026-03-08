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
  hasSceneChanged,
} from './lib/timeline-utils';
import { GripVertical, Database, AlertCircle, Zap } from 'lucide-react';

interface SceneBlockProps {
  scene: Scene;
  zoom: number;
  isSelected: boolean;
  isDraggedScene?: boolean;
  previewLeft?: number;
  previewWidth?: number;
  onClick: () => void;
  onDragStart?: (sceneId: number, startFrame: number) => void;
  onDragMove?: (sceneId: number, cursorFrame: number) => void;
  onDragEnd?: (sceneId: number, cursorFrame: number) => void;
  onResizeStart?: (sceneId: number, edge: 'start' | 'end') => void;
  onResizeMove?: (sceneId: number, edge: 'start' | 'end', newFrame: number) => void;
  onResizeEnd?: (sceneId: number, edge: 'start' | 'end', newFrame: number) => void;
  onRenderScene?: (sceneId: number) => void;
  trackHeight: number;
  snapEnabled?: boolean;
  hasChanges?: boolean;
  inTransitionFrames?: number;
  outTransitionFrames?: number;
  containerOffset?: number;
  renderProgress?: number;
}

export function SceneBlock({
  scene,
  zoom,
  isSelected,
  isDraggedScene = false,
  previewLeft,
  previewWidth,
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
  renderProgress,
}: SceneBlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPendingDrag, setIsPendingDrag] = useState(false);
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
  const dragStartX = useRef<number>(0);
  const dragStartY = useRef<number>(0);
  const dragStartFrame = useRef<number>(0);
  const hasDragged = useRef<boolean>(false);
  const DRAG_THRESHOLD = 6; // pixels before drag activates

  const isUnrendered = !scene.cache_path;
  const hasStaleCache = hasSceneChanged(scene);
  const effectiveHasChanges = hasChanges || hasStaleCache;
  const duration = getSceneDuration(scene);

  // Use preview position/width during drag or resize, otherwise use scene's actual values
  const displayLeft = previewLeft !== undefined
    ? previewLeft
    : frameToPixel(scene.start_frame, zoom);
  const width = previewWidth !== undefined
    ? previewWidth
    : frameToPixel(duration, zoom);
  const color = getSceneTypeColor(scene.scene_type);
  const zebraStyle = getZebraStripeStyle(isUnrendered, effectiveHasChanges);

  // Handle drag start (for reordering) — enters pending state until threshold crossed
  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (isResizing) return;
    e.preventDefault();
    e.stopPropagation();

    setIsPendingDrag(true);
    hasDragged.current = false;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragStartFrame.current = scene.start_frame;
  }, [scene.start_frame, isResizing]);

  // Handle resize start
  const handleResizeMouseDown = useCallback((
    e: React.MouseEvent,
    edge: 'start' | 'end'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(edge);
    onResizeStart?.(scene.id, edge);
  }, [scene.id, onResizeStart]);

  // Mouse move and up handlers
  useEffect(() => {
    if (!isPendingDrag && !isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Check if we should transition from pending to actual drag
      if (isPendingDrag && !isDragging) {
        const dx = e.clientX - dragStartX.current;
        const dy = e.clientY - dragStartY.current;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
        // Threshold crossed — commit to dragging
        setIsPendingDrag(false);
        setIsDragging(true);
        hasDragged.current = true;
        onDragStart?.(scene.id, scene.start_frame);
      }

      const container = document.querySelector('[data-timeline-container]');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollLeft = container.scrollLeft || 0;
      const gridSize = getSnapGridSize(zoom, snapEnabled);

      if (isDragging && onDragMove) {
        // Send cursor position as a frame value for reorder calculation
        const cursorX = e.clientX - rect.left + scrollLeft - containerOffset;
        const cursorFrame = pixelToFrame(Math.max(0, cursorX), zoom);
        onDragMove(scene.id, cursorFrame);
      } else if (isResizing && onResizeMove) {
        const x = e.clientX - rect.left + scrollLeft - containerOffset;
        const rawFrame = pixelToFrame(Math.max(0, x), zoom);
        const snappedFrame = snapEnabled ? snapToGrid(rawFrame, gridSize) : rawFrame;
        onResizeMove(scene.id, isResizing, snappedFrame);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isPendingDrag) {
        // Mouse released before threshold — treat as click, not drag
        setIsPendingDrag(false);
      }
      if (isDragging && onDragEnd) {
        const container = document.querySelector('[data-timeline-container]');
        if (container) {
          const rect = container.getBoundingClientRect();
          const scrollLeft = container.scrollLeft || 0;
          const cursorX = e.clientX - rect.left + scrollLeft - containerOffset;
          const cursorFrame = pixelToFrame(Math.max(0, cursorX), zoom);
          onDragEnd(scene.id, cursorFrame);
        }
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
  }, [isPendingDrag, isDragging, isResizing, scene.id, scene.start_frame, zoom, snapEnabled, containerOffset, onDragStart, onDragMove, onDragEnd, onResizeMove, onResizeEnd]);

  return (
    <div
      style={{
        position: 'absolute',
        left: displayLeft,
        width: Math.max(width, 30),
        height: trackHeight - 8,
        top: 4,
        zIndex: isDragging ? 100 : (isResizing || isSelected ? 50 : 10),
        transition: isDragging ? 'none' : 'left 150ms ease',
      }}
      className="group"
    >
      {/* Main block - entire block is draggable */}
      <div
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-resize-handle]') || target.closest('button')) {
            return;
          }
          handleDragMouseDown(e);
        }}
        onClick={(e) => {
          if (!hasDragged.current) {
            onClick();
          }
          hasDragged.current = false;
        }}
        className={`h-full flex items-center overflow-hidden relative cursor-grab ${
          isSelected
            ? 'ring-2 ring-[hsl(var(--accent))] ring-offset-1 ring-offset-[hsl(var(--background))]'
            : ''
        } ${isDragging ? 'opacity-80 shadow-xl cursor-grabbing scale-[1.02]' : ''} ${isResizing ? 'opacity-90' : ''}`}
        style={{
          backgroundColor: color,
          ...zebraStyle,
          ...(isDragging ? { boxShadow: '0 8px 25px rgba(0,0,0,0.3)' } : {}),
        }}
      >
        {/* Render progress fill (bottom to top) */}
        {renderProgress != null && renderProgress >= 0 && (
          <div
            className="absolute inset-x-0 bottom-0 bg-white/30 pointer-events-none transition-all duration-300"
            style={{ height: `${renderProgress}%` }}
          />
        )}

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
              {scene.cache_path && !effectiveHasChanges && (
                <Database className="w-2.5 h-2.5" />
              )}
              {effectiveHasChanges && (
                <span className="text-yellow-200">modified</span>
              )}
            </div>
          )}
        </div>

        {/* Render button for unrendered scenes */}
        {(isUnrendered || effectiveHasChanges) && onRenderScene && width > 60 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRenderScene(scene.id);
            }}
            className="flex-shrink-0 p-1 mr-1 bg-white/20 hover:bg-white/30 transition-colors z-10"
            title="Render this scene"
          >
            <Zap className="w-3 h-3 text-white" />
          </button>
        )}

        {/* Right resize handle only */}
        {(onResizeMove || onResizeEnd) && (
          <div
            data-resize-handle="end"
            className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 transition-colors z-20 ${
              isResizing === 'end' ? 'bg-white/40' : ''
            }`}
            onMouseDown={(e) => handleResizeMouseDown(e, 'end')}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Timeline state management hook
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Scene, Transition } from '@/lib/api';
import {
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  calculateTotalFrames,
  snapToGrid,
  clamp,
  getSnapGridSize,
  computeSequentialLayout,
  findDropTargetIndex,
} from '../lib/timeline-utils';

export interface DragPreview {
  sceneId: number;
  targetIndex: number;
  originalIndex: number;
  cursorFrame: number;
}

export interface ResizePreview {
  sceneId: number;
  edge: 'start' | 'end';
  newFrame: number;
}

export interface TimelineState {
  zoom: number;
  playheadFrame: number;
  selectedSceneId: number | null;
  selectedTransitionId: number | null;
  snapToGrid: boolean;
  isPlaying: boolean;
  scrollLeft: number;
  changedSceneIds: Set<number>;
}

export interface UseTimelineOptions {
  scenes: Scene[];
  transitions: Transition[];
  onSceneUpdate?: (sceneId: number, data: Partial<Scene>) => Promise<void>;
  onSceneReorder?: (videoId: number, sceneId: number, newSceneNumber: number) => Promise<void>;
  onSceneResize?: (sceneId: number, edge: 'start' | 'end', newFrame: number) => Promise<void>;
  onTransitionSelect?: (transitionId: number | null) => void;
}

export function useTimeline({
  scenes,
  transitions,
  onSceneUpdate,
  onSceneReorder,
  onSceneResize,
  onTransitionSelect,
}: UseTimelineOptions) {
  const [state, setState] = useState<TimelineState>({
    zoom: DEFAULT_ZOOM,
    playheadFrame: 0,
    selectedSceneId: null,
    selectedTransitionId: null,
    snapToGrid: true,
    isPlaying: false,
    scrollLeft: 0,
    changedSceneIds: new Set(),
  });

  // Drag preview state for reorder
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const dragPreviewRef = useRef<DragPreview | null>(null);

  // Resize preview state
  const [resizePreview, setResizePreview] = useState<ResizePreview | null>(null);

  // Track original scene positions for drag
  const dragState = useRef<{
    sceneId: number;
    originalSceneNumber: number;
    originalStartFrame: number;
    originalEndFrame: number;
  } | null>(null);

  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sorted scenes by scene_number
  const sortedScenes = useMemo(
    () => [...scenes].sort((a, b) => a.scene_number - b.scene_number),
    [scenes]
  );

  // Preview scenes: during drag or resize, show adjusted layout
  const previewScenes = useMemo(() => {
    if (dragPreview) {
      return computeSequentialLayout(
        sortedScenes,
        dragPreview.sceneId,
        dragPreview.targetIndex,
      );
    }
    if (resizePreview) {
      // Apply the resize to the target scene, then recompute sequential layout
      const modified = sortedScenes.map(s => {
        if (s.id !== resizePreview.sceneId) return s;
        if (resizePreview.edge === 'start') {
          const maxStart = s.end_frame - 15;
          const newStart = clamp(resizePreview.newFrame, 0, maxStart);
          return { ...s, start_frame: newStart };
        } else {
          const minEnd = s.start_frame + 15;
          const newEnd = Math.max(resizePreview.newFrame, minEnd);
          return { ...s, end_frame: newEnd };
        }
      });
      return computeSequentialLayout(modified);
    }
    return sortedScenes;
  }, [sortedScenes, dragPreview, resizePreview]);

  // Total duration
  const totalFrames = useMemo(
    () => calculateTotalFrames(sortedScenes),
    [sortedScenes]
  );

  // Zoom controls with extended range
  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: clamp(zoom, MIN_ZOOM, MAX_ZOOM),
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: clamp(prev.zoom * 1.3, MIN_ZOOM, MAX_ZOOM),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: clamp(prev.zoom / 1.3, MIN_ZOOM, MAX_ZOOM),
    }));
  }, []);

  // Playhead controls
  const setPlayheadFrame = useCallback((frame: number) => {
    setState(prev => ({
      ...prev,
      playheadFrame: clamp(frame, 0, totalFrames),
    }));
  }, [totalFrames]);

  const seekToFrame = useCallback((frame: number) => {
    const gridSize = getSnapGridSize(state.zoom, state.snapToGrid);
    const targetFrame = state.snapToGrid
      ? snapToGrid(frame, gridSize)
      : frame;
    setPlayheadFrame(clamp(targetFrame, 0, totalFrames));
  }, [state.zoom, state.snapToGrid, totalFrames, setPlayheadFrame]);

  // Playback controls
  const play = useCallback(() => {
    if (state.isPlaying) return;

    setState(prev => ({ ...prev, isPlaying: true }));

    playIntervalRef.current = setInterval(() => {
      setState(prev => {
        const nextFrame = prev.playheadFrame + 1;
        if (nextFrame >= totalFrames) {
          if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
          }
          return { ...prev, isPlaying: false, playheadFrame: totalFrames };
        }
        return { ...prev, playheadFrame: nextFrame };
      });
    }, 1000 / 30); // 30 FPS
  }, [state.isPlaying, totalFrames]);

  const pause = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const stop = useCallback(() => {
    pause();
    setPlayheadFrame(0);
  }, [pause, setPlayheadFrame]);

  // Scene selection
  const selectScene = useCallback((sceneId: number | null) => {
    setState(prev => ({
      ...prev,
      selectedSceneId: sceneId,
      selectedTransitionId: null,
    }));
  }, []);

  // Transition selection
  const selectTransition = useCallback((transitionId: number | null) => {
    setState(prev => ({
      ...prev,
      selectedTransitionId: transitionId,
      selectedSceneId: null,
    }));
    onTransitionSelect?.(transitionId);
  }, [onTransitionSelect]);

  // Toggle snap to grid
  const toggleSnapToGrid = useCallback(() => {
    setState(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }));
  }, []);

  // Scroll position
  const setScrollLeft = useCallback((scrollLeft: number) => {
    setState(prev => ({ ...prev, scrollLeft }));
  }, []);

  // Scene drag handlers - for reordering scenes
  const handleSceneDragStart = useCallback((sceneId: number, _startFrame: number) => {
    const scene = sortedScenes.find(s => s.id === sceneId);
    if (!scene) return;

    const originalIndex = sortedScenes.findIndex(s => s.id === sceneId);
    dragState.current = {
      sceneId,
      originalSceneNumber: scene.scene_number,
      originalStartFrame: scene.start_frame,
      originalEndFrame: scene.end_frame,
    };

    const preview = {
      sceneId,
      targetIndex: originalIndex,
      originalIndex,
      cursorFrame: scene.start_frame,
    };
    dragPreviewRef.current = preview;
    setDragPreview(preview);
  }, [sortedScenes]);

  const handleSceneDragMove = useCallback((sceneId: number, cursorFrame: number) => {
    if (!dragState.current || dragState.current.sceneId !== sceneId) return;

    const targetIndex = findDropTargetIndex(sortedScenes, sceneId, cursorFrame);

    setDragPreview(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        targetIndex,
        cursorFrame,
      };
      dragPreviewRef.current = updated;
      return updated;
    });
  }, [sortedScenes]);

  const handleSceneDragEnd = useCallback(async (sceneId: number, _cursorFrame: number) => {
    if (!dragState.current || dragState.current.sceneId !== sceneId) {
      dragPreviewRef.current = null;
      setDragPreview(null);
      dragState.current = null;
      return;
    }

    // Read from ref to avoid stale closure
    const preview = dragPreviewRef.current;
    if (!preview) {
      dragState.current = null;
      return;
    }

    // Compute the new scene_number from targetIndex
    // Both targetIndex and scene_number are 0-based
    const newSceneNumber = preview.targetIndex;
    const oldSceneNumber = dragState.current.originalSceneNumber;

    dragPreviewRef.current = null;
    setDragPreview(null);
    dragState.current = null;

    if (newSceneNumber !== oldSceneNumber && onSceneReorder) {
      const scene = sortedScenes.find(s => s.id === sceneId);
      if (scene) {
        await onSceneReorder(scene.video_id, sceneId, newSceneNumber);
      }
    }
  }, [sortedScenes, onSceneReorder]);

  // Scene resize handlers — local preview during drag, server commit on drop
  const handleSceneResizeStart = useCallback((sceneId: number, edge: 'start' | 'end') => {
    const scene = sortedScenes.find(s => s.id === sceneId);
    if (!scene) return;

    dragState.current = {
      sceneId,
      originalSceneNumber: scene.scene_number,
      originalStartFrame: scene.start_frame,
      originalEndFrame: scene.end_frame,
    };
    setResizePreview({ sceneId, edge, newFrame: edge === 'start' ? scene.start_frame : scene.end_frame });
  }, [sortedScenes]);

  const handleSceneResizeMove = useCallback((_sceneId: number, edge: 'start' | 'end', newFrame: number) => {
    setResizePreview(prev => {
      if (!prev) return null;
      return { ...prev, newFrame };
    });
  }, []);

  const handleSceneResizeEnd = useCallback(async (sceneId: number, edge: 'start' | 'end', newFrame: number) => {
    setResizePreview(null);

    if (onSceneResize) {
      await onSceneResize(sceneId, edge, newFrame);
    } else if (onSceneUpdate) {
      const scene = sortedScenes.find(s => s.id === sceneId);
      if (!scene) return;
      if (edge === 'start') {
        const maxStart = scene.end_frame - 15;
        const newStart = clamp(newFrame, 0, maxStart);
        await onSceneUpdate(sceneId, { start_frame: newStart });
      } else {
        const minEnd = scene.start_frame + 15;
        const newEnd = Math.max(newFrame, minEnd);
        await onSceneUpdate(sceneId, { end_frame: newEnd });
      }
    }

    // Mark scene as changed (needs re-render)
    setState(prev => ({
      ...prev,
      changedSceneIds: new Set([...prev.changedSceneIds, sceneId]),
    }));

    dragState.current = null;
  }, [sortedScenes, onSceneUpdate, onSceneResize]);

  // Mark scene as changed (when data is modified)
  const markSceneChanged = useCallback((sceneId: number) => {
    setState(prev => ({
      ...prev,
      changedSceneIds: new Set([...prev.changedSceneIds, sceneId]),
    }));
  }, []);

  // Clear changed status for a scene (after re-render)
  const clearSceneChanged = useCallback((sceneId: number) => {
    setState(prev => {
      const newSet = new Set(prev.changedSceneIds);
      newSet.delete(sceneId);
      return { ...prev, changedSceneIds: newSet };
    });
  }, []);

  // Clear all changed statuses
  const clearAllChanges = useCallback(() => {
    setState(prev => ({ ...prev, changedSceneIds: new Set() }));
  }, []);

  // Get transition between two scenes
  const getTransitionBetween = useCallback((fromSceneNumber: number, toSceneNumber: number) => {
    return transitions.find(
      t => t.from_scene_number === fromSceneNumber && t.to_scene_number === toSceneNumber
    );
  }, [transitions]);

  // Get selected scene
  const selectedScene = useMemo(
    () => sortedScenes.find(s => s.id === state.selectedSceneId) || null,
    [sortedScenes, state.selectedSceneId]
  );

  // Get selected transition
  const selectedTransition = useMemo(
    () => transitions.find(t => t.id === state.selectedTransitionId) || null,
    [transitions, state.selectedTransitionId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setPlayheadFrame(Math.max(0, state.playheadFrame - (e.shiftKey ? 30 : 1)));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPlayheadFrame(Math.min(totalFrames, state.playheadFrame + (e.shiftKey ? 30 : 1)));
          break;
        case 'Home':
          e.preventDefault();
          setPlayheadFrame(0);
          break;
        case 'End':
          e.preventDefault();
          setPlayheadFrame(totalFrames);
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case 'Escape':
          selectScene(null);
          selectTransition(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    state.playheadFrame,
    totalFrames,
    togglePlayPause,
    setPlayheadFrame,
    selectScene,
    selectTransition,
    zoomIn,
    zoomOut,
  ]);

  return {
    // State
    ...state,
    sortedScenes,
    previewScenes,
    totalFrames,
    selectedScene,
    selectedTransition,
    containerRef,
    dragPreview,
    resizePreview,

    // Actions
    setZoom,
    zoomIn,
    zoomOut,
    setPlayheadFrame,
    seekToFrame,
    play,
    pause,
    togglePlayPause,
    stop,
    selectScene,
    selectTransition,
    toggleSnapToGrid,
    setScrollLeft,
    handleSceneDragStart,
    handleSceneDragMove,
    handleSceneDragEnd,
    handleSceneResizeStart,
    handleSceneResizeMove,
    handleSceneResizeEnd,
    markSceneChanged,
    clearSceneChanged,
    clearAllChanges,
    getTransitionBetween,
  };
}

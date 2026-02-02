"use client";

import React, { useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene, Transition, TransitionType, sceneApi, Video, API_BASE } from '@/lib/api';
import { calculateSceneDuration } from '@/lib/scene-duration';
import { useTimeline } from './hooks/useTimeline';
import { TimelineHeader } from './TimelineHeader';
import { TimelineContainer } from './TimelineContainer';
import { SidePanel } from './SidePanel';
import { Film, AlertTriangle, X, RefreshCw, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { frameToSeconds, getSceneAtFrame, TRACKS } from './lib/timeline-utils';

// Local storage key for "don't show again" preference
const RENDER_MODAL_DISMISSED_KEY = 'timeline-render-modal-dismissed';

interface TimelineEditorProps {
  video: Video;
  scenes: Scene[];
  transitions: Transition[];
  transitionTypes: TransitionType[];
  onScenesChange: () => void;
  onTransitionsChange: () => void;
  onSceneSelect?: (scene: Scene | null) => void;
  onOpenStockBrowser?: (fieldName: string) => void;
  onRenderVideo?: () => void;
  onRegenerateFromPrompt?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  sceneRenderProgress?: Map<number, number>;
}

export function TimelineEditor({
  video,
  scenes,
  transitions,
  transitionTypes,
  onScenesChange,
  onTransitionsChange,
  onSceneSelect,
  onOpenStockBrowser,
  onRenderVideo,
  onRegenerateFromPrompt,
  videoRef: externalVideoRef,
  sceneRenderProgress,
}: TimelineEditorProps) {
  const [showRenderChangedModal, setShowRenderChangedModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [dontShowRenderModal, setDontShowRenderModal] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(RENDER_MODAL_DISMISSED_KEY) === 'true';
    }
    return false;
  });
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const [videoSyncEnabled, setVideoSyncEnabled] = useState(true);

  // Scene update handler (for resize during drag - local preview)
  const handleSceneUpdate = useCallback(async (sceneId: number, data: Partial<Scene>) => {
    try {
      await sceneApi.update(sceneId, data);
      onScenesChange();
    } catch (error) {
      console.error('[TimelineEditor] sceneApi.update failed', error);
    }
  }, [onScenesChange]);

  // Scene reorder handler
  const handleSceneReorder = useCallback(async (videoId: number, sceneId: number, newSceneNumber: number) => {
    try {
      await sceneApi.reorder(videoId, sceneId, newSceneNumber);
      onScenesChange();
      onTransitionsChange();
    } catch (error) {
      console.error('[TimelineEditor] sceneApi.reorder failed', error);
    }
  }, [onScenesChange, onTransitionsChange]);

  // Scene resize handler (server-side with frame recalculation)
  const handleSceneResize = useCallback(async (sceneId: number, edge: 'start' | 'end', newFrame: number) => {
    try {
      await sceneApi.resize(sceneId, edge, newFrame);
      onScenesChange();
    } catch (error) {
      console.error('[TimelineEditor] sceneApi.resize failed', error);
    }
  }, [onScenesChange]);

  // Timeline hook
  const timeline = useTimeline({
    scenes,
    transitions,
    onSceneUpdate: handleSceneUpdate,
    onSceneReorder: handleSceneReorder,
    onSceneResize: handleSceneResize,
  });

  // Derived state
  const hasUnrenderedScenes = useMemo(
    () => scenes.some(s => !s.cache_path),
    [scenes]
  );

  const hasChangedScenes = useMemo(
    () => timeline.changedSceneIds.size > 0,
    [timeline.changedSceneIds]
  );

  // Scene save handler (for side panel) - saves and triggers re-render
  const handleSceneSave = useCallback(async (sceneId: number, data: any) => {
    await sceneApi.update(sceneId, {
      data: JSON.stringify(data),
      // Clear cache when data changes to trigger re-render
      cache_path: null,
      cache_hash: null,
      cached_at: null,
    });
    onScenesChange();
    timeline.clearSceneChanged(sceneId);
    timeline.selectScene(null);
    // Trigger video render
    onRenderVideo?.();
  }, [onScenesChange, timeline, onRenderVideo]);

  // Transition save handler
  const handleTransitionSave = useCallback(async (
    transitionId: number,
    data: { transition_type?: string; duration_frames?: number }
  ) => {
    const res = await fetch(`${API_BASE}/api/transitions/${transitionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transition');
    onTransitionsChange();
    timeline.selectTransition(null);
  }, [onTransitionsChange, timeline]);

  // Transition delete handler
  const handleTransitionDelete = useCallback(async (transitionId: number) => {
    const res = await fetch(`${API_BASE}/api/transitions/${transitionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transition');
    onTransitionsChange();
    timeline.selectTransition(null);
  }, [onTransitionsChange, timeline]);

  // Scene drag handlers - pass through to timeline hook
  const handleSceneDragStart = useCallback((sceneId: number, startFrame: number) => {
    timeline.handleSceneDragStart(sceneId, startFrame);
  }, [timeline]);

  const handleSceneDragMove = useCallback((sceneId: number, cursorFrame: number) => {
    timeline.handleSceneDragMove(sceneId, cursorFrame);
  }, [timeline]);

  const handleSceneDragEnd = useCallback((sceneId: number, cursorFrame: number) => {
    timeline.handleSceneDragEnd(sceneId, cursorFrame);
  }, [timeline]);

  // Scene resize handlers - pass through to timeline hook
  const handleSceneResizeStart = useCallback((sceneId: number, edge: 'start' | 'end') => {
    timeline.handleSceneResizeStart(sceneId, edge);
  }, [timeline]);

  const handleSceneResizeMove = useCallback((sceneId: number, edge: 'start' | 'end', newFrame: number) => {
    timeline.handleSceneResizeMove(sceneId, edge, newFrame);
  }, [timeline]);

  const handleSceneResizeEnd = useCallback((sceneId: number, edge: 'start' | 'end', newFrame: number) => {
    timeline.handleSceneResizeEnd(sceneId, edge, newFrame);
  }, [timeline]);

  // Render single scene
  const handleRenderScene = useCallback(async (sceneId: number) => {
    // Clear cache to trigger re-render
    await sceneApi.update(sceneId, {
      cache_path: null,
      cache_hash: null,
      cached_at: null,
    });
    timeline.clearSceneChanged(sceneId);
    onScenesChange();
    // Trigger full video render to include this scene
    onRenderVideo?.();
  }, [timeline, onScenesChange, onRenderVideo]);

  // Render changed scenes - the actual render logic
  const doRenderChanged = useCallback(async () => {
    // Save "don't show again" preference if checked
    if (dontShowRenderModal) {
      localStorage.setItem(RENDER_MODAL_DISMISSED_KEY, 'true');
    }

    // Only clear caches for changed scenes (or unrendered)
    const scenesToRender = scenes.filter(
      scene => !scene.cache_path || timeline.changedSceneIds.has(scene.id)
    );

    await Promise.all(
      scenesToRender.map(scene =>
        sceneApi.update(scene.id, {
          cache_path: null,
          cache_hash: null,
          cached_at: null,
        })
      )
    );
    timeline.clearAllChanges();
    onScenesChange();
    setShowRenderChangedModal(false);
    // Trigger full video render
    onRenderVideo?.();
  }, [scenes, timeline, onScenesChange, onRenderVideo, dontShowRenderModal]);

  // Handler for render button - shows modal or renders directly
  const handleRenderChanged = useCallback(() => {
    if (dontShowRenderModal) {
      doRenderChanged();
    } else {
      setShowRenderChangedModal(true);
    }
  }, [dontShowRenderModal, doRenderChanged]);

  // Regenerate from prompt handler
  const handleRegenerateFromPrompt = useCallback(() => {
    setShowRegenerateModal(true);
  }, []);

  const confirmRegenerateFromPrompt = useCallback(() => {
    setShowRegenerateModal(false);
    onRegenerateFromPrompt?.();
  }, [onRegenerateFromPrompt]);

  // Add a new scene
  const handleAddScene = useCallback(async () => {
    try {
      const lastScene = scenes.length > 0
        ? scenes.reduce((a, b) => a.end_frame > b.end_frame ? a : b)
        : null;
      const startFrame = lastScene ? lastScene.end_frame : 0;
      const sceneNumber = scenes.length > 0
        ? Math.max(...scenes.map(s => s.scene_number)) + 1
        : 0;

      const defaultData = { title: `Scene ${sceneNumber}`, body_text: '' };
      const durationFrames = calculateSceneDuration({ scene_type: 'text-only', data: defaultData });

      const newScene = await sceneApi.create(video.id, {
        scene_number: sceneNumber,
        name: `Scene ${sceneNumber}`,
        scene_type: 'text-only',
        start_frame: startFrame,
        end_frame: startFrame + durationFrames,
        data: JSON.stringify(defaultData),
        cache_path: null,
        cache_hash: null,
        cached_at: null,
      });

      onScenesChange();
      // Auto-select the new scene to open the editor
      timeline.selectScene(newScene.id);
    } catch (error) {
      console.error('[TimelineEditor] handleAddScene failed', error);
    }
  }, [scenes, video.id, onScenesChange, timeline]);

  // Handle scene type change
  const handleSceneTypeChange = useCallback(async (sceneId: number, newType: string) => {
    try {
      const scene = scenes.find(s => s.id === sceneId);
      if (!scene) return;

      const sceneData = scene.data ? JSON.parse(scene.data) : {};
      const durationFrames = calculateSceneDuration({ scene_type: newType, data: sceneData });

      await sceneApi.update(sceneId, {
        scene_type: newType,
        end_frame: scene.start_frame + durationFrames,
        cache_path: null,
        cache_hash: null,
        cached_at: null,
      });
      onScenesChange();
    } catch (error) {
      console.error('[TimelineEditor] handleSceneTypeChange failed', error);
    }
  }, [scenes, onScenesChange]);

  // Get transition type label
  const getTransitionLabel = useCallback((typeId: string) => {
    const type = transitionTypes.find(t => t.id === typeId);
    return type?.label || typeId;
  }, [transitionTypes]);

  // Handle scene selection with callback
  const handleSceneSelect = useCallback((sceneId: number | null) => {
    timeline.selectScene(sceneId);
    if (onSceneSelect) {
      const scene = sceneId ? scenes.find(s => s.id === sceneId) || null : null;
      onSceneSelect(scene);
    }
  }, [timeline, scenes, onSceneSelect]);

  // Close side panel
  const closeSidePanel = useCallback(() => {
    timeline.selectScene(null);
    timeline.selectTransition(null);
  }, [timeline]);

  // Video sync - update video time when playhead moves
  useEffect(() => {
    if (!videoRef.current || !videoSyncEnabled) return;

    const video = videoRef.current;
    const currentTime = frameToSeconds(timeline.playheadFrame);

    // Only seek if difference is significant
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }
  }, [timeline.playheadFrame, videoSyncEnabled]);

  // Sync playhead with video during playback
  useEffect(() => {
    if (!videoRef.current || !videoSyncEnabled || !timeline.isPlaying) return;

    const video = videoRef.current;

    // Play video when timeline plays
    video.play().catch(() => {});

    return () => {
      video.pause();
    };
  }, [timeline.isPlaying, videoSyncEnabled]);

  if (scenes.length === 0) {
    const totalTrackHeight = TRACKS.reduce((sum, t) => sum + t.height, 0);
    const RULER_HEIGHT = 24;
    const TRACK_LABEL_WIDTH = 80;

    return (
      <div className="flex flex-col border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden opacity-75">
        {/* Disabled header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--surface))] border-b border-[hsl(var(--border))] pointer-events-none select-none">
          <div className="flex items-center gap-2 text-[hsl(var(--foreground-muted))]">
            <Film className="w-4 h-4" />
            <span className="text-sm">Timeline</span>
          </div>
          <span className="text-xs text-[hsl(var(--foreground-muted))]">00:00 / 00:00</span>
        </div>

        {/* Empty timeline area */}
        <div
          className="relative overflow-hidden bg-[hsl(var(--background))]"
          style={{ height: RULER_HEIGHT + totalTrackHeight + 8 }}
        >
          {/* Ruler placeholder */}
          <div
            className="h-6 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
            style={{ marginLeft: TRACK_LABEL_WIDTH }}
          />

          {/* Track area */}
          <div className="relative" style={{ height: totalTrackHeight }}>
            {/* Track labels */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-[hsl(var(--surface))] border-r border-[hsl(var(--border))] z-10"
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

            {/* Track content */}
            <div style={{ marginLeft: TRACK_LABEL_WIDTH }}>
              {TRACKS.map((track, index) => {
                const top = TRACKS.slice(0, index).reduce((sum, t) => sum + t.height, 0);
                return (
                  <div
                    key={track.id}
                    className="absolute left-0 right-0 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]"
                    style={{ top, height: track.height, marginLeft: TRACK_LABEL_WIDTH }}
                  >
                    {/* Placeholder block on video track */}
                    {track.id === 'video' && (
                      <div
                        className="absolute flex flex-col items-center justify-center gap-1"
                        style={{
                          left: 8,
                          right: 8,
                          top: 4,
                          height: track.height - 8,
                        }}
                      >
                        <button
                          className="flex items-center justify-center gap-2 border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface))]/50 hover:bg-[hsl(var(--surface))] hover:border-[hsl(var(--accent))] transition-colors cursor-pointer w-full"
                          style={{ height: Math.max(28, (track.height - 8) * 0.6) }}
                          onClick={handleAddScene}
                        >
                          <Plus className="w-4 h-4 text-[hsl(var(--foreground-muted))]" />
                          <span className="text-xs text-[hsl(var(--foreground-muted))]">
                            Add a scene to get started
                          </span>
                        </button>
                        {onRegenerateFromPrompt && (
                          <button
                            className="text-[10px] text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--accent))] transition-colors flex items-center gap-1"
                            onClick={() => onRegenerateFromPrompt?.()}
                          >
                            <Sparkles className="w-3 h-3" />
                            or generate from prompt
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col border border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden">
        {/* Header with controls */}
        <TimelineHeader
          zoom={timeline.zoom}
          playheadFrame={timeline.playheadFrame}
          totalFrames={timeline.totalFrames}
          isPlaying={timeline.isPlaying}
          snapToGrid={timeline.snapToGrid}
          hasUnrenderedScenes={hasUnrenderedScenes}
          hasChangedScenes={hasChangedScenes}
          onZoomIn={timeline.zoomIn}
          onZoomOut={timeline.zoomOut}
          onZoomChange={timeline.setZoom}
          onToggleSnap={timeline.toggleSnapToGrid}
          onPlay={timeline.play}
          onPause={timeline.pause}
          onStop={timeline.stop}
          onSeekStart={() => timeline.setPlayheadFrame(0)}
          onSeekEnd={() => timeline.setPlayheadFrame(timeline.totalFrames)}
          onRenderChanged={handleRenderChanged}
          onRegenerateFromPrompt={handleRegenerateFromPrompt}
          onAddScene={handleAddScene}
        />

        {/* Main timeline area */}
        <div className="flex flex-1 min-h-0">
          {/* Timeline container */}
          <div className="flex-1 min-w-0">
            <TimelineContainer
              scenes={timeline.sortedScenes}
              previewScenes={timeline.previewScenes}
              transitions={transitions}
              zoom={timeline.zoom}
              playheadFrame={timeline.playheadFrame}
              selectedSceneId={timeline.selectedSceneId}
              selectedTransitionId={timeline.selectedTransitionId}
              isPlaying={timeline.isPlaying}
              snapEnabled={timeline.snapToGrid}
              dragPreview={timeline.dragPreview}
              resizePreview={timeline.resizePreview}
              onSeek={timeline.seekToFrame}
              onSceneSelect={handleSceneSelect}
              onTransitionSelect={timeline.selectTransition}
              onSceneDragStart={handleSceneDragStart}
              onSceneDragMove={handleSceneDragMove}
              onSceneDragEnd={handleSceneDragEnd}
              onSceneResizeStart={handleSceneResizeStart}
              onSceneResizeMove={handleSceneResizeMove}
              onSceneResizeEnd={handleSceneResizeEnd}
              onRenderScene={handleRenderScene}
              onScrollChange={timeline.setScrollLeft}
              getTransitionLabel={getTransitionLabel}
              changedSceneIds={timeline.changedSceneIds}
              sceneRenderProgress={sceneRenderProgress}
            />
          </div>

          {/* Side panel editor */}
          <SidePanel
            selectedScene={timeline.selectedScene}
            selectedTransition={timeline.selectedTransition}
            transitionTypes={transitionTypes}
            onClose={closeSidePanel}
            onSceneSave={handleSceneSave}
            onTransitionSave={handleTransitionSave}
            onTransitionDelete={handleTransitionDelete}
            onOpenStockBrowser={onOpenStockBrowser}
            onSceneTypeChange={handleSceneTypeChange}
            hasChanges={timeline.selectedSceneId ? timeline.changedSceneIds.has(timeline.selectedSceneId) : false}
          />
        </div>

        {/* Hidden video element for sync (only when no external ref) */}
        {!externalVideoRef && video.output_path && (
          <video
            ref={internalVideoRef}
            src={`${API_BASE}/uploads/${video.output_path}`}
            className="hidden"
            muted
          />
        )}
      </div>

      {/* Re-render Changed Scenes Confirmation Modal */}
      <AnimatePresence>
        {showRenderChangedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRenderChangedModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 5 }}
              className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="headline text-xl text-[hsl(var(--foreground))] mb-2">
                    Re-render Changed Scenes?
                  </h2>
                  <p className="text-sm text-[hsl(var(--foreground-muted))]">
                    This will re-render only the modified and unrendered scenes, then regenerate the video.
                  </p>
                </div>
              </div>

              <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--foreground-muted))]">Modified scenes:</span>
                  <span className="font-medium text-[hsl(var(--warning))]">{timeline.changedSceneIds.size}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-[hsl(var(--foreground-muted))]">Unrendered scenes:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {scenes.filter(s => !s.cache_path).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2 pt-2 border-t border-[hsl(var(--border))]">
                  <span className="text-[hsl(var(--foreground-muted))]">Total to render:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">
                    {scenes.filter(s => !s.cache_path || timeline.changedSceneIds.has(s.id)).length}
                  </span>
                </div>
              </div>

              {/* Don't show again checkbox */}
              <label className="flex items-center gap-2 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowRenderModal}
                  onChange={(e) => setDontShowRenderModal(e.target.checked)}
                  className="w-4 h-4 accent-[hsl(var(--accent))]"
                />
                <span className="text-sm text-[hsl(var(--foreground-muted))]">
                  Don't show this again
                </span>
              </label>

              <div className="flex gap-3">
                <Button
                  onClick={doRenderChanged}
                  className="flex-1"
                >
                  Re-render Changed
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowRenderChangedModal(false)}
                  icon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regenerate from Prompt Modal */}
      <AnimatePresence>
        {showRegenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowRegenerateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 5 }}
              className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-2 bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="headline text-xl text-[hsl(var(--foreground))] mb-2">
                    Regenerate from Prompt?
                  </h2>
                  <p className="text-sm text-[hsl(var(--foreground-muted))]">
                    This will regenerate all scenes from your original prompt.
                    <strong className="text-[hsl(var(--warning))]"> All current scene edits will be lost.</strong>
                  </p>
                </div>
              </div>

              <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--foreground-muted))]">Current scenes:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{scenes.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-[hsl(var(--foreground-muted))]">Rendered scenes:</span>
                  <span className="font-medium text-[hsl(var(--success))]">
                    {scenes.filter(s => s.cache_path).length}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={confirmRegenerateFromPrompt}
                  className="flex-1"
                  variant="destructive"
                >
                  Yes, Regenerate All
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowRegenerateModal(false)}
                  icon={<X className="w-4 h-4" />}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

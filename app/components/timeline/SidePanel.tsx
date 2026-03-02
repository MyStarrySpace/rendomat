"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene, Transition, TransitionType, AudioClip, VideoClip } from '@/lib/api';
import { SceneEditor } from './SceneEditor';
import { TransitionEditor } from './TransitionEditor';
import { AudioClipEditor } from './AudioClipEditor';
import { VideoClipEditor } from './VideoClipEditor';
import { X, MoreHorizontal, Sparkles } from 'lucide-react';

interface SidePanelProps {
  selectedScene: Scene | null;
  selectedTransition: Transition | null;
  selectedAudioClip?: AudioClip | null;
  selectedVideoClip?: VideoClip | null;
  transitionTypes: TransitionType[];
  onClose: () => void;
  onSceneSave: (sceneId: number, data: any) => Promise<void>;
  onTransitionSave: (transitionId: number, data: { transition_type?: string; duration_frames?: number }) => Promise<void>;
  onTransitionDelete: (transitionId: number) => Promise<void>;
  onAudioClipSave?: (clipId: number, data: Partial<AudioClip>) => Promise<void>;
  onAudioClipDelete?: (clipId: number) => Promise<void>;
  onVideoClipSave?: (clipId: number, data: Partial<VideoClip>) => Promise<void>;
  onVideoClipDelete?: (clipId: number) => Promise<void>;
  onOpenStockBrowser?: (fieldName: string) => void;
  onSceneTypeChange?: (sceneId: number, newType: string) => void;
  onRegenerateFromPrompt?: () => void;
  hasChanges?: boolean;
}

export function SidePanel({
  selectedScene,
  selectedTransition,
  selectedAudioClip,
  selectedVideoClip,
  transitionTypes,
  onClose,
  onSceneSave,
  onTransitionSave,
  onTransitionDelete,
  onAudioClipSave,
  onAudioClipDelete,
  onVideoClipSave,
  onVideoClipDelete,
  onOpenStockBrowser,
  onSceneTypeChange,
  onRegenerateFromPrompt,
  hasChanges = false,
}: SidePanelProps) {
  const isOpen = selectedScene !== null || selectedTransition !== null || selectedAudioClip !== null || selectedVideoClip !== null;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 h-full min-h-screen border-l border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden"
        >
          <div className="w-[320px] h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-8 pb-3 border-b border-[hsl(var(--border))]">
              <h2 className="font-medium text-[hsl(var(--foreground))]">
                {selectedScene ? 'Edit Scene' : selectedTransition ? 'Edit Transition' : selectedVideoClip ? 'Edit Video Clip' : 'Edit Audio Clip'}
              </h2>
              <div className="flex items-center gap-1">
                {/* Ellipsis menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-1 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))] transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-lg z-50"
                      >
                        {onRegenerateFromPrompt && (
                          <button
                            onClick={() => { setMenuOpen(false); onRegenerateFromPrompt(); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))] transition-colors text-left"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Regenerate All
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedScene && (
                <SceneEditor
                  scene={selectedScene}
                  onSave={onSceneSave}
                  onCancel={onClose}
                  onOpenStockBrowser={onOpenStockBrowser}
                  onSceneTypeChange={onSceneTypeChange}
                  hasChanges={hasChanges}
                />
              )}

              {selectedTransition && (
                <TransitionEditor
                  transition={selectedTransition}
                  transitionTypes={transitionTypes}
                  onSave={onTransitionSave}
                  onDelete={onTransitionDelete}
                  onCancel={onClose}
                />
              )}

              {selectedAudioClip && onAudioClipSave && onAudioClipDelete && (
                <AudioClipEditor
                  clip={selectedAudioClip}
                  onSave={onAudioClipSave}
                  onDelete={onAudioClipDelete}
                  onCancel={onClose}
                />
              )}

              {selectedVideoClip && onVideoClipSave && onVideoClipDelete && (
                <VideoClipEditor
                  clip={selectedVideoClip}
                  onSave={onVideoClipSave}
                  onDelete={onVideoClipDelete}
                  onCancel={onClose}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

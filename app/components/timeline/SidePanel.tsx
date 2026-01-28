"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scene, Transition, TransitionType } from '@/lib/api';
import { SceneEditor } from './SceneEditor';
import { TransitionEditor } from './TransitionEditor';
import { X } from 'lucide-react';

interface SidePanelProps {
  selectedScene: Scene | null;
  selectedTransition: Transition | null;
  transitionTypes: TransitionType[];
  onClose: () => void;
  onSceneSave: (sceneId: number, data: any) => Promise<void>;
  onTransitionSave: (transitionId: number, data: { transition_type?: string; duration_frames?: number }) => Promise<void>;
  onTransitionDelete: (transitionId: number) => Promise<void>;
  onOpenStockBrowser?: (fieldName: string) => void;
  hasChanges?: boolean;
}

export function SidePanel({
  selectedScene,
  selectedTransition,
  transitionTypes,
  onClose,
  onSceneSave,
  onTransitionSave,
  onTransitionDelete,
  onOpenStockBrowser,
  hasChanges = false,
}: SidePanelProps) {
  const isOpen = selectedScene !== null || selectedTransition !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 border-l border-[hsl(var(--border))] bg-[hsl(var(--surface))] overflow-hidden"
        >
          <div className="w-[320px] h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
              <h2 className="font-medium text-[hsl(var(--foreground))]">
                {selectedScene ? 'Edit Scene' : 'Edit Transition'}
              </h2>
              <button
                onClick={onClose}
                className="p-1 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedScene && (
                <SceneEditor
                  scene={selectedScene}
                  onSave={onSceneSave}
                  onCancel={onClose}
                  onOpenStockBrowser={onOpenStockBrowser}
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
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

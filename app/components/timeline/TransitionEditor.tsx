"use client";

import React, { useState } from 'react';
import { Transition, TransitionType } from '@/lib/api';
import { Button } from '@/components/ui';
import { Label } from '@/components/ui/input';
import { Save, X, Trash2 } from 'lucide-react';

interface TransitionEditorProps {
  transition: Transition;
  transitionTypes: TransitionType[];
  onSave: (transitionId: number, data: { transition_type?: string; duration_frames?: number }) => Promise<void>;
  onDelete: (transitionId: number) => Promise<void>;
  onCancel: () => void;
}

export function TransitionEditor({
  transition,
  transitionTypes,
  onSave,
  onDelete,
  onCancel,
}: TransitionEditorProps) {
  const [transitionType, setTransitionType] = useState(transition.transition_type);
  const [durationFrames, setDurationFrames] = useState(transition.duration_frames);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(transition.id, {
        transition_type: transitionType,
        duration_frames: durationFrames,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this transition?')) return;
    setDeleting(true);
    try {
      await onDelete(transition.id);
    } finally {
      setDeleting(false);
    }
  };

  // Group transition types by category
  const groupedTypes = transitionTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, TransitionType[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-3 border-b border-[hsl(var(--border))]">
        <h3 className="font-medium text-[hsl(var(--foreground))]">
          Transition
        </h3>
        <p className="text-xs text-[hsl(var(--foreground-muted))]">
          Scene {transition.from_scene_number} to Scene {transition.to_scene_number}
        </p>
      </div>

      {/* Transition Type */}
      <div>
        <Label>Transition Type</Label>
        <select
          value={transitionType}
          onChange={(e) => setTransitionType(e.target.value)}
          className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
        >
          {Object.entries(groupedTypes).map(([category, types]) => (
            <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Description */}
      {transitionType && (
        <p className="text-xs text-[hsl(var(--foreground-muted))] bg-[hsl(var(--background))] p-2 border border-[hsl(var(--border))]">
          {transitionTypes.find(t => t.id === transitionType)?.description}
        </p>
      )}

      {/* Duration */}
      <div>
        <Label>Duration (frames)</Label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={5}
            max={60}
            value={durationFrames}
            onChange={(e) => setDurationFrames(parseInt(e.target.value))}
            className="flex-1"
          />
          <div className="w-16 text-center">
            <input
              type="number"
              min={5}
              max={60}
              value={durationFrames}
              onChange={(e) => setDurationFrames(Math.max(5, Math.min(60, parseInt(e.target.value) || 20)))}
              className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-2 py-1 text-sm text-[hsl(var(--foreground))] text-center focus:outline-none focus:border-[hsl(var(--accent))]"
            />
          </div>
        </div>
        <p className="text-[10px] text-[hsl(var(--foreground-subtle))] mt-1">
          {(durationFrames / 30).toFixed(2)}s at 30fps
        </p>
      </div>

      {/* Preset durations */}
      <div>
        <Label>Quick Duration</Label>
        <div className="flex gap-2 mt-1">
          {[
            { label: '0.5s', frames: 15 },
            { label: '0.67s', frames: 20 },
            { label: '1s', frames: 30 },
            { label: '1.5s', frames: 45 },
          ].map((preset) => (
            <button
              key={preset.frames}
              onClick={() => setDurationFrames(preset.frames)}
              className={`flex-1 px-2 py-1 text-xs border transition-colors ${
                durationFrames === preset.frames
                  ? 'bg-[hsl(var(--accent-muted))] border-[hsl(var(--accent))] text-[hsl(var(--accent))]'
                  : 'bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--foreground-muted))] hover:border-[hsl(var(--foreground-muted))]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-[hsl(var(--border))]">
        <Button
          onClick={handleSave}
          loading={saving}
          icon={<Save className="w-4 h-4" />}
          className="flex-1"
        >
          Save
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          icon={<X className="w-4 h-4" />}
        >
          Cancel
        </Button>
      </div>

      {/* Delete */}
      <div className="pt-3 border-t border-[hsl(var(--border))]">
        <Button
          variant="destructive"
          onClick={handleDelete}
          loading={deleting}
          icon={<Trash2 className="w-4 h-4" />}
          className="w-full"
        >
          Delete Transition
        </Button>
      </div>
    </div>
  );
}

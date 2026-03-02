"use client";

import React, { useState, useEffect } from 'react';
import { VideoClip, videoClipApi } from '@/lib/api';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input, Label } from '@/components/ui/input';

interface VideoClipEditorProps {
  clip: VideoClip;
  onSave: (clipId: number, data: Partial<VideoClip>) => Promise<void>;
  onDelete: (clipId: number) => Promise<void>;
  onCancel: () => void;
}

export function VideoClipEditor({ clip, onSave, onDelete, onCancel }: VideoClipEditorProps) {
  const [name, setName] = useState(clip.name);
  const [startSeconds, setStartSeconds] = useState(clip.start_frame / 30);
  const [volume, setVolume] = useState(clip.volume);
  const [muteAudio, setMuteAudio] = useState(!!clip.mute_audio);
  const [trimStartSeconds, setTrimStartSeconds] = useState((clip.trim_start_frame || 0) / 30);
  const [trimEndSeconds, setTrimEndSeconds] = useState(
    clip.trim_end_frame ? clip.trim_end_frame / 30 : clip.source_duration_frames / 30
  );

  useEffect(() => {
    setName(clip.name);
    setStartSeconds(clip.start_frame / 30);
    setVolume(clip.volume);
    setMuteAudio(!!clip.mute_audio);
    setTrimStartSeconds((clip.trim_start_frame || 0) / 30);
    setTrimEndSeconds(clip.trim_end_frame ? clip.trim_end_frame / 30 : clip.source_duration_frames / 30);
  }, [clip]);

  const sourceDurationSeconds = clip.source_duration_frames / 30;
  const effectiveDurationSeconds = trimEndSeconds - trimStartSeconds;

  const handleSave = async () => {
    await onSave(clip.id, {
      name,
      start_frame: Math.round(startSeconds * 30),
      volume,
      mute_audio: muteAudio,
      trim_start_frame: Math.round(trimStartSeconds * 30),
      trim_end_frame: Math.round(trimEndSeconds * 30),
      duration_frames: Math.round(effectiveDurationSeconds * 30),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <Label>Start time (seconds)</Label>
        <Input
          type="number"
          step="0.1"
          min="0"
          value={startSeconds.toFixed(1)}
          onChange={(e) => setStartSeconds(parseFloat(e.target.value) || 0)}
        />
      </div>

      <div>
        <Label>Volume ({Math.round(volume * 100)}%)</Label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full accent-[hsl(160,50%,45%)]"
          disabled={muteAudio}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={muteAudio}
          onChange={(e) => setMuteAudio(e.target.checked)}
          className="w-4 h-4 accent-[hsl(160,50%,45%)]"
        />
        <span className="text-sm text-[hsl(var(--foreground-muted))]">Mute clip audio</span>
      </label>

      <div>
        <Label>Trim start (seconds)</Label>
        <Input
          type="number"
          step="0.1"
          min="0"
          max={sourceDurationSeconds}
          value={trimStartSeconds.toFixed(1)}
          onChange={(e) => setTrimStartSeconds(parseFloat(e.target.value) || 0)}
        />
      </div>

      <div>
        <Label>Trim end (seconds)</Label>
        <Input
          type="number"
          step="0.1"
          min="0"
          max={sourceDurationSeconds}
          value={trimEndSeconds.toFixed(1)}
          onChange={(e) => setTrimEndSeconds(parseFloat(e.target.value) || sourceDurationSeconds)}
        />
      </div>

      <div className="text-xs text-[hsl(var(--foreground-muted))] space-y-1">
        <div>Source: {sourceDurationSeconds.toFixed(1)}s | Effective: {effectiveDurationSeconds.toFixed(1)}s</div>
        {clip.source_width && clip.source_height && (
          <div>Resolution: {clip.source_width}x{clip.source_height} | FPS: {clip.source_fps?.toFixed(0) || '?'}</div>
        )}
      </div>

      {/* Video preview */}
      <div>
        <Label>Preview</Label>
        <video
          src={videoClipApi.getStreamUrl(clip.id)}
          controls
          className="w-full"
          style={{ aspectRatio: '16/9' }}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSave} className="flex-1">
          Save
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <Button
        variant="destructive"
        className="w-full"
        icon={<Trash2 className="w-4 h-4" />}
        onClick={() => onDelete(clip.id)}
      >
        Delete Clip
      </Button>
    </div>
  );
}

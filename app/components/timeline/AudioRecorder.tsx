"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, X, Save } from 'lucide-react';
import { Button } from '@/components/ui';

interface AudioRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (blob: Blob, filename: string) => void;
}

type RecordingState = 'idle' | 'recording' | 'stopped';

export function AudioRecorder({ isOpen, onClose, onRecordingComplete }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setRecordingState('idle');
      setElapsedSeconds(0);
      setError(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    }
  }, [isOpen]);

  const getMimeType = () => {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
    return '';
  };

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState('stopped');

        // Stop tracks
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      setRecordingState('recording');
      setElapsedSeconds(0);

      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.');
      console.error('[AudioRecorder] getUserMedia error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!blobRef.current) return;
    const ext = blobRef.current.type.includes('webm') ? 'webm' : 'mp4';
    const filename = `recording-${Date.now()}.${ext}`;
    onRecordingComplete(blobRef.current, filename);
    onClose();
  }, [onRecordingComplete, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 5 }}
            className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-medium text-[hsl(var(--foreground))]">Record Audio</h2>
              <button
                onClick={onClose}
                className="p-1 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[hsl(var(--error))]/10 border border-[hsl(var(--error))]/30 text-sm text-[hsl(var(--error))]">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              {/* Timer display */}
              <div className="text-3xl font-mono text-[hsl(var(--foreground))]">
                {formatTime(elapsedSeconds)}
              </div>

              {/* Recording indicator */}
              {recordingState === 'recording' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[hsl(var(--error))] animate-pulse" />
                  <span className="text-sm text-[hsl(var(--error))]">Recording...</span>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3">
                {recordingState === 'idle' && (
                  <Button onClick={startRecording} icon={<Mic className="w-4 h-4" />}>
                    Start Recording
                  </Button>
                )}

                {recordingState === 'recording' && (
                  <Button onClick={stopRecording} variant="destructive" icon={<Square className="w-4 h-4" />}>
                    Stop
                  </Button>
                )}

                {recordingState === 'stopped' && (
                  <>
                    <Button onClick={startRecording} variant="secondary" icon={<Mic className="w-4 h-4" />}>
                      Re-record
                    </Button>
                    <Button onClick={handleSave} icon={<Save className="w-4 h-4" />}>
                      Save
                    </Button>
                  </>
                )}
              </div>

              {/* Playback preview */}
              {recordingState === 'stopped' && audioUrl && (
                <div className="w-full mt-2">
                  <audio src={audioUrl} controls className="w-full h-8" />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

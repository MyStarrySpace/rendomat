"use client";

import React from 'react';
import { Transition } from '@/lib/api';
import { frameToPixel } from './lib/timeline-utils';
import { ArrowLeftRight } from 'lucide-react';

interface TransitionIndicatorProps {
  transition: Transition;
  fromSceneEndFrame: number;
  zoom: number;
  trackHeight: number;
  isSelected: boolean;
  onClick: () => void;
  transitionLabel?: string;
}

export function TransitionIndicator({
  transition,
  fromSceneEndFrame,
  zoom,
  trackHeight,
  isSelected,
  onClick,
  transitionLabel,
}: TransitionIndicatorProps) {
  // Position at the end of the "from" scene, spanning the transition duration
  const left = frameToPixel(fromSceneEndFrame - transition.duration_frames, zoom);
  const width = frameToPixel(transition.duration_frames, zoom);

  return (
    <div
      className={`absolute z-20 cursor-pointer group`}
      style={{
        left,
        width: Math.max(width, 20),
        height: trackHeight - 8,
        top: 4,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Transition overlay */}
      <div
        className={`h-full flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-[hsl(var(--warning))]/40 ring-2 ring-[hsl(var(--warning))]'
            : 'bg-[hsl(var(--foreground))]/10 hover:bg-[hsl(var(--foreground))]/20'
        }`}
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            rgba(255,255,255,0.1) 4px,
            rgba(255,255,255,0.1) 8px
          )`,
        }}
      >
        {width > 30 && (
          <div className="flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--foreground-muted))]">
            <ArrowLeftRight className="w-3 h-3" />
            {width > 60 && transitionLabel}
          </div>
        )}
      </div>

      {/* Tooltip on hover */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="px-2 py-1 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[10px] font-mono whitespace-nowrap">
          {transitionLabel || transition.transition_type} ({transition.duration_frames}f)
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";

const ANIMATION_OPTIONS = [
  { value: "none", label: "None", group: null },
  { value: "particles", label: "Particles", group: "Subtle" },
  { value: "floating-shapes", label: "Floating Shapes", group: "Subtle" },
  { value: "waves", label: "Waves", group: "Subtle" },
  { value: "bokeh", label: "Bokeh", group: "Subtle" },
  { value: "aurora", label: "Aurora", group: "Subtle" },
  { value: "grid-pulse", label: "Grid Pulse", group: "Tech" },
  { value: "matrix", label: "Matrix", group: "Tech" },
  { value: "geometric", label: "Geometric", group: "Dynamic" },
  { value: "confetti", label: "Confetti", group: "Playful" },
] as const;

const GROUPS = ["Subtle", "Tech", "Dynamic", "Playful"] as const;

interface AnimationPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function AnimationPicker({ value, onChange }: AnimationPickerProps) {
  const [open, setOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const selectedOption =
    ANIMATION_OPTIONS.find((o) => o.value === value) || ANIMATION_OPTIONS[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Reset video when hovered value changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [hoveredValue]);

  const previewSrc =
    hoveredValue && hoveredValue !== "none"
      ? `/animations/${hoveredValue}.mp4`
      : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))] text-left"
      >
        <span>{selectedOption.label}</span>
        <svg
          className={`w-4 h-4 text-[hsl(var(--foreground-muted))] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 flex gap-0">
          {/* Options list */}
          <div
            className="w-48 max-h-64 overflow-y-auto bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-lg"
          >
            {/* None option */}
            <button
              type="button"
              onClick={() => {
                onChange("none");
                setOpen(false);
              }}
              onMouseEnter={() => setHoveredValue("none")}
              onMouseLeave={() => setHoveredValue(null)}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                value === "none"
                  ? "bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))]"
                  : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))]"
              }`}
            >
              None
            </button>

            {GROUPS.map((group) => {
              const items = ANIMATION_OPTIONS.filter((o) => o.group === group);
              return (
                <div key={group}>
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[hsl(var(--foreground-muted))] bg-[hsl(var(--surface))]">
                    {group}
                  </div>
                  {items.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setHoveredValue(option.value)}
                      onMouseLeave={() => setHoveredValue(null)}
                      className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                        value === option.value
                          ? "bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))]"
                          : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Video preview panel */}
          {previewSrc && (
            <div className="w-48 bg-[hsl(var(--background))] border border-[hsl(var(--border))] border-l-0 shadow-lg overflow-hidden flex flex-col">
              <video
                ref={videoRef}
                key={hoveredValue}
                src={previewSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full aspect-video object-cover"
              />
              <div className="px-2 py-1.5 text-[10px] text-center text-[hsl(var(--foreground-muted))]">
                Preview
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

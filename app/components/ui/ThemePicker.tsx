"use client";

import React, { useState, useRef, useEffect } from "react";
import { THEMES } from "@/lib/themes";

interface ThemePickerProps {
  value: string;
  onChange: (themeId: string) => void;
}

const THEME_IDS = Object.keys(THEMES);

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentTheme = THEMES[value] || THEMES["tech-dark"];

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

  const previewSrc = hoveredValue ? `/themes/${hoveredValue}.mp4` : null;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] transition-colors"
      >
        <div
          className="w-4 h-4 flex-shrink-0"
          style={{
            background:
              currentTheme.colors.backgroundGradient ||
              currentTheme.colors.background,
          }}
        />
        <span>{currentTheme.name}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 flex gap-0">
          {/* Theme list */}
          <div className="w-[200px] max-h-64 overflow-y-auto bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-lg">
            {THEME_IDS.map((themeId) => {
              const theme = THEMES[themeId];
              return (
                <button
                  key={themeId}
                  type="button"
                  onClick={() => {
                    onChange(themeId);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHoveredValue(themeId)}
                  onMouseLeave={() => setHoveredValue(null)}
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                    value === themeId
                      ? "bg-[hsl(var(--accent-muted))] text-[hsl(var(--accent))]"
                      : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))]"
                  }`}
                >
                  <div
                    className="w-5 h-5 flex-shrink-0"
                    style={{
                      background:
                        theme.colors.backgroundGradient ||
                        theme.colors.background,
                    }}
                  />
                  {theme.name}
                </button>
              );
            })}
          </div>

          {/* Video preview panel */}
          {previewSrc && (
            <div className="w-[200px] bg-[hsl(var(--background))] border border-[hsl(var(--border))] border-l-0 shadow-lg overflow-hidden flex flex-col">
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

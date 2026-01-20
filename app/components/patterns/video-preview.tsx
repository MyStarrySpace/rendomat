"use client";

import { useState, useRef, type VideoHTMLAttributes } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";

interface VideoPreviewProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, "className"> {
  aspectRatio?: AspectRatio;
  showControls?: boolean;
  className?: string;
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const aspectRatioStyles: Record<AspectRatio, string> = {
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
  "4:3": "aspect-[4/3]",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function VideoPreview({
  src,
  poster,
  aspectRatio = "16:9",
  showControls = true,
  autoPlay = false,
  loop = true,
  muted = true,
  className = "",
  ...props
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    setProgress((currentTime / duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    videoRef.current.currentTime = percentage * videoRef.current.duration;
  };

  return (
    <div
      className={`
        relative overflow-hidden
        bg-[hsl(var(--surface))]
        border border-[hsl(var(--border))]
        rounded-[var(--radius-lg)]
        ${aspectRatioStyles[aspectRatio]}
        ${className}
      `.trim().replace(/\s+/g, " ")}
    >
      {/* Video or Placeholder */}
      {src ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="absolute inset-0 w-full h-full object-cover"
          {...props}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[hsl(var(--foreground-subtle))] text-sm">
            No video source
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && src && (
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <div
            className="h-1 bg-white/20 cursor-pointer mx-3 mb-2"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2 p-3 pt-0">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Play Button Overlay (when paused) */}
      {showControls && src && !isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          aria-label="Play video"
        >
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Skeleton for loading state
// -----------------------------------------------------------------------------

interface VideoSkeletonProps {
  aspectRatio?: AspectRatio;
  className?: string;
}

export function VideoSkeleton({
  aspectRatio = "16:9",
  className = "",
}: VideoSkeletonProps) {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-[hsl(var(--surface))]
        border border-[hsl(var(--border))]
        rounded-[var(--radius-lg)]
        ${aspectRatioStyles[aspectRatio]}
        animate-pulse
        ${className}
      `.trim().replace(/\s+/g, " ")}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[hsl(var(--surface-hover))]" />
      </div>
    </div>
  );
}

export default VideoPreview;

"use client";

import { useState, useEffect, useRef } from "react";
import {
  Instagram,
  Play,
  Download,
  Loader2,
  Eye,
  Film,
  Sparkles,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { API_BASE } from "@/lib/api";

// Scene content for the IG Reel - following Hook → Value Drop → Story → CTA structure
const IG_REEL_SCENES = [
  {
    id: "hook",
    type: "text-only",
    duration: 90, // 3 seconds at 30fps
    content: {
      headline: "What if any document could become a video?",
      supportingText: "",
    },
    animation: "zoom-in",
  },
  {
    id: "value-drop",
    type: "text-only",
    duration: 120, // 4 seconds
    content: {
      headline: "Meet Rendomat",
      supportingText: "AI-powered generative video creation",
    },
    animation: "slide-up",
  },
  {
    id: "story-1",
    type: "text-only",
    duration: 90, // 3 seconds
    content: {
      headline: "Drop in a document",
      supportingText: "Markdown, Word, or plain text",
    },
    animation: "fade",
  },
  {
    id: "story-2",
    type: "text-only",
    duration: 90,
    content: {
      headline: "AI extracts the structure",
      supportingText: "Sections become scenes automatically",
    },
    animation: "slide-right",
  },
  {
    id: "story-3",
    type: "text-only",
    duration: 90,
    content: {
      headline: "Renders to any platform",
      supportingText: "YouTube, TikTok, Instagram, LinkedIn",
    },
    animation: "scale",
  },
  {
    id: "story-4",
    type: "stats",
    duration: 120, // 4 seconds
    content: {
      headline: "Built for speed",
      stats: [
        { label: "Scene caching", value: "10x faster" },
        { label: "Multi-platform", value: "1 click" },
        { label: "AE Export", value: "Full fidelity" },
      ],
    },
    animation: "stagger",
  },
  {
    id: "cta",
    type: "text-only",
    duration: 90, // 3 seconds
    content: {
      headline: "Follow for more",
      supportingText: "Weekly design experiments",
    },
    animation: "bounce",
  },
];

export default function IGPostPage() {
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [previewScene, setPreviewScene] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-cycle preview scenes
  useEffect(() => {
    const interval = setInterval(() => {
      setPreviewScene((prev) => (prev + 1) % IG_REEL_SCENES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleRender() {
    setRendering(true);
    setRenderProgress("Preparing scenes...");
    setVideoUrl(null);

    try {
      // Create a temporary video with these scenes
      const createRes = await fetch(`${API_BASE}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: null,
          title: "IG Reel - Rendomat Demo",
          composition_id: "DynamicScene-9x16",
          status: "draft",
          aspect_ratio: "9:16",
          theme_id: "tech-dark",
        }),
      });

      if (!createRes.ok) throw new Error("Failed to create video");
      const video = await createRes.json();

      // Add scenes
      setRenderProgress("Creating scenes...");
      for (let i = 0; i < IG_REEL_SCENES.length; i++) {
        const scene = IG_REEL_SCENES[i];
        const startFrame = IG_REEL_SCENES.slice(0, i).reduce(
          (sum, s) => sum + s.duration,
          0
        );

        await fetch(`${API_BASE}/api/videos/${video.id}/scenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene_number: i + 1,
            name: scene.id,
            scene_type: scene.type,
            start_frame: startFrame,
            end_frame: startFrame + scene.duration,
            data: JSON.stringify(scene.content),
          }),
        });
      }

      // Render for Instagram Reels
      setRenderProgress("Rendering video (9:16)...");
      const renderRes = await fetch(
        `${API_BASE}/api/videos/${video.id}/render-multi`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platforms: ["instagram_reels"] }),
        }
      );

      if (!renderRes.ok) throw new Error("Failed to render");
      const result = await renderRes.json();

      if (result.outputs?.instagram_reels?.downloadUrl) {
        setVideoUrl(
          `${API_BASE}${result.outputs.instagram_reels.downloadUrl}`
        );
        setRenderProgress("Complete!");
      }
    } catch (error) {
      console.error("Render failed:", error);
      setRenderProgress("Error: " + (error as Error).message);
    } finally {
      setRendering(false);
    }
  }

  const totalDuration = IG_REEL_SCENES.reduce((sum, s) => sum + s.duration, 0);
  const totalSeconds = Math.round(totalDuration / 30);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" mono>
              <Film className="w-3 h-3 mr-1" />
              {totalSeconds}s @ 30fps
            </Badge>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-4">Instagram Reel Generator</p>
          <h1 className="headline text-4xl md:text-5xl text-[hsl(var(--foreground))] mb-4">
            AI Video Tool Demo
          </h1>
          <p className="text-lg text-[hsl(var(--foreground-muted))] max-w-xl">
            Generate an Instagram Reel that demonstrates Rendomat itself.
          </p>
        </div>
      </section>

      <main className="px-6 pb-24">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Preview Panel */}
          <div className="space-y-6">
            <div className="border border-[hsl(var(--border))] p-6">
              <h2 className="text-lg font-medium text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-[hsl(var(--accent))]" />
                Preview
              </h2>

              {/* Phone Frame */}
              <div className="flex justify-center">
                <div className="relative w-[270px] h-[585px] bg-black p-3 shadow-2xl border-4 border-[hsl(var(--border))]">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black z-10" />

                  {/* Screen */}
                  <div className="w-full h-full bg-[hsl(var(--surface))] overflow-hidden relative">
                    {videoUrl ? (
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                        loop
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                        <div
                          key={previewScene}
                          className="space-y-4 animate-fade-in"
                        >
                          <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] leading-tight">
                            {IG_REEL_SCENES[previewScene].content.headline}
                          </h3>
                          {"supportingText" in IG_REEL_SCENES[previewScene].content && (
                            <p className="text-[hsl(var(--foreground-muted))] text-lg">
                              {(IG_REEL_SCENES[previewScene].content as any).supportingText}
                            </p>
                          )}
                          {"stats" in IG_REEL_SCENES[previewScene].content && (
                            <div className="space-y-3 mt-4">
                              {(IG_REEL_SCENES[previewScene].content as any).stats.map(
                                (stat: any, i: number) => (
                                  <div key={i} className="flex justify-between text-sm">
                                    <span className="text-[hsl(var(--foreground-muted))]">{stat.label}</span>
                                    <span className="text-[hsl(var(--foreground))] font-bold">{stat.value}</span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>

                        {/* Scene indicator */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5">
                          {IG_REEL_SCENES.map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 transition-colors ${
                                i === previewScene ? "bg-[hsl(var(--accent))]" : "bg-[hsl(var(--border))]"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Render Controls */}
            <div className="border border-[hsl(var(--border))] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-[hsl(var(--foreground))] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[hsl(var(--accent))]" />
                  Render
                </h2>
                {videoUrl && (
                  <a
                    href={videoUrl}
                    download="ig-reel-vsl-demo.mp4"
                  >
                    <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>
                      Download
                    </Button>
                  </a>
                )}
              </div>

              <Button
                onClick={handleRender}
                disabled={rendering}
                loading={rendering}
                className="w-full"
                icon={!rendering ? <Play className="w-5 h-5" /> : undefined}
              >
                {rendering ? renderProgress : "Render Instagram Reel"}
              </Button>

              {videoUrl && !rendering && (
                <p className="text-center text-[hsl(var(--success))] text-sm mt-3">
                  Video ready! Click to preview or download.
                </p>
              )}
            </div>
          </div>

          {/* Scene Timeline */}
          <div className="border border-[hsl(var(--border))] p-6">
            <h2 className="text-lg font-medium text-[hsl(var(--foreground))] mb-6 flex items-center gap-2">
              <Film className="w-5 h-5 text-[hsl(var(--accent))]" />
              Scene Timeline
            </h2>

            <div className="space-y-3">
              {IG_REEL_SCENES.map((scene, index) => {
                const isActive = index === previewScene;
                const startTime = IG_REEL_SCENES.slice(0, index).reduce(
                  (sum, s) => sum + s.duration / 30,
                  0
                );
                const duration = scene.duration / 30;

                return (
                  <div
                    key={scene.id}
                    onClick={() => setPreviewScene(index)}
                    className={`p-4 cursor-pointer transition-all ${
                      isActive
                        ? "bg-[hsl(var(--accent-muted))] border-2 border-[hsl(var(--accent))]"
                        : "bg-[hsl(var(--surface))] border-2 border-transparent hover:bg-[hsl(var(--surface-hover))]"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            size="sm"
                            variant={
                              scene.id === "hook"
                                ? "warning"
                                : scene.id === "value-drop"
                                ? "default"
                                : scene.id.startsWith("story")
                                ? "secondary"
                                : "success"
                            }
                          >
                            {scene.id === "hook"
                              ? "HOOK"
                              : scene.id === "value-drop"
                              ? "VALUE DROP"
                              : scene.id === "cta"
                              ? "CTA"
                              : "STORY"}
                          </Badge>
                          <span className="text-xs text-[hsl(var(--foreground-subtle))]">{scene.type}</span>
                        </div>
                        <h3 className="text-[hsl(var(--foreground))] font-medium">
                          {scene.content.headline}
                        </h3>
                        {"supportingText" in scene.content && scene.content.supportingText && (
                          <p className="text-[hsl(var(--foreground-muted))] text-sm mt-1">
                            {scene.content.supportingText}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-[hsl(var(--foreground-subtle))]">
                        <div>{startTime.toFixed(1)}s</div>
                        <div className="text-[hsl(var(--accent))]">{duration}s</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1 bg-[hsl(var(--border))] overflow-hidden">
                      <div
                        className="h-full bg-[hsl(var(--accent))]"
                        style={{ width: `${(duration / totalSeconds) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Video Structure Legend */}
            <div className="mt-6 pt-6 border-t border-[hsl(var(--border))]">
              <h3 className="text-sm font-medium text-[hsl(var(--foreground-muted))] mb-3">
                Video Structure
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[hsl(var(--warning-muted))]" />
                  <span className="text-[hsl(var(--foreground-muted))]">Hook - Grab attention</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[hsl(var(--accent-muted))]" />
                  <span className="text-[hsl(var(--foreground-muted))]">Value Drop - Key insight</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[hsl(var(--surface))]" />
                  <span className="text-[hsl(var(--foreground-muted))]">Story - Process</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[hsl(var(--success-muted))]" />
                  <span className="text-[hsl(var(--foreground-muted))]">CTA - Invite engagement</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="max-w-7xl mx-auto mt-8">
          <div className="border border-[hsl(var(--border))] p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[hsl(var(--accent-muted))] flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-[hsl(var(--accent))]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[hsl(var(--foreground))] mb-2">
                  AI Programmatic Video Generation Tool
                </h3>
                <p className="text-[hsl(var(--foreground-muted))] mb-4">
                  This page demonstrates Rendomat in a meta way - using the tool to create
                  content about itself. The video follows the structure from our Social Media Strategy:
                  Hook, Value Drop, Story, Call to Action.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="pill">DesignExperiments</span>
                  <span className="pill">AITools</span>
                  <span className="pill">Remotion</span>
                  <span className="pill">ProcessOverPolish</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

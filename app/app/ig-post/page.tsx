"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Instagram,
  Play,
  Download,
  Loader2,
  RefreshCw,
  Eye,
  Film,
  Sparkles,
  FileText,
  ArrowRight,
  Home,
} from "lucide-react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-pink-900 to-purple-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Home className="w-5 h-5 text-white/70" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">IG Reel Generator</h1>
                <p className="text-sm text-pink-200">Week 2: AI Video Tool Demo</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-pink-200 text-sm">
            <Film className="w-4 h-4" />
            <span>{totalSeconds}s @ 30fps</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview Panel */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/20"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-pink-400" />
                Preview
              </h2>

              {/* Phone Frame */}
              <div className="flex justify-center">
                <div className="relative w-[270px] h-[585px] bg-black rounded-[3rem] p-3 shadow-2xl border-4 border-gray-800">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />

                  {/* Screen */}
                  <div className="w-full h-full bg-gradient-to-b from-slate-900 to-purple-900 rounded-[2.25rem] overflow-hidden relative">
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
                        <motion.div
                          key={previewScene}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4"
                        >
                          <h3 className="text-2xl font-bold text-white leading-tight">
                            {IG_REEL_SCENES[previewScene].content.headline}
                          </h3>
                          {"supportingText" in IG_REEL_SCENES[previewScene].content && (
                            <p className="text-pink-200 text-lg">
                              {(IG_REEL_SCENES[previewScene].content as any).supportingText}
                            </p>
                          )}
                          {"stats" in IG_REEL_SCENES[previewScene].content && (
                            <div className="space-y-3 mt-4">
                              {(IG_REEL_SCENES[previewScene].content as any).stats.map(
                                (stat: any, i: number) => (
                                  <div key={i} className="flex justify-between text-sm">
                                    <span className="text-pink-200">{stat.label}</span>
                                    <span className="text-white font-bold">{stat.value}</span>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </motion.div>

                        {/* Scene indicator */}
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5">
                          {IG_REEL_SCENES.map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                i === previewScene ? "bg-pink-400" : "bg-white/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Render Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" />
                  Render
                </h2>
                {videoUrl && (
                  <a
                    href={videoUrl}
                    download="ig-reel-vsl-demo.mp4"
                    className="flex items-center gap-2 px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
              </div>

              <button
                onClick={handleRender}
                disabled={rendering}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-3"
              >
                {rendering ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {renderProgress}
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Render Instagram Reel
                  </>
                )}
              </button>

              {videoUrl && !rendering && (
                <p className="text-center text-green-400 text-sm mt-3">
                  Video ready! Click to preview or download.
                </p>
              )}
            </motion.div>
          </div>

          {/* Scene Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/20"
          >
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Film className="w-5 h-5 text-pink-400" />
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
                  <motion.div
                    key={scene.id}
                    onClick={() => setPreviewScene(index)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? "bg-pink-500/20 border-2 border-pink-500"
                        : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              scene.id === "hook"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : scene.id === "value-drop"
                                ? "bg-blue-500/20 text-blue-300"
                                : scene.id.startsWith("story")
                                ? "bg-purple-500/20 text-purple-300"
                                : "bg-green-500/20 text-green-300"
                            }`}
                          >
                            {scene.id === "hook"
                              ? "HOOK"
                              : scene.id === "value-drop"
                              ? "VALUE DROP"
                              : scene.id === "cta"
                              ? "CTA"
                              : "STORY"}
                          </span>
                          <span className="text-xs text-white/50">{scene.type}</span>
                        </div>
                        <h3 className="text-white font-medium">
                          {scene.content.headline}
                        </h3>
                        {"supportingText" in scene.content && scene.content.supportingText && (
                          <p className="text-pink-200/70 text-sm mt-1">
                            {scene.content.supportingText}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-white/50">
                        <div>{startTime.toFixed(1)}s</div>
                        <div className="text-pink-300">{duration}s</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                        style={{ width: `${(duration / totalSeconds) * 100}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Video Structure Legend */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium text-white/70 mb-3">
                Video Structure
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500/50" />
                  <span className="text-white/60">Hook - Grab attention</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500/50" />
                  <span className="text-white/60">Value Drop - Key insight</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-purple-500/50" />
                  <span className="text-white/60">Story - Process & exploration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500/50" />
                  <span className="text-white/60">CTA - Invite engagement</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Meta Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Week 2: AI Programmatic Video Generation Tool
              </h3>
              <p className="text-pink-200/70 mb-4">
                This page demonstrates Rendomat in a meta way - using the tool to create
                content about itself. The video follows the structure from our Social Media Strategy:
                Hook → Value Drop → Story → Call to Action.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs">
                  #DesignExperiments
                </span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                  #AITools
                </span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                  #Remotion
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                  #ProcessOverPolish
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

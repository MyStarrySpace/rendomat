"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Video as VideoIcon,
  Film,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Edit,
  Save,
  X,
  Download,
  Zap,
  Database,
  Home
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { videoApi, sceneApi, clientApi, Video, Scene, Client } from "@/lib/api";

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = parseInt(params.id as string);

  const [video, setVideo] = useState<Video | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<string>("");
  const [progressData, setProgressData] = useState<any>(null);
  const [editingScene, setEditingScene] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [videoId]);

  // Poll for progress when rendering
  useEffect(() => {
    if (!rendering) return;

    const interval = setInterval(async () => {
      try {
        const videoData = await videoApi.getById(videoId);

        // Parse render_progress if it exists
        if (videoData.render_progress) {
          const progress = JSON.parse(videoData.render_progress);
          setProgressData(progress);

          if (progress.status === 'stitching') {
            setRenderProgress('Stitching scenes together...');
          } else {
            const cacheInfo = progress.cached_scenes > 0 ? ` (${progress.cached_scenes} cached)` : '';
            setRenderProgress(`Rendering scene ${progress.rendered_scenes + 1} of ${progress.total_scenes}${cacheInfo}`);
          }
        }

        // If video is no longer rendering, stop polling
        if (videoData.status !== 'rendering') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Failed to poll progress:", error);
      }
    }, 500); // Poll every 500ms

    return () => clearInterval(interval);
  }, [rendering, videoId]);

  async function loadData() {
    try {
      const [videoData, scenesData] = await Promise.all([
        videoApi.getById(videoId),
        sceneApi.getAllForVideo(videoId),
      ]);
      setVideo(videoData);
      setScenes(scenesData);

      if (videoData.client_id) {
        const clientData = await clientApi.getById(videoData.client_id);
        setClient(clientData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRender() {
    setRendering(true);
    setRenderProgress("Preparing to render...");
    setProgressData({
      rendered_scenes: 0,
      total_scenes: scenes.length,
      current_scene: 0,
      percentage: 0
    });

    try {
      const blob = await videoApi.renderScenes(videoId);

      // Download the video
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video?.title || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setRenderProgress("Render complete!");
      setProgressData(null);
      setTimeout(() => {
        setRenderProgress("");
        setRendering(false);
      }, 2000);

      // Reload to get updated cache info
      loadData();
    } catch (error) {
      console.error("Failed to render video:", error);
      setRenderProgress("Render failed");
      setProgressData(null);
      setTimeout(() => {
        setRenderProgress("");
        setRendering(false);
      }, 3000);
    }
  }

  function startEditScene(scene: Scene) {
    setEditingScene(scene.id);
    setEditData(scene.data ? JSON.parse(scene.data) : {});
  }

  function cancelEdit() {
    setEditingScene(null);
    setEditData({});
  }

  async function saveEdit(sceneId: number) {
    try {
      // TODO: Implement scene update API call
      // await sceneApi.update(sceneId, { data: JSON.stringify(editData) });
      alert("Scene editing coming soon!");
      setEditingScene(null);
      setEditData({});
      loadData();
    } catch (error) {
      console.error("Failed to update scene:", error);
      alert("Failed to update scene");
    }
  }

  function getSceneName(sceneNumber: number): string {
    const sceneNames = [
      "Cold Open",
      "Respect the Ambition",
      "The Inflection Point",
      "Naming the Hidden Problem",
      "Dashboard-of-Dashboards",
      "Reframing the Opportunity",
      "Why You're Reaching Out",
      "Soft Close"
    ];
    return sceneNames[sceneNumber] || `Scene ${sceneNumber}`;
  }

  function formatFrameRange(startFrame: number, endFrame: number): string {
    const fps = 30;
    const startSeconds = Math.floor(startFrame / fps);
    const endSeconds = Math.floor(endFrame / fps);

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return `${formatTime(startSeconds)} - ${formatTime(endSeconds)}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Video not found</h1>
          <Link href="/clients">
            <button className="text-purple-400 hover:text-purple-300">Go back to clients</button>
          </Link>
        </div>
      </div>
    );
  }

  const cachedScenes = scenes.filter(s => s.cache_path).length;
  const totalScenes = scenes.length;
  const cachePercentage = totalScenes > 0 ? Math.round((cachedScenes / totalScenes) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <button className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors">
              <Home className="w-5 h-5" />
              Home
            </button>
          </Link>
          <Link href={`/clients/${video.client_id}`}>
            <button className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Client
            </button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <VideoIcon className="w-8 h-8 text-purple-400" />
                <h1 className="text-4xl font-bold text-white">{video.title}</h1>
              </div>
              {client && (
                <p className="text-purple-200 text-lg">{client.company}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-purple-300">
                <span className="flex items-center gap-1">
                  <Film className="w-4 h-4" />
                  {video.aspect_ratio || "16:9"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {video.duration_seconds}s
                </span>
                <span className="flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  Cache: {cachePercentage}%
                </span>
              </div>
            </div>
            <button
              onClick={handleRender}
              disabled={rendering}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              {rendering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Rendering...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Render Video
                </>
              )}
            </button>
          </div>

          {renderProgress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3 mb-3">
                {rendering ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
                <p className="text-white font-medium">{renderProgress}</p>
              </div>
              {progressData && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-purple-200">
                    <span>
                      Scene {progressData.rendered_scenes + 1} of {progressData.total_scenes}
                    </span>
                    <span className="font-semibold">{progressData.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                      style={{ width: `${progressData.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {cachedScenes > 0 && (
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-purple-500/20 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">Cache Status</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${cachePercentage}%` }}
                  />
                </div>
                <span className="text-purple-200 text-sm font-medium">
                  {cachedScenes}/{totalScenes} scenes cached
                </span>
              </div>
              <p className="text-purple-300 text-sm mt-2">
                Only {totalScenes - cachedScenes} scene{totalScenes - cachedScenes !== 1 ? 's' : ''} will be re-rendered
              </p>
            </div>
          )}
        </motion.div>

        {video.output_path && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <VideoIcon className="w-6 h-6 text-purple-400" />
              Output Video
            </h2>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-purple-500/20">
              <video
                controls
                className="w-full rounded-lg"
                src={`http://localhost:8787/api/videos/${videoId}/preview`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">Scenes</h2>
          {scenes.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-12 border border-purple-500/20 text-center">
              <Film className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No scenes yet</h3>
              <p className="text-purple-200">Scenes will appear here once the video is set up</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scenes.map((scene, idx) => (
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/10 backdrop-blur-lg rounded-lg border border-purple-500/20 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center">
                            <span className="text-purple-200 font-bold">{scene.scene_number}</span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {getSceneName(scene.scene_number)}
                            </h3>
                            <p className="text-purple-300 text-sm">
                              {formatFrameRange(scene.start_frame, scene.end_frame)} • {scene.end_frame - scene.start_frame} frames
                            </p>
                          </div>
                        </div>

                        {editingScene === scene.id ? (
                          <div className="mt-4 space-y-3">
                            <textarea
                              value={JSON.stringify(editData, null, 2)}
                              onChange={(e) => {
                                try {
                                  setEditData(JSON.parse(e.target.value));
                                } catch {}
                              }}
                              className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                              rows={8}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(scene.id)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                              >
                                <Save className="w-4 h-4" />
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-2 border border-purple-500/30 text-purple-200 hover:bg-white/5 px-4 py-2 rounded-lg transition-colors text-sm"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {scene.cache_path && (
                              <div className="bg-white/5 rounded-lg p-3">
                                <video
                                  controls
                                  className="w-full rounded-lg"
                                  src={`http://localhost:8787/api/scenes/${scene.id}/preview`}
                                >
                                  Your browser does not support the video tag.
                                </video>
                              </div>
                            )}
                            {scene.data && (
                              <details className="bg-white/5 rounded-lg">
                                <summary className="cursor-pointer p-3 text-purple-300 text-sm font-medium hover:text-purple-200">
                                  View Scene Data
                                </summary>
                                <div className="p-3 pt-0">
                                  <pre className="text-purple-200 text-xs font-mono overflow-x-auto">
                                    {JSON.stringify(JSON.parse(scene.data), null, 2)}
                                  </pre>
                                </div>
                              </details>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        {scene.cache_path ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Cached</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-400">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">Not Cached</span>
                          </div>
                        )}

                        {editingScene !== scene.id && (
                          <button
                            onClick={() => startEditScene(scene)}
                            className="p-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-white/5 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {scene.cached_at && (
                      <div className="mt-3 text-xs text-purple-400">
                        Last cached: {new Date(scene.cached_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

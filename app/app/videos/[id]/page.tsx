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
  Home,
  Upload,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { videoApi, sceneApi, clientApi, Video, Scene, Client } from "@/lib/api";
import { THEMES } from "@/lib/themes";
import StockImageBrowser from "../../components/StockImageBrowser";

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
  const [editingSceneName, setEditingSceneName] = useState<number | null>(null);
  const [editedName, setEditedName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [showStockBrowser, setShowStockBrowser] = useState(false);
  const [currentImageField, setCurrentImageField] = useState<string | null>(null);

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

  function startEditSceneName(scene: Scene) {
    setEditingSceneName(scene.id);
    setEditedName(scene.name);
  }

  async function saveSceneName(sceneId: number) {
    try {
      await sceneApi.update(sceneId, { name: editedName });
      setEditingSceneName(null);
      setEditedName("");
      loadData();
    } catch (error) {
      console.error("Failed to update scene name:", error);
      alert("Failed to update scene name");
    }
  }

  function cancelEditSceneName() {
    setEditingSceneName(null);
    setEditedName("");
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>, fieldName: string) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8787/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const imageUrl = `http://localhost:8787${data.url}`;

      // Update editData with the new image URL
      setEditData({
        ...editData,
        [fieldName]: imageUrl
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(fieldName: string) {
    const newData = { ...editData };
    delete newData[fieldName];
    setEditData(newData);
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
                {video.theme_id && THEMES[video.theme_id] && (
                  <span className="flex items-center gap-1">
                    <div
                      className="w-4 h-4 rounded-sm"
                      style={{ background: THEMES[video.theme_id].colors.backgroundGradient || THEMES[video.theme_id].colors.background }}
                    />
                    {THEMES[video.theme_id].name}
                  </span>
                )}
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
              <div className="max-w-4xl mx-auto">
                <video
                  controls
                  className="w-full rounded-lg"
                  style={{ aspectRatio: video.aspect_ratio || '16/9' }}
                  src={`http://localhost:8787/api/videos/${videoId}/preview`}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
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
                          <div className="flex-1">
                            {editingSceneName === scene.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editedName}
                                  onChange={(e) => setEditedName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveSceneName(scene.id);
                                    if (e.key === 'Escape') cancelEditSceneName();
                                  }}
                                  className="flex-1 bg-white/10 border border-purple-500/50 rounded-lg px-3 py-1 text-white text-xl font-bold focus:outline-none focus:border-purple-500"
                                  autoFocus
                                />
                                <button
                                  onClick={() => saveSceneName(scene.id)}
                                  className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                                  title="Save"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEditSceneName}
                                  className="p-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-white/5 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group">
                                <h3 className="text-xl font-bold text-white">
                                  {scene.name}
                                </h3>
                                <button
                                  onClick={() => startEditSceneName(scene)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-purple-300 hover:text-purple-200 hover:bg-white/10 transition-all"
                                  title="Rename scene"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <p className="text-purple-300 text-sm mt-1">
                              {formatFrameRange(scene.start_frame, scene.end_frame)} • {scene.end_frame - scene.start_frame} frames
                            </p>
                          </div>
                        </div>

                        {editingScene === scene.id ? (
                          <div className="mt-4 space-y-4">
                            {/* Scene Type Selector */}
                            <div>
                              <label className="block text-sm font-medium text-purple-200 mb-2">
                                Scene Type
                              </label>
                              <select
                                value={scene.scene_type || 'text-only'}
                                onChange={(e) => {
                                  sceneApi.update(scene.id, { scene_type: e.target.value });
                                  loadData();
                                }}
                                className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 [&>option]:text-gray-900 [&>option]:bg-white [&>optgroup]:text-gray-900 [&>optgroup]:bg-gray-100"
                              >
                                <optgroup label="📝 Text Content">
                                  <option value="text-only">Text Only</option>
                                  <option value="quote">Quote/Testimonial</option>
                                  <option value="stats">Stats/Numbers</option>
                                </optgroup>
                                <optgroup label="🖼️ Visual Content">
                                  <option value="single-image">Single Image + Title</option>
                                  <option value="dual-images">Dual Images + Title</option>
                                  <option value="grid-2x2">Grid (2×2 Images)</option>
                                  <option value="image-gallery">Image Gallery</option>
                                </optgroup>
                                <optgroup label="📊 Data Visualization">
                                  <option value="line-chart">Line Chart</option>
                                  <option value="bar-chart">Bar Chart</option>
                                  <option value="pie-chart">Pie/Donut Chart</option>
                                  <option value="area-chart">Area Chart</option>
                                  <option value="progress-bars">Progress Bars</option>
                                </optgroup>
                              </select>
                            </div>

                            {/* Conditional Fields Based on Scene Type */}
                            {(scene.scene_type === 'single-image' || scene.scene_type === 'dual-images' || scene.scene_type === 'grid-2x2' || scene.scene_type === 'image-gallery') && (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-purple-200">
                                  Images
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                {['image_url', 'image_url_2', 'image_url_3', 'image_url_4'].map((field) => (
                                  <div key={field} className="relative">
                                    {editData[field] ? (
                                      <div className="relative bg-white/5 rounded-lg p-2 border border-purple-500/30">
                                        <img
                                          src={editData[field]}
                                          alt={field}
                                          className="w-full h-32 object-cover rounded"
                                        />
                                        <button
                                          onClick={() => removeImage(field)}
                                          className="absolute top-3 right-3 p-1 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-colors"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <label className="block bg-white/5 border-2 border-dashed border-purple-500/30 rounded-lg p-6 hover:border-purple-500/50 cursor-pointer transition-colors">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, field)}
                                            className="hidden"
                                            disabled={uploading}
                                          />
                                          <div className="flex flex-col items-center gap-2 text-purple-300">
                                            {uploading ? (
                                              <Loader2 className="w-8 h-8 animate-spin" />
                                            ) : (
                                              <>
                                                <Upload className="w-8 h-8" />
                                                <span className="text-xs">Upload Image</span>
                                              </>
                                            )}
                                          </div>
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCurrentImageField(field);
                                            setShowStockBrowser(true);
                                          }}
                                          className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                                        >
                                          <div className="flex items-center justify-center gap-2">
                                            <ImageIcon className="w-4 h-4" />
                                            Browse Stock Images
                                          </div>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                </div>
                              </div>
                            )}

                            {/* Common Text Fields */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-purple-200 mb-2">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={editData.title || ''}
                                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                  className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                                  placeholder="Scene title"
                                />
                              </div>

                              {scene.scene_type !== 'quote' && scene.scene_type !== 'stats' && !scene.scene_type?.includes('chart') && (
                                <div>
                                  <label className="block text-sm font-medium text-purple-200 mb-2">
                                    Body Text
                                  </label>
                                  <textarea
                                    value={editData.body_text || ''}
                                    onChange={(e) => setEditData({ ...editData, body_text: e.target.value })}
                                    className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                                    rows={3}
                                    placeholder="Additional text for this scene"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Quote-specific fields */}
                            {scene.scene_type === 'quote' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-purple-200 mb-2">
                                    Quote
                                  </label>
                                  <textarea
                                    value={editData.quote || ''}
                                    onChange={(e) => setEditData({ ...editData, quote: e.target.value })}
                                    className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                                    rows={3}
                                    placeholder="The quote text"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-purple-200 mb-2">
                                    Author
                                  </label>
                                  <input
                                    type="text"
                                    value={editData.author || ''}
                                    onChange={(e) => setEditData({ ...editData, author: e.target.value })}
                                    className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                                    placeholder="Author name"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Stats-specific fields */}
                            {scene.scene_type === 'stats' && (
                              <div>
                                <label className="block text-sm font-medium text-purple-200 mb-2">
                                  Stats (one per line, format: "75% | Increase in engagement")
                                </label>
                                <textarea
                                  value={editData.stats_text || ''}
                                  onChange={(e) => setEditData({ ...editData, stats_text: e.target.value })}
                                  className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500 font-mono text-sm"
                                  rows={5}
                                  placeholder="75% | Increase in engagement&#10;10+ hours | Saved per week&#10;$50K | Revenue growth"
                                />
                              </div>
                            )}

                            {/* Chart data fields */}
                            {scene.scene_type?.includes('chart') && (
                              <div>
                                <label className="block text-sm font-medium text-purple-200 mb-2">
                                  Chart Data (JSON format)
                                </label>
                                <textarea
                                  value={editData.chart_data || ''}
                                  onChange={(e) => setEditData({ ...editData, chart_data: e.target.value })}
                                  className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500 font-mono text-sm"
                                  rows={6}
                                  placeholder='{"labels": ["Jan", "Feb", "Mar"], "data": [10, 20, 30]}'
                                />
                                <button
                                  onClick={async () => {
                                    const description = prompt('Describe the data you want to visualize:');
                                    if (!description) return;

                                    try {
                                      const response = await fetch('http://localhost:8787/api/ai/generate-chart-data', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ description, chartType: scene.scene_type })
                                      });
                                      const data = await response.json();
                                      setEditData({ ...editData, chart_data: JSON.stringify(data, null, 2) });
                                    } catch (error) {
                                      alert('Failed to generate chart data');
                                    }
                                  }}
                                  className="mt-2 flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Generate with AI
                                </button>
                              </div>
                            )}

                            {/* JSON Editor for Advanced Users */}
                            <details className="bg-white/5 rounded-lg border border-purple-500/20">
                              <summary className="cursor-pointer p-3 text-purple-300 text-sm font-medium hover:text-purple-200">
                                Advanced: Edit Raw JSON
                              </summary>
                              <div className="p-3 pt-0">
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
                              </div>
                            </details>

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
                                <div className="max-w-2xl">
                                  <video
                                    controls
                                    className="w-full rounded-lg"
                                    style={{ aspectRatio: video.aspect_ratio || '16/9' }}
                                    src={`http://localhost:8787/api/scenes/${scene.id}/preview`}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
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

      {/* Stock Image Browser */}
      <StockImageBrowser
        isOpen={showStockBrowser}
        onClose={() => {
          setShowStockBrowser(false);
          setCurrentImageField(null);
        }}
        onSelectImage={(imageUrl) => {
          if (currentImageField) {
            setEditData({ ...editData, [currentImageField]: imageUrl });
          }
        }}
        initialQuery={editData.title || "business"}
      />
    </div>
  );
}

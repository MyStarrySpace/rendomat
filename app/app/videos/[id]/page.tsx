"use client";

import { useState, useEffect } from "react";
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
  Upload,
  Image as ImageIcon,
  Trash2,
  Share2,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { videoApi, sceneApi, clientApi, platformApi, personaApi, Video, Scene, Client, EffectivePersonas } from "@/lib/api";
import { THEMES } from "@/lib/themes";
import StockImageBrowser from "../../components/StockImageBrowser";
import PersonaSelector from "@/components/PersonaSelector";
import { Button } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Platform configuration
const PLATFORMS = {
  youtube: { id: 'youtube', name: 'YouTube / Website', aspectRatio: '16:9', icon: '📺' },
  instagram_feed: { id: 'instagram_feed', name: 'Instagram Feed', aspectRatio: '1:1', icon: '📷' },
  instagram_reels: { id: 'instagram_reels', name: 'Instagram Reels', aspectRatio: '9:16', icon: '🎬' },
  tiktok: { id: 'tiktok', name: 'TikTok', aspectRatio: '9:16', icon: '🎵' },
  linkedin_feed: { id: 'linkedin_feed', name: 'LinkedIn Feed', aspectRatio: '1:1', icon: '💼' },
  linkedin_video: { id: 'linkedin_video', name: 'LinkedIn Video', aspectRatio: '16:9', icon: '📊' },
  youtube_shorts: { id: 'youtube_shorts', name: 'YouTube Shorts', aspectRatio: '9:16', icon: '📱' },
};

const ASPECT_RATIO_GROUPS = {
  '16:9': { label: 'Landscape (16:9)', platforms: ['youtube', 'linkedin_video'] },
  '1:1': { label: 'Square (1:1)', platforms: ['instagram_feed', 'linkedin_feed'] },
  '9:16': { label: 'Vertical (9:16)', platforms: ['instagram_reels', 'tiktok', 'youtube_shorts'] },
};

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

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<any>(null);
  const [exportOutputs, setExportOutputs] = useState<Record<string, any> | null>(null);

  // Persona state
  const [showPersonaSection, setShowPersonaSection] = useState(false);
  const [effectivePersonas, setEffectivePersonas] = useState<EffectivePersonas | null>(null);
  const [editingPersonas, setEditingPersonas] = useState(false);
  const [editPersonas, setEditPersonas] = useState<string[]>([]);
  const [editBehaviorOverrides, setEditBehaviorOverrides] = useState<Record<string, string | string[]>>({});

  useEffect(() => {
    loadData();
  }, [videoId]);

  // Poll for progress when rendering
  useEffect(() => {
    if (!rendering) return;

    const interval = setInterval(async () => {
      try {
        const videoData = await videoApi.getById(videoId);

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

        if (videoData.status !== 'rendering') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Failed to poll progress:", error);
      }
    }, 500);

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

      try {
        const personas = await personaApi.getEffectiveForVideo(videoId);
        setEffectivePersonas(personas);
        setEditPersonas(personas.personaIds);
        setEditBehaviorOverrides(personas.behaviorOverrides);
      } catch (error) {
        console.error("Failed to load personas:", error);
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

  function togglePlatform(platformId: string) {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  }

  async function handleMultiPlatformExport() {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    setExporting(true);
    setExportProgress({ percentage: 0, current: 'Preparing...' });
    setExportOutputs(null);

    try {
      const result = await platformApi.renderMultiPlatform(videoId, selectedPlatforms);
      setExportOutputs(result.outputs);
      setExportProgress(null);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Export failed. Please try again.');
      setExportProgress(null);
    } finally {
      setExporting(false);
    }
  }

  async function downloadPlatformExport(platformId: string) {
    try {
      const blob = await platformApi.downloadExport(videoId, platformId);
      const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video?.title || 'video'}-${platform.name.replace(/[^a-zA-Z0-9]/g, '-')}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Download failed. Please try again.');
    }
  }

  async function savePersonaChanges() {
    try {
      await videoApi.update(videoId, {
        personas: editPersonas,
        behavior_overrides: editBehaviorOverrides,
      });
      setEditingPersonas(false);
      loadData();
    } catch (error) {
      console.error('Failed to save persona changes:', error);
      alert('Failed to save persona changes');
    }
  }

  function cancelPersonaEdit() {
    if (effectivePersonas) {
      setEditPersonas(effectivePersonas.personaIds);
      setEditBehaviorOverrides(effectivePersonas.behaviorOverrides);
    }
    setEditingPersonas(false);
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
      await sceneApi.update(sceneId, {
        data: JSON.stringify(editData),
        cache_path: null,
        cache_hash: null,
        cached_at: null,
      });
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
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[hsl(var(--foreground-muted))] animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <h1 className="headline text-2xl text-[hsl(var(--foreground))] mb-4">Video not found</h1>
          <Link href="/clients" className="link-subtle">
            Go back to clients
          </Link>
        </div>
      </div>
    );
  }

  const cachedScenes = scenes.filter(s => s.cache_path).length;
  const totalScenes = scenes.length;
  const cachePercentage = totalScenes > 0 ? Math.round((cachedScenes / totalScenes) * 100) : 0;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href={`/clients/${video.client_id}`}
            className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to client
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowExportModal(true)}
              disabled={rendering || exporting}
              icon={<Share2 className="w-4 h-4" />}
            >
              Export
            </Button>
            <Button
              onClick={handleRender}
              disabled={rendering}
              loading={rendering}
              icon={<Play className="w-4 h-4" />}
            >
              {rendering ? "Rendering..." : "Render Video"}
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <p className="caption mb-4">{client?.company || "Video"}</p>
            <h1 className="headline text-4xl md:text-5xl text-[hsl(var(--foreground))] mb-4">
              {video.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-[hsl(var(--foreground-muted))]">
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
                    className="w-4 h-4"
                    style={{ background: THEMES[video.theme_id].colors.backgroundGradient || THEMES[video.theme_id].colors.background }}
                  />
                  {THEMES[video.theme_id].name}
                </span>
              )}
            </div>
          </div>

          {/* Render Progress */}
          {renderProgress && (
            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-4 mb-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                {rendering ? (
                  <Loader2 className="w-5 h-5 text-[hsl(var(--accent))] animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-[hsl(var(--success))]" />
                )}
                <p className="text-[hsl(var(--foreground))] font-medium">{renderProgress}</p>
              </div>
              {progressData && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-[hsl(var(--foreground-muted))]">
                    <span>
                      Scene {progressData.rendered_scenes + 1} of {progressData.total_scenes}
                    </span>
                    <span className="font-mono">{progressData.percentage}%</span>
                  </div>
                  <div className="w-full bg-[hsl(var(--background))] h-2 overflow-hidden">
                    <div
                      className="bg-[hsl(var(--accent))] h-full transition-all duration-300"
                      style={{ width: `${progressData.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cache Status */}
          {cachedScenes > 0 && (
            <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-4 mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-[hsl(var(--warning))]" />
                <h3 className="font-medium text-[hsl(var(--foreground))]">Cache Status</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-[hsl(var(--background))] h-2 overflow-hidden">
                  <div
                    className="bg-[hsl(var(--success))] h-full transition-all duration-500"
                    style={{ width: `${cachePercentage}%` }}
                  />
                </div>
                <span className="text-sm text-[hsl(var(--foreground-muted))] font-mono">
                  {cachedScenes}/{totalScenes} cached
                </span>
              </div>
              <p className="text-sm text-[hsl(var(--foreground-subtle))] mt-2">
                Only {totalScenes - cachedScenes} scene{totalScenes - cachedScenes !== 1 ? 's' : ''} will be re-rendered
              </p>
            </div>
          )}

          {/* AI Personas Section */}
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] mb-8 overflow-hidden">
            <button
              onClick={() => setShowPersonaSection(!showPersonaSection)}
              className="w-full p-4 flex items-center justify-between hover:bg-[hsl(var(--surface-hover))] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[hsl(var(--accent))]" />
                <span className="font-medium text-[hsl(var(--foreground))]">AI Personas</span>
                {effectivePersonas && (
                  <Badge variant="secondary" size="sm">
                    {effectivePersonas.personaIds.length} selected
                  </Badge>
                )}
                {effectivePersonas?.source === 'client' && (
                  <Badge variant="outline" size="sm">
                    Inherited from client
                  </Badge>
                )}
              </div>
              {showPersonaSection ? (
                <ChevronUp className="w-5 h-5 text-[hsl(var(--foreground-muted))]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[hsl(var(--foreground-muted))]" />
              )}
            </button>

            {showPersonaSection && (
              <div className="p-4 pt-0 border-t border-[hsl(var(--border))]">
                {editingPersonas ? (
                  <div className="space-y-4 pt-4">
                    <PersonaSelector
                      selectedPersonas={editPersonas}
                      behaviorOverrides={editBehaviorOverrides}
                      onChange={(personas, overrides) => {
                        setEditPersonas(personas);
                        setEditBehaviorOverrides(overrides);
                      }}
                    />
                    <div className="flex gap-3 pt-3 border-t border-[hsl(var(--border))]">
                      <Button onClick={savePersonaChanges} icon={<Save className="w-4 h-4" />} size="sm">
                        Save Changes
                      </Button>
                      <Button variant="ghost" onClick={cancelPersonaEdit} icon={<X className="w-4 h-4" />} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4">
                    {effectivePersonas && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {effectivePersonas.preview.metadata.personas.map((persona) => (
                            <Badge key={persona.id} variant="default">
                              {persona.name}
                            </Badge>
                          ))}
                        </div>

                        {Object.keys(effectivePersonas.preview.metadata.behaviors).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-[hsl(var(--foreground-subtle))]">Active Behaviors:</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(effectivePersonas.preview.metadata.behaviors).map(([key, behavior]: [string, any]) => (
                                <Badge key={key} variant="outline" size="sm">
                                  {behavior.label}: {behavior.selectedId || (behavior.selectedIds?.join(', '))}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => setEditingPersonas(true)}
                          className="flex items-center gap-2 text-sm link-subtle"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Personas
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Output Video */}
          {video.output_path && (
            <div className="mb-12">
              <p className="caption mb-4">Output Video</p>
              <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-4">
                <div className="max-w-4xl mx-auto">
                  <video
                    controls
                    className="w-full"
                    style={{ aspectRatio: video.aspect_ratio || '16/9' }}
                    src={`http://localhost:8787/api/videos/${videoId}/preview`}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          )}

          {/* Scenes */}
          <div className="divider mb-8" />
          <p className="caption mb-6">Scenes</p>

          {scenes.length === 0 ? (
            <div className="text-center py-24 border border-[hsl(var(--border))]">
              <Film className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-6" />
              <h3 className="headline text-2xl text-[hsl(var(--foreground))] mb-2">
                No scenes yet
              </h3>
              <p className="text-[hsl(var(--foreground-muted))]">
                Scenes will appear here once the video is set up
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-[hsl(var(--accent-muted))] flex items-center justify-center">
                            <span className="text-[hsl(var(--accent))] font-bold font-mono">{scene.scene_number}</span>
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
                                  className="flex-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-3 py-1 text-[hsl(var(--foreground))] text-xl font-bold focus:outline-none focus:border-[hsl(var(--accent))]"
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => saveSceneName(scene.id)} icon={<Save className="w-4 h-4" />}>
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEditSceneName} icon={<X className="w-4 h-4" />}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group">
                                <h3 className="headline text-xl text-[hsl(var(--foreground))]">
                                  {scene.name}
                                </h3>
                                <button
                                  onClick={() => startEditSceneName(scene)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--background))] transition-all"
                                  title="Rename scene"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <p className="text-sm text-[hsl(var(--foreground-muted))] mt-1 font-mono">
                              {formatFrameRange(scene.start_frame, scene.end_frame)} &bull; {scene.end_frame - scene.start_frame} frames
                            </p>
                          </div>
                        </div>

                        {editingScene === scene.id ? (
                          <div className="mt-4 space-y-4">
                            {/* Scene Type Selector */}
                            <div>
                              <Label>Scene Type</Label>
                              <select
                                value={scene.scene_type || 'text-only'}
                                onChange={(e) => {
                                  sceneApi.update(scene.id, { scene_type: e.target.value });
                                  loadData();
                                }}
                                className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-4 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
                              >
                                <optgroup label="Text Content">
                                  <option value="text-only">Text Only</option>
                                  <option value="quote">Quote/Testimonial</option>
                                  <option value="stats">Stats/Numbers</option>
                                </optgroup>
                                <optgroup label="Visual Content">
                                  <option value="single-image">Single Image + Title</option>
                                  <option value="dual-images">Dual Images + Title</option>
                                  <option value="grid-2x2">Grid (2x2 Images)</option>
                                  <option value="image-gallery">Image Gallery</option>
                                </optgroup>
                                <optgroup label="Data Visualization">
                                  <option value="line-chart">Line Chart</option>
                                  <option value="bar-chart">Bar Chart</option>
                                  <option value="pie-chart">Pie/Donut Chart</option>
                                  <option value="area-chart">Area Chart</option>
                                  <option value="progress-bars">Progress Bars</option>
                                </optgroup>
                                <optgroup label="Scientific">
                                  <option value="equation">Equation (LaTeX)</option>
                                </optgroup>
                              </select>
                            </div>

                            {/* Animation Style */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Background Animation</Label>
                                <select
                                  value={editData.animation_style || 'none'}
                                  onChange={(e) => setEditData({ ...editData, animation_style: e.target.value })}
                                  className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-4 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
                                >
                                  <option value="none">None</option>
                                  <optgroup label="Subtle">
                                    <option value="particles">Particles</option>
                                    <option value="floating-shapes">Floating Shapes</option>
                                    <option value="waves">Waves</option>
                                    <option value="bokeh">Bokeh</option>
                                    <option value="aurora">Aurora</option>
                                  </optgroup>
                                  <optgroup label="Tech">
                                    <option value="grid-pulse">Grid Pulse</option>
                                    <option value="matrix">Matrix</option>
                                  </optgroup>
                                  <optgroup label="Dynamic">
                                    <option value="geometric">Geometric</option>
                                  </optgroup>
                                  <optgroup label="Playful">
                                    <option value="confetti">Confetti</option>
                                  </optgroup>
                                </select>
                              </div>
                              <div>
                                <Label>Animation Intensity</Label>
                                <select
                                  value={editData.animation_intensity || 'medium'}
                                  onChange={(e) => setEditData({ ...editData, animation_intensity: e.target.value })}
                                  disabled={editData.animation_style === 'none' || !editData.animation_style}
                                  className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-4 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))] disabled:opacity-50"
                                >
                                  <option value="low">Low (Subtle)</option>
                                  <option value="medium">Medium (Balanced)</option>
                                  <option value="high">High (Active)</option>
                                </select>
                              </div>
                            </div>

                            {/* Image Fields */}
                            {(scene.scene_type === 'single-image' || scene.scene_type === 'dual-images' || scene.scene_type === 'grid-2x2' || scene.scene_type === 'image-gallery') && (
                              <div className="space-y-2">
                                <Label>Images</Label>
                                <div className="grid grid-cols-2 gap-3">
                                  {['image_url', 'image_url_2', 'image_url_3', 'image_url_4'].map((field) => (
                                    <div key={field} className="relative">
                                      {editData[field] ? (
                                        <div className="relative bg-[hsl(var(--background))] p-2 border border-[hsl(var(--border))]">
                                          <img
                                            src={editData[field]}
                                            alt={field}
                                            className="w-full h-32 object-cover"
                                          />
                                          <button
                                            onClick={() => removeImage(field)}
                                            className="absolute top-3 right-3 p-1 bg-[hsl(var(--error))] text-white transition-colors"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="space-y-2">
                                          <label className="block bg-[hsl(var(--background))] border-2 border-dashed border-[hsl(var(--border))] p-6 hover:border-[hsl(var(--accent))] cursor-pointer transition-colors">
                                            <input
                                              type="file"
                                              accept="image/*"
                                              onChange={(e) => handleImageUpload(e, field)}
                                              className="hidden"
                                              disabled={uploading}
                                            />
                                            <div className="flex flex-col items-center gap-2 text-[hsl(var(--foreground-muted))]">
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
                                            className="w-full bg-[hsl(var(--accent-muted))] hover:bg-[hsl(var(--accent))]/20 border border-[hsl(var(--accent))]/30 text-[hsl(var(--accent))] px-4 py-2 transition-colors text-sm font-medium"
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

                            {/* Text Fields */}
                            <div className="space-y-3">
                              <div>
                                <Label>Title</Label>
                                <Input
                                  type="text"
                                  value={editData.title || ''}
                                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                  placeholder="Scene title"
                                />
                              </div>

                              {scene.scene_type !== 'quote' && scene.scene_type !== 'stats' && !scene.scene_type?.includes('chart') && (
                                <div>
                                  <Label>Body Text</Label>
                                  <Textarea
                                    value={editData.body_text || ''}
                                    onChange={(e) => setEditData({ ...editData, body_text: e.target.value })}
                                    rows={3}
                                    placeholder="Additional text for this scene"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Quote Fields */}
                            {scene.scene_type === 'quote' && (
                              <div className="space-y-3">
                                <div>
                                  <Label>Quote</Label>
                                  <Textarea
                                    value={editData.quote || ''}
                                    onChange={(e) => setEditData({ ...editData, quote: e.target.value })}
                                    rows={3}
                                    placeholder="The quote text"
                                  />
                                </div>
                                <div>
                                  <Label>Author</Label>
                                  <Input
                                    type="text"
                                    value={editData.author || ''}
                                    onChange={(e) => setEditData({ ...editData, author: e.target.value })}
                                    placeholder="Author name"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Stats Fields */}
                            {scene.scene_type === 'stats' && (
                              <div>
                                <Label>Stats (one per line, format: "75% | Increase in engagement")</Label>
                                <Textarea
                                  value={editData.stats_text || ''}
                                  onChange={(e) => setEditData({ ...editData, stats_text: e.target.value })}
                                  className="font-mono text-sm"
                                  rows={5}
                                  placeholder="75% | Increase in engagement&#10;10+ hours | Saved per week"
                                />
                              </div>
                            )}

                            {/* Chart Data */}
                            {scene.scene_type?.includes('chart') && (
                              <div>
                                <Label>Chart Data (JSON format)</Label>
                                <Textarea
                                  value={editData.chart_data || ''}
                                  onChange={(e) => setEditData({ ...editData, chart_data: e.target.value })}
                                  className="font-mono text-sm"
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
                                  className="mt-2 flex items-center gap-2 text-sm link-subtle"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Generate with AI
                                </button>
                              </div>
                            )}

                            {/* Equation Fields */}
                            {scene.scene_type === 'equation' && (
                              <div className="space-y-3">
                                <div>
                                  <Label>Equation (LaTeX format)</Label>
                                  <Textarea
                                    value={editData.equation || ''}
                                    onChange={(e) => setEditData({ ...editData, equation: e.target.value })}
                                    className="font-mono text-sm"
                                    rows={2}
                                    placeholder="E = mc^2"
                                  />
                                  <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">
                                    Use LaTeX syntax: ^2 for superscript, _n for subscript
                                  </p>
                                </div>
                                <div>
                                  <Label>Multiple Equations (one per line)</Label>
                                  <Textarea
                                    value={editData.equations?.join('\n') || ''}
                                    onChange={(e) => setEditData({
                                      ...editData,
                                      equations: e.target.value.split('\n').filter(eq => eq.trim())
                                    })}
                                    className="font-mono text-sm"
                                    rows={4}
                                    placeholder="x^2 + y^2 = r^2"
                                  />
                                </div>
                                <button
                                  onClick={async () => {
                                    const description = prompt('Describe the equation or concept:');
                                    if (!description) return;
                                    try {
                                      const response = await fetch('http://localhost:8787/api/ai/generate-equation', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ description })
                                      });
                                      const data = await response.json();
                                      setEditData({
                                        ...editData,
                                        equation: data.equation,
                                        equations: data.equations,
                                        equation_description: data.description,
                                        title: data.title || editData.title
                                      });
                                    } catch (error) {
                                      alert('Failed to generate equation');
                                    }
                                  }}
                                  className="flex items-center gap-2 text-sm link-subtle"
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Generate with AI
                                </button>
                              </div>
                            )}

                            {/* Raw JSON Editor */}
                            <details className="bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
                              <summary className="cursor-pointer p-3 text-sm font-medium text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]">
                                Advanced: Edit Raw JSON
                              </summary>
                              <div className="p-3 pt-0">
                                <Textarea
                                  value={JSON.stringify(editData, null, 2)}
                                  onChange={(e) => {
                                    try {
                                      setEditData(JSON.parse(e.target.value));
                                    } catch {}
                                  }}
                                  className="font-mono text-sm"
                                  rows={8}
                                />
                              </div>
                            </details>

                            <div className="flex gap-2 pt-2">
                              <Button onClick={() => saveEdit(scene.id)} icon={<Save className="w-4 h-4" />}>
                                Save Changes
                              </Button>
                              <Button variant="ghost" onClick={cancelEdit} icon={<X className="w-4 h-4" />}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {scene.cache_path && (
                              <div className="bg-[hsl(var(--background))] p-3">
                                <div className="max-w-2xl">
                                  <video
                                    controls
                                    className="w-full"
                                    style={{ aspectRatio: video.aspect_ratio || '16/9' }}
                                    src={`http://localhost:8787/api/scenes/${scene.id}/preview`}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              </div>
                            )}
                            {scene.data && (
                              <details className="bg-[hsl(var(--background))]">
                                <summary className="cursor-pointer p-3 text-sm font-medium text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]">
                                  View Scene Data
                                </summary>
                                <div className="p-3 pt-0">
                                  <pre className="text-[hsl(var(--foreground-muted))] text-xs font-mono overflow-x-auto">
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
                          <Badge variant="success" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Cached
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Not Cached
                          </Badge>
                        )}

                        {editingScene !== scene.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditScene(scene)}
                            icon={<Edit className="w-4 h-4" />}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {scene.cached_at && (
                      <div className="mt-3 text-xs text-[hsl(var(--foreground-subtle))] font-mono">
                        Last cached: {new Date(scene.cached_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-[hsl(var(--accent))]" />
                  <h2 className="headline text-2xl text-[hsl(var(--foreground))]">Export to Platforms</h2>
                </div>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setSelectedPlatforms([]);
                    setExportOutputs(null);
                  }}
                  className="p-2 text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface))] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-[hsl(var(--foreground-muted))] mt-2">
                Select platforms to export to. Videos will be rendered in the optimal aspect ratio for each.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {!exportOutputs && (
                <>
                  {Object.entries(ASPECT_RATIO_GROUPS).map(([ratio, group]) => (
                    <div key={ratio} className="space-y-3">
                      <h3 className="font-medium text-[hsl(var(--foreground))] flex items-center gap-2">
                        <Film className="w-4 h-4 text-[hsl(var(--accent))]" />
                        {group.label}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {group.platforms.map(platformId => {
                          const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];
                          const isSelected = selectedPlatforms.includes(platformId);

                          return (
                            <button
                              key={platformId}
                              onClick={() => togglePlatform(platformId)}
                              disabled={exporting}
                              className={`flex items-center gap-3 p-4 border transition-all ${
                                isSelected
                                  ? 'bg-[hsl(var(--accent-muted))] border-[hsl(var(--accent))] text-[hsl(var(--foreground))]'
                                  : 'bg-[hsl(var(--surface))] border-[hsl(var(--border))] text-[hsl(var(--foreground-muted))] hover:bg-[hsl(var(--surface-hover))]'
                              } ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span className="text-2xl">{platform.icon}</span>
                              <div className="text-left">
                                <div className="font-medium">{platform.name}</div>
                                <div className="text-xs text-[hsl(var(--foreground-subtle))]">{platform.aspectRatio}</div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-[hsl(var(--success))] ml-auto" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {exporting && exportProgress && (
                    <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Loader2 className="w-5 h-5 text-[hsl(var(--accent))] animate-spin" />
                        <span className="text-[hsl(var(--foreground))] font-medium">{exportProgress.current || 'Rendering...'}</span>
                      </div>
                      <div className="w-full bg-[hsl(var(--background))] h-2 overflow-hidden">
                        <div
                          className="bg-[hsl(var(--accent))] h-full transition-all duration-300"
                          style={{ width: `${exportProgress.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleMultiPlatformExport}
                      disabled={selectedPlatforms.length === 0 || exporting}
                      loading={exporting}
                      icon={<Sparkles className="w-4 h-4" />}
                      className="flex-1"
                    >
                      {exporting ? "Exporting..." : `Export ${selectedPlatforms.length > 0 ? `(${selectedPlatforms.length} platforms)` : ''}`}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowExportModal(false);
                        setSelectedPlatforms([]);
                      }}
                      disabled={exporting}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}

              {exportOutputs && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[hsl(var(--success))] mb-4">
                    <CheckCircle className="w-6 h-6" />
                    <span className="text-lg font-medium">Export Complete!</span>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(exportOutputs).map(([platformId, output]) => {
                      const platform = PLATFORMS[platformId as keyof typeof PLATFORMS];

                      return (
                        <div
                          key={platformId}
                          className="flex items-center justify-between bg-[hsl(var(--surface))] p-4 border border-[hsl(var(--border))]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{platform.icon}</span>
                            <div>
                              <div className="font-medium text-[hsl(var(--foreground))]">{platform.name}</div>
                              <div className="text-xs text-[hsl(var(--foreground-muted))]">{output.aspectRatio}</div>
                            </div>
                          </div>
                          <Button
                            onClick={() => downloadPlatformExport(platformId)}
                            icon={<Download className="w-4 h-4" />}
                            size="sm"
                          >
                            Download
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => {
                      setShowExportModal(false);
                      setSelectedPlatforms([]);
                      setExportOutputs(null);
                    }}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

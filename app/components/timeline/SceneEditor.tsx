"use client";

import React, { useState, useEffect } from 'react';
import { Scene, API_BASE } from '@/lib/api';
import { Button } from '@/components/ui';
import { Input, Textarea, Label } from '@/components/ui/input';
import {
  Zap,
  X,
  Upload,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AnimationPicker } from '@/components/ui/AnimationPicker';
import StockImageBrowser from '../../app/components/StockImageBrowser';
import { formatDuration, getSceneDuration } from './lib/timeline-utils';
import { SpotlightsEditor } from './SpotlightsEditor';

const SCENE_TYPE_OPTIONS = [
  { group: 'Text Content', types: [
    { value: 'text-only', label: 'Text Only' },
    { value: 'quote', label: 'Quote' },
  ]},
  { group: 'Visual Content', types: [
    { value: 'single-image', label: 'Single Image' },
    { value: 'dual-images', label: 'Dual Images' },
    { value: 'grid-2x2', label: 'Grid 2x2' },
    { value: 'image-gallery', label: 'Image Gallery' },
    { value: 'spotlights', label: 'Spotlights' },
  ]},
  { group: 'Data Visualization', types: [
    { value: 'stats', label: 'Stats' },
    { value: 'bar-chart', label: 'Bar Chart' },
    { value: 'line-chart', label: 'Line Chart' },
    { value: 'pie-chart', label: 'Pie Chart' },
    { value: 'area-chart', label: 'Area Chart' },
    { value: 'progress-bars', label: 'Progress Bars' },
  ]},
  { group: 'Scientific', types: [
    { value: 'equation', label: 'Equation' },
  ]},
];

interface SceneEditorProps {
  scene: Scene;
  onSave: (sceneId: number, data: any) => Promise<void>;
  onCancel: () => void;
  onOpenStockBrowser?: (fieldName: string) => void;
  onSceneTypeChange?: (sceneId: number, newType: string) => void;
  hasChanges?: boolean;
}

export function SceneEditor({
  scene,
  onSave,
  onCancel,
  onOpenStockBrowser,
  onSceneTypeChange,
  hasChanges = false,
}: SceneEditorProps) {
  const [editData, setEditData] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [showStockBrowser, setShowStockBrowser] = useState(false);
  const [stockImageField, setStockImageField] = useState<string | null>(null);
  const isUnrendered = !scene.cache_path;

  useEffect(() => {
    setEditData(scene.data ? JSON.parse(scene.data) : {});
  }, [scene]);

  const handleSaveAndRender = async () => {
    setRendering(true);
    try {
      await onSave(scene.id, editData);
    } finally {
      setRendering(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const imageUrl = `${API_BASE}${data.url}`;

      setEditData({ ...editData, [fieldName]: imageUrl });
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (fieldName: string) => {
    const newData = { ...editData };
    delete newData[fieldName];
    setEditData(newData);
  };

  const duration = getSceneDuration(scene);

  return (
    <div className="space-y-4">
      {/* Scene info header */}
      <div className="pb-3 border-b border-[hsl(var(--border))]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-[hsl(var(--foreground))]">
              Scene {scene.scene_number}: {scene.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--foreground-muted))]">
              <select
                value={scene.scene_type}
                onChange={(e) => onSceneTypeChange?.(scene.id, e.target.value)}
                disabled={!onSceneTypeChange}
                className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-1.5 py-0.5 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))] disabled:opacity-70 disabled:cursor-default"
              >
                {SCENE_TYPE_OPTIONS.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.types.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span>&bull; {formatDuration(duration)}</span>
            </div>
          </div>
          {(isUnrendered || hasChanges) && (
            <div className="flex items-center gap-1 text-[hsl(var(--warning))]">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">{hasChanges ? 'Modified' : 'Not rendered'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Animation Style */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Background Animation</Label>
          <AnimationPicker
            value={editData.animation_style || 'none'}
            onChange={(v) => setEditData({ ...editData, animation_style: v })}
          />
        </div>
        <div>
          <Label>Intensity</Label>
          <select
            value={editData.animation_intensity || 'medium'}
            onChange={(e) => setEditData({ ...editData, animation_intensity: e.target.value })}
            disabled={editData.animation_style === 'none' || !editData.animation_style}
            className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))] disabled:opacity-50"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Text Animation Preset */}
      <div>
        <Label>Text Animation</Label>
        <select
          value={editData.animation_preset || 'smooth'}
          onChange={(e) => setEditData({ ...editData, animation_preset: e.target.value })}
          className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
        >
          <optgroup label="Professional">
            <option value="minimal">Minimal</option>
            <option value="smooth">Smooth</option>
            <option value="elegant">Elegant</option>
            <option value="cinematic">Cinematic</option>
          </optgroup>
          <optgroup label="Energetic">
            <option value="energetic">Energetic</option>
            <option value="dramatic">Dramatic</option>
            <option value="kinetic">Kinetic</option>
            <option value="typewriter">Typewriter</option>
          </optgroup>
          <optgroup label="Lyric Video">
            <option value="lyric">Lyric</option>
            <option value="stacking">Stacking</option>
            <option value="cascade">Cascade</option>
            <option value="burst">Burst</option>
          </optgroup>
        </select>
      </div>

      {/* Image Fields */}
      {(scene.scene_type === 'single-image' ||
        scene.scene_type === 'dual-images' ||
        scene.scene_type === 'grid-2x2' ||
        scene.scene_type === 'image-gallery') && (
        <div>
          <Label>Images</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {['image_url', 'image_url_2', 'image_url_3', 'image_url_4'].map((field) => (
              <div key={field} className="relative">
                {editData[field] ? (
                  <div className="relative bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
                    <img
                      src={editData[field]}
                      alt={field}
                      className="w-full h-20 object-cover"
                    />
                    <button
                      onClick={() => removeImage(field)}
                      className="absolute top-1 right-1 p-1 bg-[hsl(var(--error))] text-white"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block bg-[hsl(var(--background))] border-2 border-dashed border-[hsl(var(--border))] p-4 hover:border-[hsl(var(--accent))] cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, field)}
                        className="hidden"
                        disabled={uploading}
                      />
                      <div className="flex flex-col items-center gap-1 text-[hsl(var(--foreground-muted))]">
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            <span className="text-[10px]">Upload</span>
                          </>
                        )}
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setStockImageField(field);
                        setShowStockBrowser(true);
                      }}
                      className="w-full bg-[hsl(var(--accent-muted))] hover:bg-[hsl(var(--accent))]/20 border border-[hsl(var(--accent))]/30 text-[hsl(var(--accent))] px-2 py-1 transition-colors text-[10px] font-medium flex items-center justify-center gap-1"
                    >
                      <ImageIcon className="w-3 h-3" />
                      Stock
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
              placeholder="Additional text"
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
          <Label>Stats (format: "75% | Description")</Label>
          <Textarea
            value={editData.stats_text || ''}
            onChange={(e) => setEditData({ ...editData, stats_text: e.target.value })}
            className="font-mono text-sm"
            rows={4}
            placeholder="75% | Increase in engagement&#10;10+ hours | Saved per week"
          />
        </div>
      )}

      {/* Chart Data */}
      {scene.scene_type?.includes('chart') && (
        <div>
          <Label>Chart Data (JSON)</Label>
          <Textarea
            value={editData.chart_data || ''}
            onChange={(e) => setEditData({ ...editData, chart_data: e.target.value })}
            className="font-mono text-xs"
            rows={5}
            placeholder='{"labels": ["Jan", "Feb"], "data": [10, 20]}'
          />
          <button
            onClick={async () => {
              const description = prompt('Describe the data:');
              if (!description) return;
              try {
                const response = await fetch(`${API_BASE}/api/ai/generate-chart-data`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ description, chartType: scene.scene_type })
                });
                const data = await response.json();
                setEditData({ ...editData, chart_data: JSON.stringify(data, null, 2) });
              } catch {
                alert('Failed to generate chart data');
              }
            }}
            className="mt-2 flex items-center gap-1 text-xs link-subtle"
          >
            <Sparkles className="w-3 h-3" />
            Generate with AI
          </button>
        </div>
      )}

      {/* Equation Fields */}
      {scene.scene_type === 'equation' && (
        <div className="space-y-3">
          <div>
            <Label>Equation (LaTeX)</Label>
            <Textarea
              value={editData.equation || ''}
              onChange={(e) => setEditData({ ...editData, equation: e.target.value })}
              className="font-mono text-sm"
              rows={2}
              placeholder="E = mc^2"
            />
          </div>
          <button
            onClick={async () => {
              const description = prompt('Describe the equation:');
              if (!description) return;
              try {
                const response = await fetch(`${API_BASE}/api/ai/generate-equation`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ description })
                });
                const data = await response.json();
                setEditData({
                  ...editData,
                  equation: data.equation,
                  equations: data.equations,
                  title: data.title || editData.title
                });
              } catch {
                alert('Failed to generate equation');
              }
            }}
            className="flex items-center gap-1 text-xs link-subtle"
          >
            <Sparkles className="w-3 h-3" />
            Generate with AI
          </button>
        </div>
      )}

      {/* Spotlights Editor */}
      {scene.scene_type === 'spotlights' && (
        <SpotlightsEditor editData={editData} setEditData={setEditData} />
      )}

      {/* Advanced JSON */}
      <details className="bg-[hsl(var(--background))] border border-[hsl(var(--border))]">
        <summary className="cursor-pointer p-2 text-xs font-medium text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]">
          Advanced: Raw JSON
        </summary>
        <div className="p-2 pt-0">
          <Textarea
            value={JSON.stringify(editData, null, 2)}
            onChange={(e) => {
              try {
                setEditData(JSON.parse(e.target.value));
              } catch {}
            }}
            className="font-mono text-xs"
            rows={6}
          />
        </div>
      </details>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-[hsl(var(--border))]">
        <Button
          onClick={handleSaveAndRender}
          loading={rendering}
          icon={<Zap className="w-4 h-4" />}
          className="flex-1"
        >
          {isUnrendered || hasChanges ? 'Save & Render' : 'Re-render'}
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          icon={<X className="w-4 h-4" />}
        >
          Cancel
        </Button>
      </div>

      {/* Stock Image Browser — embedded so it writes to this component's editData */}
      <StockImageBrowser
        isOpen={showStockBrowser}
        onClose={() => {
          setShowStockBrowser(false);
          setStockImageField(null);
        }}
        onSelectImage={(imageUrl) => {
          if (stockImageField) {
            setEditData((prev: any) => ({ ...prev, [stockImageField]: imageUrl }));
          }
        }}
        initialQuery={editData.title || 'business'}
      />
    </div>
  );
}

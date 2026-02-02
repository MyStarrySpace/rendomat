"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Button } from '@/components/ui';
import {
  Trash2,
  Upload,
  Image as ImageIcon,
  GripVertical,
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { API_BASE } from '@/lib/api';
import StockImageBrowser from '../../app/components/StockImageBrowser';

interface SpotlightPoint {
  id: string;
  x: number;
  y: number;
  zoom: number;
  title?: string;
  description?: string;
  image_url?: string;
  badge?: string;
}

interface SpotlightsEditorProps {
  editData: any;
  setEditData: (data: any) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function SpotlightsEditor({ editData, setEditData }: SpotlightsEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingPointImage, setUploadingPointImage] = useState<string | null>(null);
  const [expandedPoint, setExpandedPoint] = useState<string | null>(null);
  const [showStockBrowser, setShowStockBrowser] = useState(false);
  const [stockTarget, setStockTarget] = useState<{ type: 'base' } | { type: 'point'; pointId: string } | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const points: SpotlightPoint[] = editData.spotlights || [];
  const baseImage: string | undefined = editData.spotlight_image_url;

  const updatePoints = (newPoints: SpotlightPoint[]) => {
    setEditData({ ...editData, spotlights: newPoints });
  };

  const updatePoint = (id: string, updates: Partial<SpotlightPoint>) => {
    updatePoints(points.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePoint = (id: string) => {
    updatePoints(points.filter(p => p.id !== id));
    if (expandedPoint === id) setExpandedPoint(null);
  };

  // Handle clicking on the image to place a point
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!baseImage) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const newPoint: SpotlightPoint = {
      id: generateId(),
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      zoom: 2.5,
    };
    updatePoints([...points, newPoint]);
    setExpandedPoint(newPoint.id);
  };

  // Handle base image upload
  const handleBaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      setEditData({ ...editData, spotlight_image_url: `${API_BASE}${data.url}` });
    } catch {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Handle point image upload
  const handlePointImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, pointId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPointImage(pointId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      updatePoint(pointId, { image_url: `${API_BASE}${data.url}` });
    } catch {
      alert('Failed to upload image');
    } finally {
      setUploadingPointImage(null);
    }
  };

  // Drag-and-drop reorder
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const newPoints = [...points];
    const [moved] = newPoints.splice(dragIdx, 1);
    newPoints.splice(idx, 0, moved);
    updatePoints(newPoints);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // Draggable point on image
  const handlePointDrag = useCallback((pointId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const container = imageContainerRef.current;
    if (!container) return;

    const onMove = (moveEvent: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (moveEvent.clientY - rect.top) / rect.height));
      updatePoint(pointId, { x, y });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [points, editData]);

  return (
    <div className="space-y-4">
      {/* Base Image Upload */}
      <div>
        <Label>Base Image</Label>
        {baseImage ? (
          <div className="relative mt-1">
            {/* Interactive point placer */}
            <div
              ref={imageContainerRef}
              className="relative cursor-crosshair select-none"
              onClick={handleImageClick}
              style={{ lineHeight: 0 }}
            >
              <img
                src={baseImage}
                alt="Base"
                className="w-full"
                style={{ display: 'block', maxHeight: 400, objectFit: 'contain', width: '100%' }}
                draggable={false}
              />
              {/* Point markers */}
              {points.map((pt, idx) => (
                <div
                  key={pt.id}
                  onMouseDown={(e) => handlePointDrag(pt.id, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedPoint(expandedPoint === pt.id ? null : pt.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${pt.x * 100}%`,
                    top: `${pt.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'grab',
                    zIndex: 10,
                    userSelect: 'none',
                  }}
                  className={`
                    border-2
                    ${expandedPoint === pt.id
                      ? 'bg-[hsl(var(--accent))] border-[hsl(var(--accent))] text-[hsl(var(--background))]'
                      : 'bg-[hsl(var(--surface))] border-[hsl(var(--foreground))] text-[hsl(var(--foreground))]'
                    }
                  `}
                >
                  {pt.badge || idx + 1}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setEditData({ ...editData, spotlight_image_url: undefined })}
                className="text-xs text-[hsl(var(--error))] hover:underline"
              >
                Remove image
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockTarget({ type: 'base' });
                  setShowStockBrowser(true);
                }}
                className="text-xs text-[hsl(var(--accent))] hover:underline flex items-center gap-1"
              >
                <ImageIcon className="w-3 h-3" /> Replace from stock
              </button>
            </div>
            <p className="text-[10px] text-[hsl(var(--foreground-muted))] mt-1">
              Click on the image to place spotlight points. Drag points to reposition.
            </p>
          </div>
        ) : (
          <div className="mt-1 space-y-2">
            <label className="block bg-[hsl(var(--background))] border-2 border-dashed border-[hsl(var(--border))] p-6 hover:border-[hsl(var(--accent))] cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleBaseImageUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex flex-col items-center gap-2 text-[hsl(var(--foreground-muted))]">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Upload base image</span>
                  </>
                )}
              </div>
            </label>
            <button
              type="button"
              onClick={() => {
                setStockTarget({ type: 'base' });
                setShowStockBrowser(true);
              }}
              className="w-full bg-[hsl(var(--accent-muted))] hover:bg-[hsl(var(--accent))]/20 border border-[hsl(var(--accent))]/30 text-[hsl(var(--accent))] px-2 py-1.5 transition-colors text-xs font-medium flex items-center justify-center gap-1"
            >
              <ImageIcon className="w-3 h-3" />
              Browse Stock Images
            </button>
          </div>
        )}
      </div>

      {/* Point List */}
      {points.length > 0 && (
        <div>
          <Label>Spotlight Points ({points.length})</Label>
          <div className="space-y-1 mt-1">
            {points.map((pt, idx) => {
              const isExpanded = expandedPoint === pt.id;
              return (
                <div
                  key={pt.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  className={`
                    border border-[hsl(var(--border))] bg-[hsl(var(--background))]
                    ${dragOverIdx === idx ? 'border-[hsl(var(--accent))]' : ''}
                  `}
                >
                  {/* Header */}
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-[hsl(var(--surface))]"
                    onClick={() => setExpandedPoint(isExpanded ? null : pt.id)}
                  >
                    <GripVertical className="w-3 h-3 text-[hsl(var(--foreground-muted))] cursor-grab flex-shrink-0" />
                    <div className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-[hsl(var(--accent))] text-[hsl(var(--background))] flex-shrink-0">
                      {pt.badge || idx + 1}
                    </div>
                    <span className="text-xs text-[hsl(var(--foreground))] flex-1 truncate">
                      {pt.title || `Point ${idx + 1}`}
                    </span>
                    <span className="text-[10px] text-[hsl(var(--foreground-muted))]">
                      {pt.zoom}x
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-[hsl(var(--foreground-muted))]" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-[hsl(var(--foreground-muted))]" />
                    )}
                  </div>

                  {/* Expanded editor */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-[hsl(var(--border))]">
                      <div className="pt-2">
                        <Label>Title</Label>
                        <Input
                          type="text"
                          value={pt.title || ''}
                          onChange={(e) => updatePoint(pt.id, { title: e.target.value })}
                          placeholder="Point title"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={pt.description || ''}
                          onChange={(e) => updatePoint(pt.id, { description: e.target.value })}
                          rows={2}
                          placeholder="Point description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Badge</Label>
                          <Input
                            type="text"
                            value={pt.badge || ''}
                            onChange={(e) => updatePoint(pt.id, { badge: e.target.value })}
                            placeholder={`${idx + 1}`}
                          />
                        </div>
                        <div>
                          <Label>Zoom ({pt.zoom}x)</Label>
                          <input
                            type="range"
                            min={1.5}
                            max={4}
                            step={0.1}
                            value={pt.zoom}
                            onChange={(e) => updatePoint(pt.id, { zoom: parseFloat(e.target.value) })}
                            className="w-full mt-1"
                          />
                        </div>
                      </div>
                      {/* Point image */}
                      <div>
                        <Label>Image (optional)</Label>
                        {pt.image_url ? (
                          <div className="relative mt-1">
                            <img src={pt.image_url} alt="" className="w-full h-20 object-cover border border-[hsl(var(--border))]" />
                            <button
                              onClick={() => updatePoint(pt.id, { image_url: undefined })}
                              className="absolute top-1 right-1 p-0.5 bg-[hsl(var(--error))] text-white"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1 mt-1">
                            <label className="flex-1 bg-[hsl(var(--background))] border border-dashed border-[hsl(var(--border))] p-2 hover:border-[hsl(var(--accent))] cursor-pointer transition-colors text-center">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handlePointImageUpload(e, pt.id)}
                                className="hidden"
                                disabled={uploadingPointImage === pt.id}
                              />
                              <span className="text-[10px] text-[hsl(var(--foreground-muted))]">
                                {uploadingPointImage === pt.id ? 'Uploading...' : 'Upload'}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setStockTarget({ type: 'point', pointId: pt.id });
                                setShowStockBrowser(true);
                              }}
                              className="flex-1 bg-[hsl(var(--accent-muted))] border border-[hsl(var(--accent))]/30 text-[hsl(var(--accent))] text-[10px] font-medium"
                            >
                              Stock
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deletePoint(pt.id)}
                        className="flex items-center gap-1 text-xs text-[hsl(var(--error))] hover:underline mt-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete point
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Image Browser */}
      <StockImageBrowser
        isOpen={showStockBrowser}
        onClose={() => {
          setShowStockBrowser(false);
          setStockTarget(null);
        }}
        onSelectImage={(imageUrl) => {
          if (!stockTarget) return;
          if (stockTarget.type === 'base') {
            setEditData({ ...editData, spotlight_image_url: imageUrl });
          } else {
            updatePoint(stockTarget.pointId, { image_url: imageUrl });
          }
        }}
        initialQuery={editData.title || 'landscape'}
      />
    </div>
  );
}

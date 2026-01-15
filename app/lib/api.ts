// API client for VSL Generator backend

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export interface Client {
  id: number;
  name: string;
  company: string;
  industry: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: number;
  client_id: number;
  title: string;
  composition_id: string;
  status: 'draft' | 'rendering' | 'completed' | 'error';
  duration_seconds: number | null;
  aspect_ratio: string | null;
  data: string | null;
  output_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: number;
  video_id: number;
  scene_number: number;
  name: string;
  start_frame: number;
  end_frame: number;
  data: string | null;
  cache_path: string | null;
  cache_hash: string | null;
  cached_at: string | null;
  created_at: string;
  updated_at: string;
}

// Client API
export const clientApi = {
  async getAll(): Promise<Client[]> {
    const res = await fetch(`${API_BASE}/api/clients`);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
  },

  async getById(id: number): Promise<Client> {
    const res = await fetch(`${API_BASE}/api/clients/${id}`);
    if (!res.ok) throw new Error('Failed to fetch client');
    return res.json();
  },

  async create(data: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const res = await fetch(`${API_BASE}/api/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create client');
    return res.json();
  },

  async update(id: number, data: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>): Promise<Client> {
    const res = await fetch(`${API_BASE}/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update client');
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/clients/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete client');
  },
};

// Video API
export const videoApi = {
  async getAll(clientId?: number): Promise<Video[]> {
    const url = clientId
      ? `${API_BASE}/api/videos?client_id=${clientId}`
      : `${API_BASE}/api/videos`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch videos');
    return res.json();
  },

  async getById(id: number): Promise<Video> {
    const res = await fetch(`${API_BASE}/api/videos/${id}`);
    if (!res.ok) throw new Error('Failed to fetch video');
    return res.json();
  },

  async create(data: Omit<Video, 'id' | 'created_at' | 'updated_at' | 'output_path'>): Promise<Video> {
    const res = await fetch(`${API_BASE}/api/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create video');
    return res.json();
  },

  async update(id: number, data: Partial<Omit<Video, 'id' | 'created_at' | 'updated_at'>>): Promise<Video> {
    const res = await fetch(`${API_BASE}/api/videos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update video');
    return res.json();
  },

  async delete(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/videos/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete video');
  },

  async renderScenes(id: number): Promise<Blob> {
    const res = await fetch(`${API_BASE}/api/videos/${id}/render-scenes`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to render video');
    return res.blob();
  },
};

// Scene API
export const sceneApi = {
  async getAllForVideo(videoId: number): Promise<Scene[]> {
    const res = await fetch(`${API_BASE}/api/videos/${videoId}/scenes`);
    if (!res.ok) throw new Error('Failed to fetch scenes');
    return res.json();
  },

  async create(videoId: number, data: Omit<Scene, 'id' | 'video_id' | 'created_at' | 'updated_at'>): Promise<Scene> {
    const res = await fetch(`${API_BASE}/api/videos/${videoId}/scenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create scene');
    return res.json();
  },
};

// API client for Rendomat backend

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4321';

export interface Client {
  id: number;
  name: string;
  company: string;
  industry?: string | null;
  default_personas?: string[] | null;
  default_behavior_overrides?: Record<string, string | string[]> | null;
  portfolio_url?: string | null;
  website_url?: string | null;
  cached_research?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: number;
  client_id: number;
  title: string;
  composition_id: string;
  status: 'draft' | 'rendering' | 'completed' | 'error';
  duration_seconds?: number | null;
  aspect_ratio?: string | null;
  data?: string | null;
  output_path?: string | null;
  render_progress?: string | null;
  theme_id?: string | null;
  personas?: string[] | null;
  behavior_overrides?: Record<string, string | string[]> | null;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: number;
  video_id: number;
  scene_number: number;
  name: string;
  scene_type: string;
  start_frame: number;
  end_frame: number;
  data: string | null;
  cache_path: string | null;
  cache_hash: string | null;
  cached_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transition {
  id: number;
  video_id: number;
  from_scene_number: number;
  to_scene_number: number;
  transition_type: string;
  duration_frames: number;
  config: string | null;
  cache_path: string | null;
  cache_hash: string | null;
  cached_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransitionType {
  id: string;
  label: string;
  category: string;
  description: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  duration_seconds: number;
  aspect_ratio: string;
  scene_count: number;
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

  async create(data: Omit<Video, 'id' | 'created_at' | 'updated_at' | 'output_path'> & { template_id?: string }): Promise<Video> {
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
    if (!res.ok) {
      let errorMessage = 'Failed to render video';
      try {
        const errorData = await res.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // If response isn't JSON, use status text
        errorMessage = `Failed to render video: ${res.statusText}`;
      }
      throw new Error(errorMessage);
    }
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

  async update(sceneId: number, data: Partial<Omit<Scene, 'id' | 'video_id' | 'created_at' | 'updated_at'>>): Promise<Scene> {
    const res = await fetch(`${API_BASE}/api/scenes/${sceneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update scene');
    return res.json();
  },

  async render(sceneId: number, forceRender = false): Promise<{
    success: boolean;
    cached: boolean;
    scene_id: number;
    cache_path: string;
    preview_url: string;
  }> {
    const res = await fetch(`${API_BASE}/api/scenes/${sceneId}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceRender }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to render scene');
    }
    return res.json();
  },

  getPreviewUrl(sceneId: number): string {
    return `${API_BASE}/api/scenes/${sceneId}/preview`;
  },

  async clearCache(sceneId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/scenes/${sceneId}/cache`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to clear scene cache');
  },
};

// Transition API
export const transitionApi = {
  async getAllForVideo(videoId: number): Promise<Transition[]> {
    const res = await fetch(`${API_BASE}/api/videos/${videoId}/transitions`);
    if (!res.ok) throw new Error('Failed to fetch transitions');
    return res.json();
  },

  async getTypes(): Promise<TransitionType[]> {
    const res = await fetch(`${API_BASE}/api/transitions/types`);
    if (!res.ok) throw new Error('Failed to fetch transition types');
    const data = await res.json();
    return data.types;
  },

  async create(
    videoId: number,
    data: {
      from_scene_number: number;
      to_scene_number: number;
      transition_type?: string;
      duration_frames?: number;
      config?: Record<string, any>;
    }
  ): Promise<Transition> {
    const res = await fetch(`${API_BASE}/api/videos/${videoId}/transitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create transition');
    return res.json();
  },

  async update(
    transitionId: number,
    data: {
      transition_type?: string;
      duration_frames?: number;
      config?: Record<string, any>;
    }
  ): Promise<Transition> {
    const res = await fetch(`${API_BASE}/api/transitions/${transitionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update transition');
    return res.json();
  },

  async delete(transitionId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/transitions/${transitionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete transition');
  },

  async createDefaults(videoId: number, transitionType?: string): Promise<Transition[]> {
    const res = await fetch(`${API_BASE}/api/videos/${videoId}/transitions/defaults`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transition_type: transitionType }),
    });
    if (!res.ok) throw new Error('Failed to create default transitions');
    return res.json();
  },

  async render(transitionId: number, forceRender = false): Promise<{
    success: boolean;
    cached: boolean;
    transition_id: number;
    cache_path: string;
    preview_url: string;
  }> {
    const res = await fetch(`${API_BASE}/api/transitions/${transitionId}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceRender }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to render transition');
    }
    return res.json();
  },

  getPreviewUrl(transitionId: number): string {
    return `${API_BASE}/api/transitions/${transitionId}/preview`;
  },
};

// Template API
export const templateApi = {
  async getAll(): Promise<Template[]> {
    const res = await fetch(`${API_BASE}/api/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
  },

  async getById(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/templates/${id}`);
    if (!res.ok) throw new Error('Failed to fetch template');
    return res.json();
  },
};

// Platform/Multi-Export API
export interface PlatformExportResult {
  success: boolean;
  outputs: Record<string, {
    platform: string;
    aspectRatio: string;
    downloadUrl: string;
  }>;
}

export const platformApi = {
  async getAll(): Promise<{ platforms: Record<string, any>; aspectRatios: Record<string, any> }> {
    const res = await fetch(`${API_BASE}/api/platforms`);
    if (!res.ok) throw new Error('Failed to fetch platforms');
    return res.json();
  },

  async renderMultiPlatform(videoId: number, platforms: string[]): Promise<PlatformExportResult> {
    const res = await fetch(`${API_BASE}/api/videos/${videoId}/render-multi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platforms }),
    });
    if (!res.ok) throw new Error('Failed to render for platforms');
    return res.json();
  },

  async downloadExport(videoId: number, platformId: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/api/videos/${videoId}/download/${platformId}`);
    if (!res.ok) throw new Error('Failed to download export');
    return res.blob();
  },
};

// Persona Types
export interface PersonaBehaviorOption {
  id: string;
  label: string;
  prompt: string;
}

export interface PersonaBehavior {
  label: string;
  default: string | string[];
  multi?: boolean;
  options: PersonaBehaviorOption[];
}

export interface Persona {
  id: string;
  name: string;
  category: 'content-type' | 'platform';
  description: string;
  expertise: string;
  behaviors: Record<string, PersonaBehavior>;
  scenePreferences: Record<string, number>;
}

export interface PersonasResponse {
  personas: Persona[];
  grouped: Record<string, Persona[]>;
}

export interface PersonaPreview {
  prompt: string;
  metadata: {
    personaCount: number;
    personas: { id: string; name: string }[];
    behaviorCount: number;
    behaviors: Record<string, any>;
    scenePreferences: Record<string, number>;
  };
}

export interface EffectivePersonas {
  personaIds: string[];
  behaviorOverrides: Record<string, string | string[]>;
  source: 'video' | 'client' | 'default';
  preview: PersonaPreview;
}

// Persona API
export const personaApi = {
  async getAll(): Promise<PersonasResponse> {
    const res = await fetch(`${API_BASE}/api/personas`);
    if (!res.ok) throw new Error('Failed to fetch personas');
    return res.json();
  },

  async getById(id: string): Promise<Persona> {
    const res = await fetch(`${API_BASE}/api/personas/${id}`);
    if (!res.ok) throw new Error('Failed to fetch persona');
    return res.json();
  },

  async previewBlend(
    personas: string[],
    behaviorOverrides: Record<string, string | string[]> = {}
  ): Promise<PersonaPreview> {
    const res = await fetch(`${API_BASE}/api/personas/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personas, behaviorOverrides }),
    });
    if (!res.ok) throw new Error('Failed to preview blend');
    return res.json();
  },

  async getEffectiveForVideo(videoId: number): Promise<EffectivePersonas> {
    const res = await fetch(`${API_BASE}/api/videos/${videoId}/effective-personas`);
    if (!res.ok) throw new Error('Failed to get effective personas');
    return res.json();
  },
};

// AI Generation with Personas
export const aiApi = {
  async generateSlides(
    description: string,
    options: {
      templateId?: string;
      sceneCount?: number;
      companyDetails?: Record<string, string>;
      personas?: string[];
      behaviorOverrides?: Record<string, string | string[]>;
    } = {}
  ): Promise<{ slides: any[] }> {
    const res = await fetch(`${API_BASE}/api/ai/generate-slides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        ...options,
      }),
    });
    if (!res.ok) throw new Error('Failed to generate slides');
    return res.json();
  },

  async generateSlidesWithResearch(
    description: string,
    options: {
      researchTopic?: string;
      portfolioUrl?: string;
      websiteUrl?: string;
      companyDetails?: Record<string, string>;
      personas?: string[];
      behaviorOverrides?: Record<string, string | string[]>;
      sceneCount?: number;
      searchWeb?: boolean;
    } = {}
  ): Promise<ResearchGenerationResult> {
    const res = await fetch(`${API_BASE}/api/ai/generate-slides-with-research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description,
        ...options,
      }),
    });
    if (!res.ok) throw new Error('Failed to generate slides with research');
    return res.json();
  },
};

// Research Types
export interface Citation {
  source_url: string;
  source_title: string;
  exact_quote: string;
  summary: string;
  confidence_score: number;
  retrieved_at: string;
  used_in_scenes?: number[];
  how_used?: string;
}

export interface CaseStudy {
  title: string;
  client_name: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string[];
  source_url: string;
  relevance_score: number;
}

export interface KeyFact {
  fact: string;
  supporting_citation_index: number;
  confidence_score: number;
}

export interface ResearchResult {
  citations: Citation[];
  case_studies: CaseStudy[];
  key_facts: KeyFact[];
  search_queries_used: string[];
  summary: string;
}

export interface ResearchGenerationResult {
  slides: any[];
  research: {
    citations_used: Citation[];
    case_studies_used: CaseStudy[];
    summary: string;
    all_citations: Citation[];
    all_case_studies: CaseStudy[];
    search_queries: string[];
  };
}

export interface ClaimVerification {
  verified: boolean;
  confidence: number;
  supporting_quote?: string;
  source_url?: string;
  explanation?: string;
  error?: string;
}

// Research API
export const researchApi = {
  async performResearch(
    topic: string,
    options: {
      portfolioUrl?: string;
      websiteUrl?: string;
      companyName?: string;
      industry?: string;
      searchWeb?: boolean;
    } = {}
  ): Promise<ResearchResult> {
    const res = await fetch(`${API_BASE}/api/research/perform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, ...options }),
    });
    if (!res.ok) throw new Error('Failed to perform research');
    return res.json();
  },

  async extractPortfolio(
    portfolioUrl: string,
    options: {
      companyName?: string;
      industry?: string;
    } = {}
  ): Promise<{ case_studies: CaseStudy[]; summary: string }> {
    const res = await fetch(`${API_BASE}/api/research/extract-portfolio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portfolioUrl, ...options }),
    });
    if (!res.ok) throw new Error('Failed to extract portfolio');
    return res.json();
  },

  async verifyClaim(
    claim: string,
    sourceUrls: string[]
  ): Promise<ClaimVerification> {
    const res = await fetch(`${API_BASE}/api/research/verify-claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim, sourceUrls }),
    });
    if (!res.ok) throw new Error('Failed to verify claim');
    return res.json();
  },
};

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Video as VideoIcon, Plus, Play, Clock, CheckCircle, AlertCircle, Loader2, Trash2, Home, Sparkles, Wand2, Settings, Search, Globe, FileText, Quote, ExternalLink, BookOpen } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { clientApi, videoApi, templateApi, aiApi, Client, Video, Template, Citation, CaseStudy, ResearchGenerationResult } from "@/lib/api";
import { THEMES } from "@/lib/themes";
import PersonaSelector from "@/components/PersonaSelector";

// Aspect ratio options with platform info
const ASPECT_RATIO_OPTIONS = [
  { value: "16:9", label: "Landscape 16:9", platforms: "YouTube, Website, LinkedIn Video" },
  { value: "1:1", label: "Square 1:1", platforms: "Instagram Feed, LinkedIn Feed" },
  { value: "9:16", label: "Vertical 9:16", platforms: "TikTok, Instagram Reels, YouTube Shorts" },
];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = parseInt(params.id as string);

  const [client, setClient] = useState<Client | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    template_id: "", // Empty = no template (AI decides)
    composition_id: "DynamicScene",
    aspect_ratio: "16:9",
    duration_seconds: 60, // Default duration when no template
    theme_id: "tech-dark", // Default theme
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(["vsl-expert"]);
  const [behaviorOverrides, setBehaviorOverrides] = useState<Record<string, string | string[]>>({});
  const [showClientSettings, setShowClientSettings] = useState(false);
  const [companyDetails, setCompanyDetails] = useState({
    companyName: "",
    industry: "",
    targetAudience: "",
    painPoints: "",
    valueProposition: "",
    metrics: "",
    cta: ""
  });

  // Research mode state
  const [researchMode, setResearchMode] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [enableWebSearch, setEnableWebSearch] = useState(true);
  const [researchResults, setResearchResults] = useState<ResearchGenerationResult['research'] | null>(null);
  const [showResearchResults, setShowResearchResults] = useState(false);

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    try {
      const [clientData, videosData, templatesData] = await Promise.all([
        clientApi.getById(clientId),
        videoApi.getAll(clientId),
        templateApi.getAll(),
      ]);
      setClient(clientData);
      setVideos(videosData);
      setTemplates(templatesData);

      // Initialize personas from client defaults if they exist
      if (clientData.default_personas && clientData.default_personas.length > 0) {
        // Parse if it's a string (from DB)
        const personas = typeof clientData.default_personas === 'string'
          ? JSON.parse(clientData.default_personas)
          : clientData.default_personas;
        setSelectedPersonas(personas);
      }
      if (clientData.default_behavior_overrides) {
        const overrides = typeof clientData.default_behavior_overrides === 'string'
          ? JSON.parse(clientData.default_behavior_overrides)
          : clientData.default_behavior_overrides;
        setBehaviorOverrides(overrides);
      }

      // Initialize portfolio/website URLs from client if they exist
      if (clientData.portfolio_url) {
        setPortfolioUrl(clientData.portfolio_url);
      }
      if (clientData.website_url) {
        setWebsiteUrl(clientData.website_url);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleTemplateChange(templateId: string) {
    if (!templateId) {
      // No template selected - use defaults
      setFormData({
        ...formData,
        template_id: "",
        composition_id: "DynamicScene",
        aspect_ratio: "16:9",
        duration_seconds: 60,
      });
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        template_id: templateId,
        composition_id: template.id,
        aspect_ratio: template.aspect_ratio,
        duration_seconds: template.duration_seconds,
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await videoApi.create({
        client_id: clientId,
        ...formData,
        status: "draft",
        data: null,
      });
      setFormData({
        title: "",
        template_id: "ultrahuman-vsl",
        composition_id: "UltrahumanVSL",
        aspect_ratio: "16:9",
        duration_seconds: 345,
        theme_id: "tech-dark",
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error("Failed to create video:", error);
      alert("Failed to create video");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateWithAI() {
    if (!aiDescription.trim()) {
      alert("Please enter a description");
      return;
    }

    setGeneratingAI(true);
    setResearchResults(null);

    try {
      let slides: any[];
      let research: ResearchGenerationResult['research'] | null = null;

      if (researchMode) {
        // Use research mode with citations
        const result = await aiApi.generateSlidesWithResearch(aiDescription, {
          researchTopic: aiDescription,
          portfolioUrl: portfolioUrl || undefined,
          websiteUrl: websiteUrl || undefined,
          companyDetails: advancedMode ? companyDetails : undefined,
          personas: selectedPersonas,
          behaviorOverrides: behaviorOverrides,
          searchWeb: enableWebSearch,
        });

        slides = result.slides;
        research = result.research;
        setResearchResults(research);

        // Save portfolio/website URLs to client if provided
        if (portfolioUrl || websiteUrl) {
          await clientApi.update(clientId, {
            portfolio_url: portfolioUrl || undefined,
            website_url: websiteUrl || undefined,
          });
        }
      } else {
        // Standard mode without research
        const response = await fetch('http://localhost:8787/api/ai/generate-slides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: aiDescription,
            templateId: formData.template_id || null,
            sceneCount: null,
            companyDetails: advancedMode ? companyDetails : null,
            personas: selectedPersonas,
            behaviorOverrides: behaviorOverrides
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate slides');
        }

        const result = await response.json();
        slides = result.slides;
      }

      // Calculate total duration based on AI-generated scenes
      const totalDuration = slides.length * 15;

      // Create video with AI-generated scenes
      const videoResponse = await videoApi.create({
        client_id: clientId,
        title: formData.title || `${researchMode ? 'Research-Based' : 'AI Generated'} - ${new Date().toLocaleDateString()}`,
        template_id: formData.template_id || undefined,
        composition_id: "DynamicScene",
        aspect_ratio: formData.aspect_ratio,
        duration_seconds: totalDuration,
        status: "draft",
        data: research ? JSON.stringify({ research }) : null,
        theme_id: formData.theme_id,
        personas: selectedPersonas,
        behavior_overrides: behaviorOverrides,
      });

      // Create the AI-generated scenes for the new video
      const videoId = videoResponse.id;
      for (const slide of slides) {
        await fetch(`http://localhost:8787/api/videos/${videoId}/scenes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene_number: slide.scene_number,
            name: slide.name,
            scene_type: slide.scene_type || 'text-only',
            start_frame: slide.scene_number * 450,
            end_frame: (slide.scene_number + 1) * 450,
            data: slide.data
          })
        });
      }

      if (research && (research.citations_used.length > 0 || research.case_studies_used.length > 0)) {
        setShowResearchResults(true);
        alert(`Video created with ${slides.length} slides! Found ${research.all_citations.length} citations and ${research.all_case_studies.length} case studies.`);
      } else {
        setShowAIModal(false);
        setAiDescription("");
        setShowForm(false);
        loadData();
        alert('Video created with AI-generated slides!');
      }
    } catch (error) {
      console.error('Failed to generate with AI:', error);
      alert('Failed to generate slides with AI');
    } finally {
      setGeneratingAI(false);
    }
  }

  async function handleDeleteClient() {
    if (!client) return;

    if (!confirm(`Are you sure you want to delete ${client.company}? This will also delete all their videos and cannot be undone.`)) {
      return;
    }

    try {
      await clientApi.delete(clientId);
      router.push('/clients');
    } catch (error) {
      console.error("Failed to delete client:", error);
      alert("Failed to delete client");
    }
  }

  async function handleDeleteVideo(videoId: number, videoTitle: string) {
    if (!confirm(`Are you sure you want to delete "${videoTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      await videoApi.delete(videoId);
      loadData();
    } catch (error) {
      console.error("Failed to delete video:", error);
      alert("Failed to delete video");
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "rendering":
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rendering":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Client not found</h1>
          <Link href="/clients">
            <button className="text-purple-400 hover:text-purple-300">Go back to clients</button>
          </Link>
        </div>
      </div>
    );
  }

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
          <Link href="/clients">
            <button className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Clients
            </button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{client.company}</h1>
              <p className="text-purple-200">{client.name}</p>
              {client.industry && (
                <p className="text-purple-300 text-sm mt-1">{client.industry}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteClient}
                className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Delete Client
              </button>
              <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                AI Generate
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Video
              </button>
            </div>
          </div>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20 mb-8"
          >
            <h2 className="text-xl font-bold text-white mb-4">Create New Video</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                  placeholder="Product Launch VSL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Template *
                </label>
                <select
                  value={formData.template_id}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 [&>option]:text-gray-900 [&>option]:bg-white"
                >
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.scene_count} scenes, {template.duration_seconds}s, {template.aspect_ratio}
                    </option>
                  ))}
                </select>
                <p className="text-purple-300 text-xs mt-1">
                  {templates.find(t => t.id === formData.template_id)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Theme *
                </label>
                <select
                  value={formData.theme_id}
                  onChange={(e) => setFormData({ ...formData, theme_id: e.target.value })}
                  className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 [&>option]:text-gray-900 [&>option]:bg-white"
                >
                  {Object.values(THEMES).map(theme => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
                <p className="text-purple-300 text-xs mt-1">
                  {THEMES[formData.theme_id]?.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={formData.aspect_ratio}
                    onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
                    className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 [&>option]:text-gray-900 [&>option]:bg-white"
                  >
                    {ASPECT_RATIO_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-purple-300 text-xs mt-1">
                    {ASPECT_RATIO_OPTIONS.find(o => o.value === formData.aspect_ratio)?.platforms}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Duration (seconds) <span className="text-purple-400 text-xs">(from template)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration_seconds}
                    disabled
                    className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-300 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Create Video
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-200 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {showAIModal && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 backdrop-blur-lg rounded-lg p-6 border border-purple-500/30 mb-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <Wand2 className="w-6 h-6 text-purple-300" />
              <h2 className="text-xl font-bold text-white">AI Video Generator</h2>
            </div>
            <p className="text-purple-200 text-sm mb-4">
              Describe your video and AI will generate professional slides for you. Include details about your product, target audience, key benefits, and call-to-action.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Video Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                  placeholder="My Amazing Product Launch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Template <span className="text-purple-400 text-xs font-normal">(optional - AI will decide if not selected)</span>
                </label>
                <select
                  value={formData.template_id}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">None (AI decides structure)</option>
                  <optgroup label="Available Templates">
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.scene_count} scenes, {template.duration_seconds}s
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Theme *
                  </label>
                  <select
                    value={formData.theme_id}
                    onChange={(e) => setFormData({ ...formData, theme_id: e.target.value })}
                    className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 [&>option]:text-gray-900 [&>option]:bg-white"
                  >
                    {Object.values(THEMES).map(theme => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-purple-300 text-xs mt-1">
                    {THEMES[formData.theme_id]?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={formData.aspect_ratio}
                    onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
                    className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 [&>option]:text-gray-900 [&>option]:bg-white"
                  >
                    {ASPECT_RATIO_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-purple-300 text-xs mt-1">
                    {ASPECT_RATIO_OPTIONS.find(o => o.value === formData.aspect_ratio)?.platforms}
                  </p>
                </div>
              </div>

              {/* AI Personas Section */}
              <div className="pt-3 border-t border-purple-500/20">
                <PersonaSelector
                  selectedPersonas={selectedPersonas}
                  behaviorOverrides={behaviorOverrides}
                  onChange={(personas, overrides) => {
                    setSelectedPersonas(personas);
                    setBehaviorOverrides(overrides);
                  }}
                />
              </div>

              {/* Research Mode Toggle */}
              <div className="flex items-center gap-3 pt-3 border-t border-purple-500/20">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={researchMode}
                    onChange={(e) => setResearchMode(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-500/30 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                  />
                  <Search className="w-4 h-4 text-purple-300" />
                  <span className="text-sm font-medium text-purple-200">
                    Research Mode
                  </span>
                </label>
                <span className="text-xs text-purple-400">
                  (Find sources, cite facts, extract case studies)
                </span>
              </div>

              {/* Research Mode Fields */}
              {researchMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-blue-300" />
                    <span className="text-sm font-medium text-blue-200">Research Sources</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-blue-200 mb-1">
                      <Globe className="w-3 h-3 inline mr-1" />
                      Portfolio/Case Studies URL
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full bg-white/5 border border-blue-500/30 rounded px-3 py-2 text-sm text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-500"
                      placeholder="https://company.com/case-studies"
                    />
                    <p className="text-blue-400 text-xs mt-1">AI will extract case studies and success stories</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-blue-200 mb-1">
                      <Globe className="w-3 h-3 inline mr-1" />
                      Company Website URL
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full bg-white/5 border border-blue-500/30 rounded px-3 py-2 text-sm text-white placeholder-blue-300/50 focus:outline-none focus:border-blue-500"
                      placeholder="https://company.com"
                    />
                    <p className="text-blue-400 text-xs mt-1">AI will analyze for product info and value propositions</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableWebSearch}
                        onChange={(e) => setEnableWebSearch(e.target.checked)}
                        className="w-4 h-4 rounded border-blue-500/30 bg-white/10 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <Search className="w-3 h-3 text-blue-300" />
                      <span className="text-xs font-medium text-blue-200">
                        Enable Web Search
                      </span>
                    </label>
                    <span className="text-xs text-blue-400">
                      (Search for additional facts and statistics)
                    </span>
                  </div>

                  <div className="bg-blue-950/50 p-3 rounded text-xs text-blue-200">
                    <strong>Research Mode will:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-blue-300">
                      <li>Extract case studies from your portfolio</li>
                      <li>Find relevant statistics and facts</li>
                      <li>Include exact quotes with source citations</li>
                      <li>Show confidence scores for each claim</li>
                      <li>Link to original sources</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Describe Your Video *
                </label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  className="w-full bg-white/10 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                  rows={6}
                  placeholder="Example: A VSL for a SaaS tool that helps marketing teams automate their social media posting. Target audience is marketing managers at mid-size companies. Key benefits include saving 10+ hours per week, increasing engagement by 40%, and seamless integration with existing tools. CTA is to start a 14-day free trial."
                />
              </div>

              {/* Advanced Mode Toggle */}
              <div className="flex items-center gap-3 pt-2 border-t border-purple-500/20">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={advancedMode}
                    onChange={(e) => setAdvancedMode(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-500/30 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                  />
                  <span className="text-sm font-medium text-purple-200">
                    Advanced Mode
                  </span>
                </label>
                <span className="text-xs text-purple-400">
                  (Add company-specific details for highly personalized VSL)
                </span>
              </div>

              {/* Advanced Mode Fields */}
              {advancedMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-2 border-t border-purple-500/20"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyDetails.companyName}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, companyName: e.target.value })}
                        className="w-full bg-white/5 border border-purple-500/20 rounded px-3 py-2 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                        placeholder="Acme Corp"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-purple-200 mb-1">
                        Industry
                      </label>
                      <input
                        type="text"
                        value={companyDetails.industry}
                        onChange={(e) => setCompanyDetails({ ...companyDetails, industry: e.target.value })}
                        className="w-full bg-white/5 border border-purple-500/20 rounded px-3 py-2 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                        placeholder="SaaS, Healthcare, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Target Audience (be specific)
                    </label>
                    <input
                      type="text"
                      value={companyDetails.targetAudience}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, targetAudience: e.target.value })}
                      className="w-full bg-white/5 border border-purple-500/20 rounded px-3 py-2 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                      placeholder="Marketing directors at mid-market B2B companies with 50-500 employees"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Key Pain Points (what problems do they face?)
                    </label>
                    <textarea
                      value={companyDetails.painPoints}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, painPoints: e.target.value })}
                      className="w-full bg-white/5 border border-purple-500/20 rounded px-3 py-2 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                      rows={2}
                      placeholder="Wasting 15+ hours/week on manual data entry, missing revenue opportunities due to delayed insights, struggling to prove ROI to executives"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Unique Value Proposition
                    </label>
                    <textarea
                      value={companyDetails.valueProposition}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, valueProposition: e.target.value })}
                      className="w-full bg-white/5 border border-purple-500/20 rounded px-3 py-2 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                      rows={2}
                      placeholder="Only platform with real-time predictive analytics + automated workflows + executive dashboards in one place"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Key Metrics / Proof Points
                    </label>
                    <input
                      type="text"
                      value={companyDetails.metrics}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, metrics: e.target.value })}
                      className="w-full bg-white/5 border border-purple-500/20 rounded px-3 py-2 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                      placeholder="500+ enterprise customers, 40% time savings on average, 94% customer satisfaction"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-purple-200 mb-1">
                      Call-to-Action (what should they do?)
                    </label>
                    <input
                      type="text"
                      value={companyDetails.cta}
                      onChange={(e) => setCompanyDetails({ ...companyDetails, cta: e.target.value })}
                      className="w-full bg-white/5 border border-purple-500/20 rounded px-3 py-2 text-sm text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                      placeholder="Book a personalized demo, Start 14-day trial, Download whitepaper"
                    />
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleGenerateWithAI}
                  disabled={generatingAI || !aiDescription.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg font-semibold"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Video with AI
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAIModal(false);
                    setAiDescription("");
                    setResearchResults(null);
                    setShowResearchResults(false);
                  }}
                  disabled={generatingAI}
                  className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-200 hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Research Results Display */}
        {showResearchResults && researchResults && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-900/90 to-indigo-900/90 backdrop-blur-lg rounded-lg p-6 border border-blue-500/30 mb-8 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-300" />
                <h2 className="text-xl font-bold text-white">Research Results</h2>
              </div>
              <button
                onClick={() => {
                  setShowResearchResults(false);
                  setResearchResults(null);
                  setShowAIModal(false);
                  setAiDescription("");
                  loadData();
                }}
                className="text-blue-300 hover:text-blue-200 text-sm"
              >
                Close & View Video
              </button>
            </div>

            {researchResults.summary && (
              <p className="text-blue-200 text-sm mb-4 bg-blue-950/50 p-3 rounded">
                {researchResults.summary}
              </p>
            )}

            {/* Citations Used */}
            {researchResults.citations_used.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Quote className="w-5 h-5 text-blue-300" />
                  Citations Used ({researchResults.citations_used.length})
                </h3>
                <div className="space-y-3">
                  {researchResults.citations_used.map((citation, index) => (
                    <div
                      key={index}
                      className="bg-blue-950/50 border border-blue-500/20 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-500/30 text-blue-200">
                              Confidence: {citation.confidence_score}%
                            </span>
                            <a
                              href={citation.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-300 hover:text-blue-200 text-xs flex items-center gap-1"
                            >
                              {citation.source_title}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <blockquote className="text-white text-sm italic border-l-2 border-blue-400 pl-3 mb-2">
                            &quot;{citation.exact_quote}&quot;
                          </blockquote>
                          <p className="text-blue-300 text-xs">
                            {citation.summary}
                          </p>
                          {citation.used_in_scenes && citation.used_in_scenes.length > 0 && (
                            <p className="text-blue-400 text-xs mt-1">
                              Used in scene{citation.used_in_scenes.length > 1 ? 's' : ''}: {citation.used_in_scenes.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Case Studies */}
            {researchResults.case_studies_used.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-300" />
                  Case Studies Found ({researchResults.case_studies_used.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {researchResults.case_studies_used.map((caseStudy, index) => (
                    <div
                      key={index}
                      className="bg-green-950/30 border border-green-500/20 rounded-lg p-4"
                    >
                      <h4 className="text-white font-medium mb-1">{caseStudy.title}</h4>
                      <p className="text-green-200 text-xs mb-2">
                        {caseStudy.client_name} • {caseStudy.industry}
                      </p>
                      <div className="text-green-300 text-xs space-y-1">
                        <p><strong>Challenge:</strong> {caseStudy.challenge}</p>
                        <p><strong>Solution:</strong> {caseStudy.solution}</p>
                        {caseStudy.results.length > 0 && (
                          <p><strong>Results:</strong> {caseStudy.results.join(', ')}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/30 text-green-200">
                          Relevance: {caseStudy.relevance_score}%
                        </span>
                        <a
                          href={caseStudy.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-300 hover:text-green-200 text-xs flex items-center gap-1"
                        >
                          Source <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Citations (collapsed) */}
            {researchResults.all_citations.length > researchResults.citations_used.length && (
              <details className="mt-4">
                <summary className="text-blue-300 text-sm cursor-pointer hover:text-blue-200">
                  Show all {researchResults.all_citations.length} citations found
                </summary>
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                  {researchResults.all_citations.map((citation, index) => (
                    <div key={index} className="bg-blue-950/30 p-3 rounded text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-200">
                          {citation.confidence_score}%
                        </span>
                        <a
                          href={citation.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 truncate"
                        >
                          {citation.source_title}
                        </a>
                      </div>
                      <p className="text-blue-200 italic">&quot;{citation.exact_quote.substring(0, 150)}...&quot;</p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Search Queries Used */}
            {researchResults.search_queries && researchResults.search_queries.length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-500/20">
                <p className="text-blue-400 text-xs">
                  <strong>Search queries used:</strong> {researchResults.search_queries.join(' • ')}
                </p>
              </div>
            )}
          </motion.div>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">Videos</h2>
          {videos.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-12 border border-purple-500/20 text-center">
              <VideoIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
              <p className="text-purple-200 mb-4">Create your first video for this client</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Video
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {videos.map((video, idx) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all group relative"
                >
                  <Link href={`/videos/${video.id}`}>
                    <div className="cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{video.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-purple-300">
                            <span>{video.aspect_ratio}</span>
                            <span>•</span>
                            <span>{video.duration_seconds}s</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(video.status)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(video.status)}`}>
                          {video.status}
                        </span>
                        <Play className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteVideo(video.id, video.title);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

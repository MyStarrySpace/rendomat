"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Video as VideoIcon, Plus, Play, Clock, CheckCircle, AlertCircle, Loader2, Trash2, Sparkles, Wand2, Search, Globe, FileText, Quote, ExternalLink, BookOpen, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { clientApi, videoApi, templateApi, aiApi, Client, Video, Template, ResearchGenerationResult } from "@/lib/api";
import { THEMES } from "@/lib/themes";
import PersonaSelector from "@/components/PersonaSelector";
import { Button } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
    template_id: "",
    composition_id: "DynamicScene",
    aspect_ratio: "16:9",
    duration_seconds: 60,
    theme_id: "tech-dark",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(["vsl-expert"]);
  const [behaviorOverrides, setBehaviorOverrides] = useState<Record<string, string | string[]>>({});
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

      if (clientData.default_personas && clientData.default_personas.length > 0) {
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

        if (portfolioUrl || websiteUrl) {
          await clientApi.update(clientId, {
            portfolio_url: portfolioUrl || undefined,
            website_url: websiteUrl || undefined,
          });
        }
      } else {
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

      const totalDuration = slides.length * 15;

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

  function getStatusBadge(status: string) {
    switch (status) {
      case "completed":
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case "rendering":
        return <Badge variant="default"><Loader2 className="w-3 h-3 mr-1 animate-spin" />{status}</Badge>;
      case "error":
        return <Badge variant="error"><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[hsl(var(--foreground-muted))] animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <h1 className="headline text-2xl text-[hsl(var(--foreground))] mb-4">Client not found</h1>
          <Link href="/clients" className="link-subtle">
            Go back to clients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/clients"
            className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to projects
          </Link>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAIModal(true)}
              icon={<Sparkles className="w-4 h-4" />}
            >
              AI Generate
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(!showForm)} icon={<Plus className="w-4 h-4" />}>
              New Video
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <p className="caption mb-4">{client.industry || "Project"}</p>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="headline text-4xl md:text-5xl text-[hsl(var(--foreground))] mb-2">
                  {client.company}
                </h1>
                {client.name && (
                  <p className="text-lg text-[hsl(var(--foreground-muted))]">{client.name}</p>
                )}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteClient}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Create Video Form */}
          {showForm && (
            <Card variant="bordered" className="mb-12 animate-fade-in">
              <CardHeader>
                <CardTitle>Create new video</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="video-title">Video title *</Label>
                    <Input
                      id="video-title"
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Product Launch Video"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="template">Template</Label>
                      <select
                        id="template"
                        value={formData.template_id}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] px-4 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
                      >
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name} - {template.scene_count} scenes, {template.duration_seconds}s
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">
                        {templates.find(t => t.id === formData.template_id)?.description}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <select
                        id="theme"
                        value={formData.theme_id}
                        onChange={(e) => setFormData({ ...formData, theme_id: e.target.value })}
                        className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] px-4 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
                      >
                        {Object.values(THEMES).map(theme => (
                          <option key={theme.id} value={theme.id}>
                            {theme.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="aspect-ratio">Aspect ratio</Label>
                      <select
                        id="aspect-ratio"
                        value={formData.aspect_ratio}
                        onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
                        className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] px-4 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
                      >
                        {ASPECT_RATIO_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">
                        {ASPECT_RATIO_OPTIONS.find(o => o.value === formData.aspect_ratio)?.platforms}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration (seconds)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration_seconds}
                        disabled
                        className="opacity-60"
                      />
                      <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">Set by template</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" loading={submitting} icon={<Plus className="w-4 h-4" />}>
                      Create video
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* AI Generator Modal */}
          {showAIModal && (
            <Card variant="bordered" className="mb-12 animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wand2 className="w-5 h-5 text-[hsl(var(--accent))]" />
                    <CardTitle>AI Video Generator</CardTitle>
                  </div>
                  <button
                    onClick={() => {
                      setShowAIModal(false);
                      setAiDescription("");
                      setResearchResults(null);
                      setShowResearchResults(false);
                    }}
                    className="p-1 hover:bg-[hsl(var(--surface))] transition-colors"
                  >
                    <X className="w-5 h-5 text-[hsl(var(--foreground-muted))]" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[hsl(var(--foreground-muted))] mb-6">
                  Describe your video and AI will generate professional slides. Include details about your product, target audience, key benefits, and call-to-action.
                </p>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="ai-title">Video title</Label>
                    <Input
                      id="ai-title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="My Amazing Product Launch"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ai-template">Template (optional)</Label>
                    <select
                      id="ai-template"
                      value={formData.template_id}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] px-4 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
                    >
                      <option value="">None (AI decides structure)</option>
                      <optgroup label="Available Templates">
                        {templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name} - {template.scene_count} scenes
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="ai-theme">Theme</Label>
                      <select
                        id="ai-theme"
                        value={formData.theme_id}
                        onChange={(e) => setFormData({ ...formData, theme_id: e.target.value })}
                        className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] px-4 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
                      >
                        {Object.values(THEMES).map(theme => (
                          <option key={theme.id} value={theme.id}>
                            {theme.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="ai-aspect">Aspect ratio</Label>
                      <select
                        id="ai-aspect"
                        value={formData.aspect_ratio}
                        onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
                        className="w-full bg-[hsl(var(--surface))] border border-[hsl(var(--border))] px-4 py-2 text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
                      >
                        {ASPECT_RATIO_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* AI Personas */}
                  <div className="pt-4 border-t border-[hsl(var(--border))]">
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
                  <div className="flex items-center gap-3 pt-4 border-t border-[hsl(var(--border))]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={researchMode}
                        onChange={(e) => setResearchMode(e.target.checked)}
                        className="w-4 h-4 border-[hsl(var(--border))] bg-[hsl(var(--surface))] accent-[hsl(var(--accent))]"
                      />
                      <Search className="w-4 h-4 text-[hsl(var(--foreground-muted))]" />
                      <span className="text-sm text-[hsl(var(--foreground))]">Research Mode</span>
                    </label>
                    <span className="text-xs text-[hsl(var(--foreground-subtle))]">
                      (Find sources, cite facts, extract case studies)
                    </span>
                  </div>

                  {/* Research Mode Fields */}
                  {researchMode && (
                    <div className="space-y-4 p-4 bg-[hsl(var(--surface))] border border-[hsl(var(--border))]">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-[hsl(var(--accent))]" />
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">Research Sources</span>
                      </div>

                      <div>
                        <Label htmlFor="portfolio-url">
                          <Globe className="w-3 h-3 inline mr-1" />
                          Portfolio/Case Studies URL
                        </Label>
                        <Input
                          id="portfolio-url"
                          type="url"
                          value={portfolioUrl}
                          onChange={(e) => setPortfolioUrl(e.target.value)}
                          placeholder="https://company.com/case-studies"
                        />
                        <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">AI will extract case studies and success stories</p>
                      </div>

                      <div>
                        <Label htmlFor="website-url">
                          <Globe className="w-3 h-3 inline mr-1" />
                          Company Website URL
                        </Label>
                        <Input
                          id="website-url"
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://company.com"
                        />
                        <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">AI will analyze for product info and value propositions</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enableWebSearch}
                            onChange={(e) => setEnableWebSearch(e.target.checked)}
                            className="w-4 h-4 border-[hsl(var(--border))] bg-[hsl(var(--surface))] accent-[hsl(var(--accent))]"
                          />
                          <Search className="w-3 h-3 text-[hsl(var(--foreground-muted))]" />
                          <span className="text-xs text-[hsl(var(--foreground))]">Enable Web Search</span>
                        </label>
                      </div>

                      <div className="bg-[hsl(var(--background))] p-3 text-xs text-[hsl(var(--foreground-muted))]">
                        <strong className="text-[hsl(var(--foreground))]">Research Mode will:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Extract case studies from your portfolio</li>
                          <li>Find relevant statistics and facts</li>
                          <li>Include exact quotes with source citations</li>
                          <li>Show confidence scores for each claim</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="ai-description">Describe your video *</Label>
                    <Textarea
                      id="ai-description"
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      rows={6}
                      placeholder="Example: A video for a SaaS tool that helps marketing teams automate their social media posting. Target audience is marketing managers at mid-size companies. Key benefits include saving time, increasing engagement, and seamless integration with existing tools."
                    />
                  </div>

                  {/* Advanced Mode */}
                  <div className="flex items-center gap-3 pt-4 border-t border-[hsl(var(--border))]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advancedMode}
                        onChange={(e) => setAdvancedMode(e.target.checked)}
                        className="w-4 h-4 border-[hsl(var(--border))] bg-[hsl(var(--surface))] accent-[hsl(var(--accent))]"
                      />
                      <span className="text-sm text-[hsl(var(--foreground))]">Advanced Mode</span>
                    </label>
                    <span className="text-xs text-[hsl(var(--foreground-subtle))]">
                      (Add company-specific details)
                    </span>
                  </div>

                  {advancedMode && (
                    <div className="space-y-4 p-4 bg-[hsl(var(--surface))] border border-[hsl(var(--border))]">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="company-name">Company Name</Label>
                          <Input
                            id="company-name"
                            type="text"
                            value={companyDetails.companyName}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, companyName: e.target.value })}
                            placeholder="Acme Corp"
                          />
                        </div>
                        <div>
                          <Label htmlFor="company-industry">Industry</Label>
                          <Input
                            id="company-industry"
                            type="text"
                            value={companyDetails.industry}
                            onChange={(e) => setCompanyDetails({ ...companyDetails, industry: e.target.value })}
                            placeholder="SaaS, Healthcare, etc."
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="target-audience">Target Audience</Label>
                        <Input
                          id="target-audience"
                          type="text"
                          value={companyDetails.targetAudience}
                          onChange={(e) => setCompanyDetails({ ...companyDetails, targetAudience: e.target.value })}
                          placeholder="Marketing directors at mid-market B2B companies"
                        />
                      </div>

                      <div>
                        <Label htmlFor="pain-points">Key Pain Points</Label>
                        <Textarea
                          id="pain-points"
                          value={companyDetails.painPoints}
                          onChange={(e) => setCompanyDetails({ ...companyDetails, painPoints: e.target.value })}
                          rows={2}
                          placeholder="What problems does your audience face?"
                        />
                      </div>

                      <div>
                        <Label htmlFor="value-prop">Unique Value Proposition</Label>
                        <Textarea
                          id="value-prop"
                          value={companyDetails.valueProposition}
                          onChange={(e) => setCompanyDetails({ ...companyDetails, valueProposition: e.target.value })}
                          rows={2}
                          placeholder="What makes your solution unique?"
                        />
                      </div>

                      <div>
                        <Label htmlFor="metrics">Key Metrics / Proof Points</Label>
                        <Input
                          id="metrics"
                          type="text"
                          value={companyDetails.metrics}
                          onChange={(e) => setCompanyDetails({ ...companyDetails, metrics: e.target.value })}
                          placeholder="500+ customers, 40% time savings, etc."
                        />
                      </div>

                      <div>
                        <Label htmlFor="cta">Call-to-Action</Label>
                        <Input
                          id="cta"
                          type="text"
                          value={companyDetails.cta}
                          onChange={(e) => setCompanyDetails({ ...companyDetails, cta: e.target.value })}
                          placeholder="Book a demo, Start free trial, etc."
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleGenerateWithAI}
                      disabled={generatingAI || !aiDescription.trim()}
                      loading={generatingAI}
                      icon={<Sparkles className="w-4 h-4" />}
                    >
                      {generatingAI ? "Generating..." : "Generate with AI"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowAIModal(false);
                        setAiDescription("");
                        setResearchResults(null);
                        setShowResearchResults(false);
                      }}
                      disabled={generatingAI}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Research Results */}
          {showResearchResults && researchResults && (
            <Card variant="bordered" className="mb-12 animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[hsl(var(--accent))]" />
                    <CardTitle>Research Results</CardTitle>
                  </div>
                  <button
                    onClick={() => {
                      setShowResearchResults(false);
                      setResearchResults(null);
                      setShowAIModal(false);
                      setAiDescription("");
                      loadData();
                    }}
                    className="text-sm link-subtle"
                  >
                    Close & View Video
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {researchResults.summary && (
                  <p className="text-sm text-[hsl(var(--foreground-muted))] mb-6 p-3 bg-[hsl(var(--surface))]">
                    {researchResults.summary}
                  </p>
                )}

                {/* Citations Used */}
                {researchResults.citations_used.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                      <Quote className="w-5 h-5 text-[hsl(var(--accent))]" />
                      Citations Used ({researchResults.citations_used.length})
                    </h3>
                    <div className="space-y-3">
                      {researchResults.citations_used.map((citation, index) => (
                        <div key={index} className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" size="sm">
                              {citation.confidence_score}% confidence
                            </Badge>
                            <a
                              href={citation.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs link-subtle flex items-center gap-1"
                            >
                              {citation.source_title}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <blockquote className="text-sm text-[hsl(var(--foreground))] italic border-l-2 border-[hsl(var(--accent))] pl-3 mb-2">
                            &quot;{citation.exact_quote}&quot;
                          </blockquote>
                          <p className="text-xs text-[hsl(var(--foreground-muted))]">
                            {citation.summary}
                          </p>
                          {citation.used_in_scenes && citation.used_in_scenes.length > 0 && (
                            <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-1">
                              Used in scene{citation.used_in_scenes.length > 1 ? 's' : ''}: {citation.used_in_scenes.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case Studies */}
                {researchResults.case_studies_used.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[hsl(var(--success))]" />
                      Case Studies Found ({researchResults.case_studies_used.length})
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {researchResults.case_studies_used.map((caseStudy, index) => (
                        <div key={index} className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-4">
                          <h4 className="font-medium text-[hsl(var(--foreground))] mb-1">{caseStudy.title}</h4>
                          <p className="text-xs text-[hsl(var(--foreground-muted))] mb-2">
                            {caseStudy.client_name} &bull; {caseStudy.industry}
                          </p>
                          <div className="text-xs text-[hsl(var(--foreground-muted))] space-y-1">
                            <p><strong>Challenge:</strong> {caseStudy.challenge}</p>
                            <p><strong>Solution:</strong> {caseStudy.solution}</p>
                            {caseStudy.results.length > 0 && (
                              <p><strong>Results:</strong> {caseStudy.results.join(', ')}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="success" size="sm">
                              {caseStudy.relevance_score}% relevant
                            </Badge>
                            <a
                              href={caseStudy.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs link-subtle flex items-center gap-1"
                            >
                              Source <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Citations */}
                {researchResults.all_citations.length > researchResults.citations_used.length && (
                  <details className="mt-4">
                    <summary className="text-sm link-subtle cursor-pointer">
                      Show all {researchResults.all_citations.length} citations found
                    </summary>
                    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                      {researchResults.all_citations.map((citation, index) => (
                        <div key={index} className="bg-[hsl(var(--surface))] p-3 text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" size="sm">{citation.confidence_score}%</Badge>
                            <a
                              href={citation.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link-subtle truncate"
                            >
                              {citation.source_title}
                            </a>
                          </div>
                          <p className="text-[hsl(var(--foreground-muted))] italic">
                            &quot;{citation.exact_quote.substring(0, 150)}...&quot;
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {researchResults.search_queries && researchResults.search_queries.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
                    <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                      <strong>Search queries used:</strong> {researchResults.search_queries.join(' \u2022 ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Videos Section */}
          <div className="divider mb-12" />

          <div>
            <p className="caption mb-4">Videos</p>

            {videos.length === 0 ? (
              <div className="text-center py-24 border border-[hsl(var(--border))]">
                <VideoIcon className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-6" />
                <h3 className="headline text-2xl text-[hsl(var(--foreground))] mb-2">
                  No videos yet
                </h3>
                <p className="text-[hsl(var(--foreground-muted))] mb-8">
                  Create your first video for this client
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={() => setShowAIModal(true)} icon={<Sparkles className="w-4 h-4" />}>
                    AI Generate
                  </Button>
                  <Button variant="secondary" onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
                    Create manually
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="group relative bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-6 hover:border-[hsl(var(--border-hover))] transition-colors"
                  >
                    <Link href={`/videos/${video.id}`} className="block">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="headline text-xl text-[hsl(var(--foreground))] mb-2">
                            {video.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-[hsl(var(--foreground-muted))]">
                            <span>{video.aspect_ratio}</span>
                            <span>&bull;</span>
                            <span>{video.duration_seconds}s</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {getStatusBadge(video.status)}
                        <Play className="w-5 h-5 text-[hsl(var(--foreground-subtle))] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteVideo(video.id, video.title);
                      }}
                      className="absolute top-4 right-4 p-2 bg-[hsl(var(--error-muted))] border border-[hsl(var(--error))]/20 text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/20 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

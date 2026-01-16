"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Video as VideoIcon, Plus, Play, Clock, CheckCircle, AlertCircle, Loader2, Trash2, Home, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { clientApi, videoApi, templateApi, Client, Video, Template } from "@/lib/api";
import { THEMES } from "@/lib/themes";

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
  const [companyDetails, setCompanyDetails] = useState({
    companyName: "",
    industry: "",
    targetAudience: "",
    painPoints: "",
    valueProposition: "",
    metrics: "",
    cta: ""
  });

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
    try {
      const response = await fetch('http://localhost:8787/api/ai/generate-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: aiDescription,
          templateId: formData.template_id || null,
          sceneCount: null, // Let AI decide optimal number of scenes
          companyDetails: advancedMode ? companyDetails : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate slides');
      }

      const { slides } = await response.json();

      // Calculate total duration based on AI-generated scenes
      const totalDuration = slides.length * 15; // Approximate 15 seconds per scene

      // Create video with AI-generated scenes
      const videoResponse = await videoApi.create({
        client_id: clientId,
        title: formData.title || `AI Generated - ${new Date().toLocaleDateString()}`,
        template_id: formData.template_id || undefined, // Don't include if empty
        composition_id: "DynamicScene", // Always use DynamicScene for AI videos
        aspect_ratio: formData.aspect_ratio,
        duration_seconds: totalDuration,
        status: "draft",
        data: null,
        theme_id: formData.theme_id,
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
            start_frame: slide.scene_number * 450, // Approximate, will be adjusted
            end_frame: (slide.scene_number + 1) * 450,
            data: slide.data  // Backend will stringify it
          })
        });
      }

      setShowAIModal(false);
      setAiDescription("");
      setShowForm(false);
      loadData();
      alert('Video created with AI-generated slides!');
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
                    Aspect Ratio <span className="text-purple-400 text-xs">(from template)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.aspect_ratio}
                    disabled
                    className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-purple-300 cursor-not-allowed"
                  />
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

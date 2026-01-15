"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Video as VideoIcon, Plus, Play, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { clientApi, videoApi, Client, Video } from "@/lib/api";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = parseInt(params.id as string);

  const [client, setClient] = useState<Client | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    composition_id: "UltrahumanVSL",
    aspect_ratio: "16:9",
    duration_seconds: 345,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [clientId]);

  async function loadData() {
    try {
      const [clientData, videosData] = await Promise.all([
        clientApi.getById(clientId),
        videoApi.getAll(clientId),
      ]);
      setClient(clientData);
      setVideos(videosData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
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
        composition_id: "UltrahumanVSL",
        aspect_ratio: "16:9",
        duration_seconds: 345,
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
        <Link href="/clients">
          <button className="flex items-center gap-2 text-purple-300 hover:text-purple-200 mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Clients
          </button>
        </Link>

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
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Video
            </button>
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
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Composition
                  </label>
                  <select
                    value={formData.composition_id}
                    onChange={(e) => setFormData({ ...formData, composition_id: e.target.value })}
                    className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="UltrahumanVSL">Ultrahuman VSL</option>
                    <option value="PolicyWrappedSquare">Policy Wrapped (Square)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={formData.aspect_ratio}
                    onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
                    className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="16:9">16:9 (YouTube)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="9:16">9:16 (Stories)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_seconds}
                    onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
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
                >
                  <Link href={`/videos/${video.id}`}>
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group">
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

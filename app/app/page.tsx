"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Users, Film, Zap, Database, ArrowRight, Loader2, Instagram } from "lucide-react";
import Link from "next/link";
import { clientApi, videoApi, Client, Video as VideoType } from "@/lib/api";

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [clientsData, videosData] = await Promise.all([
        clientApi.getAll(),
        videoApi.getAll(),
      ]);
      setClients(clientsData);
      setVideos(videosData);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const renderingVideos = videos.filter(v => v.status === 'rendering').length;
  const completedVideos = videos.filter(v => v.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-white">Rendomat</h1>
          </div>
          <p className="text-xl text-purple-200">
            Generative video creation with intelligent scene caching
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20"
              >
                <Users className="w-8 h-8 text-purple-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{clients.length}</div>
                <p className="text-purple-200">Total Clients</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20"
              >
                <Film className="w-8 h-8 text-purple-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{videos.length}</div>
                <p className="text-purple-200">Total Videos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20"
              >
                <Zap className="w-8 h-8 text-green-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{completedVideos}</div>
                <p className="text-purple-200">Completed</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20"
              >
                <Database className="w-8 h-8 text-blue-400 mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{renderingVideos}</div>
                <p className="text-purple-200">Rendering</p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link href="/clients">
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-purple-600/20 rounded-lg flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                        <Users className="w-8 h-8 text-purple-400" />
                      </div>
                      <ArrowRight className="w-6 h-6 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Manage Clients</h2>
                    <p className="text-purple-200 mb-4">
                      View and manage your clients, create new client profiles, and organize their video projects.
                    </p>
                    <div className="flex items-center gap-2 text-purple-300">
                      <span className="text-sm">{clients.length} active clients</span>
                    </div>
                  </div>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-purple-500/20"
              >
                <div className="w-16 h-16 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Scene Caching System</h2>
                <p className="text-purple-200 mb-4">
                  Intelligent caching only re-renders what changed.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-purple-300">
                    <span>Change 1 scene:</span>
                    <span className="text-green-400 font-semibold">~35s</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-300">
                    <span>No changes:</span>
                    <span className="text-green-400 font-semibold">~10s</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-300">
                    <span>Full render:</span>
                    <span className="text-purple-400 font-semibold">~3m</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Link href="/ig-post">
                  <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-lg rounded-lg p-8 border border-pink-500/30 hover:border-pink-500/50 transition-all cursor-pointer group h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-lg flex items-center justify-center group-hover:from-pink-500/40 group-hover:to-purple-500/40 transition-colors">
                        <Instagram className="w-8 h-8 text-pink-400" />
                      </div>
                      <ArrowRight className="w-6 h-6 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">IG Reel Demo</h2>
                    <p className="text-pink-200 mb-4">
                      Week 2: Create an Instagram Reel showcasing this very tool.
                    </p>
                    <div className="flex items-center gap-2 text-pink-300">
                      <span className="text-sm">Meta demo ready</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white/10 backdrop-blur-lg rounded-lg p-8 border border-purple-500/20"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Getting Started</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-purple-200 font-bold">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Create a Client</h3>
                  <p className="text-purple-300 text-sm">
                    Add a new client profile with their company information and industry.
                  </p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-purple-200 font-bold">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Create a Video</h3>
                  <p className="text-purple-300 text-sm">
                    Set up a video project with composition type, aspect ratio, and duration.
                  </p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-purple-200 font-bold">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Render & Iterate</h3>
                  <p className="text-purple-300 text-sm">
                    Edit scenes and re-render quickly thanks to intelligent caching.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-purple-500/20">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-200 text-sm">
                      <strong>Server Required:</strong> Make sure the render server is running.
                      Run <code className="bg-black/30 px-2 py-1 rounded">npm run render-server</code> in the root directory.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <strong>Optional:</strong> Add AI voiceover with ElevenLabs.
                      See <code className="bg-black/30 px-2 py-1 rounded">QUICK_REFERENCE.md</code> for setup.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}

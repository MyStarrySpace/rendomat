"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Building2, Briefcase, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { clientApi, Client } from "@/lib/api";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", company: "", industry: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const data = await clientApi.getAll();
      setClients(data);
    } catch (error) {
      console.error("Failed to load clients:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await clientApi.create(formData);
      setFormData({ name: "", company: "", industry: "" });
      setShowForm(false);
      loadClients();
    } catch (error) {
      console.error("Failed to create client:", error);
      alert("Failed to create client");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-10 h-10 text-purple-400" />
              <h1 className="text-4xl font-bold text-white">Clients</h1>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Client
            </button>
          </div>
          <p className="text-purple-200">Manage your VSL clients</p>
        </motion.div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20 mb-8"
          >
            <h2 className="text-xl font-bold text-white mb-4">Create New Client</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full bg-white/5 border border-purple-500/30 rounded-lg px-4 py-2 text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-500"
                  placeholder="SaaS, Health Tech, etc."
                />
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
                  Create Client
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 backdrop-blur-lg rounded-lg p-12 border border-purple-500/20 text-center"
          >
            <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No clients yet</h3>
            <p className="text-purple-200 mb-4">Create your first client to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Client
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client, idx) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={`/clients/${client.id}`}>
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center group-hover:bg-purple-600/30 transition-colors">
                        <Building2 className="w-6 h-6 text-purple-400" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{client.company}</h3>
                    <p className="text-purple-200 text-sm mb-3">{client.name}</p>
                    {client.industry && (
                      <div className="flex items-center gap-2 text-purple-300 text-sm">
                        <Briefcase className="w-4 h-4" />
                        {client.industry}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

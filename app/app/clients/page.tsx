"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Building2, Briefcase, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { clientApi, Client } from "@/lib/api";
import { Button } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  staggerContainer,
  fadeInUp,
  cardVariants,
  modalContentVariants,
  spring,
} from "@/lib/motion";

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

  async function handleDelete(clientId: number, clientName: string) {
    if (!confirm(`Are you sure you want to delete ${clientName}? This will also delete all their videos.`)) {
      return;
    }

    try {
      await clientApi.delete(clientId);
      loadClients();
    } catch (error) {
      console.error("Failed to delete client:", error);
      alert("Failed to delete client");
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rendomat
          </Link>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => setShowForm(!showForm)} icon={<Plus className="w-4 h-4" />}>
              New Project
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.gentle}
            className="mb-12"
          >
            <p className="caption mb-4">Projects</p>
            <h1 className="headline text-4xl md:text-5xl text-[hsl(var(--foreground))] mb-4">
              Your clients
            </h1>
            <p className="text-lg text-[hsl(var(--foreground-muted))] max-w-xl">
              Manage video projects for your clients. Each client can have multiple videos.
            </p>
          </motion.div>

          {/* Create Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 48 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={spring.gentle}
              >
                <Card variant="bordered">
                  <CardHeader>
                    <CardTitle>Create new project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, ...spring.gentle }}
                      >
                        <Label htmlFor="company">Company name *</Label>
                        <Input
                          id="company"
                          type="text"
                          required
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Acme Corporation"
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, ...spring.gentle }}
                      >
                        <Label htmlFor="name">Contact name</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, ...spring.gentle }}
                      >
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          type="text"
                          value={formData.industry}
                          onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                          placeholder="SaaS, Health Tech, etc."
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="flex gap-3 pt-2"
                      >
                        <Button
                          type="submit"
                          loading={submitting}
                          icon={<Plus className="w-4 h-4" />}
                        >
                          Create project
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setShowForm(false)}
                        >
                          Cancel
                        </Button>
                      </motion.div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-24"
            >
              <Loader2 className="w-6 h-6 text-[hsl(var(--foreground-muted))] animate-spin" />
            </motion.div>
          ) : clients.length === 0 ? (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.gentle}
              className="text-center py-24 border border-[hsl(var(--border))]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, ...spring.bouncy }}
              >
                <Building2 className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-6" />
              </motion.div>
              <h3 className="headline text-2xl text-[hsl(var(--foreground))] mb-2">
                No projects yet
              </h3>
              <p className="text-[hsl(var(--foreground-muted))] mb-8">
                Create your first client project to get started
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
                  Create project
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            /* Client Grid */
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {clients.map((client, index) => (
                <motion.div
                  key={client.id}
                  variants={cardVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="group relative bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-6 hover:border-[hsl(var(--border-hover))] transition-colors"
                >
                  <Link href={`/clients/${client.id}`} className="block">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05, ...spring.bouncy }}
                      className="flex items-start mb-4"
                    >
                      <div className="w-10 h-10 bg-[hsl(var(--accent-muted))] flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[hsl(var(--accent))]" />
                      </div>
                    </motion.div>
                    <h3 className="headline text-xl text-[hsl(var(--foreground))] mb-1">
                      {client.company}
                    </h3>
                    {client.name && (
                      <p className="text-sm text-[hsl(var(--foreground-muted))] mb-3">
                        {client.name}
                      </p>
                    )}
                    {client.industry && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="sm">
                          <Briefcase className="w-3 h-3 mr-1.5" />
                          {client.industry}
                        </Badge>
                      </div>
                    )}
                  </Link>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--error) / 0.2)" }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(client.id, client.company);
                    }}
                    className="absolute top-4 right-4 p-2 bg-[hsl(var(--error-muted))] border border-[hsl(var(--error))]/20 text-[hsl(var(--error))] opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete client"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

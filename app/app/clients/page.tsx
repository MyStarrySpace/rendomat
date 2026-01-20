"use client";

import { useState, useEffect } from "react";
import { Plus, Building2, Briefcase, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { clientApi, Client } from "@/lib/api";
import { Button } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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

          <Button onClick={() => setShowForm(!showForm)} icon={<Plus className="w-4 h-4" />}>
            New Project
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <p className="caption mb-4">Projects</p>
            <h1 className="headline text-4xl md:text-5xl text-[hsl(var(--foreground))] mb-4">
              Your clients
            </h1>
            <p className="text-lg text-[hsl(var(--foreground-muted))] max-w-xl">
              Manage video projects for your clients. Each client can have multiple videos.
            </p>
          </div>

          {/* Create Form */}
          {showForm && (
            <Card variant="bordered" className="mb-12 animate-fade-in">
              <CardHeader>
                <CardTitle>Create new project</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="company">Company name *</Label>
                    <Input
                      id="company"
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Contact name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="SaaS, Health Tech, etc."
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
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
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 text-[hsl(var(--foreground-muted))] animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            /* Empty State */
            <div className="text-center py-24 border border-[hsl(var(--border))]">
              <Building2 className="w-12 h-12 text-[hsl(var(--foreground-subtle))] mx-auto mb-6" />
              <h3 className="headline text-2xl text-[hsl(var(--foreground))] mb-2">
                No projects yet
              </h3>
              <p className="text-[hsl(var(--foreground-muted))] mb-8">
                Create your first client project to get started
              </p>
              <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
                Create project
              </Button>
            </div>
          ) : (
            /* Client Grid */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="group relative bg-[hsl(var(--surface))] border border-[hsl(var(--border))] p-6 hover:border-[hsl(var(--border-hover))] transition-colors"
                >
                  <Link href={`/clients/${client.id}`} className="block">
                    <div className="flex items-start mb-4">
                      <div className="w-10 h-10 bg-[hsl(var(--accent-muted))] flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[hsl(var(--accent))]" />
                      </div>
                    </div>
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
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(client.id, client.company);
                    }}
                    className="absolute top-4 right-4 p-2 bg-[hsl(var(--error-muted))] border border-[hsl(var(--error))]/20 text-[hsl(var(--error))] hover:bg-[hsl(var(--error))]/20 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete client"
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
  );
}

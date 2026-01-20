"use client";

import Link from "next/link";
import {
  FileText,
  Sparkles,
  Layers,
  Download,
  Palette,
  Zap,
  ArrowRight,
  Play,
  Github,
} from "lucide-react";

import { Button } from "@/components/ui";
import { Container, Section, Stack, HStack, VStack } from "@/components/layout";
import { FeatureCard } from "@/components/patterns/feature-card";
import { StatGrid } from "@/components/patterns/stat-block";
import { Badge } from "@/components/ui/badge";

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-sm">
        <Container size="xl">
          <HStack justify="between" align="center" className="h-16">
            <HStack gap="lg" align="center">
              <Link href="/" className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Rendomat
              </Link>
              <Badge variant="outline" size="sm" mono>
                v0.1.0
              </Badge>
            </HStack>

            <HStack gap="sm" align="center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/clients">Clients</Link>
              </Button>
              <Button size="sm" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right" asChild>
                <Link href="/clients">Get Started</Link>
              </Button>
            </HStack>
          </HStack>
        </Container>
      </header>

      {/* Hero */}
      <Section spacing="xl" className="border-b border-[hsl(var(--border))]">
        <Container size="lg">
          <VStack gap="lg" align="center" className="text-center">
            <Badge variant="secondary">Now with After Effects export</Badge>

            <h1 className="text-4xl md:text-5xl font-bold text-[hsl(var(--foreground))] tracking-tight text-balance max-w-3xl">
              Turn documents into videos
            </h1>

            <p className="text-lg text-[hsl(var(--foreground-muted))] max-w-2xl text-balance">
              Drop in a markdown file, Word doc, or raw text. Get a rendered video with
              scenes, transitions, and themes. Export to any platform or After Effects.
            </p>

            <HStack gap="sm" className="mt-4">
              <Button size="lg" icon={<Play className="w-4 h-4" />}>
                Watch Demo
              </Button>
              <Button variant="secondary" size="lg">
                Read Docs
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Section>

      {/* Product Screenshot */}
      <Section spacing="lg" className="border-b border-[hsl(var(--border))]">
        <Container size="xl">
          <div className="relative rounded-[var(--radius-lg)] border border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--surface))]">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background-subtle))]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--foreground-subtle))]/30" />
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--foreground-subtle))]/30" />
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--foreground-subtle))]/30" />
              </div>
              <div className="flex-1 mx-4">
                <div className="max-w-md mx-auto h-6 rounded-[var(--radius-default)] bg-[hsl(var(--surface))] border border-[hsl(var(--border))] flex items-center justify-center">
                  <span className="text-xs text-[hsl(var(--foreground-subtle))] font-mono">
                    localhost:3000
                  </span>
                </div>
              </div>
            </div>

            {/* App preview placeholder */}
            <div className="aspect-[16/10] bg-gradient-to-br from-[hsl(var(--surface))] to-[hsl(var(--background))] flex items-center justify-center">
              <div className="text-center">
                <p className="text-[hsl(var(--foreground-muted))] text-sm mb-2">
                  App screenshot will go here
                </p>
                <p className="text-[hsl(var(--foreground-subtle))] text-xs font-mono">
                  1920 × 1200
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section spacing="default" className="border-b border-[hsl(var(--border))]">
        <Container size="lg">
          <StatGrid
            stats={[
              { value: "10x", label: "Faster with scene caching" },
              { value: "5", label: "Export formats" },
              { value: "∞", label: "Themes supported" },
            ]}
            mono
          />
        </Container>
      </Section>

      {/* Features */}
      <Section spacing="lg" className="border-b border-[hsl(var(--border))]">
        <Container size="lg">
          <VStack gap="xl">
            <VStack gap="sm" align="center" className="text-center">
              <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
                Capabilities
              </h2>
              <p className="text-[hsl(var(--foreground-muted))] max-w-lg">
                Everything you need to go from document to published video.
              </p>
            </VStack>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon={<FileText className="w-5 h-5" />}
                title="Document Import"
                description="Parse Markdown, Word docs, or plain text. Structure is automatically detected and converted to scenes."
              />
              <FeatureCard
                icon={<Sparkles className="w-5 h-5" />}
                title="AI Scene Generation"
                description="Claude analyzes your content and generates compelling scene copy with headlines and supporting text."
              />
              <FeatureCard
                icon={<Layers className="w-5 h-5" />}
                title="Multi-platform Export"
                description="Render once, export to YouTube (16:9), Instagram (9:16), TikTok, or square format."
              />
              <FeatureCard
                icon={<Download className="w-5 h-5" />}
                title="After Effects Export"
                description="Full-fidelity JSON manifest with ExtendScript plugin. Recreate your composition in AE."
              />
              <FeatureCard
                icon={<Palette className="w-5 h-5" />}
                title="Theme System"
                description="Swap colors, fonts, and styles with a single setting. Create custom themes for clients."
              />
              <FeatureCard
                icon={<Zap className="w-5 h-5" />}
                title="Scene Caching"
                description="Only re-render what changed. Edit one scene, skip the other six. 10x faster iteration."
              />
            </div>
          </VStack>
        </Container>
      </Section>

      {/* How it works */}
      <Section spacing="lg" className="border-b border-[hsl(var(--border))]">
        <Container size="lg">
          <VStack gap="xl">
            <VStack gap="sm" align="center" className="text-center">
              <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
                How it works
              </h2>
            </VStack>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Import",
                  description: "Upload a document or paste text. The parser extracts structure and creates a video seed.",
                },
                {
                  step: "02",
                  title: "Generate",
                  description: "AI creates scene content. Review, edit, or regenerate individual scenes until it's right.",
                },
                {
                  step: "03",
                  title: "Render",
                  description: "One-click render to any platform. Scene caching makes re-renders nearly instant.",
                },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="text-5xl font-bold text-[hsl(var(--surface-hover))] mb-4 font-mono">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[hsl(var(--foreground-muted))]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </VStack>
        </Container>
      </Section>

      {/* Tech specs */}
      <Section spacing="lg" className="border-b border-[hsl(var(--border))]">
        <Container size="lg">
          <VStack gap="lg">
            <VStack gap="sm" align="center" className="text-center">
              <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
                Technical Details
              </h2>
              <p className="text-[hsl(var(--foreground-muted))]">
                For developers who want to know what's under the hood.
              </p>
            </VStack>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-[var(--radius-lg)]">
                <h3 className="text-sm font-medium text-[hsl(var(--foreground-muted))] mb-4 uppercase tracking-wide">
                  Stack
                </h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--foreground-subtle))]">Frontend</span>
                    <span className="text-[hsl(var(--foreground))]">Next.js 15 + React 19</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--foreground-subtle))]">Video</span>
                    <span className="text-[hsl(var(--foreground))]">Remotion 4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--foreground-subtle))]">Database</span>
                    <span className="text-[hsl(var(--foreground))]">SQLite</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--foreground-subtle))]">AI</span>
                    <span className="text-[hsl(var(--foreground))]">Claude API</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-[var(--radius-lg)]">
                <h3 className="text-sm font-medium text-[hsl(var(--foreground-muted))] mb-4 uppercase tracking-wide">
                  Export Formats
                </h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--foreground-subtle))]">YouTube</span>
                    <span className="text-[hsl(var(--foreground))]">1920×1080 / 16:9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--foreground-subtle))]">Reels/TikTok</span>
                    <span className="text-[hsl(var(--foreground))]">1080×1920 / 9:16</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--foreground-subtle))]">Square</span>
                    <span className="text-[hsl(var(--foreground))]">1080×1080 / 1:1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--foreground-subtle))]">After Effects</span>
                    <span className="text-[hsl(var(--foreground))]">JSON + JSX</span>
                  </div>
                </div>
              </div>
            </div>
          </VStack>
        </Container>
      </Section>

      {/* CTA */}
      <Section spacing="lg">
        <Container size="default">
          <VStack gap="lg" align="center" className="text-center">
            <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
              Ready to try it?
            </h2>
            <p className="text-[hsl(var(--foreground-muted))]">
              Create your first video in under five minutes.
            </p>
            <HStack gap="sm">
              <Button size="lg" asChild>
                <Link href="/clients">Open Dashboard</Link>
              </Button>
              <Button variant="secondary" size="lg" icon={<Github className="w-4 h-4" />} asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  View Source
                </a>
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--border))] py-8">
        <Container size="lg">
          <HStack justify="between" align="center">
            <span className="text-sm text-[hsl(var(--foreground-subtle))]">
              Rendomat — Generative video creation
            </span>
            <span className="text-sm text-[hsl(var(--foreground-subtle))] font-mono">
              2026
            </span>
          </HStack>
        </Container>
      </footer>
    </div>
  );
}

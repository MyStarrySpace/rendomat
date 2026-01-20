"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm tracking-wide text-[hsl(var(--foreground))]"
          >
            Rendomat
          </Link>

          <div className="flex items-center gap-8">
            <Link href="/" className="link-subtle text-sm">
              Dashboard
            </Link>
            <Link href="/clients" className="link-subtle text-sm">
              Projects
            </Link>
            <Link
              href="/clients"
              className="text-sm text-[hsl(var(--foreground))] flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              Start creating
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-6">Video Creation Tool</p>

          <h1 className="headline text-5xl md:text-7xl text-[hsl(var(--foreground))] mb-8">
            Turn documents
            <br />
            <span className="text-[hsl(var(--foreground-muted))]">
              into videos
            </span>
          </h1>

          <p className="text-lg text-[hsl(var(--foreground-muted))] max-w-xl leading-relaxed">
            Drop in a markdown file, Word doc, or plain text. Get back a video
            with scenes, transitions, and themes you can edit or export.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="divider mx-6" />

      {/* Feature Strip */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { label: "Input", value: "Markdown, Word, Text" },
              { label: "Output", value: "MP4, WebM, AE" },
              { label: "Formats", value: "16:9, 9:16, 1:1" },
              { label: "Rendering", value: "Cached scenes" },
            ].map((item) => (
              <div key={item.label}>
                <p className="caption mb-2">{item.label}</p>
                <p className="text-[hsl(var(--foreground))] text-sm">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="divider mx-6" />

      {/* Main Visual */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="frame">
            <div className="aspect-[16/9] bg-[hsl(var(--background-subtle))] flex items-center justify-center">
              <p className="caption">App Preview</p>
            </div>
          </div>
          <p className="caption mt-4 text-center">
            The editor interface. Simple, focused, fast.
          </p>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 px-6 bg-[hsl(var(--surface))]">
        <div className="max-w-4xl mx-auto">
          <p className="caption mb-12">How it works</p>

          <div className="space-y-16">
            {[
              {
                num: "01",
                title: "Drop in your document",
                text: "Paste text or upload a file. Our parser automatically turns your headings into scenes and your paragraphs into supporting copy.",
              },
              {
                num: "02",
                title: "Review and refine",
                text: "AI generates scene content from your material. Keep what works, edit what doesn't. Regenerate any scene with one click.",
              },
              {
                num: "03",
                title: "Export anywhere",
                text: "Render to YouTube, TikTok, Instagram, or square format. Need more control? Export to After Effects with full layer data.",
              },
            ].map((step) => (
              <div key={step.num} className="grid md:grid-cols-12 gap-6">
                <div className="md:col-span-2">
                  <span className="font-mono text-sm text-[hsl(var(--foreground-subtle))]">
                    {step.num}
                  </span>
                </div>
                <div className="md:col-span-10">
                  <h3 className="headline text-2xl text-[hsl(var(--foreground))] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[hsl(var(--foreground-muted))] leading-relaxed max-w-lg">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] leading-snug">
            You already have the content.
            <span className="text-[hsl(var(--foreground-muted))]">
              {" "}This turns it into something you can share.
            </span>
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="divider mx-6" />

      {/* Tech */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <p className="caption mb-6">Built with</p>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between text-[hsl(var(--foreground-muted))]">
                  <span>Frontend</span>
                  <span className="text-[hsl(var(--foreground))]">
                    Next.js, React
                  </span>
                </li>
                <li className="flex justify-between text-[hsl(var(--foreground-muted))]">
                  <span>Video</span>
                  <span className="text-[hsl(var(--foreground))]">
                    Remotion
                  </span>
                </li>
                <li className="flex justify-between text-[hsl(var(--foreground-muted))]">
                  <span>AI</span>
                  <span className="text-[hsl(var(--foreground))]">
                    Claude API
                  </span>
                </li>
                <li className="flex justify-between text-[hsl(var(--foreground-muted))]">
                  <span>Storage</span>
                  <span className="text-[hsl(var(--foreground))]">SQLite</span>
                </li>
              </ul>
            </div>

            <div>
              <p className="caption mb-6">Export options</p>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between text-[hsl(var(--foreground-muted))]">
                  <span>YouTube</span>
                  <span className="text-[hsl(var(--foreground))]">
                    1920×1080
                  </span>
                </li>
                <li className="flex justify-between text-[hsl(var(--foreground-muted))]">
                  <span>Reels / TikTok</span>
                  <span className="text-[hsl(var(--foreground))]">
                    1080×1920
                  </span>
                </li>
                <li className="flex justify-between text-[hsl(var(--foreground-muted))]">
                  <span>Square</span>
                  <span className="text-[hsl(var(--foreground))]">
                    1080×1080
                  </span>
                </li>
                <li className="flex justify-between text-[hsl(var(--foreground-muted))]">
                  <span>After Effects</span>
                  <span className="text-[hsl(var(--foreground))]">
                    JSON manifest
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[hsl(var(--surface))]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-6">
            Try it with your own content
          </h2>
          <p className="text-[hsl(var(--foreground-muted))] mb-8">
            Paste some text or upload a document and see what comes out.
          </p>
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-sm hover:opacity-90 transition-opacity"
          >
            Open the editor
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm text-[hsl(var(--foreground-subtle))]">
            Rendomat
          </span>
          <span className="text-sm text-[hsl(var(--foreground-subtle))] font-mono">
            2026
          </span>
        </div>
      </footer>
    </div>
  );
}

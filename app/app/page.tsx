"use client";

import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { motion } from "framer-motion";
import {
  spring,
  staggerContainer,
  fadeInUp,
  fadeInLeft,
  revealVariants,
  revealFromLeft,
  viewportOnce,
} from "@/lib/motion";

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function Home() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-5"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm tracking-wide text-[hsl(var(--foreground))]"
          >
            Rendomat
          </Link>

          <div className="flex items-center gap-8">
            <Link href="/clients" className="link-subtle text-sm">
              Projects
            </Link>
            <Link
              href="/ae-plugin"
              className="link-subtle text-sm flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              AE Plugin
            </Link>
            <motion.div whileHover={{ x: 2 }} transition={spring.snappy}>
              <Link
                href="/clients"
                className="text-sm text-[hsl(var(--foreground))] flex items-center gap-1 hover:opacity-70 transition-opacity"
              >
                Start creating
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto"
        >
          <motion.p variants={fadeInUp} className="caption mb-6">
            Video Creation Tool
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            className="headline text-5xl md:text-7xl text-[hsl(var(--foreground))] mb-8"
          >
            From content to{" "}
            <em className="italic text-[hsl(var(--accent))]">production</em>
            <br />
            <span className="text-[hsl(var(--foreground-muted))]">
              in one sitting
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-[hsl(var(--foreground-muted))] max-w-xl leading-relaxed"
          >
            AI structures your content into scenes. A visual timeline gives you
            full editorial control. Export to MP4, multiple formats, or
            After Effects — from a single source.
          </motion.p>
        </motion.div>
      </section>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "left" }}
        className="divider mx-6"
      />

      {/* Feature Strip */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4"
          >
            {[
              { label: "Input", value: "Markdown, Word, Text" },
              { label: "Output", value: "MP4, WebM, AE" },
              { label: "Formats", value: "16:9, 9:16, 1:1" },
              { label: "Rendering", value: "Cached scenes" },
            ].map((item) => (
              <motion.div key={item.label} variants={fadeInUp}>
                <p className="caption mb-2">{item.label}</p>
                <p className="text-[hsl(var(--foreground))] text-sm">
                  {item.value}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "left" }}
        className="divider mx-6"
      />

      {/* Main Visual */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-6xl mx-auto"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={spring.gentle}
            className="frame"
          >
            <div className="aspect-[16/9] bg-[hsl(var(--background-subtle))] flex items-center justify-center">
              <p className="caption">App Preview</p>
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ delay: 0.3 }}
            className="caption mt-4 text-center"
          >
            The editor interface. Simple, focused, fast.
          </motion.p>
        </motion.div>
      </section>

      {/* Process */}
      <section className="py-24 px-6 bg-[hsl(var(--surface))]">
        <div className="max-w-4xl mx-auto">
          <motion.p
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="caption mb-12"
          >
            How it works
          </motion.p>

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
            ].map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid md:grid-cols-12 gap-6"
              >
                <div className="md:col-span-2">
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={viewportOnce}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="font-mono text-sm text-[hsl(var(--foreground-subtle))]"
                  >
                    {step.num}
                  </motion.span>
                </div>
                <div className="md:col-span-10">
                  <h3 className="headline text-2xl text-[hsl(var(--foreground))] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[hsl(var(--foreground-muted))] leading-relaxed max-w-lg">
                    {step.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <p className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] leading-snug">
            You already have the content.

            {" "}<em className="italic text-[hsl(var(--accent))]">This turns it into something you can share.</em>
          </p>
        </motion.div>
      </section>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "center" }}
        className="divider mx-6"
      />

      {/* Tech */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
            >
              <motion.p variants={fadeInUp} className="caption mb-6">
                Built with
              </motion.p>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Frontend", value: "Next.js, React" },
                  { label: "Video", value: "Remotion" },
                  { label: "AI", value: "Claude API" },
                  { label: "Storage", value: "SQLite" },
                ].map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={viewportOnce}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="flex justify-between text-[hsl(var(--foreground-muted))]"
                  >
                    <span>{item.label}</span>
                    <span className="text-[hsl(var(--foreground))]">
                      {item.value}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
            >
              <motion.p variants={fadeInUp} className="caption mb-6">
                Export options
              </motion.p>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "YouTube", value: "1920×1080" },
                  { label: "Reels / TikTok", value: "1080×1920" },
                  { label: "Square", value: "1080×1080" },
                  { label: "After Effects", value: "JSON manifest" },
                ].map((item, index) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={viewportOnce}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="flex justify-between text-[hsl(var(--foreground-muted))]"
                  >
                    <span>{item.label}</span>
                    <span className="text-[hsl(var(--foreground))]">
                      {item.value}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-[hsl(var(--surface))]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-6">
            Try it with your own content
          </h2>
          <p className="text-[hsl(var(--foreground-muted))] mb-8">
            Paste some text or upload a document and see what comes out.
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={spring.snappy}
          >
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-sm hover:opacity-90 transition-opacity"
            >
              Open the editor
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 0.5 }}
        className="py-8 px-6 border-t border-[hsl(var(--border))]"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm text-[hsl(var(--foreground-subtle))]">
            Rendomat
          </span>
          <span className="text-sm text-[hsl(var(--foreground-subtle))] font-mono">
            2026
          </span>
        </div>
      </motion.footer>
    </div>
  );
}

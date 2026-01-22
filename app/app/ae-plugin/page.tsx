"use client";

import Link from "next/link";
import { ArrowLeft, Download, Check, Folder, Play } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import {
  spring,
  staggerContainer,
  fadeInUp,
  viewportOnce,
} from "@/lib/motion";

// -----------------------------------------------------------------------------
// AE Plugin Download Page
// -----------------------------------------------------------------------------

const installMethods = [
  {
    num: "01",
    title: "Run Script Directly",
    description: "Quick way to try the plugin without installation.",
    steps: [
      "Download the plugin ZIP file below",
      "Extract to a location on your computer",
      "In After Effects: File → Scripts → Run Script File...",
      "Navigate to and select RemotionImporter.jsx",
    ],
  },
  {
    num: "02",
    title: "Install in Scripts Folder",
    badge: "Recommended",
    description: "Makes the script available from After Effects menus.",
    steps: [
      "Download and extract the plugin",
      "Copy the ae-plugin folder to your Scripts folder:",
      "Windows: C:\\Program Files\\Adobe\\After Effects [version]\\Support Files\\Scripts\\",
      "macOS: /Applications/Adobe After Effects [version]/Scripts/",
      "Restart After Effects",
      "Access via File → Scripts → RemotionImporter",
    ],
  },
  {
    num: "03",
    title: "ScriptUI Panel",
    description: "Best for frequent use. Adds a dockable panel.",
    steps: [
      "Copy the ae-plugin folder to ScriptUI Panels:",
      "Windows: ...\\Scripts\\ScriptUI Panels\\",
      "macOS: .../Scripts/ScriptUI Panels/",
      "Restart After Effects",
      "Access via Window → RemotionImporter",
    ],
  },
];

const features = [
  { label: "Solid layers", desc: "Background colors from theme" },
  { label: "Text layers", desc: "Headlines, body text with styling" },
  { label: "Animations", desc: "Opacity, position, scale, rotation" },
  { label: "Easing", desc: "Bezier curves converted to AE keyframes" },
];

export default function AEPluginPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-5 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-[hsl(var(--border))]"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[hsl(var(--foreground-muted))] flex items-center gap-2 hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Rendomat
          </Link>

          <Link href="/clients" className="link-subtle text-sm">
            Projects
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto"
        >
          <motion.p variants={fadeInUp} className="caption mb-6">
            After Effects Integration
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            className="headline text-4xl md:text-5xl text-[hsl(var(--foreground))] mb-6"
          >
            Remotion Importer
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-[hsl(var(--foreground-muted))] max-w-xl leading-relaxed mb-8"
          >
            Import your Rendomat video exports directly into After Effects.
            Preserves layer structure, text styling, animations, and timing.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={spring.snappy}
              className="inline-block"
            >
              <a href="http://localhost:8787/api/ae-plugin">
                <Button size="lg" icon={<Download className="w-4 h-4" />}>
                  Download Plugin
                </Button>
              </a>
            </motion.div>
            <p className="text-sm text-[hsl(var(--foreground-subtle))] mt-3">
              ZIP archive containing RemotionImporter.jsx and dependencies
            </p>
          </motion.div>
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

      {/* What Gets Imported */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            className="caption mb-8"
          >
            What gets imported
          </motion.p>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.label} variants={fadeInUp}>
                <p className="text-sm text-[hsl(var(--foreground))] mb-1">
                  {feature.label}
                </p>
                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Installation Methods */}
      <section className="py-16 px-6 bg-[hsl(var(--surface))]">
        <div className="max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            className="caption mb-12"
          >
            Installation
          </motion.p>

          <div className="space-y-12">
            {installMethods.map((method, index) => (
              <motion.div
                key={method.num}
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
                  <span className="font-mono text-sm text-[hsl(var(--foreground-subtle))]">
                    {method.num}
                  </span>
                </div>
                <div className="md:col-span-10">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="headline text-xl text-[hsl(var(--foreground))]">
                      {method.title}
                    </h3>
                    {method.badge && (
                      <span className="pill text-xs">{method.badge}</span>
                    )}
                  </div>
                  <p className="text-[hsl(var(--foreground-muted))] mb-4">
                    {method.description}
                  </p>
                  <ul className="space-y-2">
                    {method.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-[hsl(var(--foreground-muted))]"
                      >
                        <Check className="w-4 h-4 text-[hsl(var(--success))] mt-0.5 flex-shrink-0" />
                        <span
                          className={
                            step.includes(":\\") || step.includes("/Applications")
                              ? "font-mono text-xs"
                              : ""
                          }
                        >
                          {step}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            className="caption mb-8"
          >
            Usage
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-[hsl(var(--surface))] border border-[hsl(var(--border))]">
                <Folder className="w-4 h-4 text-[hsl(var(--foreground-muted))]" />
              </div>
              <div>
                <p className="text-[hsl(var(--foreground))] mb-1">
                  Export from Rendomat
                </p>
                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                  On any video page, use the &ldquo;Export to AE&rdquo; option to download
                  the JSON manifest or self-contained JSX script.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-[hsl(var(--surface))] border border-[hsl(var(--border))]">
                <Play className="w-4 h-4 text-[hsl(var(--foreground-muted))]" />
              </div>
              <div>
                <p className="text-[hsl(var(--foreground))] mb-1">
                  Run the importer
                </p>
                <p className="text-sm text-[hsl(var(--foreground-muted))]">
                  In After Effects, run the RemotionImporter script and select your
                  exported file. The script creates compositions with all your
                  scenes, layers, and animations.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="py-16 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            className="caption mb-8"
          >
            Troubleshooting
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            className="grid md:grid-cols-2 gap-8"
          >
            <div>
              <p className="text-[hsl(var(--foreground))] mb-2">
                Script won&apos;t run
              </p>
              <p className="text-sm text-[hsl(var(--foreground-muted))]">
                Enable &ldquo;Allow Scripts to Write Files&rdquo; in AE Preferences →
                Scripting &amp; Expressions. Make sure all library files are in the
                lib/ subfolder.
              </p>
            </div>

            <div>
              <p className="text-[hsl(var(--foreground))] mb-2">
                Fonts don&apos;t match
              </p>
              <p className="text-sm text-[hsl(var(--foreground-muted))]">
                Install the fonts specified in your theme (Inter, Montserrat,
                etc.). AE uses font names differently—adjust in the Character
                panel.
              </p>
            </div>

            <div>
              <p className="text-[hsl(var(--foreground))] mb-2">Timing is off</p>
              <p className="text-sm text-[hsl(var(--foreground-muted))]">
                Verify FPS matches between your Remotion export and the AE
                composition. Check in/out points on individual layers.
              </p>
            </div>

            <div>
              <p className="text-[hsl(var(--foreground))] mb-2">
                Missing animations
              </p>
              <p className="text-sm text-[hsl(var(--foreground-muted))]">
                Complex expressions may not convert perfectly. Manually recreate
                any spring or physics-based animations in AE.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[hsl(var(--border))]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-sm text-[hsl(var(--foreground-subtle))]">
            Rendomat
          </span>
          <span className="text-sm text-[hsl(var(--foreground-subtle))] font-mono">
            v1.0.0
          </span>
        </div>
      </footer>
    </div>
  );
}

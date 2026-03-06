"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  User,
  Target,
  AlertTriangle,
  Layers,
  FileText,
  Film,
  Upload,
  Sparkles,
  Settings,
  Download,
  Play,
  Clock,
  Database,
  Server,
  Code,
  Monitor,
  Cpu,
  GitBranch,
  Box,
  Terminal,
  TrendingUp,
  RefreshCw,
  CreditCard,
  Shield,
  Cloud,
  Zap,
  Lock,
  DollarSign,
  Package,
} from "lucide-react";
import { MermaidChart } from "@/components/ui/MermaidChart";
import { motion } from "framer-motion";
import {
  spring,
  staggerContainer,
  staggerContainerSlow,
  staggerContainerFast,
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  revealVariants,
  viewportOnce,
} from "@/lib/motion";

// =============================================================================
// DATA
// =============================================================================

const metrics = [
  { label: "Scene Types", value: "14", detail: "Text, charts, images, equations" },
  { label: "Transitions", value: "22", detail: "Crossfade to iris-close" },
  { label: "Animation Presets", value: "15", detail: "Minimal to cinematic" },
  { label: "Export Targets", value: "5", detail: "16:9, 1:1, 9:16, square, AE" },
  { label: "Cloud Render", value: "~60s", detail: "Lambda fan-out vs. 3-5 min local" },
  { label: "Auth Providers", value: "2", detail: "Google + GitHub OAuth" },
];

const techMetrics = [
  { label: "Backend", value: "Express", detail: "REST API + SQLite + FFmpeg" },
  { label: "Frontend", value: "Next.js", detail: "Custom timeline editor" },
  { label: "Video Engine", value: "Remotion", detail: "React components as frames" },
  { label: "AI Layer", value: "Claude", detail: "Content generation + structuring" },
];

const stackLayers = [
  {
    title: "Frontend",
    tech: "Next.js 16 / React 19 / TypeScript",
    color: "var(--accent)",
    items: [
      "Custom multi-track timeline editor with drag, resize, and snap",
      "Scene editor panels for 14 scene types with live preview",
      "Framer Motion animation system with editorial design tokens",
      "Theme picker and animation preset browser",
    ],
  },
  {
    title: "Backend",
    tech: "Express.js / SQLite / FFmpeg",
    color: "var(--accent-alt)",
    items: [
      "REST API with full CRUD for clients, videos, scenes, transitions",
      "SQLite database with relational schema (better-sqlite3)",
      "Multer file upload pipeline for images, audio, and video clips",
      "FFmpeg orchestration for stitching, muxing, and format conversion",
    ],
  },
  {
    title: "Video Engine",
    tech: "Remotion 4 / React / Headless Chrome",
    color: "var(--foreground-subtle)",
    items: [
      "14 scene types as typed React components with frame-based animation",
      "Per-scene SHA256 caching — edit one scene, re-render one scene",
      "22 transitions rendered as independent clips and stitched via FFmpeg",
      "Multi-format composition: same data renders at 16:9, 1:1, and 9:16",
    ],
  },
];

const engineeringDecisions = [
  {
    num: "01",
    title: "Scenes as React components",
    description:
      "Each scene type (text, bar chart, quote, equation, image grid) is a self-contained React component with typed props. Adding a new scene type means writing one component — no plugins, no DSL. Remotion renders each frame via headless Chrome, giving full access to CSS, SVG, canvas, and WebGL.",
    detail: "14 scene types, each with typed SceneData props and frame-range-aware animation",
    tags: ["Remotion", "React", "TypeScript"],
  },
  {
    num: "02",
    title: "Per-scene cached rendering",
    description:
      "Rendering video is slow — a seven-scene video takes 2-3 minutes cold. The caching system hashes each scene's data and frame range with SHA256. Before rendering, it checks the cache. Only changed scenes re-render. The final video is stitched from cached clips using FFmpeg. Editing one scene in a seven-scene video drops render time from minutes to seconds.",
    detail: "SHA256 content hashing, FFmpeg concat, sub-5-second feedback loops",
    tags: ["FFmpeg", "Caching", "Performance"],
  },
  {
    num: "03",
    title: "Custom timeline editor",
    description:
      "The multi-track timeline is built from scratch — no library. Scenes, transitions, audio clips, and video clips live on separate tracks with independent selection, drag-to-reorder, resize-to-adjust-duration, and snap-to-grid. The timeline hook manages all state and converts between frames and pixels for precise positioning.",
    detail: "4 tracks, drag/resize/snap, frame-to-pixel conversion, mutual-exclusive selection",
    tags: ["React", "Custom Hooks", "UI Engineering"],
  },
  {
    num: "04",
    title: "Independent transition system",
    description:
      "Transitions are rendered as separate clips between scene snapshots, then stitched in. This keeps them independent of scene caching — changing a transition doesn't invalidate scenes on either side. 22 types across basic (crossfade, fade), directional (slide, wipe), cinematic (zoom, blur, glitch), and dynamic (flash, spin, pixelate) categories.",
    detail: "22 types, 4 categories, batch-rendered MP4 preview clips at 320x180",
    tags: ["FFmpeg", "Animation", "Architecture"],
  },
  {
    num: "05",
    title: "After Effects export pipeline",
    description:
      "For projects needing post-production polish, Rendomat exports a full AE project. A JSON manifest describes every layer, keyframe, and easing curve. An ExtendScript importer reconstructs the composition in After Effects with accurate timing, blend modes, and bezier easing. Rendomat handles the 90% case; AE handles the last 10%.",
    detail: "JSON manifest generation, ExtendScript (JSX) importer, keyframe reconstruction",
    tags: ["After Effects", "ExtendScript", "Interop"],
  },
  {
    num: "06",
    title: "AI content structuring",
    description:
      "Claude API takes raw documents (markdown, Word, pasted text) and structures them into typed scene data — deciding scene types, splitting content, generating chart data, and writing copy. Every AI decision is stored as editable fields. Users see results, then override anything. The AI accelerates without removing control.",
    detail: "Document parsing, scene-type selection, chart data generation, copy refinement",
    tags: ["Claude API", "AI", "NLP"],
  },
  {
    num: "07",
    title: "Electron desktop packaging",
    description:
      "The Express server, Next.js frontend, Remotion renderer, and FFmpeg pipeline all run inside a single Electron process. The main process starts the Express server programmatically and opens a BrowserWindow pointed at the static Next.js build. All file paths use process.cwd() so they resolve correctly whether running as a Node.js server or an Electron app. SQLite, file uploads, and scene cache live in the app's user data directory. No architecture changes were needed — the existing localhost REST pattern became an internal IPC channel.",
    detail: "Electron main process as Express host, static Next.js in renderer, bundled FFmpeg + Chrome",
    tags: ["Electron", "Desktop", "Architecture"],
  },
  {
    num: "08",
    title: "Serverless video rendering with AWS Lambda",
    description:
      "Local rendering ties up the user's machine for minutes. The cloud render pipeline offloads the entire job to @remotion/lambda — a FullVideoComposition bundles all scenes and transitions into a single composition, Lambda fans out rendering across parallel workers, and the final video lands in S3. The user sees real-time progress via SSE, then gets a download link. Credits gate access: 3 free on signup, more via Stripe. The same SSE infrastructure serves both local and cloud progress.",
    detail: "FullVideoComposition pattern, Lambda fan-out, S3 delivery, SSE progress reuse",
    tags: ["AWS Lambda", "Remotion", "S3", "Serverless"],
  },
  {
    num: "09",
    title: "Credits-based billing with Stripe",
    description:
      "NextAuth v5 handles Google + GitHub OAuth with JWT strategy. On sign-in, a callback syncs the user to the Express backend via REST. JWTs propagate identity from the Next.js frontend to Express middleware. Stripe Checkout Sessions handle payment — the webhook endpoint is registered before express.json() middleware so raw body parsing preserves the signature. Credits are atomic: adjustCredits() wraps the balance update and transaction log in a SQLite transaction. Idempotency is enforced by checking stripe_session_id before fulfillment.",
    detail: "NextAuth JWT → Express middleware, Stripe webhook with signature verification, atomic credit transactions",
    tags: ["NextAuth", "Stripe", "JWT", "OAuth"],
  },
];

const uxPrinciples = [
  {
    num: "01",
    principle: "Progressive Disclosure",
    title: "Simple entry, deep control",
    description:
      "New users see a text input and a Generate button. The timeline, animation presets, and multi-track audio only appear after content exists. This prevents the blank-canvas problem where complex tools overwhelm before you start.",
    tags: ["Onboarding", "Cognitive Load"],
  },
  {
    num: "02",
    principle: "Direct Manipulation",
    title: "Drag to reorder, resize to adjust",
    description:
      "Scenes are physical objects on the timeline — grab, drag, resize. No modal dialogs for reordering. No numeric inputs for duration. Interactions map directly to the data model.",
    tags: ["Timeline", "Interaction Design"],
  },
  {
    num: "03",
    principle: "AI as Co-pilot",
    title: "Generate first, refine after",
    description:
      "AI generates a complete first draft from the document. Every decision is editable — scene type, content, animation, timing. The system accelerates without removing creative authority.",
    tags: ["AI / ML", "Trust"],
  },
  {
    num: "04",
    principle: "Familiar Mental Models",
    title: "Timeline metaphor from NLEs",
    description:
      "The multi-track timeline borrows directly from Premiere and DaVinci. Scenes, transitions, audio, and video live on separate tracks. Anyone with editing experience transfers their knowledge immediately.",
    tags: ["Mental Models", "Learnability"],
  },
];

const userFlowChart = `flowchart LR
    subgraph ENTRY["01 ENTRY"]
        A["Landing Page"] -->|"CTA"| B["Clients Hub"]
        B -->|"New"| C["Create Client"]
        C --> D["New Video Modal"]
        B -->|"Existing"| D
    end

    subgraph GENERATION["02 GENERATION"]
        E["Upload Document"] -->|".md / .docx / paste"| F["Parse & Seed"]
        F -->|"Structured data"| G["AI Scene Generation"]
        H["Select Theme"] --> G
        I["Assign Personas"] --> G
        G -->|"Enrich"| J["Research & Fact-Check"]
    end

    subgraph EDITING["03 EDITING"]
        K["Timeline Editor"]
        K --> L["Edit Scenes"]
        K --> M["Transitions"]
        K --> N["Audio Clips"]
        K --> O["Video B-Roll"]
        L -->|"14 types"| P["Preview Render"]
        M -->|"22 types"| P
        L -->|"Search"| Q["Stock Images"]
        Q --> L
        N -->|"Upload / Record"| P
        O -->|"Upload / Normalize"| P
        P -->|"Iterate"| K
    end

    subgraph EXPORT["04 EXPORT"]
        R["Select Platforms"]
        R --> S["Scene Rendering"]
        S -->|"SHA256 cache"| T["Stitch & Mux"]
        T --> U["Multi-Format Render"]
        U -->|"16:9"| V["Download MP4"]
        U -->|"1:1"| V
        U -->|"9:16"| V
        U --> W["AE Export"]
        W -->|"JSON manifest"| X["After Effects"]
        W -->|"JSX script"| X
    end

    D -->|"Start"| E
    D -->|"Blank"| K
    J --> K
    P -->|"Final"| R
`;

const cloudRenderChart = `flowchart LR
    A["User"] -->|"Click Cloud Render"| B["Next.js Frontend"]
    B -->|"JWT Bearer Token"| C["Express API"]
    C -->|"Deduct Credit"| D["SQLite"]
    C -->|"renderMediaOnLambda"| E["AWS Lambda"]
    E -->|"Fan-out Workers"| F["Parallel Rendering"]
    F -->|"Stitch"| G["S3 Output"]
    G -->|"Presigned URL"| A

    B2["NextAuth"] -->|"OAuth"| B
    C2["Stripe Webhook"] -->|"Add Credits"| D
`;

const authFlowChart = `flowchart LR
    subgraph OAUTH["OAuth Providers"]
        G["Google"]
        GH["GitHub"]
    end

    subgraph NEXTAUTH["Next.js (NextAuth v5)"]
        A["signIn Callback"] -->|"Upsert User"| B["POST /api/auth/sync-user"]
        A -->|"Sign JWT (jose)"| C["jwt Callback"]
        C -->|"Expose Token"| D["session Callback"]
    end

    subgraph EXPRESS["Express API"]
        E["authenticateToken"] -->|"jwt.verify"| F["req.user"]
        F --> H["Protected Endpoints"]
    end

    G -->|"OAuth Code"| A
    GH -->|"OAuth Code"| A
    B -->|"x-auth-sync-secret"| I["SQLite users Table"]
    D -->|"Bearer JWT"| E
`;

const stripeFlowChart = `flowchart LR
    A["User"] -->|"Buy Credits"| B["Billing Page"]
    B -->|"POST /api/billing/checkout"| C["Express API"]
    C -->|"createCheckoutSession"| D["Stripe API"]
    D -->|"Redirect"| E["Stripe Checkout"]
    E -->|"Payment Complete"| F["Stripe Webhook"]
    F -->|"express.raw() + Signature Verify"| G["handleWebhookEvent"]
    G -->|"Idempotent Check"| H["SQLite"]
    H -->|"adjustCredits (Transaction)"| I["credits + transaction_log"]
    I -->|"Refresh"| A
`;

const personas = [
  {
    name: "Sarah Chen",
    role: "Marketing Manager",
    company: "B2B SaaS Startup",
    bio: "Runs a lean team of three. Needs video for launches and LinkedIn — no production budget.",
    goals: [
      "Professional videos in under 30 minutes",
      "Repurpose blog posts into video",
      "Multi-platform export without re-editing",
    ],
    painPoints: [
      "Steep learning curves on pro tools",
      "Agency outsourcing is slow and expensive",
      "Resizing per platform is tedious",
    ],
    techComfort: "Medium",
    color: "var(--accent)",
  },
  {
    name: "James Okafor",
    role: "Freelance Video Editor",
    company: "Independent",
    bio: "Handles 8-12 client projects per month. Uses AE for polish but needs faster rough cuts.",
    goals: [
      "Prototype video concepts from client briefs",
      "Export to After Effects for refinement",
      "Scale output without sacrificing quality",
    ],
    painPoints: [
      "Building scenes from scratch is slow",
      "Clients change direction mid-project",
      "Preview iterations take too long",
    ],
    techComfort: "High",
    color: "var(--accent-alt)",
  },
  {
    name: "Dr. Priya Mehta",
    role: "Research Communicator",
    company: "University Hospital",
    bio: "Translates medical research into accessible content. Zero tolerance for fussy interfaces.",
    goals: [
      "Research papers into visual explainers",
      "Data viz without design skills",
      "Professional, credible output",
    ],
    painPoints: [
      "Tools prioritize flashy over clear",
      "Charts require separate tools",
      "Accessibility is an afterthought",
    ],
    techComfort: "Low",
    color: "var(--error)",
  },
];

const techStack = [
  { layer: "Video Engine", tech: "Remotion 4, React, TypeScript", why: "Programmatic video as React components" },
  { layer: "Frontend", tech: "Next.js 16, React 19, Framer Motion", why: "Custom timeline editor and scene configuration" },
  { layer: "Backend", tech: "Express.js, better-sqlite3", why: "REST API, render orchestration, scene caching" },
  { layer: "AI", tech: "Anthropic Claude API", why: "Content generation, scene structuring, chart data" },
  { layer: "Video Processing", tech: "FFmpeg (spawnSync)", why: "Scene stitching, muxing, multi-format export" },
  { layer: "AE Export", tech: "ExtendScript (JSX)", why: "Keyframe reconstruction in After Effects" },
  { layer: "Styling", tech: "Tailwind CSS, CSS custom properties (HSL)", why: "Editorial design system with warm palette" },
  { layer: "Desktop", tech: "Electron", why: "Native desktop wrapper, bundled FFmpeg + Chrome" },
  { layer: "Cloud Render", tech: "@remotion/lambda, AWS S3", why: "Serverless video rendering with parallel fan-out" },
  { layer: "Auth", tech: "NextAuth v5, JWT", why: "OAuth providers + JWT propagation to Express" },
  { layer: "Payments", tech: "Stripe Checkout + Webhooks", why: "Credits-based billing with atomic fulfillment" },
];

const marketPositioning = [
  {
    player: "Canva / Lumen5",
    position: "Template-first",
    strength: "Fast, zero learning curve",
    gap: "Low ceiling — no timeline, no fine-grained control, no AE export. Output looks generic.",
  },
  {
    player: "Premiere / After Effects",
    position: "Professional NLE",
    strength: "Unlimited creative control",
    gap: "6-8 hour production cycles. No AI assistance. Requires trained operators.",
  },
  {
    player: "Descript / Synthesia",
    position: "AI-native video",
    strength: "Script-to-video, avatar generation",
    gap: "Talking-head focused. Limited scene types. No data visualization or custom animation.",
  },
  {
    player: "Rendomat",
    position: "Structured video from documents",
    strength: "AI structures content → visual timeline → multi-format export + AE interop + cloud rendering",
    gap: "No real-time collaboration yet.",
  },
];

const strategicDecisions = [
  {
    num: "01",
    label: "Build vs. Buy",
    title: "Custom timeline over off-the-shelf",
    description:
      "Every timeline library I evaluated (react-timeline-editor, Plyr, Video.js) assumed a single-track model. Rendomat needs four parallel tracks (scenes, transitions, audio, video) with mutual-exclusive selection, frame-precise positioning, and drag-to-reorder. Building from scratch took 3 weeks longer, but the UX advantage compounds: every editing interaction maps directly to the data model with zero translation layer.",
    outcome: "4-track timeline with sub-frame precision, 0 abstraction leaks from third-party libraries",
  },
  {
    num: "02",
    label: "Positioning",
    title: "The gap between Canva and Premiere",
    description:
      "Template tools are fast but creatively constrained. Professional NLEs are powerful but slow. Rendomat occupies the middle: AI handles the 80% (content structuring, scene selection, initial layout), then a real timeline editor gives fine-grained control over the remaining 20%. The After Effects export bridge means power users never feel trapped.",
    outcome: "15-minute document-to-video vs. 6-8 hours in traditional tools",
  },
  {
    num: "03",
    label: "Moat",
    title: "Scene-type system as a compounding asset",
    description:
      "Each scene type (bar chart, equation, spotlights, image gallery) is a self-contained React component. Adding a new type takes one component file and one database seed entry — no plugin architecture, no SDK. This means the scene library grows cheaply, and each new type increases the range of documents the AI can handle. The system gets more capable without getting more complex.",
    outcome: "14 scene types, linear cost to add more, exponential content coverage",
  },
  {
    num: "04",
    label: "Go-to-Market",
    title: "Client-first architecture enables white-labeling",
    description:
      "The client entity isn't just organization — it's the unit of customization. Each client has default personas, behavior overrides, themes, and cached research. This architecture naturally supports an agency model: one Rendomat instance serves multiple client brands with isolated visual identities. White-label capability is a data model decision, not a feature bolt-on.",
    outcome: "Multi-tenant by default, per-client theming and AI behavior",
  },
  {
    num: "05",
    label: "Platform",
    title: "Web-to-desktop via Electron",
    description:
      "Video editors are desktop apps for a reason — large file I/O, native codec access, and GPU-bound rendering don't fit the browser sandbox. Rather than rewriting the stack, Electron wraps the existing Express + Next.js + Remotion architecture: the main process runs the backend server, the renderer shows the UI, and FFmpeg/Chrome binaries ship bundled. One codebase serves both web deployment and native desktop. The migration cost is one file (electron/main.js); the architecture was already structured for it because every path is relative and the frontend connects to the backend via localhost REST.",
    outcome: "Single-click desktop app, zero architecture changes, same codebase for web and native",
  },
];

const systemLoops = [
  {
    num: "01",
    title: "Cache → speed → iteration → quality",
    description:
      "Per-scene SHA256 caching creates a virtuous cycle. Fast renders (under 5 seconds for single-scene edits) encourage more iterations. More iterations produce better output. Better output builds trust in the tool, which drives deeper usage of advanced features. The caching system isn't just a performance optimization — it's the engine of user engagement.",
    type: "reinforcing" as const,
  },
  {
    num: "02",
    title: "Scene types → AI coverage → content range",
    description:
      "Each new scene type expands what the AI can generate from a document. When I added the equation scene, the system could suddenly handle academic papers. When I added the spotlights scene, product walkthrough documents became viable input. The AI's content-structuring model and the scene library co-evolve: broader scenes train better structuring, and better structuring justifies more scene types.",
    type: "reinforcing" as const,
  },
  {
    num: "03",
    title: "Rendering cost → architecture constraints",
    description:
      "Video rendering is CPU-intensive and blocks the Node.js event loop. This constraint forced three architectural decisions: (1) per-scene caching to minimize redundant renders, (2) separate render worker processes, and (3) the transition system rendering independently from scenes. A downstream constraint became an upstream organizing principle — the entire pipeline is shaped by the need to minimize render operations.",
    type: "balancing" as const,
  },
  {
    num: "04",
    title: "Multi-format → data/view separation",
    description:
      "Supporting 16:9, 1:1, and 9:16 from the same content forced a clean separation between scene data (what to show) and composition (how to lay it out). This constraint propagated through the entire system: the database stores content-only data, the Remotion components handle layout per aspect ratio, and themes are resolution-independent. Platform fragmentation as an input produced better architecture as an output.",
    type: "balancing" as const,
  },
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// =============================================================================
// PAGE
// =============================================================================

export default function CaseStudyPage() {
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
            Rendomat
          </Link>
          <div className="flex items-center gap-6">
            <a href="#strategy" className="link-subtle text-sm">
              Strategy
            </a>
            <a href="#architecture" className="link-subtle text-sm">
              Architecture
            </a>
            <a href="#systems" className="link-subtle text-sm">
              Systems
            </a>
            <a href="#design" className="link-subtle text-sm">
              Design
            </a>
            <a href="#flow" className="link-subtle text-sm">
              Flow
            </a>
            <a href="#infrastructure" className="link-subtle text-sm">
              Infra
            </a>
          </div>
        </div>
      </motion.nav>

      {/* ================================================================== */}
      {/* HERO                                                                */}
      {/* ================================================================== */}
      <section className="pt-32 pb-16 px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto"
        >
          <motion.p variants={fadeInUp} className="caption mb-6">
            Product Case Study
          </motion.p>

          <motion.h1
            variants={fadeInUp}
            className="headline text-5xl md:text-7xl text-[hsl(var(--foreground))] mb-8"
          >
            Designing a{" "}
            <em className="italic text-[hsl(var(--accent))]">production pipeline</em>
            <br />
            <span className="text-[hsl(var(--foreground-muted))]">
              not just a UI
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-10"
          >
            Rendomat is a full-stack video platform I designed and built solo —
            AI content structuring, a custom timeline editor, per-scene cached
            rendering, and multi-format export with After Effects interop.
            Strategy, systems architecture, and interface design in one product.
          </motion.p>

          {/* Key Results */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap gap-3"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2.5 border border-[hsl(var(--accent))] bg-[hsl(var(--accent-muted))]">
              <Clock className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
              <span className="text-sm text-[hsl(var(--foreground))]">
                Content to production in under 15 minutes
              </span>
            </div>
            <div className="inline-flex items-center gap-3 px-4 py-2.5 border border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
              <Code className="w-3.5 h-3.5 text-[hsl(var(--foreground-subtle))]" />
              <span className="text-sm text-[hsl(var(--foreground))]">
                Solo-built, 0 to 1
              </span>
            </div>
            <div className="inline-flex items-center gap-3 px-4 py-2.5 border border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
              <Layers className="w-3.5 h-3.5 text-[hsl(var(--foreground-subtle))]" />
              <span className="text-sm text-[hsl(var(--foreground))]">
                Strategy + systems + interface design
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Product Metrics */}
      <section className="py-10 px-6 border-y border-[hsl(var(--border))]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {metrics.map((m) => (
              <motion.div key={m.label} variants={fadeInUp}>
                <p className="caption mb-2">{m.label}</p>
                <p className="headline text-3xl text-[hsl(var(--foreground))] mb-1">
                  {m.value}
                </p>
                <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                  {m.detail}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* THE PROBLEM                                                         */}
      {/* ================================================================== */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              The Problem
            </motion.p>
            <motion.div variants={fadeInUp}>
              <p className="headline text-3xl text-[hsl(var(--foreground))] leading-snug mb-6">
                Content teams produce great material.{" "}
                <span className="text-[hsl(var(--foreground-muted))]">
                  But the path from written content to{" "}
                  <em className="italic">produced video</em> requires tools
                  they don&apos;t have, skills they can&apos;t hire for, and
                  timelines they can&apos;t afford.
                </span>
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="grid md:grid-cols-3 gap-6 mt-12"
            >
              {[
                {
                  icon: <Clock className="w-5 h-5" />,
                  title: "Slow turnaround",
                  text: "Agency videos take 2-4 weeks at $2,000-10,000 per minute. Internal teams using After Effects spend 6-8 hours per video.",
                },
                {
                  icon: <Layers className="w-5 h-5" />,
                  title: "Tool complexity",
                  text: "Professional NLEs require months of training. Simplified tools lack multi-format export and fine-grained control over timing.",
                },
                {
                  icon: <Settings className="w-5 h-5" />,
                  title: "Platform fragmentation",
                  text: "Each platform demands different aspect ratios. A single video concept becomes 3-5 separate production jobs.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="p-5 border border-[hsl(var(--border))]"
                >
                  <div className="text-[hsl(var(--foreground-subtle))] mb-3">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="divider mx-6" />

      {/* ================================================================== */}
      {/* THE APPROACH                                                        */}
      {/* ================================================================== */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              The Approach
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-4"
            >
              Video as a <em className="italic">rendering</em> problem
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-8"
            >
              I evaluated Premiere/AE (powerful but not programmable), template
              platforms like Canva (easy but ceiling is low), and Remotion
              (code-based video with React). Remotion was the right abstraction:
              scenes become React components, themes become data, and rendering
              is automated.
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-12"
            >
              But Remotion has no visual editor — it&apos;s a rendering engine, not a
              product. I needed to build everything else: the database, the API,
              the timeline editor, the caching layer, the AI pipeline, the export
              system. That&apos;s what this case study is about.
            </motion.p>
          </motion.div>

          {/* What I chose & why */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid md:grid-cols-2 gap-6"
          >
            <div className="p-5 bg-[hsl(var(--accent-muted))] border border-[hsl(var(--accent))]/20">
              <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                What Remotion gives me
              </p>
              <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                Frame-by-frame rendering via headless Chrome. Full web platform
                access (CSS, SVG, canvas). Component model for scenes.
                Automated MP4 output via FFmpeg.
              </p>
            </div>
            <div className="p-5 bg-[hsl(var(--surface))] border border-[hsl(var(--border))]">
              <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                What I built around it
              </p>
              <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                Database + REST API, custom timeline editor, per-scene caching,
                AI content pipeline, transition system, audio/video muxing,
                multi-format export, and AE interop.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="divider mx-6" />

      {/* ================================================================== */}
      {/* STRATEGIC POSITIONING                                               */}
      {/* ================================================================== */}
      <section id="strategy" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              Strategic Positioning
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-4"
            >
              Where this sits in the <em className="italic">market</em>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-16"
            >
              The video creation market bifurcates into easy-but-limited templates and
              powerful-but-slow professional tools. Rendomat is positioned in the gap:
              AI-assisted structuring with real editing control and a professional
              export path.
            </motion.p>
          </motion.div>

          {/* Competitive Landscape */}
          <div className="space-y-4 mb-20">
            {marketPositioning.map((player, index) => (
              <motion.div
                key={player.player}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{
                  delay: index * 0.08,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`grid md:grid-cols-12 gap-4 p-5 border ${
                  player.player === "Rendomat"
                    ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent-muted))]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
                }`}
              >
                <div className="md:col-span-3">
                  <p className={`text-sm font-medium ${
                    player.player === "Rendomat"
                      ? "text-[hsl(var(--accent))]"
                      : "text-[hsl(var(--foreground))]"
                  }`}>
                    {player.player}
                  </p>
                  <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-0.5">
                    {player.position}
                  </p>
                </div>
                <div className="md:col-span-4">
                  <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-1">Strength</p>
                  <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                    {player.strength}
                  </p>
                </div>
                <div className="md:col-span-5">
                  <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-1">
                    {player.player === "Rendomat" ? "Current limitation" : "Gap"}
                  </p>
                  <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                    {player.gap}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Strategic Decisions */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              Strategic Decisions
            </motion.p>
            <motion.h3
              variants={fadeInUp}
              className="headline text-2xl md:text-3xl text-[hsl(var(--foreground))] mb-4"
            >
              Bets that shaped the <em className="italic">product</em>
            </motion.h3>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-14"
            >
              Four decisions that go beyond &ldquo;what should the UI look like&rdquo;
              — each one is a business-level bet about where value accrues.
            </motion.p>
          </motion.div>

          <div className="space-y-14">
            {strategicDecisions.map((decision, index) => (
              <motion.div
                key={decision.num}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{
                  duration: 0.5,
                  delay: index * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid md:grid-cols-12 gap-6"
              >
                <div className="md:col-span-2">
                  <span className="font-mono text-sm text-[hsl(var(--foreground-subtle))]">
                    {decision.num}
                  </span>
                  <p className="caption mt-1 text-[10px]">{decision.label}</p>
                </div>
                <div className="md:col-span-10">
                  <h3 className="headline text-2xl text-[hsl(var(--foreground))] mb-3">
                    {decision.title}
                  </h3>
                  <p className="text-[hsl(var(--foreground-muted))] leading-relaxed mb-4 max-w-xl">
                    {decision.description}
                  </p>
                  <div className="p-3 border-l-2 border-[hsl(var(--accent))] bg-[hsl(var(--surface))]">
                    <p className="text-xs text-[hsl(var(--foreground-subtle))] mb-0.5">Outcome</p>
                    <p className="text-xs font-mono text-[hsl(var(--foreground-muted))] leading-relaxed">
                      {decision.outcome}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider mx-6" />

      {/* ================================================================== */}
      {/* TECHNICAL ARCHITECTURE                                              */}
      {/* ================================================================== */}
      <section id="architecture" className="py-24 px-6 bg-[hsl(var(--surface))] scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              Technical Architecture
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-4"
            >
              Three layers, one <em className="italic">pipeline</em>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-16"
            >
              The system is split into a Next.js frontend for editing, an
              Express backend for data and orchestration, and a Remotion engine
              for rendering. Each layer is independently responsible for its
              domain.
            </motion.p>
          </motion.div>

          {/* Stack Layers */}
          <div className="space-y-6">
            {stackLayers.map((layer, index) => (
              <motion.div
                key={layer.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{
                  delay: index * 0.12,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="border border-[hsl(var(--border))] bg-[hsl(var(--background))]"
              >
                <div
                  className="px-6 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2"
                      style={{ backgroundColor: `hsl(${layer.color})` }}
                    />
                    <h3 className="text-sm font-medium text-[hsl(var(--foreground))] uppercase tracking-wide">
                      {layer.title}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-[hsl(var(--foreground-subtle))]">
                    {layer.tech}
                  </span>
                </div>
                <div className="px-6 py-4">
                  <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                    {layer.items.map((item) => (
                      <li
                        key={item}
                        className="text-sm text-[hsl(var(--foreground-muted))] flex gap-2"
                      >
                        <span className="text-[hsl(var(--foreground-subtle))] mt-0.5 shrink-0">&mdash;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tech Stack Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 border border-[hsl(var(--border))] bg-[hsl(var(--background))] overflow-hidden"
          >
            <div className="px-6 py-3 border-b border-[hsl(var(--border))]">
              <p className="caption">Full Stack</p>
            </div>
            <div className="divide-y divide-[hsl(var(--border))]">
              {techStack.map((row) => (
                <div
                  key={row.layer}
                  className="grid grid-cols-12 px-6 py-3 gap-4"
                >
                  <span className="col-span-2 text-sm font-medium text-[hsl(var(--foreground))]">
                    {row.layer}
                  </span>
                  <span className="col-span-4 font-mono text-xs text-[hsl(var(--foreground-muted))] self-center">
                    {row.tech}
                  </span>
                  <span className="col-span-6 text-sm text-[hsl(var(--foreground-subtle))]">
                    {row.why}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* ENGINEERING DEEP DIVES                                              */}
      {/* ================================================================== */}
      <section id="engineering" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              Engineering Decisions
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-4"
            >
              What I built and <em className="italic">why</em>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-16"
            >
              Six core systems that make the platform work. Each involved
              architectural trade-offs — I chose simplicity and directness over
              abstraction wherever possible.
            </motion.p>
          </motion.div>

          <div className="space-y-16">
            {engineeringDecisions.map((decision, index) => (
              <motion.div
                key={decision.num}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{
                  duration: 0.5,
                  delay: index * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid md:grid-cols-12 gap-6"
              >
                <div className="md:col-span-2">
                  <span className="font-mono text-sm text-[hsl(var(--foreground-subtle))]">
                    {decision.num}
                  </span>
                </div>
                <div className="md:col-span-10">
                  <h3 className="headline text-2xl text-[hsl(var(--foreground))] mb-3">
                    {decision.title}
                  </h3>
                  <p className="text-[hsl(var(--foreground-muted))] leading-relaxed mb-4 max-w-xl">
                    {decision.description}
                  </p>
                  <div className="p-3 border-l-2 border-[hsl(var(--accent))] bg-[hsl(var(--surface))] mb-4">
                    <p className="text-xs font-mono text-[hsl(var(--foreground-muted))] leading-relaxed">
                      {decision.detail}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {decision.tags.map((tag) => (
                      <span key={tag} className="pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider mx-6" />

      {/* ================================================================== */}
      {/* SYSTEMS DESIGN                                                      */}
      {/* ================================================================== */}
      <section id="systems" className="py-24 px-6 bg-[hsl(var(--surface))] scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              Systems Design
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-4"
            >
              Feedback loops and <em className="italic">constraints</em>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-6"
            >
              Software systems aren&apos;t static structures — they&apos;re dynamic
              systems with reinforcing loops and balancing constraints. Understanding
              these patterns explains why the architecture looks the way it does
              better than any component diagram.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-4 mb-16"
            >
              {[
                { icon: <TrendingUp className="w-3 h-3" />, label: "Reinforcing loop", desc: "Growth compounds" },
                { icon: <RefreshCw className="w-3 h-3" />, label: "Balancing loop", desc: "Constraint shapes design" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[hsl(var(--foreground-subtle))]">{item.icon}</span>
                  <span className="text-xs text-[hsl(var(--foreground-muted))]">
                    {item.label} — {item.desc}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <div className="space-y-14">
            {systemLoops.map((loop, index) => (
              <motion.div
                key={loop.num}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{
                  duration: 0.5,
                  delay: index * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid md:grid-cols-12 gap-6"
              >
                <div className="md:col-span-2">
                  <span className="font-mono text-sm text-[hsl(var(--foreground-subtle))]">
                    {loop.num}
                  </span>
                  <div className="flex items-center gap-1.5 mt-2">
                    {loop.type === "reinforcing" ? (
                      <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-[hsl(var(--accent-alt))]" />
                    )}
                    <span className="text-[10px] text-[hsl(var(--foreground-subtle))] uppercase tracking-wider">
                      {loop.type}
                    </span>
                  </div>
                </div>
                <div className="md:col-span-10">
                  <h3 className="headline text-2xl text-[hsl(var(--foreground))] mb-3">
                    {loop.title}
                  </h3>
                  <p className="text-[hsl(var(--foreground-muted))] leading-relaxed max-w-xl">
                    {loop.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider mx-6" />

      {/* ================================================================== */}
      {/* UX DESIGN                                                           */}
      {/* ================================================================== */}
      <section id="design" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              Design Rationale
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-4"
            >
              UX <em className="italic">principles</em>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-16"
            >
              Four principles that shaped the interface. The editorial visual
              style (sharp corners, warm tones, serif headlines) was a
              deliberate departure from generic SaaS aesthetics — the tool
              should feel like a creative environment, not an admin panel.
            </motion.p>
          </motion.div>

          <div className="space-y-14">
            {uxPrinciples.map((item, index) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid md:grid-cols-12 gap-6"
              >
                <div className="md:col-span-2">
                  <span className="font-mono text-sm text-[hsl(var(--foreground-subtle))]">
                    {item.num}
                  </span>
                </div>
                <div className="md:col-span-10">
                  <p className="caption mb-2">{item.principle}</p>
                  <h3 className="headline text-2xl text-[hsl(var(--foreground))] mb-3">
                    {item.title}
                  </h3>
                  <p className="text-[hsl(var(--foreground-muted))] leading-relaxed mb-4 max-w-xl">
                    {item.description}
                  </p>
                  <div className="flex gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="pill">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider mx-6" />

      {/* ================================================================== */}
      {/* USER PERSONAS (compact)                                             */}
      {/* ================================================================== */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              Who it&apos;s for
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-4"
            >
              User Personas
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-12"
            >
              Three archetypes spanning low-tech researchers to professional
              editors. The system needed to serve all three without
              compromising depth for simplicity or vice versa.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainerSlow}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="grid lg:grid-cols-3 gap-6"
          >
            {personas.map((persona) => (
              <motion.div
                key={persona.name}
                variants={fadeInUp}
                className="border border-[hsl(var(--border))] bg-[hsl(var(--surface))]"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[hsl(var(--border))]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="headline text-xl text-[hsl(var(--foreground))]">
                        {persona.name}
                      </h3>
                      <p className="text-sm text-[hsl(var(--foreground-muted))] mt-0.5">
                        {persona.role} — {persona.company}
                      </p>
                    </div>
                    <div
                      className="w-8 h-8 flex items-center justify-center border border-[hsl(var(--border))]"
                      style={{ color: `hsl(${persona.color})` }}
                    >
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                    {persona.bio}
                  </p>
                  <div className="flex gap-3 mt-3">
                    <span className="pill">Tech: {persona.techComfort}</span>
                  </div>
                </div>

                {/* Goals */}
                <div className="px-6 py-4 border-b border-[hsl(var(--border))]">
                  <p className="caption mb-2 flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    Goals
                  </p>
                  <ul className="space-y-1.5">
                    {persona.goals.map((goal) => (
                      <li
                        key={goal}
                        className="text-sm text-[hsl(var(--foreground-muted))] flex gap-2"
                      >
                        <span className="text-[hsl(var(--success))] mt-0.5 shrink-0">+</span>
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pain Points */}
                <div className="px-6 py-4">
                  <p className="caption mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Pain Points
                  </p>
                  <ul className="space-y-1.5">
                    {persona.painPoints.map((pain) => (
                      <li
                        key={pain}
                        className="text-sm text-[hsl(var(--foreground-muted))] flex gap-2"
                      >
                        <span className="text-[hsl(var(--error))] mt-0.5 shrink-0">&ndash;</span>
                        {pain}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="divider mx-6" />

      {/* ================================================================== */}
      {/* USER FLOW                                                           */}
      {/* ================================================================== */}
      <section id="flow" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              The Journey
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-4"
            >
              User Flow
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-12"
            >
              Four phases from document to rendered video. The editing loop
              is intentionally circular — preview renders feed back into the
              timeline for iteration before committing to a full export.
            </motion.p>
          </motion.div>

          <MermaidChart chart={userFlowChart} className="py-4" />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            className="mt-16"
          >
            <motion.h3
              variants={fadeInUp}
              className="headline text-2xl text-[hsl(var(--foreground))] mb-4"
            >
              Cloud Render Pipeline
            </motion.h3>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-8"
            >
              Authenticated users can offload rendering to AWS Lambda. The
              frontend sends a JWT, Express deducts a credit, Lambda fans out
              the work, and the completed video lands in S3.
            </motion.p>
          </motion.div>

          <MermaidChart chart={cloudRenderChart} className="py-4" />
        </div>
      </section>

      <div className="divider mx-6" />

      {/* ================================================================== */}
      {/* INFRASTRUCTURE DEEP DIVES                                           */}
      {/* ================================================================== */}
      <section id="infrastructure" className="py-24 px-6 bg-[hsl(var(--surface))] scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              Infrastructure
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-4"
            >
              Auth, payments, and <em className="italic">cloud rendering</em>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-[hsl(var(--foreground-muted))] max-w-2xl leading-relaxed mb-16"
            >
              Three infrastructure systems that turn a local tool into a deployed
              product: OAuth authentication, credits-based Stripe billing, and
              serverless video rendering on AWS Lambda. Each integrates with the
              same Express backend and SQLite database.
            </motion.p>
          </motion.div>

          {/* ---- AUTH FLOW ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 flex items-center justify-center border border-[hsl(var(--border))] text-[hsl(var(--foreground-subtle))]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="headline text-2xl text-[hsl(var(--foreground))]">
                  Authentication
                </h3>
                <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                  NextAuth v5 + JWT + Express middleware
                </p>
              </div>
            </div>
            <p className="text-[hsl(var(--foreground-muted))] leading-relaxed mb-8 max-w-2xl">
              NextAuth v5 handles Google and GitHub OAuth with JWT strategy. On
              sign-in, a callback syncs the user to the Express backend via a
              secret-protected REST endpoint. The JWT is signed with jose,
              propagated through the session callback, and sent as a Bearer token
              to Express. The Express{" "}
              <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                authenticateToken
              </span>{" "}
              middleware verifies the JWT and populates{" "}
              <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                req.user
              </span>{" "}
              for all protected endpoints.
            </p>

            <MermaidChart chart={authFlowChart} className="py-4 mb-8" />

            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: <Lock className="w-4 h-4" />,
                  title: "JWT propagation",
                  text: "Signed in Next.js, verified in Express. One token flows through the entire stack — no session store, no cookies on the API layer.",
                },
                {
                  icon: <Shield className="w-4 h-4" />,
                  title: "User sync on sign-in",
                  text: "The signIn callback POSTs to /api/auth/sync-user with a shared secret. This upserts the user record and initializes 3 signup credits.",
                },
                {
                  icon: <Database className="w-4 h-4" />,
                  title: "SQLite as source of truth",
                  text: "User records, credit balances, and transaction history live in SQLite. The JWT carries identity; the database carries state.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="p-5 border border-[hsl(var(--border))] bg-[hsl(var(--background))]"
                >
                  <div className="text-[hsl(var(--foreground-subtle))] mb-3">
                    {item.icon}
                  </div>
                  <h4 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ---- STRIPE BILLING ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 flex items-center justify-center border border-[hsl(var(--border))] text-[hsl(var(--foreground-subtle))]">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="headline text-2xl text-[hsl(var(--foreground))]">
                  Stripe Billing
                </h3>
                <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                  Credits-based payments with atomic fulfillment
                </p>
              </div>
            </div>
            <p className="text-[hsl(var(--foreground-muted))] leading-relaxed mb-8 max-w-2xl">
              Cloud renders cost credits. Users start with 3 free credits on
              signup, then purchase more through Stripe Checkout. The webhook
              endpoint is registered before{" "}
              <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                express.json()
              </span>{" "}
              middleware so the raw body is available for signature verification.
              Fulfillment is idempotent — the handler checks{" "}
              <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                stripe_session_id
              </span>{" "}
              before adjusting credits, preventing double-credit on webhook retries.
            </p>

            <MermaidChart chart={stripeFlowChart} className="py-4 mb-8" />

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                <div className="px-5 py-3 border-b border-[hsl(var(--border))]">
                  <p className="caption flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    Credit Packages
                  </p>
                </div>
                <div className="divide-y divide-[hsl(var(--border))]">
                  {[
                    { credits: 5, price: "$4.99", per: "$1.00 / render" },
                    { credits: 20, price: "$14.99", per: "$0.75 / render" },
                    { credits: 50, price: "$29.99", per: "$0.60 / render" },
                  ].map((pkg) => (
                    <div
                      key={pkg.credits}
                      className="px-5 py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-[hsl(var(--foreground))]">
                          {pkg.credits}
                        </span>
                        <span className="text-xs text-[hsl(var(--foreground-subtle))]">
                          credits
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {pkg.price}
                        </span>
                        <span className="text-xs text-[hsl(var(--foreground-subtle))] ml-2">
                          {pkg.per}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                <div className="px-5 py-3 border-b border-[hsl(var(--border))]">
                  <p className="caption flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    Transaction Types
                  </p>
                </div>
                <div className="divide-y divide-[hsl(var(--border))]">
                  {[
                    { type: "signup_bonus", description: "+3 credits on first OAuth sign-in", direction: "+" },
                    { type: "purchase", description: "Stripe Checkout fulfillment via webhook", direction: "+" },
                    { type: "render", description: "-1 credit per cloud render invocation", direction: "-" },
                  ].map((tx) => (
                    <div
                      key={tx.type}
                      className="px-5 py-3 flex items-center gap-3"
                    >
                      <span className={`text-sm font-mono ${
                        tx.direction === "+" ? "text-[hsl(var(--success))]" : "text-[hsl(var(--error))]"
                      }`}>
                        {tx.direction}
                      </span>
                      <div>
                        <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                          {tx.type}
                        </span>
                        <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                          {tx.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  icon: <Lock className="w-4 h-4" />,
                  title: "Webhook signature verification",
                  text: "The /api/stripe/webhook route uses express.raw() and Stripe's constructEvent to verify the webhook signature before processing. Registered before the JSON body parser to preserve the raw body.",
                },
                {
                  icon: <Database className="w-4 h-4" />,
                  title: "Atomic credit adjustment",
                  text: "adjustCredits() wraps the balance UPDATE and transaction INSERT in a single SQLite transaction. If either fails, both roll back. No partial state.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="p-5 border border-[hsl(var(--border))] bg-[hsl(var(--background))]"
                >
                  <div className="text-[hsl(var(--foreground-subtle))] mb-3">
                    {item.icon}
                  </div>
                  <h4 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ---- CLOUD RENDERING (LAMBDA) ---- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 flex items-center justify-center border border-[hsl(var(--border))] text-[hsl(var(--foreground-subtle))]">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="headline text-2xl text-[hsl(var(--foreground))]">
                  Cloud Rendering
                </h3>
                <p className="text-xs text-[hsl(var(--foreground-subtle))]">
                  @remotion/lambda + S3 + SSE progress
                </p>
              </div>
            </div>
            <p className="text-[hsl(var(--foreground-muted))] leading-relaxed mb-8 max-w-2xl">
              Local rendering ties up the user&apos;s machine for 3-5 minutes.
              The cloud pipeline offloads the entire job to{" "}
              <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                @remotion/lambda
              </span>
              . A{" "}
              <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                FullVideoComposition
              </span>{" "}
              bundles all scenes and transitions into a single Remotion composition,
              Lambda fans out rendering across parallel workers (40 frames per worker),
              and the final video lands in S3. The user sees real-time progress
              via Server-Sent Events, then gets a download link.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                <div className="px-5 py-3 border-b border-[hsl(var(--border))]">
                  <p className="caption flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Lambda Configuration
                  </p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {[
                    { label: "Codec", value: "H.264" },
                    { label: "Image format", value: "JPEG" },
                    { label: "Frames per worker", value: "40" },
                    { label: "Max retries", value: "1" },
                    { label: "Composition", value: "FullVideo-{aspect}" },
                    { label: "Output", value: "S3 presigned URL" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-[hsl(var(--foreground-subtle))]">
                        {row.label}
                      </span>
                      <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                <div className="px-5 py-3 border-b border-[hsl(var(--border))]">
                  <p className="caption flex items-center gap-2">
                    <Play className="w-3 h-3" />
                    Render Lifecycle
                  </p>
                </div>
                <div className="px-5 py-4">
                  <div className="space-y-3">
                    {[
                      { stage: "starting", desc: "Credit deducted, props built from DB, Lambda invoked" },
                      { stage: "rendering", desc: "Parallel workers render frames, SSE polls every 2s" },
                      { stage: "complete", desc: "S3 URL returned, video record updated, download ready" },
                      { stage: "error", desc: "Credit refund, error logged, user notified via SSE" },
                    ].map((step, i) => (
                      <div key={step.stage} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 mt-1.5 ${
                            step.stage === "error"
                              ? "bg-[hsl(var(--error))]"
                              : step.stage === "complete"
                              ? "bg-[hsl(var(--success))]"
                              : "bg-[hsl(var(--accent))]"
                          }`} />
                          {i < 3 && (
                            <div className="w-px h-full bg-[hsl(var(--border))]" />
                          )}
                        </div>
                        <div className="pb-2">
                          <span className="font-mono text-xs text-[hsl(var(--foreground))]">
                            {step.stage}
                          </span>
                          <p className="text-xs text-[hsl(var(--foreground-subtle))] mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: <Cloud className="w-4 h-4" />,
                  title: "FullVideoComposition",
                  text: "Unlike local rendering which caches individual scenes, Lambda renders a single composition containing all scenes and transitions. The tradeoff: no incremental caching, but massive parallelism across workers.",
                },
                {
                  icon: <Zap className="w-4 h-4" />,
                  title: "SSE progress reuse",
                  text: "The same Server-Sent Events infrastructure serves both local and cloud progress. The frontend doesn't care where the video is rendering — it just subscribes to the progress stream.",
                },
                {
                  icon: <Server className="w-4 h-4" />,
                  title: "Aspect-ratio routing",
                  text: "The Lambda function name and composition ID are derived from the video's aspect ratio. A 16:9 video renders as FullVideo-16x9, a 9:16 as FullVideo-9x16. Same code, different compositions.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="p-5 border border-[hsl(var(--border))] bg-[hsl(var(--background))]"
                >
                  <div className="text-[hsl(var(--foreground-subtle))] mb-3">
                    {item.icon}
                  </div>
                  <h4 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="divider mx-6" />

      {/* ================================================================== */}
      {/* REFLECTIONS                                                         */}
      {/* ================================================================== */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <motion.p variants={fadeInUp} className="caption mb-6">
              Reflections
            </motion.p>
            <motion.h2
              variants={fadeInUp}
              className="headline text-3xl text-[hsl(var(--foreground))] mb-8"
            >
              What I <em className="italic">learned</em>
            </motion.h2>

            <motion.div variants={fadeInUp} className="space-y-8">
              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Start with the timeline editor
                </h3>
                <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                  I built the data model and rendering pipeline first, then the
                  visual timeline. In retrospect, the timeline is what makes the
                  tool usable for non-technical people. Building it earlier would
                  have surfaced UX issues sooner and driven better API design.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Cached rendering changed everything
                </h3>
                <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                  Early prototypes re-rendered the entire video on every change.
                  Users abandoned editing after 2-3 iterations. Per-scene SHA256
                  caching reduced feedback time from 45 seconds to under 5.
                  That single optimization made the product viable.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Separate the render worker earlier
                </h3>
                <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                  Rendering blocks the Node.js event loop. I eventually moved it
                  to a separate process, but should have done that from day one.
                  Early architectural decisions about process boundaries save
                  significant refactoring later.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  AI transparency is a spectrum
                </h3>
                <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                  I initially showed every AI decision in real time — scene type
                  selection, content splitting, animation matching. It created
                  anxiety, not trust. The final design shows the result, then
                  lets users inspect and override each decision at their own
                  pace.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                  Preview rendering pays for itself immediately
                </h3>
                <p className="text-sm text-[hsl(var(--foreground-muted))] leading-relaxed">
                  The batch pipeline that renders 320x180 MP4 preview clips for
                  transitions made the UI dramatically better. Seeing actual
                  rendered motion instead of text labels changed how users
                  selected transitions. The same approach now extends to theme
                  and text layout previews.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* CTA                                                                 */}
      {/* ================================================================== */}
      <section className="py-24 px-6 bg-[hsl(var(--surface))]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="headline text-3xl md:text-4xl text-[hsl(var(--foreground))] mb-6">
            See it in <em className="italic">action</em>
          </h2>
          <p className="text-[hsl(var(--foreground-muted))] mb-8">
            Try the editor yourself. Paste content, edit on the timeline,
            and export.
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

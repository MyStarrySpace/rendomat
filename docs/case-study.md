# Rendomat: Building a Programmatic Video Studio

A case study on designing and engineering a generative video platform at GoInvo.

---

## The Problem

At GoInvo, we produce outreach videos (explainers, pitch decks, data-driven narratives) for healthcare and civic design projects. The process was entirely manual: open Premiere or After Effects, lay out text, animate charts by hand, export, repeat. Every new video meant starting from scratch.

The bottleneck wasn't creative direction. It was production. A two-minute outreach video with six scenes, a few charts, and some text animation could take a full day. Change the data? Re-render. New client branding? Rebuild the project. Need it in square for Instagram and vertical for TikTok? Do it again twice.

The people who needed to create these videos (designers, researchers, project leads) weren't video editors. They had the content and the stories, but the tooling stood between them and a finished video.

I wanted to build something that removed that barrier entirely.

---

## Research

### Traditional Editors (Premiere, Filmora, After Effects)

These are powerful, but they solve a different problem. They're built for editors who want frame-level control over a single project. For our use case, generating videos from structured data with consistent branding, they introduced friction at every step. Templates help, but they're rigid. You still have to manually swap text, re-time animations, and export per platform.

After Effects was the closest to what I wanted in terms of motion quality, but it's not programmable in any meaningful way for batch generation.

### Template Platforms (Canva, Lumen5)

These get the UX right; non-technical users can produce videos quickly. But the output ceiling is low. You're locked into their template library, their animation vocabulary, their export options. There's no way to render a custom chart animation or build a transition system that matches your brand's motion language.

For a studio that values design craft, "good enough" templates weren't good enough.

### Remotion (Code-Based Video)

Remotion reframes video as a React rendering problem. Each frame is a React component. You get the full power of the web platform (CSS, SVG, canvas, WebGL), composed with React's component model and rendered frame-by-frame to video via headless Chrome and FFmpeg.

This was the right abstraction. It meant:

- **Scenes are components.** A bar chart scene, a quote scene, a stats scene. Each is a self-contained React component with typed props.
- **Themes are data.** Colors, fonts, and effects are configuration, not baked into project files.
- **Aspect ratios are free.** The same composition renders at 16:9, 1:1, or 9:16 by changing two numbers.
- **Rendering is automated.** Generate a JSON payload, call `renderMedia`, get an MP4.

The tradeoff is that Remotion has no visual editor; you're writing code. But that's exactly what enables the automation we needed.

---

## Choosing the Visual Style

Most video generation tools and SaaS dashboards default to the same look: rounded corners, blue-purple gradients, geometric sans-serif type. It's clean, but it's generic. Everything looks like a Figma prototype.

I wanted Rendomat to feel different, both the tool itself and the videos it produces. The interface should feel like a creative environment, not an admin panel. People should feel comfortable and inspired when they open it.

The direction I landed on is editorial: inspired by VSCO, print magazines, and film photography aesthetics.

**Key decisions:**

- **Sharp corners everywhere.** No border-radius. It's a small detail that immediately changes the tone from "software product" to "design tool." It signals intentionality.
- **Warm, muted tones.** The background sits at hue 30 (warm beige), with an amber/gold accent at hue 38. It feels like paper, not screen.
- **Serif typography for headlines.** Instrument Serif for titles gives weight and character. Combined with uppercase tracked captions for labels, it creates a clear typographic hierarchy that feels considered.
- **Minimal ornamentation.** No gradients, no decorative shadows, no illustrations. The content (the videos, the timeline, the scene data) is the interface.

This aesthetic carries through to the generated videos too. The seven built-in themes range from clinical healthcare blues to bold cinematic gradients, but they all share a sense of restraint. Motion is purposeful. Text is readable. Charts are clear.

---

## Architecture Decisions

### Scene Composition System

The core abstraction is the scene. Rendomat ships with 13 scene types:

- Text and quote scenes for narrative content
- Five chart types (bar, line, pie, area, progress bars) for data visualization
- Image scenes (single, dual, grid, gallery) for visual content
- An equation scene with LaTeX rendering and step-by-step reveals

Each scene is a React component that accepts typed props (`SceneData`) and renders within a frame range. Scenes are composed sequentially into a video, with transitions between them.

This component model means adding a new scene type is just writing a new React component. No framework plugins, no custom DSL. Just React.

### Smart Caching

Rendering video is slow. A seven-scene video can take 2-3 minutes on initial render. But most edits only touch one or two scenes.

The caching system hashes each scene's data and frame range with SHA256. Before rendering, it checks the cache. Only scenes with changed hashes get re-rendered. The final video is stitched from cached clips using FFmpeg.

The result: editing one scene in a seven-scene video drops render time from minutes to under a minute. Changing nothing (just re-exporting) takes seconds.

### Transition System

Transitions between scenes are rendered as separate clips and stitched in. This keeps them independent of the scene caching, so changing a transition doesn't invalidate the scenes on either side.

The system supports 17 transition types across four categories:

- **Basic:** cut, crossfade, fade to black/white
- **Directional:** slide and wipe in four directions each
- **Cinematic:** zoom, blur, glitch, morph

Each transition has a preset configuration (duration, easing curve) and renders between two scene snapshots or solid colors. The easing system supports linear, ease-in/out, ease-in-out, and spring physics.

To make transitions browsable, I built a batch rendering pipeline that generates 320x180 MP4 preview clips for all 16 animated transition types. This lets the UI show actual rendered previews instead of text labels.

### After Effects Export

For projects that need post-production polish beyond what Remotion handles, Rendomat can export a full After Effects project. The export pipeline generates a JSON manifest describing every layer, keyframe, and easing curve, then an ExtendScript (JSX) importer reconstructs the composition in After Effects with accurate timing, blend modes, and bezier easing.

This was important for the studio workflow. Rendomat handles the 90% case: structured content rendered programmatically. But when a client needs a custom animation or a one-off visual effect, the project transfers cleanly into After Effects without starting over.

### Multi-Platform Export

A single video project renders to three aspect ratios:

| Format | Resolution | Platforms |
|--------|-----------|-----------|
| 16:9 | 1920x1080 | YouTube, website embeds, LinkedIn video |
| 1:1 | 1080x1080 | Instagram feed, LinkedIn feed |
| 9:16 | 1080x1920 | TikTok, Instagram Reels, YouTube Shorts |

The composition adapts layout automatically. This is where the "reuse potential" became clear. The same scene data that drives an outreach video also drives a week's worth of social media content in three formats.

---

## From Outreach to Recurring Content

The original scope was one-off outreach videos: a pitch to a potential partner, an explainer for a new project, a data visualization for a report.

Once the scene and caching systems were working, the pivot to recurring social media content was obvious. The engine already supported:

- **Structured data in, video out.** Feed it updated stats, new quotes, fresh chart data, and get a new video without redesigning anything.
- **Multi-format export.** One render pass produces content for every platform.
- **Theming.** Switch between client brands without rebuilding scenes.
- **AI content generation.** Claude integration generates scene content from text descriptions, creates chart data, and improves copy, reducing the content bottleneck alongside the production bottleneck.

A studio that previously spent a day on one video can now produce a batch of platform-specific clips from the same source material, with consistent branding and professional motion design.

---

## Technical Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Video engine | Remotion 4, React, TypeScript | Programmatic video as React components |
| Frontend | Next.js 15, Framer Motion | Interactive timeline editor, scene configuration |
| Backend | Express.js, better-sqlite3 | Render orchestration, scene caching, client management |
| AI | Anthropic Claude API | Content generation, chart data, copy improvement |
| Video processing | FFmpeg | Scene stitching, multi-format export |
| After Effects | ExtendScript (JSX) | Project export with keyframe reconstruction |
| Styling | CSS custom properties (HSL) | Theme system with warm editorial palette |

---

## What I'd Do Differently

- **Start with the timeline editor.** I built the data model and rendering pipeline first, then added the visual timeline. In retrospect, the timeline is what makes the tool usable for non-technical people. Building it earlier would have surfaced UX issues sooner.
- **Separate the render worker earlier.** Rendering blocks the Node.js event loop. I moved it to a worker process, but doing that from day one would have avoided some early architectural debt.
- **Invest in preview rendering sooner.** The transition preview pipeline (batch-rendering small MP4 clips) made the UI dramatically better. The same approach would benefit scene type previews and theme previews.

---

## Outcome

Rendomat is a working video generation studio that turns structured content into multi-platform video with professional motion design. It serves GoInvo's need for both one-off outreach videos and recurring social media content, while being accessible to team members who aren't video editors.

The project demonstrates that programmatic video, treating frames as a rendering problem rather than an editing problem, is a viable approach for studios that need volume, consistency, and brand control without sacrificing design quality.

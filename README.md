# Rendomat

A generative video creation platform built with Next.js, Remotion, and TypeScript. Create professional VSL (Video Sales Letter) content with AI-powered slide generation, smart scene duration, and lyric-video style animations.

## Project Structure

```
vsl-generator/
├── app/                    # Next.js application
│   ├── app/               # Next.js App Router pages
│   ├── components/        # Shared UI components
│   └── lib/               # API client, themes, utilities
├── remotion/              # Remotion video components
│   ├── Root.tsx          # Remotion root with compositions
│   ├── scenes/           # Scene components (TextOnly, Quote, Stats, etc.)
│   ├── components/       # Reusable video components
│   └── lib/              # Animation presets, motion utilities
├── server/               # Backend render server
│   ├── render-server.mjs # Express API server
│   ├── render-worker.cjs # Remotion render worker
│   ├── database.mjs      # SQLite database
│   ├── ai-service.mjs    # Claude AI integration
│   └── personas.mjs      # AI persona system
├── scripts/              # Utility scripts
│   └── seed-database.mjs # Database seeding with GoInvo demo
└── data/                 # SQLite database storage
```

## Key Features

- **Multi-Client System**: Manage multiple clients and their video projects
- **AI-Powered Generation**: Claude AI generates slides from descriptions with persona customization
- **Smart Scene Duration**: Automatic duration calculation based on content length, scene type, and animation style
- **Animation Presets**: Professional motion design with lyric-video style options (stacking, cascade, burst)
- **Scene-Based Rendering**: Individual scene rendering with intelligent caching
- **Multi-Platform Export**: Render for YouTube (16:9), Instagram (1:1, 9:16), TikTok, LinkedIn
- **Research Integration**: Web research and citation support for fact-based content
- **Real-time Progress**: SSE-based render progress with per-scene status

## Quick Start

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# App dependencies
cd app && npm install && cd ..
```

### 2. Ensure Browser for Remotion

```bash
npm run remotion:ensure-browser
```

### 3. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your API keys (Anthropic, Pexels, ElevenLabs)
```

### 4. Seed the Database

```bash
npm run seed-db
```

This creates the GoInvo demo client with a showcase video demonstrating various scene types and animation presets.

### 5. Start the Servers

**Terminal 1 - Render Server:**
```bash
npm run render-server
```
Starts on http://localhost:4321

**Terminal 2 - Next.js App:**
```bash
cd app && npm run dev
```
Starts on http://localhost:3456

## Animation Presets

### Professional Presets
- **minimal** - Subtle, professional animations
- **smooth** - Gentle, flowing movement
- **elegant** - Refined, sophisticated timing
- **cinematic** - Slow, epic atmosphere

### Energetic Presets
- **energetic** - Bouncy, playful feel
- **dramatic** - Bold, impactful entrances
- **kinetic** - Fast, dynamic motion
- **typewriter** - Sequential text reveals

### Lyric Video Style
- **lyric** - Words fly in from alternating directions
- **stacking** - Words fly up and stack into sentences
- **cascade** - Words drop down from above
- **burst** - Words burst in from center with scale

## Scene Types

- **text-only** - Title and body text
- **quote** - Testimonial with attribution
- **stats** - Key metrics display
- **single-image** - Image with caption
- **dual-images** - Side-by-side images
- **grid** - 2x2 image grid
- **bar-chart** - Animated bar charts
- **progress-bars** - Horizontal progress indicators
- **equation** - Mathematical expressions

## Smart Duration Calculation

Scene duration is automatically calculated based on:
- **Text length**: ~1.5 words/second for video comprehension
- **Scene type**: Charts and stats get more time
- **Animation preset**: Lyric styles get 30-40% more time
- **Constraints**: 4-25 seconds per scene

## API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Videos
- `GET /api/videos` - List videos (optional `?client_id=`)
- `POST /api/videos` - Create video
- `GET /api/videos/:id` - Get video
- `PUT /api/videos/:id` - Update video
- `POST /api/videos/:id/render-scenes` - Render full video
- `POST /api/videos/:id/render-multi` - Multi-platform export

### Scenes
- `GET /api/videos/:id/scenes` - List scenes for video
- `POST /api/videos/:id/scenes` - Create scene
- `PUT /api/scenes/:id` - Update scene
- `POST /api/scenes/:id/render` - Render individual scene
- `GET /api/scenes/:id/preview` - Get scene preview
- `DELETE /api/scenes/:id/cache` - Clear scene cache

### AI Generation
- `POST /api/ai/generate-slides` - Generate slides from description
- `POST /api/ai/generate-slides-with-research` - Generate with web research

## Testing

Tests use Node.js built-in test runner (`node:test`) — no extra test dependencies.

```bash
# Server-side: state management, video lifecycle, cache invalidation, credits, reorder
node --test server/test/state-management.test.mjs

# Server-side: render pipeline integration (requires running server on :4321)
node --test server/test/render-pipeline.test.mjs

# App-side: render state logic (change detection, progress, zebra stripes)
node --test app/test/render-state.test.mjs

# App-side: Neon database models (requires DATABASE_URL env var)
cd app && npm test

# App-side: individual test suites
cd app && npm run test:db
cd app && npm run test:auth
```

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=         # Claude AI for slide generation

# Optional
PEXELS_API_KEY=            # Stock images
ELEVENLABS_API_KEY=        # AI narration
ELEVENLABS_VOICE_ID=       # Voice selection

# Server
PORT=4321                  # Render server port
NEXT_PUBLIC_API_URL=http://localhost:4321

# Cloud deployment (Vercel + Neon)
DATABASE_URL=              # Neon PostgreSQL connection string
NEXT_PUBLIC_NEON_AUTH_URL=  # Neon Auth endpoint
```

## Cloud Deployment

The `app/` directory deploys to Vercel. Set root directory to `app` in the Vercel dashboard.

Required Vercel env vars: `DATABASE_URL`, `NEXT_PUBLIC_NEON_AUTH_URL`.

## Technologies

- **Next.js 16** - React framework
- **Remotion 4** - Video generation
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Framer Motion** - UI animations
- **SQLite** - Local database (better-sqlite3)
- **Neon PostgreSQL** - Cloud database (Prisma ORM)
- **Neon Auth** - Authentication
- **Claude AI** - Content generation
- **Express** - API server
- **Electron** - Desktop app

## Demo Client

The seed script creates **GoInvo** as the demo client - a healthcare design studio. The demo video showcases:
- Various scene types (text, stats, quote)
- Different animation presets
- Smart duration per scene
- Professional healthcare design content

## License

Private project - GoInvo

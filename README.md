# VSL Generator

A Video Sales Letter generator built with Next.js, Remotion, and TypeScript. Optional AI narration via ElevenLabs.

## Project Structure

```
vsl-generator/
├── app/                    # Next.js application
│   ├── app/               # Next.js App Router pages
│   └── package.json       # Frontend dependencies
├── remotion/              # Remotion video components
│   ├── index.ts          # Remotion entry point
│   ├── Root.tsx          # Remotion root with compositions
│   ├── PolicyWrappedSquare.tsx
│   ├── CivicProfileVideo.tsx
│   ├── ClassProfileVideo.tsx
│   └── types.ts          # TypeScript types for video props
├── scripts/              # Render scripts
│   └── render-policy-wrapped.mjs
├── server/               # Remotion render server
│   ├── render-server.mjs
│   └── render-worker.cjs
├── .env                  # Environment variables
├── remotion-lambda-policy.json  # AWS IAM policy for Remotion Lambda
└── package.json          # Root dependencies (Remotion)
```

## ✨ Key Features

- **Multi-Client System**: Manage multiple clients and their VSLs in SQLite database
- **Scene-Based Rendering**: Videos split into scenes for faster iteration
- **Intelligent Caching**: Only re-render changed scenes (saves 80-90% render time!)
- **REST API**: Full CRUD operations for clients, videos, and scenes
- **16:9 & 1:1 Support**: Multiple aspect ratios
- **AI Narration**: Optional ElevenLabs integration
- **Clean Logging**: Fixed verbose console output

See [FEATURES.md](FEATURES.md) for detailed feature documentation.

## Setup

### 1. Install Root Dependencies

```bash
npm install
```

### 2. Install App Dependencies

```bash
cd app
npm install
```

### 3. Ensure Browser for Remotion

```bash
npm run remotion:ensure-browser
```

This downloads Chrome Headless Shell needed for video rendering.

### 4. Seed the Database

```bash
npm run seed-db
```

This creates the Ultrahuman client and video with all 7 scenes.

### 5. Set Up ElevenLabs API (Optional - for AI Voiceover)

**The VSL works perfectly without this!** The on-screen text tells the full story.

If you want AI-generated voiceover narration:

1. Sign up at https://elevenlabs.io (free tier available - 10,000 characters/month)
2. Get your API key from https://elevenlabs.io/app/settings/api-keys
3. Update `.env` and replace `your_api_key_here` with your actual key
4. Generate narration audio:
   ```bash
   npm run generate-narration
   ```

The script will create audio files in `public/audio/` that you can add to the video later.

## Running the Project

### Start the Render Server (Terminal 1)

```bash
npm run render-server
```

This starts the Remotion render server on http://localhost:8787

### Start the Next.js App (Terminal 2)

```bash
cd app
npm run dev
```

This starts the Next.js development server on http://localhost:3000

## Features

- **Next.js App**: Modern React framework with TypeScript
- **Remotion Video Generation**: Programmatic video creation
- **Framer Motion**: Smooth animations and transitions
- **Lucide Icons**: Beautiful icon library
- **Recharts & D3**: Data visualization libraries
- **Tailwind CSS**: Utility-first CSS framework

## Video Generation

The app includes multiple video compositions:

1. **UltrahumanVSL** (1920x1080, 5:45): Full VSL for Ultrahuman with 7 scenes
   - 16:9 aspect ratio (YouTube standard)
   - Restrained, calm motion design
   - Professional narration script included
2. **PolicyWrappedSquare** (1080x1080, 4 seconds): Square format video with stats and policy list
3. **CivicProfile** (1080x1080, 5 seconds): Student profile video
4. **ClassProfile** (1080x1080, 5 seconds): Class summary video

### Test Video Generation

1. Make sure the render server is running (`npm run render-server`)
2. Navigate to http://localhost:3000
3. Click "Generate Ultrahuman VSL"
4. Wait for the video to render (takes ~2-3 minutes for 5:45 video)
5. Preview and download the generated video

## Remotion Commands

### Preview Videos

```bash
npm run remotion:preview
```

Opens the Remotion Studio to preview and edit videos interactively.

### Render a Video

```bash
# Render the Ultrahuman VSL (5:45, 16:9)
npm run remotion:render:ultrahuman

# Render PolicyWrappedSquare (square format)
npm run remotion:render:square
```

### Generate AI Narration (Optional)

**Note:** The video works perfectly without narration! This is optional.

```bash
npm run generate-narration
```

If you have an ElevenLabs API key, this will:
- Use ElevenLabs API to generate professional voiceover
- Create individual audio files for each scene
- Output files to `public/audio/` directory
- Free tier gives you 10,000 characters/month

If no API key is set, the script will show you setup instructions and exit gracefully.

### Render with Custom Data

```bash
npm run remotion:render:payload -- --input data.json --out output.mp4
```

Where `data.json` contains the video props.

## Environment Variables

The `.env` file contains:

### Remotion Lambda (AWS)
- **REMOTION_AWS_ACCESS_KEY_ID**: AWS access key for Remotion Lambda
- **REMOTION_AWS_SECRET_ACCESS_KEY**: AWS secret key
- **REMOTION_AWS_REGION**: AWS region (default: us-east-1)
- **REMOTION_FUNCTION_NAME**: Lambda function name
- **REMOTION_SERVE_URL**: S3 URL for the bundled Remotion project

### ElevenLabs (AI Narration)
- **ELEVENLABS_API_KEY**: Your ElevenLabs API key
- **ELEVENLABS_VOICE_ID**: Voice ID to use (defaults to Adam voice)

## Technologies Used

- **Next.js 16**: React framework with App Router
- **Remotion 4**: Video generation framework
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Styling
- **Framer Motion**: Animations
- **Lucide React**: Icons
- **Recharts**: Charts and data visualization
- **D3**: Advanced data visualization
- **Express**: Render server
- **ElevenLabs**: AI-powered narration generation

## License

Private project

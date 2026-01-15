# Quick Start Guide

Get your VSL generator running in 5 minutes!

## Prerequisites

- Node.js installed (v18 or higher)
- Git (if you cloned the repo)

## Setup Steps

### 1. Install Dependencies

```bash
# Install root dependencies (Remotion)
npm install

# Install Next.js app dependencies
cd app
npm install
cd ..
```

### 2. Ensure Browser for Remotion

```bash
npm run remotion:ensure-browser
```

This downloads Chrome Headless Shell (takes ~1 minute).

### 3. Start the Project

Open **two terminals**:

**Terminal 1 - Render Server:**
```bash
npm run render-server
```

Wait for: `Remotion render server listening on http://localhost:8787`

**Terminal 2 - Web App:**
```bash
cd app
npm run dev
```

### 4. Generate Your First Video

1. Open http://localhost:3000 in your browser
2. Click "Generate Ultrahuman VSL"
3. Wait ~2-3 minutes for rendering
4. Preview and download your video!

## That's It!

You now have a working VSL generator. The video will render without any voiceover - the on-screen text tells the story.

## Optional: Add AI Voiceover

Want AI narration? It's optional but cool!

1. Sign up at https://elevenlabs.io (free tier available)
2. Get your API key from Settings → API Keys
3. Edit `.env` file in the root directory:
   ```
   ELEVENLABS_API_KEY=your_actual_key_here
   ```
4. Generate narration:
   ```bash
   npm run generate-narration
   ```
5. Audio files will be created in `public/audio/`

## Troubleshooting

### "Cannot connect to render server"
- Make sure Terminal 1 is running `npm run render-server`
- Check that port 8787 isn't being used by another app

### "Command not found: remotion"
- Run `npm install` in the root directory
- Make sure you're in the project root, not the `app/` folder

### Video takes too long to render
- Normal! A 5:45 video at 1920x1080 takes 2-3 minutes
- First render is slower (bundling happens)
- Subsequent renders are faster

## Next Steps

- **Preview in Remotion Studio**: Run `npm run remotion:preview` to interactively edit
- **Customize the video**: Edit `remotion/UltrahumanVSL.tsx`
- **Change timing**: Adjust scene durations in the component
- **Add your own copy**: Modify text in each scene component

Enjoy building VSLs! 🎬

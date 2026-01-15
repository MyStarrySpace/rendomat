# Quick Reference Guide

## 🚀 Getting Started (First Time)

```bash
# 1. Install dependencies
npm install
cd app && npm install && cd ..

# 2. Download browser
npm run remotion:ensure-browser

# 3. Seed database with Ultrahuman
npm run seed-db

# 4. Start render server
npm run render-server

# 5. Test it works
curl http://localhost:8787/api/clients
```

## 📋 Common Commands

```bash
# Start render server
npm run render-server

# Seed/reset database
npm run seed-db

# Preview in Remotion Studio
npm run remotion:preview

# Generate AI narration (optional)
npm run generate-narration

# Start Next.js app
cd app && npm run dev
```

## 🔌 API Quick Reference

### List All Clients
```bash
curl http://localhost:8787/api/clients
```

### Get Ultrahuman Client
```bash
curl http://localhost:8787/api/clients/1
```

### List Videos
```bash
curl http://localhost:8787/api/videos
```

### Get Ultrahuman VSL
```bash
curl http://localhost:8787/api/videos/1
```

### Get Scenes for Video
```bash
curl http://localhost:8787/api/videos/1/scenes
```

### Render Video with Caching
```bash
curl -X POST http://localhost:8787/api/videos/1/render-scenes \
  --output ultrahuman-vsl.mp4
```

### Create New Client
```bash
curl -X POST http://localhost:8787/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"New Client","company":"Acme Inc","industry":"SaaS"}'
```

## 📊 Database Structure

```
data/vsl-generator.db
  └── clients (id, name, company, industry)
      └── videos (id, client_id, title, composition_id, status)
          └── scenes (id, video_id, scene_number, start_frame, end_frame, cache_hash)
```

## 🎬 Ultrahuman VSL Scenes

```
Scene 0: Cold Open                  (0:00-0:10, frames 0-300)
Scene 1: Respect the Ambition       (0:10-0:50, frames 300-1500)
Scene 2: The Inflection Point       (0:50-1:40, frames 1500-3000)
Scene 3: Naming the Hidden Problem  (1:40-2:40, frames 3000-4800)
Scene 4: Dashboard-of-Dashboards    (2:40-3:20, frames 4800-6000)
Scene 5: Reframing the Opportunity  (3:20-4:20, frames 6000-7800)
Scene 6: Why You're Reaching Out    (4:20-5:10, frames 7800-9300)
Scene 7: Soft Close                 (5:10-5:45, frames 9300-10350)
```

## 💾 Cache Location

```
cache/scenes/
  ├── scene-1-abc123.mp4  (Scene 0, hash: abc123)
  ├── scene-2-def456.mp4  (Scene 1, hash: def456)
  └── ... (7 scenes total)
```

## ⚡ Performance Reference

| Scenario | Time | Notes |
|----------|------|-------|
| Initial render | 2-3 min | All scenes rendered |
| Change 1 scene | 30-45 sec | 1 render + stitch |
| Change 2 scenes | 60-90 sec | 2 renders + stitch |
| No changes | 5-10 sec | All cached + stitch |
| All scenes cached | <10 sec | Just stitching |

## 🔧 Troubleshooting

### Server won't start
```bash
# Check if port 8787 is in use
netstat -ano | findstr :8787

# Kill process if needed
taskkill /PID <process_id> /F
```

### Database locked
```bash
# Close all connections and restart
rm data/vsl-generator.db
npm run seed-db
```

### Cache not working
```bash
# Clear cache and re-render
rm -rf cache/scenes/*
```

### FFmpeg not found
```bash
# Install ffmpeg and add to PATH
# Windows: Download from https://ffmpeg.org/
# Verify: ffmpeg -version
```

## 📝 Example Workflow

### Scenario: Change Scene 3 Text

1. **Update scene data** (via API or direct DB edit):
```bash
curl -X PUT http://localhost:8787/api/scenes/4 \
  -H "Content-Type: application/json" \
  -d '{"data":{"text":"New text here"}}'
```

2. **Re-render video**:
```bash
curl -X POST http://localhost:8787/api/videos/1/render-scenes \
  --output updated-video.mp4
```

3. **Result**:
   - Scenes 0-2: Cached (instant)
   - Scene 3: Re-rendered (30s)
   - Scenes 4-7: Cached (instant)
   - Total: ~35 seconds

## 🎯 Development Tips

1. **Use cache wisely**: Small scene changes = fast iteration
2. **Scene granularity**: Break long scenes into smaller ones for more flexibility
3. **Database backups**: Backup `data/vsl-generator.db` before experiments
4. **Clear cache**: Delete `cache/scenes/` to force full re-render
5. **Monitor logs**: Watch render server console for cache hits/misses

## 🌐 Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Render Server | 8787 | http://localhost:8787 |
| Next.js App | 3000 | http://localhost:3000 |
| Remotion Studio | 3002 | http://localhost:3002 |

## 📚 Documentation Files

- `README.md` - Main documentation
- `FEATURES.md` - Feature details
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation
- `QUICK_REFERENCE.md` - This file
- `QUICKSTART.md` - Beginner guide

## 🆘 Need Help?

1. Check console logs in render server
2. Verify database exists: `ls data/vsl-generator.db`
3. Check cache directory: `ls cache/scenes/`
4. Test API: `curl http://localhost:8787/healthz`
5. Review error messages in server output

Happy VSL making! 🎬

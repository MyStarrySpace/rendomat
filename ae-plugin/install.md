# Remotion to After Effects Importer

This plugin imports Remotion composition exports into After Effects, recreating layer structure, text, animations, and timing.

## Installation

### Option 1: Run Script Directly

1. Copy the entire `ae-plugin` folder to a location on your computer
2. In After Effects: **File > Scripts > Run Script File...**
3. Navigate to and select `RemotionImporter.jsx`

### Option 2: Install in Scripts Folder (Recommended)

1. Copy the entire `ae-plugin` folder to your After Effects Scripts folder:
   - **Windows**: `C:\Program Files\Adobe\Adobe After Effects [version]\Support Files\Scripts\`
   - **macOS**: `/Applications/Adobe After Effects [version]/Scripts/`

2. Restart After Effects

3. The script will now appear in **File > Scripts > RemotionImporter**

### Option 3: ScriptUI Panel (For Frequent Use)

1. Copy the `ae-plugin` folder to your ScriptUI Panels folder:
   - **Windows**: `C:\Program Files\Adobe\Adobe After Effects [version]\Support Files\Scripts\ScriptUI Panels\`
   - **macOS**: `/Applications/Adobe After Effects [version]/Scripts/ScriptUI Panels/`

2. Restart After Effects

3. Access via **Window > RemotionImporter**

## Usage

### Method 1: Import Manifest JSON

1. Export your Remotion composition from the VSL Generator using the API endpoint:
   ```
   GET /api/videos/{id}/export-ae
   ```
   This returns a JSON manifest file.

2. Save the JSON response to a file (e.g., `my-video-export.json`)

3. Run the importer script in After Effects

4. When prompted, select the JSON manifest file

5. The script will create:
   - A main composition with your video's timeline
   - Individual scene compositions as pre-comps
   - Text layers with proper styling
   - Background solids with theme colors
   - Keyframed opacity animations

### Method 2: Self-Contained Script

1. Export using the script endpoint:
   ```
   GET /api/videos/{id}/export-ae/script
   ```
   This returns a `.jsx` file with the manifest embedded.

2. Save the file (e.g., `import-my-video.jsx`)

3. Run this script directly in After Effects - no separate JSON file needed

## What Gets Imported

### Supported Layer Types
- **Solid layers** - Background colors from theme
- **Text layers** - Headlines, body text, with font family, size, color
- **Null layers** - For organization and parenting
- **Shape layers** - Rectangles and ellipses
- **Image placeholders** - Gray solids with markers indicating source URL

### Supported Animations
- **Opacity** - Fade in/out animations
- **Position** - Movement animations
- **Scale** - Size animations
- **Rotation** - Rotation animations

### Supported Easing
- Linear interpolation
- Bezier curves (CSS cubic-bezier converted to AE KeyframeEase)
- Hold keyframes
- Standard easing presets (ease-in, ease-out, ease-in-out, etc.)

## After Import

### Replace Image Placeholders

Images are imported as gray placeholder solids. To add your actual images:

1. Import your images into the AE project
2. Find layers named "Image (Placeholder)"
3. Check the layer marker at frame 0 for the original source URL
4. Select the placeholder layer
5. Alt/Option + drag your imported image onto the placeholder to replace it

### Fine-Tune Text

Text layers preserve basic styling, but you may want to:
- Adjust kerning and leading
- Apply AE text animators for additional effects
- Update fonts if the original font isn't installed

### Add Effects

The import creates a clean starting point. Enhance with:
- Background animation layers
- Particle effects
- Color grading
- Motion blur

## Scene Types

The importer handles these Remotion scene types:

| Scene Type | AE Layers Created |
|------------|-------------------|
| `text-only` | Background solid, Title text, Body text |
| `single-image` | Background solid, Image placeholder, Title text |
| `quote` | Background solid, Quote text, Author text |
| `stats` | Background solid, Title text, Stats text |
| Other | Background solid, Title text (if present) |

## Troubleshooting

### Script Won't Run
- Enable **Allow Scripts to Write Files** in AE Preferences > Scripting & Expressions
- Check that all library files are in the `lib/` subfolder

### Fonts Don't Match
- Install the fonts specified in your theme (Inter, Montserrat, etc.)
- AE uses font names differently - adjust in Text Document panel

### Timing Is Off
- Verify FPS matches between Remotion export and AE composition
- Check in/out points on individual layers

### Missing Animations
- Complex expressions may not convert perfectly
- Manually recreate any spring or physics-based animations

## API Reference

### Export Endpoints

```http
# Get JSON manifest
GET /api/videos/:id/export-ae

# Get self-contained JSX script
GET /api/videos/:id/export-ae/script
```

### Response Formats

**JSON Manifest** includes:
- `version` - Manifest format version
- `metadata` - Composition dimensions, fps, duration
- `theme` - Color and font definitions
- `compositions` - Array of composition/scene data
- `easingPresets` - Bezier curves for easing functions

**JSX Script** includes:
- Embedded manifest data
- Complete importer code
- No external dependencies

## Version History

- **1.0.0** - Initial release
  - Basic layer import (solid, text, null, shape)
  - Keyframe animation support
  - Bezier easing conversion
  - Scene-based composition structure

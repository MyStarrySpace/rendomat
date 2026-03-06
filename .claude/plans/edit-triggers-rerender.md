---
planStatus:
  planId: plan-edit-triggers-rerender
  title: Every Edit Option Should Trigger Re-render Necessity
  status: in-development
  planType: bug-fix
  priority: high
  owner: developer
  tags:
    - rendering
    - editing
    - cache-invalidation
  created: "2026-03-06"
  updated: "2026-03-06T13:00:00.000Z"
---

# Every Edit Option Should Trigger Re-render Necessity

## Goals
- Any change to a video or scene property that affects the rendered output should invalidate the cache and mark the scene as needing re-render
- Zebra stripes should appear on affected scene(s) in the timeline immediately after a change

## Overview

There are two editing surfaces (side panel SceneEditor and legacy scene cards) plus video-level settings. Each editable property needs to clear the scene's `cache_path` when changed, marking it as needing re-render.

## Editing Surfaces Audit

### Side Panel (SceneEditor.tsx) — via `handleSceneSave` in TimelineEditor
All fields write to local `editData` state. On "Save & Render":
- `handleSceneSave` → `sceneApi.update(sceneId, { data, cache_path: null, ... })` → triggers `onRenderVideo`
- **Status: WORKS** — cache is cleared on save, render is triggered

### Side Panel — Scene Type Change
- `onSceneTypeChange` → `handleSceneTypeChange` in TimelineEditor
- **Status: WORKS** — already sets `cache_path: null` (line 437)

### Legacy Scene Cards (page.tsx) — via `saveEdit`
- `saveEdit` → `sceneApi.update(sceneId, { data, cache_path: null, ... })`
- **Status: WORKS** — cache is cleared on save

### Legacy Scene Cards — Scene Type Change (line 1298-1301)
- Calls `sceneApi.update(scene.id, { scene_type: newType })` without clearing cache
- Local state update also doesn't clear cache: `setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, scene_type: newType } : s))`
- **Status: BUG** — cache NOT cleared, zebra stripes don't appear

### Video-Level: Theme Change (ThemePicker, line 916-930)
- Confirms with user, clears all scene caches, updates theme, reloads data
- **Status: WORKS**

### Video-Level: Persona Change (line 513-533)
- Updates video personas but does NOT clear scene caches
- Note: Personas affect AI content generation, not rendering. The rendered output depends on scene data (text, images), which is generated *from* personas. Changing personas alone doesn't change what's already in scene data.
- **Status: OK** — not a render concern (content generation concern)

## Tasks

- [x] Fix legacy card Scene Type change to clear cache and mark as needing re-render
- [ ] Verify: when any scene edit surface clears `cache_path`, the new auto-clear effect in TimelineEditor properly handles the state

## Acceptance Criteria

- [ ] Changing scene type in legacy cards clears cache and shows zebra stripes
- [ ] Changing theme clears all caches and shows zebra stripes on all scenes
- [ ] Saving scene data in side panel clears cache and shows zebra stripes
- [ ] Saving scene data in legacy cards clears cache and shows zebra stripes

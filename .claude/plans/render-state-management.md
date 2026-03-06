---
planStatus:
  planId: plan-render-state-management
  title: Consistent Render State Lifecycle Across All Modalities
  status: in-development
  planType: bug-fix
  priority: high
  owner: developer
  tags:
    - rendering
    - timeline
    - state-management
  created: "2026-03-06"
  updated: "2026-03-06T12:00:00.000Z"
---

# Consistent Render State Lifecycle Across All Modalities

## Goals
- Every rendering modality follows the same state lifecycle: set scenes to "rendering" (zebra stripes) -> show progress mask on timeline clip -> mark as "rendered" (remove stripes)
- Progress is always visible on the timeline SceneBlock via the fill bar
- Zebra stripes are always removed when rendering completes

## Overview

There are 6 rendering entry points that trigger scene renders. Currently they have inconsistent state management. Some skip the SSE progress pipeline, some don't clear `changedSceneIds`, and some don't refresh scene data after completion.

### The 6 Rendering Modalities

| # | Modality | Entry Point | File |
|---|----------|-------------|------|
| 1 | **Render All** (nav bar button) | `handleRender()` | `page.tsx:351` |
| 2 | **Render Single Scene** (scene card button) | `handleRenderScene()` | `page.tsx:432` |
| 3 | **Render Changed** (timeline header button) | `doRenderChanged()` | `TimelineEditor.tsx:316` |
| 4 | **Auto-render** (debounced on change) | auto-render effect | `TimelineEditor.tsx:362` |
| 5 | **Scene Save** (side panel save) | `handleSceneSave()` | `TimelineEditor.tsx:235` |
| 6 | **Cloud Render** | `handleCloudRender()` | `page.tsx:411` |

### Current State Pipeline

- **SSE**: Server broadcasts per-scene progress via `/api/videos/:videoId/render-progress`
- **`progressData`**: Raw SSE data stored in state (`page.tsx:172`)
- **`sceneRenderProgress`**: `Map<sceneId, percent>` derived from `progressData.scenes` (`page.tsx:223`)
- **SceneBlock**: Displays progress as bottom-up fill bar (`height: ${renderProgress}%`, `bg-white/30`)
- **Zebra stripes**: `getZebraStripeStyle(isUnrendered, hasChanges)` in SceneBlock
  - `isUnrendered = !scene.cache_path` -> white stripes
  - `hasChanges = changedSceneIds.has(scene.id)` -> yellow stripes

### Problems by Modality

1. **handleRender** (`page.tsx:351`): Sets `rendering=true`, initializes `progressData`, calls `videoApi.renderScenes()`. SSE handles progress. Calls `loadData()` on complete. **Issue**: Doesn't clear `changedSceneIds` - if scenes were changed and then "Render All" is clicked, yellow stripes may persist even though scenes were re-rendered.

2. **handleRenderScene** (`page.tsx:432`): Sets `renderingSceneId`, calls `sceneApi.render()`, updates local scene state on success. **Issue**: Does NOT use SSE pipeline at all - no progress fill bar on timeline. Only updates a single scene's `cache_path` locally, doesn't go through `loadData()`.

3. **doRenderChanged** (`TimelineEditor.tsx:316`): Clears caches for changed/unrendered scenes via API, calls `timeline.clearAllChanges()`, triggers `onRenderVideo()` (which is `handleRender`). **Works well**: Clears `changedSceneIds`, delegates to `handleRender` which uses SSE. But `handleRender` doesn't clear `changedSceneIds` on its own.

4. **Auto-render** (`TimelineEditor.tsx:362`): Just calls `doRenderChanged()` after 1500ms debounce. **Same as #3**.

5. **handleSceneSave** (`TimelineEditor.tsx:235`): Clears cache via API, calls `onScenesChange()` + `timeline.clearSceneChanged()`, then `onRenderVideo()`. **Issue**: Only clears the single scene from `changedSceneIds` then delegates to `handleRender`. Similar pipeline to #3 but for one scene.

6. **handleCloudRender** (`page.tsx:411`): Sets `rendering=true`, initializes `progressData` with cloud mode. SSE handles progress via cloud-specific stages. **Works**: Uses SSE pipeline, calls `loadData()` on 'complete'.

## Tasks

- [x] Fix nav button: "Download Video" when all cached, "Render All Unrendered" otherwise, never disabled
- [x] **handleRender**: Auto-clear `changedSceneIds` when scenes get cache_path (effect in TimelineEditor)
- [x] **handleRenderScene**: Show progress fill on SceneBlock via `renderingSceneId` merged into `sceneRenderProgress`
- [x] **handleRenderScene**: Zebra stripes removed via local state update + changedSceneIds auto-clear effect
- [ ] Verify all modalities call `loadData()` or equivalent after completion to ensure `cache_path` is refreshed from DB
- [ ] Test each modality end-to-end: zebra stripes appear -> progress fill shows -> stripes removed on completion

## Acceptance Criteria

- [ ] All 6 modalities show zebra stripes on scenes being rendered
- [ ] All 6 modalities show progress fill bar on SceneBlock during render
- [ ] All 6 modalities remove zebra stripes when render completes
- [ ] `changedSceneIds` is properly cleared for all modalities
- [ ] No scene gets "stuck" in an intermediate visual state

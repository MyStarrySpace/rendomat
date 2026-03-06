---
planStatus:
  planId: plan-render-pipeline-fix
  title: Fix Render Pipeline Architecture and Add Test Suite
  status: in-development
  planType: bug-fix
  priority: critical
  owner: developer
  tags:
    - rendering
    - architecture
    - testing
    - sse
  created: "2026-03-06"
  updated: "2026-03-06T15:00:00.000Z"
---

# Fix Render Pipeline Architecture and Add Test Suite

## Goals
- Fix the broken render pipeline so "Render All" reliably triggers renders
- Eliminate race conditions between SSE listener and render start
- Add comprehensive test coverage for the render flow
- Ensure all render states properly propagate to UI

## Root Cause Analysis

### Bug #1: Synchronous blocking endpoint
`POST /api/videos/:videoId/render-scenes` is synchronous. It renders ALL scenes, stitches, muxes audio, overlays video, then returns a blob. This blocks the HTTP connection for minutes. Browser/proxy timeouts kill it.

### Bug #2: handleRender awaits a blob it doesn't use
`handleRender()` calls `await videoApi.renderScenes(videoId)` which returns a `Promise<Blob>`. But `handleRender` doesn't use the blob (only `handleDownload` does). So `handleRender` blocks waiting for a multi-minute blob download it will discard.

### Bug #3: SSE race condition
The SSE listener effect runs when `rendering=true`, but `handleRender` sets `rendering=true` AND starts the fetch in the same function. The SSE connection might not be established before the server starts broadcasting progress.

### Bug #4: doRenderChanged timing
`doRenderChanged()` calls `onScenesChange()` (async reload) and `onRenderVideo()` without awaiting the scene reload. The render may start before scenes reflect cleared caches.

## Fix Strategy

### Phase 1: Make render endpoint async (server)
- Split `render-scenes` into: `POST /render-scenes` returns immediately `{status: 'started'}`, renders in background
- Progress continues via existing SSE pipeline
- Add `GET /render-status` endpoint for completion check
- Add `GET /download` endpoint to get the final video blob

### Phase 2: Fix client render flow (frontend)
- `handleRender()` fires POST, gets immediate response, relies on SSE for progress
- SSE 'complete' event triggers `loadData()` to refresh scene states
- `handleDownload()` calls separate download endpoint
- Remove blob return from renderScenes API call

### Phase 3: Fix race conditions
- Ensure SSE connection is established BEFORE triggering render POST
- In doRenderChanged, await onScenesChange before calling onRenderVideo

### Phase 4: Test suite
- Server-side: test render endpoint returns immediately, SSE events fire correctly
- Client-side: test state transitions (idle -> rendering -> progress -> complete)
- Integration: test full flow with mock renderer

## Tasks

- [ ] Split render-scenes endpoint into async fire-and-forget + SSE progress + download
- [ ] Update `videoApi` in api.ts: `renderScenes` returns status, add `downloadVideo` method
- [ ] Fix `handleRender` to not await blob, just POST and let SSE handle progress
- [ ] Fix `handleDownload` to use new download endpoint
- [ ] Fix SSE 'complete' handler to reload scene data and clear rendering state
- [ ] Fix `doRenderChanged` to await onScenesChange before triggering render
- [ ] Add server render endpoint tests
- [ ] Add SSE event tests
- [ ] Add client state transition tests
- [ ] Add integration tests for full render flow

## Acceptance Criteria

- [ ] "Render All" button triggers render immediately, progress shows in real time
- [ ] Render never freezes or hangs
- [ ] All scenes show progress on timeline during render
- [ ] Zebra stripes removed when render completes
- [ ] Download button works after render completes
- [ ] Test suite passes for all render modalities

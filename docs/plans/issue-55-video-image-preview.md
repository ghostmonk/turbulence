# Issue #55: Video Image Preview

## Problem
On mobile, videos display without a preview thumbnail - just a black video player that eventually loads with incorrect dimensions initially. This creates a poor user experience.

## Root Cause Analysis
1. **Thumbnails ARE generated** - Cloud Function (`cloud-functions/video-processor/main.py`) generates 5 thumbnails at different timestamps and stores them in `thumbnail_options`
2. **Thumbnails NOT used** - Frontend never retrieves or uses these thumbnails:
   - Upload response only includes `urls` and `dimensions`, not thumbnail info
   - `setVideo` command doesn't pass a `poster` attribute
   - Story content has no poster on `<video>` tags

## Solution Overview
Store the selected thumbnail URL with the video in story content so it can be used as the `poster` attribute.

---

## Implementation Plan

### Phase 1: Backend - Return Job ID on Upload
**File:** `backend/handlers/uploads.py`

- Modify `process_video_file` to return the `job_id` in the upload response
- Response should include: `{ urls: [...], dimensions: [...], jobId: "..." }`

### Phase 2: Frontend - Poll for Thumbnail & Update Video
**File:** `frontend/src/components/RichTextEditor.tsx`

After video upload:
1. Store the `jobId` from upload response
2. Poll `/api/video-processing/jobs/{jobId}` until status is "completed"
3. When complete, extract `selected_thumbnail_id` (or first thumbnail) URL
4. Update the video node with the `poster` attribute

### Phase 3: Frontend - Video Display Enhancement
**File:** `frontend/src/components/VideoExtension.tsx`

- Add aspect-ratio CSS to prevent layout shift (like images have)
- Show loading skeleton/shimmer while waiting for poster
- Ensure poster is properly rendered on mobile

**File:** `frontend/src/components/LazyStoryContent.tsx`

- Add video handling similar to image handling
- Inject `poster`, `loading`, and `aspect-ratio` attributes to video tags
- Add shimmer effect for videos without posters

### Phase 4: Frontend - API Route for Video Jobs
**File:** `frontend/src/app/api/video-processing/jobs/[jobId]/route.ts` (new)

- Create API route to proxy video job status requests to backend
- Returns job status, thumbnail_options, and selected_thumbnail_id

---

## Files to Modify

| File | Changes |
|------|---------|
| `backend/handlers/uploads.py` | Return jobId in video upload response |
| `frontend/src/components/RichTextEditor.tsx` | Poll for thumbnail, update video with poster |
| `frontend/src/components/VideoExtension.tsx` | Add aspect-ratio, loading state, poster display |
| `frontend/src/components/LazyStoryContent.tsx` | Handle video tags like images (aspect-ratio, poster) |
| `frontend/src/app/api/video-processing/jobs/[jobId]/route.ts` | New - proxy for job status |
| `frontend/src/styles/editor.css` | Video shimmer/loading styles |
| `frontend/src/styles/globals.css` | Video styles for story display |

---

## Data Flow

```
1. User uploads video
2. Backend creates job (pending), returns { urls, dimensions, jobId }
3. Frontend inserts video into editor (no poster yet)
4. Frontend polls /api/video-processing/jobs/{jobId}
5. Cloud Function processes video, generates thumbnails
6. Job status → "completed" with thumbnail_options
7. Frontend updates video node with poster URL
8. On story view, LazyStoryContent adds poster to <video> tags
```

---

## Mobile-Specific Fixes
- Remove hardcoded `maxHeight: 500px` - use viewport-relative sizing
- Add `aspect-ratio` CSS to prevent layout shift
- Ensure `poster` image is properly scaled on mobile
- Add `playsinline` attribute for iOS compatibility

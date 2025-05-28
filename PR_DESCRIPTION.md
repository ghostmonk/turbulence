# Story Landing Pages with Slugified URLs

## Overview
This PR adds story landing pages that can be accessed via user-friendly slugified URLs. Readers can now view individual stories at www.ghostmonk.com/stories/this-is-a-story instead of using numeric IDs.

## Changes

### Backend
- Added `slugify` utility function to convert titles to URL-friendly strings
- Implemented unique slug generation with auto-incrementation for duplicates
- Updated the Story model to include a slug field
- Created a backfill function to generate slugs for existing stories
- Added a new API endpoint to fetch stories by slug
- Modified create/update handlers to manage slugs

### Frontend
- Created a new story page at `/stories/[slug]` for individual story views
- Added URL utilities for generating shareable story links
- Updated the Stories component to link to individual story pages
- Implemented fallback mechanism if a story lacks a slug
- Enhanced dark mode styling for better readability of story content

## Technical Details
- Slugs are unique within the database (implementation ensures no duplicates)
- When duplicate titles occur, slugs are enumerated (e.g., "my-story", "my-story-2")
- SEO optimization with proper metadata and canonical URLs
- Responsive design works on all screen sizes
- Backwards compatibility with ID-based URLs is maintained

## Testing
- All existing routes continue to function
- Individual story pages correctly display content
- Dark mode styling properly applied to story content
- Slug generation produces correct URL-friendly strings
- Duplicate detection and handling works as expected

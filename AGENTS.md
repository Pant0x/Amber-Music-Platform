<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Pantooty Music Player — Project Context

## Tech Stack
- **Framework**: Next.js 16 App Router
- **State**: Zustand v5 (persisted to sessionStorage as `yt-music-storage-v1`)
- **Styling**: Tailwind CSS v4
- **Auth**: Clerk v7 (`@clerk/nextjs`)
- **Database**: Supabase (free tier, service_role key server-only)
- **Media**: ReactPlayer (react-player v2)
- **Icons**: lucide-react

## IMMUTABLE RULES
- DO NOT touch existing UI components (19 components in `src/components/`)
- DO NOT touch working APIs: YouTube Music search/playback, Genius lyrics, Spotify search
- All new work is backend/functional: API routes, DB schema, store slices, data pipelines
- Only free-tier services (Clerk free, Supabase free, Vercel Hobby)

## Store Architecture
The Zustand store is split into 6 slices in `src/store/slices/`:
- `playbackSlice.ts` — playback state, queue, next/prev track
- `navigationSlice.ts` — activeTab, nav history, channel viewing
- `collectionSlice.ts` — playlists, liked tracks, subscriptions
- `uiSlice.ts` — panels, modals, minimized state, hideExplicit
- `lyricsSlice.ts` — lyrics data + loading state
- `persistenceSlice.ts` — autoplay queue, hydration

## New Feature Routes
| Route | Purpose |
|-------|---------|
| `/api/admin/login` | Admin login with env-var credentials |
| `/api/admin/dashboard` | Admin stats |
| `/api/admin/logout` | Clear admin session |
| `/api/artist/upload` | Artist track upload |
| `/api/artist/tracks` | Artist track CRUD |
| `/api/storage/upload` | Supabase Storage file upload |
| `/api/storage/delete` | Delete file from storage |
| `/api/transfer/import` | Import playlist from external service |
| `/api/transfer/save` | Save imported playlist |
| `/api/devices` | Device sync register/list/update |
| `/api/devices/transfer` | Transfer playback between devices |
| `/api/files` | Local files CRUD |
| `/api/files/share` | Access shared file by token |
| `/api/radio/start` | Generate radio from seed track |
| `/api/radio/more` | Radio pagination |
| `/api/webhooks/clerk` | Clerk user sync webhook |

## Admin Dashboard Auth
- Username/password from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars
- Basic auth via cookie-based token
- Routes: `/admin/login`, `/admin/dashboard`

## SQL Schemas
All table definitions in `db/profiles.sql`:
- `profiles` — user profiles synced from Clerk
- `artist_tracks` — artist uploaded tracks with metadata
- `artist_follows` — artist follow relationships
- `devices` — active devices for sync
- `user_files` — local uploaded files with privacy tiers

## Env Vars
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# API Keys (existing)
YOUTUBE_API_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
GENIUS_CLIENT_ID=
GENIUS_CLIENT_SECRET=

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
```

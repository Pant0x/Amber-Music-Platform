<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Amber Music — Project Context

## Tech Stack
- **Framework**: Next.js 16 App Router (dual-target: Vercel web + Electron Windows desktop, same codebase)
- **State**: Zustand v5 (persisted to localStorage as `yt-music-storage-v1`)
- **Styling**: Tailwind CSS v4
- **Auth**: Supabase Auth (email/password + magic links; `@supabase/ssr`)
- **Database**: Supabase (free tier, service_role key server-only)
- **Media**: ReactPlayer (react-player v2)
- **Icons**: lucide-react

## IMMUTABLE RULES
- DO NOT touch existing UI components (19 components in `src/components/`) unless the change is required for auth/deployment parity
- DO NOT touch working APIs: YouTube Music search/playback, Genius lyrics, Spotify search
- All new work is backend/functional: API routes, DB schema, store slices, data pipelines
- Only free-tier services (Supabase free, Vercel free/hobby, GitHub free; NO Clerk, NO paid tiers)
- **Dual-target parity is the product**: web (Vercel) and desktop (Electron) must behave identically — verify with `npm run dev` and `npm run desktop:dev`
- Never break desktop builds: `main.js` + `preload.js` + `build/` + `scripts/` are tracked and required

## Auth Architecture (Supabase, not Clerk)
- Server: `src/lib/auth.ts` — `auth()` returns `{ userId }` (drop-in `auth()` replacement, Supabase user UUID = `auth.jwt() ->> 'sub'` in RLS)
- Client: `src/lib/auth-context.tsx` — `AuthProvider` + `useAuth()` (`user`, `isLoaded`, `signOut`)
- Session gate: `src/proxy.ts` — Supabase middleware (`createServerClient` + `getUser`), public routes list, `/admin/*` public (HMAC cookie gate)
- Sign in/up: `src/components/auth/AuthForm.tsx` (email/password + magic link), pages at `/sign-in`, `/sign-up`
- Admin dashboard auth stays env-var HMAC (independent of user accounts)
- Magic-link deep link: desktop registers `ambermusic://` protocol (`main.js` + `preload.js`); Supabase redirect URLs must include `ambermusic://auth/confirm` (desktop) AND the Vercel URL (web)

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
| `/api/subscription` | Set plan tier (free/plus stub) |

## Admin Dashboard Auth
- Username/password from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars
- Basic auth via cookie-based token
- Routes: `/admin/login`, `/admin/dashboard`

## SQL Schemas
All table definitions in `db/profiles.sql`:
- `profiles` — user profiles synced from Supabase Auth (user_id = Supabase user UUID)
- `artist_tracks` — artist uploaded tracks with metadata
- `artist_follows` — artist follow relationships
- `devices` — active devices for sync
- `user_files` — local uploaded files with privacy tiers
- `track_fingerprints` — acoustic fingerprints for Shazam-style matching

## Env Vars
```env
# Supabase (auth + DB + storage)
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

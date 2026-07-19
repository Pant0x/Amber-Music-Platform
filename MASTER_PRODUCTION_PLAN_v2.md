# MASTER PRODUCTION PLAN V2 — Pantooty Music Platform

> **Prompt-Ready Specification** — Copy this entire document and give to any AI agent for context.

---

## PART 1: PROJECT OVERVIEW

### Current State
A Next.js 16 App Router music player with Zustand state management, Tailwind CSS v4, React 19. Plays audio/video via ReactPlayer. Integrates YouTube Music (ytmusic-api, node-youtube-music, youtubei.js), Spotify (spotify-web-api-node), and Genius for lyrics. Already has Supabase client setup with `listen_history` RLS.

### IMMUTABLE RULES
- **DO NOT touch any existing UI components, CSS, or layout files**
- **DO NOT touch working APIs**: YouTube Music search/playback pipeline, Genius lyrics pipeline, Spotify search
- All additions are backend/functional: new API routes, DB schema, store logic, data pipelines, config
- Existing Zustand store (`usePlayerStore.ts`) is canonical — `PlaybackContext.tsx` is legacy and must be removed
- Only free-tier services (Clerk free, Supabase free, serverless functions)

### Current File Structure
```
src/
├── app/
│   ├── api/       # listen_history, lyrics, recommendations, search, spotify, track, user, youtube
│   ├── album/[id]/
│   ├── artist/[id]/
│   ├── explore/
│   ├── library/
│   ├── liked/
│   ├── playlist/[id]/
│   ├── profile/
│   ├── search/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/    # 19 components — DO NOT MODIFY
├── context/       # PlaybackContext.tsx (LEGACY — to be removed)
├── hooks/
├── lib/           # supabase.ts, supabase-server.ts, spotify.ts, youtubei.ts, yt-music-adapter.ts, match-utils.ts
├── store/         # usePlayerStore.ts (688 lines, Zustand + sessionStorage persist)
├── types/         # music-player.ts (Track, Playlist, PlaybackState)
└── utils/
db/                # listen_history.ddl.sql, listen_history.sql
waitlist_page/     # orphaned independent Next.js app
```

### Running the project
```bash
npm install        # already done
npm run dev        # Next.js dev server
npm run build      # production build
npm run lint       # ESLint
```

---

## PART 2: COMPETITIVE BENCHMARKS

| Feature | Spotify | Apple Music | YouTube Music | SoundCloud | Our Target |
|---------|---------|-------------|---------------|------------|------------|
| Max Quality | 320kbps Ogg | 24-bit/192kHz FLAC | 256kbps AAC | 128kbps MP3 | Lossless FLAC + 320kbps fallback |
| Algorithm | Unmatched | Human curation | Basic | None | Multi-signal (collab + content + recency) |
| Local Files | Desktop sync only | iCloud Library | Cloud sync | Upload only | 3-tier (local/private/unlisted) |
| Device Sync | Spotify Connect | AirPlay | Cast | None | Supabase Realtime WebSocket |
| Uploads | No (DistroKid) | No | No | Yes (anyone) | Artist Portal (SoundCloud-style) |
| Lyrics | Musixmatch | Apple Lyrics | Auto-generated | None | Genius + Whisper auto-generate |
| Social | Collaborative, Wrapped | SharePlay | Comments | Timestamped comments | v2: waveform comments |
| Free Tier | Ad + shuffle | Radio only | Ad + no bg play | Ad + previews | Our choice |

---

## PART 3: NEW TECH LAYERS

### 3.1 BPM & Key Detection
- **Primary**: Essentia.js (WebAssembly, runs 100% client-side, $0 server cost)
  - BPM via rhythmic onset extractors
  - Musical key via Harmonic Pitch Class Profiles (HPCP)
- **Backup**: Librosa + Aubio (Python/FastAPI microservice for batch processing)
- **Flow**: User uploads → Essentia.js extracts BPM/key instantly → stored in track metadata

### 3.2 Metadata Matching (Playlist Transfer & Search)
- **Sentence-Transformers** (`all-MiniLM-L6-v2`)
  - Converts track titles + artist names into 384-dim vector embeddings
  - Match across services via cosine similarity
  - Catches typos, formatting differences, transliterations
- **Three-tier matching**: ISRC > Title+Artist+Duration > Vector similarity

### 3.3 Auto-Synced Lyrics
- **Whisper-timestamped** (whisper-tiny/whisper-base)
  - OpenAI Whisper + forced alignment for word-level timestamps
  - Python/FastAPI microservice
  - Free for all artists
- **Stack**: `[User Uploads] → [Frontend: Essentia.js BPM/Key] + [Backend: Whisper-tiny synced lyrics]`

---

## PART 4: FEATURE SPECIFICATIONS

### 4.1 Clerk/Supabase Auth + PFP Upload

**Requirements**: Clerk free tier, Supabase free tier, Supabase Storage for avatars

**Flow**:
- Clerk handles auth (email, Google, GitHub OAuth)
- Clerk webhook on `user.created` → inserts row in `public.profiles` table in Supabase
- Profile page at `/profile/[user_id]` shows avatar + display name + bio
- PFP upload: drag-drop → client-side resize → upload to Supabase Storage `avatars` bucket

**DB Schema**:
```sql
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  is_artist BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Env Vars**:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 4.2 Admin Dashboard

**Requirements**: Simple built-in routes, env-var auth, no Clerk dependency

**Routes**: `/admin/login`, `/admin/dashboard`

**Auth**: Username/password from env vars (`ADMIN_USERNAME`, `ADMIN_PASSWORD`), session via Next.js cookies (simple JWT or iron-session)

**Dashboard**:
- Stats: total users, total artist uploads, total plays, storage used
- User management: list, suspend, delete
- Track management: list uploaded tracks, flag explicit, delete
- Reports: storage usage, recent sign-ups, recent uploads

### 4.3 Artist Portal (SoundCloud-style)

**Requirements**: Any user can become artist via toggle in settings

**Artist Dashboard** (`/artist/dashboard`):
- Upload tracks (MP3, FLAC, WAV, AAC)
- Set cover art (upload to Supabase Storage `covers` bucket)
- Auto-detect BPM + key via Essentia.js
- Auto-generate synced lyrics via Whisper-timestamped
- Edit title, artist name, genre, tags, explicit flag
- Manage catalog (edit, delete, reorder)

**Upload Flow**:
1. Select audio file → client-side Essentia.js extracts BPM/key
2. Upload audio + cover to Supabase Storage (`artist_uploads` private bucket)
3. Backend enqueues Whisper job (or runs sync for small files)
4. Track appears in catalog

**Public Artist Page** (`/artist/[slug]`):
- Bio, discography with cover art, popular tracks
- Follow/unfollow button
- Notification on new uploads (toast + email)

**DB Schema**:
```sql
CREATE TABLE public.artist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES public.profiles(user_id) NOT NULL,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  genre TEXT,
  tags TEXT[],
  is_explicit BOOLEAN DEFAULT false,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration_seconds INT,
  bpm REAL,
  musical_key TEXT,
  lyrics_json JSONB,
  lyrics_status TEXT DEFAULT 'pending', -- 'pending', 'generating', 'ready', 'failed'
  plays_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.artist_follows (
  follower_id UUID REFERENCES public.profiles(user_id),
  artist_id UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, artist_id)
);
```

### 4.4 Playlist Transfer (16 Services)

**Service Adapters** (each in `src/lib/transfers/`):

| # | Service | Method | Key Needed | Priority |
|---|---------|--------|------------|----------|
| 1 | Spotify | spotify-web-api-node | Existing keys | P0 |
| 2 | YouTube Music | ytmusic-api | None (existing) | P0 |
| 3 | Apple Music | Apple Music API / MusicKit | Dev token | P1 |
| 4 | YouTube | YouTube Data API v3 | Existing key | P1 |
| 5 | Deezer | deezer-public-api | None | P1 |
| 6 | SoundCloud | SoundCloud API | Client ID | P1 |
| 7 | Last.fm | Last.fm API | Free key | P1 |
| 8 | Tidal | tidal-api | Client ID/Secret | P2 |
| 9 | Qobuz | qobuz-api | App ID/Secret | P2 |
| 10 | Beatport | Scraping | None | P2 |
| 11 | iTunes | iTunes Search API | None | P2 |
| 12 | Pandora | Scraping | None | P3 |
| 13 | Anghami | Unofficial API | None | P3 |
| 14 | Yandex Music | Unofficial API | None | P3 |
| 15 | Amazon Music | Scraping | None | P3 |
| 16 | KKBox | KKBox API | Partner access | P3 |

**Matching Pipeline**:
1. Parse source playlist (API call or file upload: JSON/CSV/TXT/M3U)
2. For each track, run matchers in order:
   - ISRC matcher (most reliable, catches exact match)
   - Title + Artist + Duration fuzzy matcher
   - Sentence-Transformers vector matcher (catches typos/transliterations)
3. Return match results with confidence score
4. User confirms → create local playlist with matched tracks
5. Unmatched tracks → manual mapping UI

**API Routes**:
```
POST /api/transfer/import    — accepts URL or file, returns parsed track list
POST /api/transfer/match     — matches against our catalog
POST /api/transfer/save      — saves matched playlist to user's library
```

### 4.5 Local Files Sync (PC↔Mobile)

**Three Privacy Tiers**:
- **Local** (device-only): PWA + File System Access API, never leaves device
- **Private** (personal cloud): Uploaded to user's Supabase Storage folder, only user can see
- **Unlisted** (shareable): Uploaded with public link, anyone with URL can play

**Desktop Sync**: PWA File System Access API → reads files → music-metadata-js parses ID3 tags → Essentia.js extracts BPM/key → Supabase Storage

**Mobile Access**: PWA lists user's uploaded files from cloud, plays via streaming

**Offline**: Cache API + IndexedDB for downloaded tracks

**Storage Layout**:
```
Supabase Storage buckets:
├── avatars/          (public, for profile pics)
├── covers/           (public, for artist upload covers)
├── artist_uploads/   (public, for artist audio files)
├── local_files/
│   ├── private/{user_id}/
│   └── unlisted/{user_id}/
```

**DB Schema**:
```sql
CREATE TABLE public.user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration_seconds INT,
  bpm REAL,
  musical_key TEXT,
  privacy_tier TEXT DEFAULT 'private', -- 'local', 'private', 'unlisted'
  share_token TEXT UNIQUE,             -- for unlisted shareable links
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.6 Device Sync (Spotify Connect clone)

**Requirements**: Supabase Realtime (free tier includes Realtime)

**Architecture**:
- Each device connects to a Realtime channel per user
- Devices broadcast presence + state
- Playback transfer protocol: pause current → seek to position → start on target
- Remote control: device A sends commands to device B via Realtime broadcast

**Event Types**:
```typescript
type DeviceEvent =
  | { type: 'TRACK_CHANGE'; trackId: string; position: number; timestamp: number }
  | { type: 'PLAYBACK_STATE'; isPlaying: boolean; position: number; timestamp: number }
  | { type: 'SEEK'; position: number; timestamp: number }
  | { type: 'VOLUME'; volume: number; timestamp: number }
  | { type: 'TRANSFER_REQUEST'; targetDeviceId: string; position: number }
  | { type: 'TRANSFER_ACCEPT'; position: number }
```

**DB Schema**:
```sql
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) NOT NULL,
  name TEXT NOT NULL,
  device_type TEXT DEFAULT 'browser', -- 'browser', 'pwa', 'desktop'
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false,
  current_track_id TEXT,
  current_position REAL DEFAULT 0,
  is_playing BOOLEAN DEFAULT false
);
```

### 4.7 Lossless Audio Pipeline

**Requirements**: Browser FLAC support (Chrome, Firefox, Safari all support FLAC in Audio element)

**Implementation**:
- Local FLAC files played natively via `<audio>` element (browsers support FLAC since ~2019)
- Upload pipeline preserves original file; generates 320kbps MP3/OGG fallback for streaming
- Music-metadata-js parses FLAC metadata on client
- Quality selector: Auto / High (320kbps) / Lossless (original FLAC)
- Spatial audio (Dolby Atmos): flagged for future, no implementation now

**Audio Processing Service (Python/FastAPI)**:
```
POST /api/audio/process
  Input:  raw audio file
  Output: { bpm, key, waveform_data, mp3_fallback_url, lyrics }
  Uses:   librosa, aubio, ffmpeg, whisper-timestamped
```

### 4.8 Radio Mode

**Requirements**: Algorithmic radio from any seed track

**Implementation**:
- `POST /api/radio/start` — given seed track ID, returns 30 tracks
- `POST /api/radio/more` — pagination, fetches next 10
- Recommendation signals:
  - Collaborative: users who liked this also like X
  - Content: same genre, artist, BPM range (±20), key (harmonic mixing)
  - Diversity: skip same artist every 3 tracks, vary BPM
- Queue auto-refreshes (fetch next 10 when 5 remain)
- Skip limit: 6 skips/hour (like Spotify free tier)

---

## PART 5: EXECUTION TIMELINE (8 Weeks)

### WEEK 0 — Immediate Security
- [ ] Generate fresh YouTube API key
- [ ] Generate fresh Spotify Client ID + Secret
- [ ] Generate fresh Genius Client ID + Secret
- [ ] Generate fresh Supabase keys (anon + service_role)
- [ ] Add all to Vercel env vars
- [ ] Run `npx @bfg-repo-cleaner` or `git filter-repo` to purge secrets from git history
- [ ] Add `.env.local` to `.gitignore` (verify it's there)
- [ ] Add `AGENTS.md` with project rules

### WEEK 1 — Architecture Foundation
- [ ] Split `usePlayerStore.ts` into modular slices (`src/store/slices/`)
  - `playbackSlice.ts` — currentTrack, isPlaying, volume, queue, history, progress
  - `navigationSlice.ts` — activeTab, searchQuery, navHistory, navForward
  - `collectionSlice.ts` — playlists, likedTracks, followedArtists, subscriptions
  - `uiSlice.ts` — showQueuePanel, showNowPlaying, isMinimized, hideExplicit
  - `lyricsSlice.ts` — lyricsData, lyricsLoading, activeLineIndex
  - `persistenceSlice.ts` — hydration, sessionStorage sync with versioning
- [ ] Remove `PlaybackContext.tsx` — migrate all consumers to Zustand
- [ ] Fix 200+ `any` types across `youtubei.ts`, `usePlayerStore.ts`, API routes
- [ ] Add global Error Boundary component
- [ ] Create centralized API client (`src/lib/api/client.ts`) with retry + interceptors
- [ ] Merge or delete `waitlist_page/`

### WEEK 2 — Auth & Platform
- [ ] Install Clerk (`npm install @clerk/nextjs`)
- [ ] Wrap `layout.tsx` with `<ClerkProvider>`
- [ ] Add `clerkMiddleware` to `src/middleware.ts`
- [ ] Create Supabase `profiles` table
- [ ] Set up Clerk webhook endpoint for `user.created` → `profiles` insert
- [ ] Build profile page with PFP upload (Supabase Storage `avatars`)
- [ ] Build Admin Dashboard (`/admin/login`, `/admin/dashboard`)
- [ ] Add admin user management (list, suspend, delete)
- [ ] Add admin track management (list, flag, delete)

### WEEK 3 — Artist Portal
- [ ] Create artist dashboard layout (`/artist/dashboard/*`)
- [ ] Build upload form (file picker, title, genre, tags, cover art)
- [ ] Integrate Essentia.js BPM/key detection on client
- [ ] Create `artist_tracks` table in Supabase
- [ ] Build API routes: `POST /api/artist/upload`, `GET/PUT/DELETE /api/artist/tracks/[id]`
- [ ] Set up Python/FastAPI microservice for Whisper-timestamped
- [ ] Create public artist page (`/artist/[slug]`)
- [ ] Add follow/unfollow system
- [ ] Handle file uploads to Supabase Storage

### WEEK 4 — Playlist Transfer + Metadata Matching
- [ ] Create `src/lib/transfers/` adapter architecture
- [ ] Implement Spotify adapter (uses existing keys)
- [ ] Implement YouTube Music adapter (uses existing ytmusic-api)
- [ ] Implement Deezer adapter (public API)
- [ ] Implement Last.fm adapter (free API key)
- [ ] Implement Apple Music adapter (MusicKit token)
- [ ] Implement SoundCloud adapter
- [ ] Build ISRC matcher
- [ ] Build Title+Artist+Duration fuzzy matcher
- [ ] Set up Sentence-Transformers microservice (Python)
- [ ] Build vector similarity matcher
- [ ] API routes: `POST /api/transfer/import`, `/match`, `/save`
- [ ] Playlist save flow → create local playlist with matched tracks
- [ ] Remaining 9 services (P2/P3 priority)

### WEEK 5 — Local Files + Device Sync
- [ ] Create `user_files` table in Supabase
- [ ] Build file upload pipeline with privacy tier selector
- [ ] Integrate music-metadata-js for ID3 tag parsing
- [ ] Integrate Essentia.js for BPM/key on local files
- [ ] Set up Supabase Storage buckets for files
- [ ] Build local file browser UI
- [ ] Implement shareable link generation for unlisted
- [ ] Create `devices` table in Supabase
- [ ] Set up Supabase Realtime channel per user
- [ ] Build device registration + presence
- [ ] Implement playback transfer protocol
- [ ] Build remote control event handlers

### WEEK 6 — Lossless + Radio Mode
- [ ] Add FLAC support detection in MediaDeck
- [ ] Build quality selector component (Auto / High / Lossless)
- [ ] Set up audio processing Python microservice (ffmpeg + librosa)
- [ ] Build `POST /api/radio/start` endpoint
- [ ] Build recommendation signals pipeline
- [ ] Add radio auto-refresh + skip limiting
- [ ] Test lossless playback across browsers

### WEEK 7 — Performance
- [ ] Install TanStack Query (`npm install @tanstack/react-query`)
- [ ] Create `src/lib/queries/` with query hooks
- [ ] Migrate all `useEffect` + `fetch` patterns to TanStack Query
- [ ] Add code splitting with `lazy()` + `Suspense` for all views
- [ ] Replace `<img>` with Next.js `<Image>` (30+ instances)
- [ ] Add virtualization with `@tanstack/react-virtual` for long lists
- [ ] Add Skeleton loading for every view

### WEEK 8 — Hardening & Production
- [ ] Zod validation on ALL API routes
- [ ] Rate limiting middleware (Upstash free tier or in-memory)
- [ ] Vitest unit tests for store slices, utils, hooks
- [ ] Playwright E2E tests for critical flows
- [ ] Sentry error tracking (free tier)
- [ ] Bundle analysis + optimization
- [ ] Lighthouse audit (target 90+)
- [ ] Accessibility audit (axe-core)
- [ ] Final README update

---

## PART 6: ENV VARS MASTER LIST

```env
# === EXISTING (Keep, rotate values) ===
YOUTUBE_API_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
GENIUS_CLIENT_ID=
GENIUS_CLIENT_SECRET=

# === NEW: Clerk Auth (free tier) ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# === NEW: Supabase (free tier, existing but needs rotation) ===
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# === NEW: Admin Dashboard ===
ADMIN_USERNAME=admin
ADMIN_PASSWORD=  # generate a strong password

# === NEW: Optional — Last.fm for scrobbling ===
LASTFM_API_KEY=

# === NEW: Optional — Apple Music ===
APPLE_MUSIC_KEY_ID=
APPLE_MUSIC_TEAM_ID=
APPLE_MUSIC_KEY_FILE=
```

---

## PART 7: FREE TIER LIMITS (Important)

| Service | Free Tier Limit | Our Mitigation |
|---------|----------------|----------------|
| **Clerk** | 10K monthly active users | Sufficient for launch |
| **Supabase** | 500MB DB, 5GB bandwidth, 1GB storage, 50K monthly active users | Compress uploads, cache aggressively |
| **Vercel** | 100GB bandwidth, 6000 build minutes | Optimize bundles, ISR |
| **Spotify API** | Rate limited but generous | Cache responses, use keys rotation |
| **YouTube API** | 10K quota/day | Use ytmusic-api (no quota) as primary |
| **Genius API** | Rate limited | Cache lyrics, use LRCLIB as fallback |
| **Replicate/HuggingFace** | Free tier for Whisper | Run on own serverless function if needed |

**Cost Strategy**: Essentia.js runs client-side ($0). Sentence-Transformers + Whisper-timestamped run on Python microservice (can deploy on Railway free tier or Fly.io free allowance).

---

## PART 8: DEFINITION OF DONE

1. ✅ `npm run build` — TypeScript compiles with zero errors
2. ✅ `npm run lint` — passes
3. ✅ Existing UI is untouched (no CSS/component changes)
4. ✅ Existing APIs (YT Music search/play, Genius lyrics) still work
5. ✅ All new features handle loading, empty, error states
6. ✅ No console errors or warnings
7. ✅ Lighthouse > 90 (Performance, Accessibility, Best Practices, SEO)
8. ✅ Works on Chrome, Firefox, Safari, Edge (last 2 versions)
9. ✅ Mobile responsive (375px, 414px, 768px, 1024px)
10. ✅ All secrets in env vars, none in source

---

## APPENDIX A: SECURITY HOTLIST

- [ ] Secrets committed in git history (rotated + scrubbed)
- [ ] Hardcoded fallback secrets in `src/lib/spotify.ts` (remove)
- [ ] No Zod validation on any API route (all need it)
- [ ] No rate limiting (add middleware)
- [ ] No CSRF protection (add if needed)
- [ ] Supabase service_role key in client bundle? (verify it's server-only)

## APPENDIX B: DIRECTORY STRUCTURE (TARGET)

```
src/
├── app/
│   ├── admin/          # NEW: admin dashboard
│   ├── api/
│   │   ├── admin/      # NEW: admin CRUD
│   │   ├── artist/     # NEW: artist uploads
│   │   ├── audio/      # NEW: audio processing
│   │   ├── devices/    # NEW: device sync
│   │   ├── files/      # NEW: local file sync
│   │   ├── radio/      # NEW: radio mode
│   │   ├── transfer/   # NEW: playlist transfer
│   │   └── webhooks/   # NEW: Clerk webhook
│   ├── artist/         # NEW: artist dashboard + public page
│   └── profile/        # EXISTING + enhanced
├── components/         # EXISTING (UNTOUCHED)
├── context/            # LEGACY (to remove)
├── lib/
│   ├── api/            # NEW: centralized client
│   ├── transfers/      # NEW: 16 service adapters
│   └── ...             # EXISTING (UNTOUCHED)
├── store/
│   ├── slices/         # NEW: modular store slices
│   └── usePlayerStore.ts  # EXISTING (refactored)
├── types/
│   └── music-player.ts # EXISTING + NEW types
└── middleware.ts       # NEW: Clerk + rate limiting
```

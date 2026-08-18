# Amber Music

> 🎵 A premium, high-fidelity hybrid music streaming platform.

Amber Music merges the Spotify search ecosystem with the YouTube Music database to deliver a beautiful, seamless streaming experience. Built with Next.js 16, Zustand, Supabase (auth + DB + storage), and Electron — **one codebase, two surfaces**: the web app (Vercel) and the native Windows desktop app (Electron), like Spotify's web player + desktop player. Same Supabase backend, same accounts, same library on both.

---

## 🌟 Key Features

- **High-Res Audio Ingestion**: Targets official release audios using query targeting suffixes (`"- Topic"`) and filters out cinematic video clips.
- **Sideways Scroll Navigation**: Left/Right navigation chevrons for smooth horizontal scrolling across shelves.
- **Deck Clicks to Pop Now Playing**: Click anywhere on the persistent player deck footer to maximize the Now Playing view tab.
- **Relational Artist Mapping**: Groups all discography items strictly by unique YouTube `channelId` to prevent collision issues for different artists sharing identical names.
- **Clickable Featured Collaborators**: Decouples featuring collaborator strings from track titles and renders them as clickable links.
- **Release Categorization & Sorting**: Categorizes releases chronologically (Newest to Oldest) and tags them dynamically: Single (1-3 tracks), EP (4-6), Album (7+).
- **Synced Lyrics**: Real-time karaoke-style lyrics via Genius API integration.
- **Multi-Service Import**: Import playlists from Spotify, YouTube, and Deezer.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **State**: Zustand v5 (persisted to localStorage)
- **Auth**: Supabase Auth (email/password + magic links)
- **Database**: Supabase (free tier)
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Media**: ReactPlayer Engine
- **Integrations**: YouTube Music internal endpoints, Spotify API, Genius API

---

## 🚀 Setup & Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Music_Player
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env.local` file in the root directory with:
```env
# Supabase (required for auth & persistence)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# YouTube Data API v3 Key (optional)
YOUTUBE_API_KEY=

# Spotify API credentials (used for search & playlists)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# Genius API credentials (used for synced lyrics)
GENIUS_CLIENT_ID=
GENIUS_CLIENT_SECRET=

# Admin dashboard credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=

# SerpApi (optional YouTube search fallback)
SERPAPI_API_KEY=
```

> **Desktop builds (security note):** the packaged `.exe` does NOT embed `.env.local`.
> Place the file next to the executable (or set environment variables) before
> launching so API keys are never extractable from the distributed binary.

### 4. Run the development server
```bash
npm run dev
```

---

## 🖥️ Two Surfaces, One Codebase (Spotify-style)

The same Next.js app is delivered in two ways:

| Surface | How it runs | Deploy/run |
|---------|-------------|------------|
| **Web** | Next.js serverless on Vercel | `git push` → Vercel auto-deploy (env vars in Vercel dashboard) |
| **Windows desktop** | Electron shell spawning the Next.js standalone server locally (port 3210) | `npm run desktop:installer` |

- **Same Supabase DB + auth**: profiles, playlists, likes, history all live in one Supabase project. Sign in once per surface (like Spotify — sessions are per-app), data is shared instantly.
- **Supabase redirect URLs** must include all three: `http://localhost:3000/**` (dev), `http://localhost:3210/**` (desktop dev), the Vercel URL (web), and `ambermusic://auth/confirm` (desktop magic-link deep link).

### Web (Vercel)
```bash
git push origin main   # Vercel auto-deploys from the GitHub repo
```
Set the same env vars from `.env.local` in the Vercel dashboard (project → Settings → Environment Variables). `SUPABASE_SERVICE_ROLE_KEY` is server-only — never expose it in `NEXT_PUBLIC_*`.

### Desktop (Windows)
```bash
npm run desktop:dev     # build + launch in Electron (dev)
npm run desktop:dist    # build + package a folder (win)
npm run desktop:portable  # build + package a portable .exe
npm run desktop:installer # build + NSIS installer .exe
```

> `next build` runs automatically as part of every desktop script. The packaged
> app loads `.env.local` from next to the executable at runtime.

## Supabase: `listen_history` RLS recommendation
When using Supabase for server-side listen writes, follow least-privilege patterns. The server route uses the Supabase Service Role key to insert rows; front-end clients should NOT have this key. Recommended RLS for `listen_history`:

```sql
-- Allow authenticated users to insert their own listen records
create policy "allow_insert_own_listen" on public.listen_history
   for insert
   with check ( auth.uid() = user_id );

-- Allow server (service role) inserts by bypassing RLS (use server-side service key)
-- No policy needed for service role; ensure service key is stored securely on server only
```

Make sure to set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your deployment secrets (service role key only on server env). The client should send the user's access token (if available) to the `/api/listen_history` endpoint for verification.

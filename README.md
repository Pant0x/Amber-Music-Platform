# Kiwi Music Player

> 🎵 A premium, high-fidelity hybrid music streaming platform.

Kiwi merges the Spotify search ecosystem with the YouTube Music database to deliver a beautiful, seamless streaming experience. Built with Next.js 16, Zustand, Clerk auth, and Supabase.

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
- **Auth**: Clerk v7
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
# Clerk (required for auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase (required for persistence)
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
```

### 4. Run the development server
```bash
npm run dev
```

---

## ⚡ Deployment on Vercel

1. Push to GitHub and import to [Vercel](https://vercel.com/new)
2. Add all environment variables from `.env.local` (excluding comments)
3. Deploy — Vercel builds and serves automatically

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

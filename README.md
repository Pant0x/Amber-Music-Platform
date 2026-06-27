# Pantooty Music Player

> 🔗 **Live Demo**: [pantooty-music-player.vercel.app](https://pantooty-music-player.vercel.app/)

Pantooty is a premium, high-fidelity hybrid music player built with Next.js, Zustand, and Tailwind CSS. It merges the Spotify search ecosystem and the YouTube Music database to deliver a beautiful, seamless desktop streaming experience.

---

## 🌟 Key Features

- **High-Res Audio Ingestion**: Targets official release audios using query targeting suffixes (`"- Topic"`) and filters out cinematic video clips.
- **Dedicated Video Canvas**: Separate horizontal scroll arrays for official videos, loading into a custom video player overlay with a custom "Stealth Black" glassmorphic control HUD (hiding native YouTube controls).
- **Sideways Scroll Navigation**: Left/Right navigation chevrons for smooth horizontal scrolling across shelves.
- **Deck Clicks to Pop Now Playing**: Click anywhere on the persistent player deck footer (excluding active buttons and sliders) to maximize the Now Playing view tab.
- **Relational Artist Mapping**: Groups all discography items strictly by unique YouTube `channelId` to prevent collision issues for different artists sharing identical names (e.g., "Ghost"). Prunes placeholder channels.
- **Clickable Featured Collaborators**: Decouples featuring collaborator strings from track titles and renders them as clickable links that route directly to their corresponding artist profiles.
- **Release Categorization & Sorting**: Categorizes releases chronologically (Newest to Oldest) and tags them dynamically:
  - **Single**: 1-3 tracks or annotated as Single.
  - **EP**: 4-6 tracks or annotated as EP.
  - **Album**: 7+ tracks.
- **Pre-Hydration & Sleek Skeletons**: Replaced blocking page-loaders with dark-themed skeleton loaders.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **State Management**: Zustand (Persisted Store)
- **Styling**: Tailwind CSS & Lucide Icons
- **Media Playback**: ReactPlayer Engine
- **Integrations**: Spotify API, YouTube Data API v3, Genius API

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
Create a `.env.local` file in the root directory and add the following keys:
```env
# YouTube Data API v3 Key (Fallback data handles queries if empty)
YOUTUBE_API_KEY=your_youtube_api_key_here

# Spotify API credentials (Used for search lookup & playlists resolver)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# Genius API credentials (Used for synced lyrics search)
GENIUS_CLIENT_ID=your_genius_client_id_here
GENIUS_CLIENT_SECRET=your_genius_client_secret_here
```

### 4. Run the development server
```bash
npm run dev
```

---

## ⚡ Deployment on Vercel

Pantooty can be deployed to Vercel in a few clicks:

1. **Push your code to GitHub**: Create a new GitHub repository and push your local files. Ensure `.env.local` is ignored by git.
2. **Import to Vercel**: 
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Click **Import** next to your repository.
3. **Configure Environment Variables**:
   Under the **Environment Variables** section, add:
   - `YOUTUBE_API_KEY`
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `GENIUS_CLIENT_ID`
   - `GENIUS_CLIENT_SECRET`
4. **Deploy**: Click **Deploy**. Vercel will build and serve your app.

# Amber Music Platform

A modern, cross-platform music platform with YouTube Music integration, lyrics, and a native desktop experience.

## Features

- 🎵 **YouTube Music Integration** - Search, play, and discover music from YouTube Music
- 📱 **Cross-Platform** - Web (Vercel) + Native Desktop (Tauri) for Windows, macOS, Linux
- 🎤 **Synced Lyrics** - Line-by-line lyrics that follow the song
- 🌍 **Multi-Language** - Lyrics translation in 20+ languages
- 💾 **Offline Downloads** - Save songs, albums, and playlists for offline listening
- 🎧 **Advanced Player** - Equalizer, crossfade, playback speed, queue management
- 🔄 **Playlist Transfer** - Import/export playlists from Spotify, YouTube Music, Deezer
- 🎨 **Themes** - Light/Dark/System with custom accent colors
- 🔔 **Discord Rich Presence** - Show what you're listening to
- 📊 **Last.fm Scrobbling** - Track your listening history
- 🔐 **Supabase Auth** - Email/password, magic links, OAuth (Google, Discord, Spotify)
- ⌨️ **Global Shortcuts** - Media keys, custom hotkeys
- 💾 **Local Files** - Play your own music library alongside streaming

## Tech Stack

- **Frontend**: React 19, Next.js 16 (App Router), TypeScript
- **Desktop**: Tauri 2 (Rust), WebView2/WebKitGTK
- **Styling**: Tailwind CSS v4
- **State**: Zustand v5 (persisted)
- **Auth**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **APIs**: YouTube Music (via youtubei.js), Spotify, Genius
- **Deployment**: Vercel (web), GitHub Releases (desktop)

## Getting Started

### Prerequisites

- Node.js 20+
- Rust 1.75+ (for desktop)
- pnpm or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Pant0x/Amber-Music-Platform.git
cd Amber-Music-Platform

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development servers
npm run dev          # Web (Next.js) - http://localhost:3000
npm run tauri:dev    # Desktop (Tauri)
```

### Environment Variables

See `.env.example` for all required variables:

- **Supabase**: Project URL, anon key, service role key
- **YouTube API**: API key for search/player
- **Spotify**: Client ID/secret for playlist import
- **Genius**: Client ID/secret for lyrics
- **Admin**: Username/password for admin dashboard

## Building

### Web (Vercel)

```bash
npm run build        # Production build
npm run start        # Start production server
vercel deploy        # Deploy to Vercel
```

### Desktop (Tauri)

```bash
# Development
npm run tauri:dev

# Production builds
npm run tauri:build:win   # Windows (NSIS installer + portable)
npm run tauri:build       # Current platform (macOS/Linux/Windows)

# Output locations:
# Windows: src-tauri/target/release/bundle/nsis/Amber Music Setup *.exe
# Windows: src-tauri/target/release/bundle/portable/AmberMusic.exe
# macOS: src-tauri/target/release/bundle/dmg/Amber Music *.dmg
# Linux: src-tauri/target/release/bundle/appimage/Amber Music *.AppImage
```

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth pages (sign-in, sign-up, callback)
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles (Tailwind v4)
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── providers.tsx      # Context providers
│   ├── components/
│   │   ├── providers/         # Theme, Player, Toast providers
│   │   └── ui/                # Shared UI components
│   ├── lib/
│   │   ├── api/               # API client (calls Vercel APIs)
│   │   ├── supabase*.ts       # Supabase clients
│   │   └── utils.ts           # Utility functions
│   ├── store/
│   │   ├── slices/            # Zustand store slices
│   │   └── usePlayerStore.ts  # Main store hook
│   ├── ui/                    # Zuno UI components (adapted)
│   │   ├── components/        # UI components
│   │   ├── pages/             # Page components
│   │   └── styles/            # Component styles
│   └── emails/                # Email templates
├── src-tauri/                 # Tauri (Rust) desktop app
│   ├── src/
│   │   ├── main.rs            # Entry point
│   │   ├── lib.rs             # Commands & logic
│   │   ├── audio.rs           # Audio engine
│   │   ├── equalizer.rs       # Equalizer
│   │   ├── discord_rpc.rs     # Discord Rich Presence
│   │   └── ...                # Platform-specific modules
│   ├── tauri.conf.json        # Tauri configuration
│   └── Cargo.toml             # Rust dependencies
├── public/                    # Static assets
├── .github/workflows/         # CI/CD pipelines
├── vercel.json                # Vercel configuration
└── package.json               # npm scripts & dependencies
```

## API Routes

| Route | Description |
|-------|-------------|
| `/api/search` | Search YouTube Music, Spotify |
| `/api/youtube/resolve` | Resolve track to video ID |
| `/api/youtube/next` | Get next recommended track |
| `/api/youtube/playlist` | Get playlist details |
| `/api/lyrics` | Get synced lyrics |
| `/api/radio/start` | Generate radio from seed |
| `/api/radio/more` | Radio pagination |
| `/api/recommendations` | Personalized recommendations |
| `/api/transfer/import` | Import playlist from URL |
| `/api/transfer/save` | Save imported playlist |
| `/api/artist/upload` | Artist track upload |
| `/api/storage/upload` | File upload to Supabase |
| `/api/devices` | Device sync |
| `/api/files` | Local files management |
| `/api/admin/*` | Admin dashboard |

## Deployment

### Vercel (Web)

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

### GitHub Releases (Desktop)

1. Tag a release: `git tag v1.0.0 && git push origin v1.0.0`
2. GitHub Actions builds for all platforms
3. Artifacts uploaded to GitHub Releases
4. Tauri updater checks for updates automatically

## Performance Optimizations

- **Bundle Size**: Optimized with `opt-level = "z"` and LTO
- **Memory**: Jemalloc allocator (optional), efficient caching
- **Network**: HTTP/2, connection pooling, request deduplication
- **Startup**: Lazy loading, code splitting, preloading
- **Desktop**: Single-instance, background updates, tray minimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run lint/typecheck: `npm run lint && npm run typecheck`
5. Submit a pull request

## License

MIT License - see LICENSE for details

## Credits

- Built on [Tauri](https://tauri.app/) and [Next.js](https://nextjs.org/)
- YouTube Music integration via [youtubei.js](https://github.com/LuanRT/YouTube.js)
- Inspired by [Zuno](https://github.com/noFAYZ/zuno) and [JustAnotherMusicClient](https://github.com/2latemc/JustAnotherMusicClient)
- Icons from [Lucide](https://lucide.dev/)
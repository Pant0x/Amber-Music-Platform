# MASTER PRODUCTION PLAN — Pantooty Music Player

**Goal**: Transform the current codebase into a production-ready, professional music player matching Apple Music/Spotify quality.

**Timeline**: 4-6 weeks if executed sequentially, 2-3 weeks with parallel tracks.

---

## 🚨 **WEEK 0 — IMMEDIATE SECURITY (Do First)**

| Task | Files | Notes |
|------|-------|-------|
| **Rotate ALL exposed secrets** | `.env.local` | YouTube API key, Supabase keys, Spotify client secret, Genius credentials — all in git history. Regenerate immediately. |
| **Add `.env.local` to `.gitignore`** | `.gitignore` | Already present but verify not tracked. |
| **Move secrets to Vercel/Netlify env vars** | — | Never commit `.env.local` again. |

---

## 🏗️ **WEEK 1 — ARCHITECTURE & FOUNDATION**

### **1.1 Unify State Management (P0)**
**Problem**: Two systems (Zustand + React Context) managing overlapping state.
**Solution**: **Migrate entirely to Zustand**. Remove `PlaybackContext.tsx`.

```typescript
// New structure in usePlayerStore.ts (split into slices):
// - playbackSlice.ts    (currentTrack, isPlaying, volume, queue, history, progress)
// - navigationSlice.ts  (activeTab, searchQuery, searchHistory, navStack)
// - collectionSlice.ts  (playlists, likedTracks, subscribedChannels, user profile)
// - uiSlice.ts          (showQueuePanel, showNowPlaying, isMinimized, theme)
// - lyricsSlice.ts      (lyricsData, lyricsLoading, activeLineIndex)
// - persistenceSlice.ts (hydration, localStorage sync with versioning)
```

**Actions**:
- Create `src/store/slices/` directory with modular slices
- Use `zustand/middleware/immer` for immutable updates
- Add `version` to persist config for migration support
- Switch from `sessionStorage` → `localStorage` with encryption for sensitive data

### **1.2 Fix All TypeScript Errors & Type Safety (P0)**
**Problem**: 200+ `any` types, missing discriminated unions.
**Files**: `youtubei.ts` (70+), `usePlayerStore.ts` (20+), `search/route.ts`, `lyrics/route.ts`

**Actions**:
- Define proper `Track` discriminated union: `SpotifyTrack | YouTubeTrack | LocalTrack | RadioTrack`
- Replace all `any` with explicit interfaces
- Add Zod schemas for all API responses
- Enable `strict: true` (already on) + `noImplicitAny: true` (add)

### **1.3 Add Error Boundaries & Error Handling (P1)**
**Files**: `src/app/layout.tsx`, `src/components/ErrorBoundary.tsx` (new)

```tsx
// layout.tsx
<ErrorBoundary fallback={<GlobalErrorFallback />}>
  <QueryErrorResetBoundary>
    <ErrorBoundary fallback={<QueryErrorFallback />}>
      {children}
    </ErrorBoundary>
  </QueryErrorResetBoundary>
</ErrorBoundary>
```

### **1.4 Centralized API Client (P1)**
**Problem**: Raw `fetch` everywhere, no retry, no interceptors.
**New**: `src/lib/api/client.ts`

```typescript
// Features:
// - Base URL from env
// - Request/response interceptors (auth, logging, retries)
// - Zod-validated responses
// - Automatic retry with exponential backoff (3 retries)
// - Request cancellation via AbortController
// - Cache headers support
```

---

## ⚡ **WEEK 2 — PERFORMANCE & DATA FETCHING**

### **2.1 Migrate to TanStack Query / SWR (P1)**
**Problem**: Manual `useEffect` + `fetch` patterns everywhere, no caching, no deduping.
**Solution**: Replace all data fetching with **TanStack Query v5**.

```typescript
// src/lib/queries/
// - useSearch(query, options)
// - useRecommendations(params)
// - useArtistChannel(channelId)
// - usePlaylist(playlistId)
// - useLyrics(track)
// - useTrackMetadata(trackId)
// - useTrending()
// - useExplore()

// Each query:
// - staleTime: 5min (artists), 10min (explore), 30s (search)
// - gcTime: 10min
// - retry: 3 with backoff
// - prefetch on hover
```

### **2.2 Code Splitting & Lazy Loading (P1)**
**Problem**: All pages/components loaded in initial bundle.
**Action**: Convert all page components to `lazy()` + `Suspense`:

```tsx
// layout.tsx
const HomeView = lazy(() => import('@/components/pages/HomeView'));
const SearchView = lazy(() => import('@/components/pages/SearchView'));
const ArtistView = lazy(() => import('@/components/pages/ArtistView'));
const LibraryView = lazy(() => import('@/components/pages/LibraryView'));
const PlaylistView = lazy(() => import('@/components/pages/PlaylistView'));
const ExploreView = lazy(() => import('@/components/pages/ExploreView'));
const ProfileView = lazy(() => import('@/app/profile/page'));

// Wrap in <Suspense fallback={<PageSkeleton />}>
```

### **2.3 Image Optimization (P1)**
**Problem**: 30+ `<img>` tags, no next/image.
**Action**: Replace all thumbnails with `<Image />`:

```tsx
import Image from 'next/image';

<Image
  src={upgradeThumbnailUrl(track.thumbnailUrl)}
  alt={track.title}
  width={544}
  height={544}
  className="rounded-md object-cover"
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
/>
```

### **2.4 Virtualization for Long Lists (P2)**
**Files**: `QueuePanel.tsx`, `PlayerDock.tsx`, `PlaylistView.tsx`, `QueuePanel.tsx`
**Action**: Use `@tanstack/react-virtual`:

```tsx
// QueuePanel - only render visible rows + buffer
const parentRef = useRef(null);
const virtualizer = useVirtualizer({
  count: queue.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 72,
  overscan: 5,
});
```

---

## 🎨 **WEEK 3 — UI/UX POLISH (Apple Music/Spotify Quality)**

### **3.1 Dynamic Theming from Album Art (P0)**
**Problem**: Hardcoded gradients, no dynamic colors.
**Solution**: Extract dominant colors from track artwork on play.

```typescript
// src/hooks/useDominantColor.ts (new)
export function useDominantColor(imageUrl: string): {
  primary: string;    // Most dominant
  secondary: string;  // Second
  tertiary: string;   // Third
  textOnPrimary: string; // Contrast color
} {
  // Use Canvas API on mount:
  // 1. Draw image to 50x50 canvas
  // 2. Read pixel data
  // 3. K-means clustering (k=3) for dominant colors
  // 4. Cache in localStorage keyed by imageUrl
}
```

**Apply to**:
- NowPlayingView background gradient
- Header/NowPlaying accent colors
- Lyrics active line color
- Mini-player accent

### **3.2 Crossfade Playback (P0) — Like Spotify**
**Problem**: Hard cuts between tracks.
**Solution**: Web Audio API crossfade in `MediaDeck.tsx`.

```typescript
// AudioContext setup
const audioCtx = new AudioContext();
const gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination);

// Crossfade function
async function crossfade(currentPlayer, nextTrack, duration = 3000) {
  // Fade out current over duration
  // Start next track at volume 0
  // Fade in next over duration
  // Swap references
}
```

**Requirements**:
- Must use `react-player`'s `onProgress` or `onBuffer` for timing
- Fallback to gapless if Web Audio unavailable
- Configurable duration (0-5s) in settings

### **3.3 Ambient Background (P1)**
**Files**: `NowPlayingView.tsx` (lines 380-393)
**Enhance**: Use extracted dominant colors for the blur overlay instead of hardcoded `#030303`.

```tsx
<div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/80" 
     style={{
       background: `radial-gradient(ellipse at center, ${color1}22, ${color2}11, transparent 70%)`
     }}
/>
```

### **3.4 Full-Screen Video with Quality Selector (P1)**
**File**: `VideoPlayerView.tsx`
**Enhancements**:
- `fs: 1` in playerVars
- Quality dropdown: 144p → 4K (read from YouTube's available qualities via `player.getAvailableQualityLevels()`)
- Custom fullscreen button using Fullscreen API
- Picture-in-Picture support (`documentPictureInPicture`)
- Aspect ratio locked to 16:9 with letterboxing
- Custom glassmorphic controls HUD (hide after 3s inactivity)

### **3.5 Skeleton Loading for EVERY View (P1)**
**Missing skeletons**: HomeView, LibraryView, ArtistView, PlaylistView, ProfileView.

```tsx
// Generic skeleton component
export function SectionSkeleton({ title, count = 4, type = 'grid' }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Loading...</h2>
      {type === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <CarouselSkeleton count={count} />
      )}
    </div>
  );
}
```

### **3.6 Mobile Polish (P1)**
| Issue | Fix |
|-------|-----|
| Touch targets < 44px | Increase all icon buttons to min 44x44px |
| Carousel keyboard nav | Add `onKeyDown` for ArrowLeft/Right on carousels |
| Focus trapping in modals | `useFocusTrap` hook on ShareModal, Search dropdown |
| Heading hierarchy | Ensure h1 → h2 → h3 on all pages |
| Tablet layout | Add `lg:` breakpoints, not just `md:` |

### **3.7 Accessibility Audit (P2)**
- Add `aria-label` to all icon-only buttons
- `aria-live="polite"` for now-playing track changes
- `role="region"` for carousels with `aria-label`
- Skip links for keyboard users
- Color contrast ratios ≥ 4.5:1

---

## 🔧 **WEEK 4 — FEATURE PARITY (Spotify/Apple Music)**

### **4.1 Smart Queue System (P0)**
**Current**: Basic FIFO queue.
**Target**: Two-tier queue like Spotify:
- **Up Next** (user-added, draggable, reorderable)
- **Suggested** (autoplay, radio, algorithmic — auto-refreshed)

```typescript
// Zustand slice additions:
interface QueueState {
  userQueue: Track[];      // Manual additions
  suggestedQueue: Track[]; // Auto-generated
  history: Track[];        // Played (max 100)
  repeatMode: 'off' | 'one' | 'context';
  shuffle: boolean;
  
  addToUpNext: (track: Track) => void;
  addToSuggested: (tracks: Track[]) => void;
  reorderUpNext: (from: number, to: number) => void;
  removeFromQueue: (id: string, source: 'user' | 'suggested') => void;
}
```

### **4.2 Crossfade Radio / Start Radio from Any Track (P1)**
**API**: New `/api/radio/start` endpoint.
**Logic**: Given a seed track, fetch 30 similar tracks via recommendation engine, shuffle deterministically, return as queue.

### **4.3 Lyrics: Genius Primary + Concurrent Fetching (P0)**
**Current**: Sequential layers (slow).
**New**: Parallel fetching with race:

```typescript
// src/app/api/lyrics/route.ts
const results = await Promise.allSettled([
  fetchGenius(cleanArtist, cleanTitle),
  fetchLrcLibExact(cleanArtist, cleanTitle),
  fetchLrcLibSearch(`${cleanArtist} ${cleanTitle}`),
  fetchYTMusicLyrics(videoId),
]);

// Return first successful with synced lyrics
const synced = results.find(r => r.status === 'fulfilled' && r.value.isSynced);
if (synced) return synced.value;

// Otherwise return first with plain lyrics + interpolate timing
```

**Add**: Client-side lyrics cache in `localStorage` (TTL 30 days).

### **4.4 Search: Artist Channel Pinning (P0)**
**Problem**: Search doesn't prioritize your channel.
**Fix**: `src/config/artistChannelMap.ts` + search API integration.

```typescript
// config
export const ARTIST_CHANNEL_MAP = {
  'pantoti': 'UCWLjkgkthzEjTmEpGg0xoDw',
  // ... your artists
};

// In search API: if query matches a key, pin that channel as top result
```

### **4.5 Recommendation Engine Overhaul (P1)**
**Current**: Basic scoring.
**Target**: Multi-signal ranking like Spotify:

```typescript
// Signals (weighted):
// - Collaborative filtering (user-user similarity) — 30%
// - Content-based (genre, artist, audio features) — 25%
// - Recency decay (exp decay, half-life 7 days) — 20%
// - Popularity (play count, trends) — 15%
// - Diversity penalty (avoid same artist 3x in row) — 10%

// Implementation: Pre-compute daily via cron, serve from cache
```

### **4.6 Home Page Redesign (P1)**
**Target**: Apple Music/Spotify home layout:
- **Hero**: Time-based greeting + "Good morning/afternoon/evening"
- **Recently Played**: Horizontal scroll, large cards (160x160)
- **Made For You**: 4+ personalized playlists (Daily Mix, Discover Weekly, etc.)
- **Mood/Genre Tiles**: Large gradient cards (not small chips)
- **New Releases**: From followed artists
- **Charts**: Top 50 global + local

---

## 🛡️ **WEEK 5 — HARDENING & PRODUCTION READY**

### **5.1 Input Validation & Security (P0)**
**All API routes**: Add Zod schemas.

```typescript
// src/lib/validators.ts
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  pageToken: z.string().optional(),
});

export const lyricsQuerySchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  duration: z.string().regex(/^\d+:\d{2}$/).optional(),
  videoId: z.string().min(11).max(11).optional(),
});

// In route handlers:
const parsed = schema.safeParse(Object.fromEntries(request.url.searchParams));
if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
```

### **5.2 Rate Limiting (P1)**
**Middleware**: `src/middleware.ts` + Upstash Redis or in-memory.

```typescript
// 30 req/min for search, 60 req/min for others
```

### **5.3 Comprehensive Testing (P2)**
| Type | Tool | Target |
|------|------|--------|
| Unit | Vitest + React Testing Library | Store slices, utils, hooks |
| Integration | Playwright | Critical flows: search→play→queue→lyrics |
| E2E | Playwright | Auth, playback, offline |
| Visual | Chromatic | Component library |
| Accessibility | axe-core | All pages |

### **5.4 Monitoring & Observability (P1)**
- **Sentry**: Error tracking + performance
- **Vercel Analytics**: Web vitals
- **Custom events**: Track play, skip, search, share, queue actions

### **5.5 Bundle Optimization (P1)**
```bash
# Run bundle analyzer
npx @next/bundle-analyzer

# Targets:
# - Initial JS < 150KB gzipped
# - No single chunk > 50KB
# - Tree-shake unused lucide icons (use `lucide-react` tree-shaking)
# - Remove Framer Motion from non-animated components
```

---

## 📋 **EXECUTION CHECKLIST**

### **Must Have (Launch Blockers)**
- [ ] Rotate all secrets
- [ ] Unify state (remove Context)
- [ ] Fix all TypeScript errors
- [ ] Add error boundaries
- [ ] Crossfade playback
- [ ] Dynamic theming from album art
- [ ] Full-screen video with quality selector
- [ ] Skeletons for all views
- [ ] Zod validation on all APIs
- [ ] Rate limiting

### **Should Have (Week 1-2 Post-Launch)**
- [ ] TanStack Query migration
- [ ] Smart queue (Up Next + Suggested)
- [ ] Start Radio feature
- [ ] Lyrics: Genius primary + concurrent
- [ ] Search artist pinning
- [ ] Mobile polish + accessibility
- [ ] Recommendation engine v2
- [ ] Home page redesign

### **Nice to Have (Month 2+)**
- [ ] Collaborative playlists
- [ ] Social features (follow, share to stories)
- [ ] Offline mode (Service Worker)
- [ ] Equalizer + audio effects
- [ ] Sleep timer
- [ ] Lyrics translation
- [ ] Concerts/tickets integration

---

## **TECH DEBT REGISTER (Track in GitHub Issues)**

| ID | Component | Debt | Effort |
|----|-----------|------|--------|
| TD-001 | `usePlayerStore` | Split into 6 slices | 8h |
| TD-002 | `youtubei.ts` | Remove 70+ `any` types | 6h |
| TD-003 | `search/route.ts` | Remove Fairuz hack, add config | 4h |
| TD-004 | `VideoPlayerView` | Merge with MediaDeck, remove `usePlayback` | 8h |
| TD-005 | `PlaybackContext` | Delete after Zustand migration | 4h |
| TD-006 | `DatabaseSync` | Replace with TanStack Query mutations | 6h |
| TD-007 | `waitlist_page` | Merge or delete | 2h |
| TD-008 | All components | Add `React.memo` + `useCallback` | 16h |

---

## **DEFINITION OF DONE (Per Feature)**

1. ✅ TypeScript compiles with zero errors (`npm run build`)
2. ✅ Lint passes (`npm run lint`)
3. ✅ Unit tests > 80% coverage
4. ✅ E2E test passes for happy path
5. ✅ No console errors/warnings in dev/prod
6. ✅ Lighthouse score > 90 (Performance, Accessibility, Best Practices, SEO)
7. ✅ Works on Chrome, Firefox, Safari, Edge (last 2 versions)
8. ✅ Mobile responsive (375px, 414px, 768px, 1024px)
9. ✅ Accessibility audit passes (axe-core)
10. ✅ Bundle size within budget

---

**Estimated Total Effort**: ~200-250 hours for full production parity with Apple Music/Spotify core features.

**Recommended Team**: 2-3 engineers (1 frontend lead, 1 full-stack, 1 UI/UX) for 4-6 weeks.

---

This plan is comprehensive and executable. Each section can be assigned as a separate GitHub issue/PR.
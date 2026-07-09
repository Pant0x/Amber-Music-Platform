# Pantooty Music Player — Production Readiness Fixes

## 🔴 CRITICAL (Must Fix Before Production)

### 1. `.env.local` — 7 Hardcoded API Secrets (ROTATE IMMEDIATELY)
All keys are in the repo file (though gitignored). They were likely used in Vercel env vars. **Revoke all and generate fresh keys**:
- `YOUTUBE_API_KEY` (Google Cloud)
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase)
- `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET`
- `GENIUS_CLIENT_ID` + `GENIUS_CLIENT_SECRET`

Also: **`spotify.ts:9-10`** has hardcoded fallback credentials hard-written in source code — these are committed to git and exposed to all users.

### 2. `NowPlayingView.tsx` — Module-Level `lyricsCache` = Memory Leak
```ts
const lyricsCache = new Map<string, any>(); // defined OUTSIDE component
```
This cache lives forever, never garbage-collected. Replace with a ref inside the component or use a bounded LRU cache with TTL.

### 3. `DatabaseSync.tsx` — Entire State Sent as 1MB+ JSON Every 1.5s
Every state change sends full `playlists[]`, `likedTracks[]`, `history[]` as a POST. For users with 500+ items this is **catastrophic**. Fix: send only a diff/patch, or debounce heavily and throttle to max 1 request per 10s.

### 4. `DatabaseSync.tsx` — Potential Infinite Sync Loop
Effect depends on `[playlists, likedTracks, subscribedChannels, history, displayName, avatarUrl]` — if the sync response updates these, the effect retriggers. Use a `isSyncing` flag or compare before committing.

### 5. `VideoPlayerView.tsx` — `seekTo` Passes Fraction as Seconds (Bug)
```ts
playerRef.current.seekTo(seekFraction); // react-player expects seconds, not fraction
```
`seekFraction` is 0-1 but react-player `seekTo()` interprets the first arg as **seconds** by default. Pass `(seekFraction * duration)` or add the second boolean parameter `'fraction'`.

### 6. `src/app/api/user/sync/route.ts` — IP-Based Authentication
User identity is derived from `x-forwarded-for` or `x-real-ip`. This is insecure (spoofable, NAT-sharing, proxies). Replace with proper auth: Supabase JWT tokens, session cookies, or API keys.

### 7. `youtube/channel/[id]/route.ts` — Supabase Query Fetches ALL Rows
```ts
supabase.from('tracks_metadata_cache').select('metadata').not('metadata', 'is', null)
```
This scans the entire `tracks_metadata_cache` table server-side with no WHERE clause. As the DB grows this becomes O(n) and kills performance. Add a filter (e.g., by artist or channel).

### 8. `LibraryView.tsx` — "Liked Music" Play Button Always Fails
Clicking play on the Liked Music card calls `/api/youtube/playlist?id=liked` which will 404. Fix: either handle `id === 'liked'` as a special case that plays all liked tracks, or disable the play overlay.

### 9. `DatabaseSync.tsx` — No Request Cancellation
Multiple rapid in-flight POST requests can arrive out of order, causing data races. Use `AbortController` and abort the previous request on each new trigger.

---

## 🟠 HIGH (Blocking Production Quality)

### 10. `NowPlayingView.tsx` — Stale Closure in Fetch Effect
```ts
useEffect(() => { /* uses history, searchHistory, selectedMood */ }, [currentTrack?.id, nowPlayingTab]);
```
Cleanup missing. Add all referenced vars to deps or use `useRef` to avoid stale reads.

### 11. `Header.tsx` — `router.back()` Can Exit the App
If there's no history, calling `router.back()` navigates the user away from the SPA entirely. Check `window.history.length > 1` before calling back.

### 12. `Header.tsx` — `/profile` Route Doesn't Exist
`router.push('/profile')` leads to 404. Either create the route or remove the navigation.

### 13. `Sidebar.tsx` — `/liked` Route Doesn't Exist
`navigateToTab('liked')` calls `router.push('/liked')` which 404s. The liked view is rendered via active tab, not routing.

### 14. `QueuePanel.tsx` — History Track Click Loses Queue Context
```ts
handleTrackClick calls playTrack(track) WITHOUT passing contextTracks
```
This breaks next/prev navigation when clicking from recently played.

### 15. `NowPlayingView.tsx` — Video Portal Element Orphaned
An empty `<div id="now-playing-video-portal">` exists but no portal source injects into it. Dead code or incomplete feature.

### 16. `AlbumCoverPlayOverlay.tsx` — Brittle Prefix Heuristic
```ts
!item.id.startsWith('VL') && !item.id.startsWith('PL') && !item.id.startsWith('MPRE')
```
YouTube IDs can have other prefixes. Use a more robust classifier (e.g., check `item.type` or `item.origin`).

### 17. `RouterRegister.tsx` — Storing Next.js Router in Zustand
Zustand holds `setRouter(router)` — this breaks React's declarative navigation model and leads to stale references. Use `useRouter()` in a component, or pass a navigate callback via context.

### 18. `PlaybackContext.tsx` — No `useMemo`/`useCallback`
All exposed functions are recreated on every render, forcing all context consumers to re-render on every state change. Wrap in `useCallback`.

### 19. `PlaybackContext.tsx` — `as any` Cast Exports Typeless Data
```ts
...({ likedTracksDetails, setPlaylist } as any)
```
This cast at line 371 defeats all TypeScript safety for consuming components.

### 20. `useTrackMetadata.ts` — Fake BPM/Key Presented as Real
The "deterministic metadata" generates fabricated BPM and Key signatures from a track ID hash. This is misleading if presented to users as real musical data. Add a label like "(estimated)" or remove.

### 21. `ShareModal.tsx` — Social Share URLs Double-Encoded
```ts
const shareText = `Listen to ${shareTrack.title} ... ${shareUrl}`;
soc.link(encodeURIComponent(shareText));
```
`encodeURIComponent` encodes `?` and `=` in the URL inside the text. Fix: encode the URL separately, then interpolate.

### 22. `youtube/explore/route.ts` — No Caching, Every Request Hits Spotify
No `Cache-Control` headers. Spotify API rate limits will be hit. Add `force-cache` or server-side caching.

### 23. `youtube/playlist/route.ts` — Recursive Traversal Can Stack Overflow
The `traverse()` function recurses into nested objects without depth limiting. A malicious or deeply nested API response could cause a stack overflow.

### 24. `listen_history/route.ts` — Auth Verified After Insert Object Built
Token verification happens after the request body is already parsed and mapped. If verification fails, `user_id` might be forged.

### 25. `AlbumCoverPlayOverlay.tsx` — No Fetch Timeout
`fetch()` calls have no `AbortSignal`. A slow network keeps the user in an indefinite loading state.

### 26. `PlaybackContext.tsx` — `playTrack` Doesn't Reset Seek State
```ts
setProgress({ played: 0, playedSeconds: 0, loaded: 0, loadedSeconds: 0 });
```
But `seekTrigger` and `seekFraction` are not reset, causing a stale seek to fire for the new track.

### 27. `SearchView.tsx` — No Request Cancellation
Multiple rapid searches fire off uncancelled fetches. Results can arrive out of order, showing stale data. Use `AbortController`.

### 28. `playlist/[id]/page.tsx` — Stale Closure on Unmount
Effect calls `setYtPlaylistDetails` and `setYtPlaylistLoading` after component unmount. Add cleanup boolean.

### 29. `Carousel` — Scroll Position Not Reset on Children Change
When navigating to a new artist with fewer items, the scroll position can be beyond the content width. Reset `scrollLeft` when `children` change.

---

## 🟡 MEDIUM (Should Fix for Quality)

### 30. Code Duplication
- `ExplicitBadge` defined in `QueuePanel.tsx`, `NowPlayingView.tsx`, `MediaDeck.tsx`, and `shared.tsx` → extract into a shared component
- Artist splitting logic `channelTitle.split(/,|\s+&\s+|\s+and\s+/i)` repeated ~10× across the codebase → extract as `splitArtistNames()` utility
- `cleanTopicGlobally` / `cleanArtistName` usage overlapping with text utils → consolidate

### 31. `Spotify.ts` — Hardcoded Fallback Credentials in Source
Lines 9-10: `clientId: process.env.SPOTIFY_CLIENT_ID || '13d23838b1d34500ad6567a12b176b87'` — the fallback `||` string is committed. Remove fallback and throw if missing.

### 32. `TrackCover.tsx` — Redundant CSS Animation State
```tsx
style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
```
The animation is already controlled by CSS class toggle. Remove inline style.

### 33. `MobileBottomNav.tsx` — Hardcoded Route Detection
```ts
pathname === '/' ? 'home' : pathname === '/explore' ? 'explore' : ...
```
Does not handle nested routes or params. Use a route-map constant.

### 34. `PlaylistView.tsx` — No `AbortController` on Fetch
Missing cancellation for the playlist fetch API call.

### 35. `youtube/channel/[id]/route.ts` — "Fairuz" Hardcoded
Contains artist-specific hacks (German Fairuz, song dedup). Remove from general-purpose code or move to config.

### 36. `youtube/explore/route.ts` — Hardcoded Spotify Playlist ID
`37i9dQZEVXbMDoHDGih2h2` is the Global Top 50. If this changes, the explore view silently falls back. Move to config or make configurable.

### 37. `SearchView.tsx` — Landing Recommendations Refetch on Every Track Play
```ts
[searchQuery, history.length, searchHistory.length, selectedMood]
```
`history.length` changes on every track play → triggers unnecessary refetch. Split into separate effects.

### 38. `Header.tsx` — No Rate-Limiting for Suggestions
Rapid typing creates many uncancelled `/api/search/suggestions` fetches. Debounce server-side or cancel client-side on query change.

### 39. `ArtistView.tsx` — Undefined Background URL
```tsx
backgroundImage: url(${currentChannelDetails.profile?.bannerUrl || currentChannelDetails.profile?.avatarUrl})
```
If both are undefined, renders `url(undefined)`. Add a fallback gradient.

### 40. `PlaybackContext.tsx` — No localStorage Versioning
Data is read/written to `localStorage` without version keys. Schema changes will silently corrupt existing data. Add a version key and migration.

### 41. `PlaybackContext.tsx` — Queue Tracks Accumulate in Playlist
Tracks played from the queue are added to the circular playlist via `playTrack`, causing playlist bloat. Track played from queue should not be added to playlist.

### 42. `Header.tsx` — Fragile Avatar Detection
```ts
avatarUrl.startsWith('bg-') // assumes gradient class
```
If a user's avatar URL ever starts with `bg-`, it breaks. Use a dedicated boolean or separate fields.

### 43. `AlbumCoverPlayOverlay.tsx` — `contextTracks` Could Be Empty Array
```ts
contextTracks || [track]
```
Empty array `[]` is truthy, so fallback never applies. Use `contextTracks?.length ? contextTracks : [track]`.

### 44. `NowPlayingView.tsx` — `isLiked` Computed on Every Render
Not memoized. Wrap in `useMemo`.

### 45. `NowPlayingView.tsx` — `activeLineIndex` O(n) on Every Progress Tick
```ts
lyricsData.lines.findIndex(line => line.time >= playedSeconds)
```
For 200-line lyrics, this runs on every 100ms tick. Use binary search or memoized cursor.

### 46. `SearchView.tsx` — "Play All" Not in Search History
Clicking tracks doesn't add the search query to `searchHistory`. Only Enter key and suggestion clicks do. Inconsistent.

### 47. `globals.css` — No Font Fallback
```css
--font-sans: var(--font-geist-sans);
```
If Geist fails to load, there's no system-ui fallback. Add `, system-ui, sans-serif` to the font-family stack.

---

## 🔧 PERFORMANCE (Production-Speed Bottlenecks)

| # | File | Issue |
|---|------|-------|
| 1 | `NowPlayingView.tsx` | 1155-line component — violates SRP. Split: LyricsPanel, UpNextPanel, RelatedPanel, PlaybackControls |
| 2 | `youtube/channel/[id]/route.ts` | 792-line API route — split into services (channel profile, discography, top songs, related artists) |
| 3 | `SearchView.tsx` | ~500 lines — split: SearchResultsSection, ArtistCards, AlbumCards |
| 4 | `NowPlayingView.tsx` | `activeLineIndex` re-runs on every render (O(n) for lyrics) |
| 5 | `DatabaseSync.tsx` | Full state payload every 1.5s → throttled diff-based sync |
| 6 | `PlaybackContext.tsx` | All context values recreated on every tick → `useMemo`/`useCallback` |

## 🛡️ SECURITY

| # | File | Issue |
|---|------|-------|
| 1 | `user/sync/route.ts` | IP-based auth is insecure — use Supabase JWT |
| 2 | `user/sync/route.ts` | No rate limiting on POST — clients can spam DB writes |
| 3 | `user/sync/route.ts` | No request body size validation — OOM risk |
| 4 | `listen_history/route.ts` | Auth verified after insert — can forge user_id |
| 5 | `user/sync/route.ts` | No input sanitization — XSS risk on stored display_name |
| 6 | `spotify.ts` | Fallback credentials in source code — exposed to all |
| 7 | `DatabaseSync.tsx` | No CORS headers on API routes |

---

## 🧪 MISSING & BROKEN (Features/APIs)

| # | File | Issue |
|---|------|-------|
| 1 | `NowPlayingView.tsx` | Video portal div exists but no portal source — dead feature |
| 2 | `LibraryView.tsx` | "Liked Music" play button always fails |
| 3 | `Header.tsx` | Profile route doesn't exist — user can navigate to 404 |
| 4 | `Sidebar.tsx` | Liked route doesn't exist via routing (only via tab) |
| 5 | `Header.tsx` | `router.back()` can exit the app |
| 6 | `useTrackMetadata.ts` | BPM/Key is fabricated from hash — misleading |
| 7 | `AlbumCoverPlayOverlay.tsx` | `contextTracks` empty array fallback bug |
| 8 | `QueuePanel.tsx` | History track click loses playlist context |
| 9 | `shared.tsx` | `artistId || cleanName` can both be empty → `/artist/` 404 |
| 10 | `NowPlayingView.tsx` | Dislike is purely local state, never synced |

---

## 🏗️ ARCHITECTURE (Structural Debt)

1. **Two State Layers**: Both `PlaybackContext.tsx` (context API) and `usePlayerStore.ts` (Zustand) manage similar state. Zustand is the canonical store; `PlaybackContext.tsx` seems to be a legacy wrapper. Consolidate into Zustand only.

2. **Router in Store Anti-Pattern**: Storing `router` in Zustand is fragile. The store should emit intent; a component should handle navigation.

3. **API Routes Too Large**: `channel/[id]/route.ts` (792 lines) and `NowPlayingView.tsx` (1155 lines) should be refactored into smaller modules.

4. **Dead Code**: `PlaybackContext.tsx`'s localStorage fallback (lines 36-67) runs even when Supabase is active. Conditional check deferred.

5. **No Request Timeouts**: Many `fetch()` calls lack `AbortController` — indefinite loading states possible.

6. **No Error Boundaries**: No `ErrorBoundary` wrapping around `ReactPlayer`, `QRCode`, or other error-prone components.

7. **No Caching Strategy**: No `Cache-Control` headers, no SWR/React Query, no server-cached responses. Every page load re-fetches everything.
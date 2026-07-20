import { NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify';
import { cleanArtistName } from '@/lib/youtubei';

const spotifyResolveCache = new Map<string, any>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');

    if (!title) {
      return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
    }

    const cacheKey = `${artist?.toLowerCase().trim() || ''}_${title.toLowerCase().trim()}`;
    if (spotifyResolveCache.has(cacheKey)) {
      const cached = spotifyResolveCache.get(cacheKey);
      console.debug(`[Spotify Resolve API] Cache HIT for key: "${cacheKey}"`);
      return NextResponse.json(cached);
    }

    // Clean up typical YouTube titles if they have feat keywords so we search Spotify cleanly
    const cleanTitle = title.replace(/\(feat\..+?\)|\(with.+?\)|\(ft\..+?\)/i, '').trim();

    // If the title contains a dash, it usually has the artist name(s) in it.
    // In that case, do NOT prepend the uploader channel title (which could be a blog/distributor).
    const hasDash = /[-–—]/.test(title);
    const query = (artist && !hasDash) ? `${cleanArtistName(artist)} ${cleanTitle}` : cleanTitle;

    const isTitleMatch = (reqT: string, resT: string) => {
      const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const r = clean(reqT);
      const m = clean(resT);
      if (r === m) return true;

      // If the request title has a dash, check the part after the dash
      const dashParts = reqT.split(/[-–—]/);
      if (dashParts.length > 1) {
        const potentialTitle = dashParts[dashParts.length - 1].trim();
        const ptCleaned = clean(potentialTitle);
        if (ptCleaned === m) return true;

        if (m.includes(ptCleaned) || ptCleaned.includes(m)) {
          const minLen = Math.min(ptCleaned.length, m.length);
          const maxLen = Math.max(ptCleaned.length, m.length);
          if (minLen / maxLen >= 0.75) return true;
        }
      }

      if (r.includes(m) || m.includes(r)) {
        const minLen = Math.min(r.length, m.length);
        const maxLen = Math.max(r.length, m.length);
        if (minLen / maxLen >= 0.75) return true;
      }
      return false;
    };

    let enrichedData: any = null;

    // 1. Try Spotify first
    try {
      console.debug(`[Spotify Resolve API] Searching Spotify for: "${query}"`);
      const spotifyApi = await getSpotifyApi();
      const searchRes = await spotifyApi.searchTracks(query, { limit: 5 });
      const tracks = searchRes.body.tracks?.items || [];

      const match = tracks.find((t: any) => isTitleMatch(cleanTitle, t.name));
      if (match) {
        const artistsStr = match.artists.map((a: any) => a.name).join(', ');
        enrichedData = {
          enriched: true,
          title: match.name,
          channelTitle: artistsStr,
          isExplicit: match.explicit
        };
      }
    } catch (spotifyError) {
      console.warn('[Spotify Resolve API] Spotify lookup failed, falling back to YouTube Music:', spotifyError);
    }

    // 2. Fall back to YouTube Music search if Spotify failed or returned nothing
    if (!enrichedData) {
      try {
        console.debug(`[Spotify Resolve API] Querying YouTube Music fallback for: "${query}"`);
        const { ytMusicSearch } = await import('@/lib/youtubei');
        const searchRes = await ytMusicSearch(query);
        const songs = searchRes.songs || [];
        
        const match = songs.find((s: any) => isTitleMatch(cleanTitle, s.title));
        if (match) {
          enrichedData = {
            enriched: true,
            title: match.title,
            channelTitle: match.channelTitle, // Parsed with all co-artists
            isExplicit: match.isExplicit || false
          };
        }
      } catch (ytError) {
        console.error('[Spotify Resolve API] YouTube Music fallback search failed:', ytError);
      }
    }

    if (!enrichedData) {
      const fallbackResult = { enriched: false };
      if (spotifyResolveCache.size > 500) {
        spotifyResolveCache.clear();
      }
      spotifyResolveCache.set(cacheKey, fallbackResult);
      return NextResponse.json(fallbackResult);
    }

    if (spotifyResolveCache.size > 500) {
      spotifyResolveCache.clear();
    }
    spotifyResolveCache.set(cacheKey, enrichedData);

    return NextResponse.json(enrichedData);
  } catch (error: any) {
    console.error('[Spotify Resolve API] Outer error in resolver:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

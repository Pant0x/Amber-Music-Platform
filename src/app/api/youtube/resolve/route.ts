import { NextResponse } from 'next/server';
import YTMusic from 'ytmusic-api';
import { isCorrectMatch, isArtistMatch } from '@/lib/match-utils';

const resolveCache = new Map<string, string>();
const CACHE_VERSION = 'v5'; // bumped for ytmusic-api pure audio resolution

let ytmusic: YTMusic | null = null;
let ytmusicInitPromise: Promise<any> | null = null;

async function getYTMusic() {
  if (!ytmusic) {
    ytmusic = new YTMusic();
    ytmusicInitPromise = ytmusic.initialize();
  }
  if (ytmusicInitPromise) {
    await ytmusicInitPromise;
    ytmusicInitPromise = null;
  }
  return ytmusic;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');

    if (!title || !artist) {
      return NextResponse.json({ error: 'Missing title or artist parameters' }, { status: 400 });
    }

    const mode = searchParams.get('mode') || 'song';
    const isExplicitRequest = searchParams.get('explicit') === 'true';
    const album = searchParams.get('album');

    // Use only the primary artist for search queries
    const primaryArtist = artist
      .split(/,|\s+&\s+|\s+feat\.?\s+|\s+ft\.?\s+/i)[0]
      .trim();
    
    // Check resolve cache
    const cacheKey = `${CACHE_VERSION}_${artist.toLowerCase().trim()}_${title.toLowerCase().trim()}_${album?.toLowerCase().trim() || ''}_${mode}_${isExplicitRequest}`;
    if (resolveCache.has(cacheKey)) {
      const cachedData = resolveCache.get(cacheKey);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          console.debug(`[Resolve API] Cache HIT for key: "${cacheKey}" -> videoId: ${parsedData.videoId}`);
          return NextResponse.json(parsedData);
        } catch (e) {
          return NextResponse.json({ videoId: cachedData });
        }
      }
    }

    const yt = await getYTMusic();
    
    // Initial query
    const query = `${primaryArtist} ${title} ${album ? album : ''} ${isExplicitRequest ? 'Explicit' : ''}`.trim();
    console.debug(`[Resolve API ytmusic-api] Searching (${mode}): "${query}"`);

    let results: any[] = [];
    if (mode === 'video') {
      results = await yt.searchVideos(query);
    } else {
      results = await yt.searchSongs(query);
    }

    // Fallback search without album/explicit if no results found
    if (results.length === 0) {
      const fallbackQuery = `${primaryArtist} ${title}`;
      console.debug(`[Resolve API ytmusic-api] Fallback search: "${fallbackQuery}"`);
      results = mode === 'video' ? await yt.searchVideos(fallbackQuery) : await yt.searchSongs(fallbackQuery);
    }

    const getBestMatch = (items: any[]) => {
      // Step 1: filter by title and artist correctness
      const validItems = items.filter(i => isCorrectMatch(title, i.name) && isArtistMatch(artist, i.artist?.name || ''));
      if (!validItems || validItems.length === 0) return null;
      
      // Step 2: if album context is provided, STRICTLY require album match.
      if (album) {
        const cleanRequestedAlbum = album.toLowerCase().replace(/[^a-z0-9]/g, '');
        const albumMatchItems = validItems.filter(i => {
          if (!i.album?.name) return false;
          const cleanItemAlbum = i.album.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanItemAlbum.includes(cleanRequestedAlbum) || cleanRequestedAlbum.includes(cleanItemAlbum);
        });
        
        if (albumMatchItems.length > 0) {
          console.debug(`[Resolve API ytmusic-api] Album filter matched ${albumMatchItems.length} item(s)`);
          return albumMatchItems[0];
        }
        
        console.debug(`[Resolve API ytmusic-api] No album-matched items for "${album}", falling back to artist+title match`);
      }

      return validItems[0];
    };

    let match = getBestMatch(results);
    
    // Fallback loosely just based on exact title match if all else fails
    if (!match && results.length > 0) {
        const looseMatch = results.find(i => isCorrectMatch(title, i.name));
        if (looseMatch) {
            match = looseMatch;
            console.debug(`[Resolve API ytmusic-api] Fallback to loose title match: ${match.name}`);
        } else {
            // Absolute fallback to top result
            match = results[0];
            console.debug(`[Resolve API ytmusic-api] Absolute fallback to top result: ${match.name}`);
        }
    }

    if (match) {
      // Normalize match object back into expected frontend format
      const normalizedTrack = {
        id: match.videoId,
        title: match.name,
        channelTitle: match.artist?.name || 'Unknown',
        thumbnailUrl: match.thumbnails?.[match.thumbnails.length - 1]?.url || '',
        isExplicit: (match as any).isExplicit || isExplicitRequest, // Approximate explicit badge if matched from explicit query
        duration: match.duration,
        albumName: match.album?.name
      };

      const responseData = { videoId: match.videoId, track: normalizedTrack };
      resolveCache.set(cacheKey, JSON.stringify(responseData));
      if (resolveCache.size > 500) {
        const firstKey = resolveCache.keys().next().value;
        if (firstKey) resolveCache.delete(firstKey);
      }
      return NextResponse.json(responseData);
    } else {
      console.debug(`[Resolve API ytmusic-api] No matches found, returning fallback empty`);
      return NextResponse.json({ videoId: null });
    }
  } catch (error: any) {
    console.error('[Resolve API ytmusic-api] Error resolving track:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


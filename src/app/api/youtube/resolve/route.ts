import { NextResponse } from 'next/server';
import { ytMusicSearch } from '@/lib/youtubei';
import ytAdapter from '@/lib/yt-music-adapter';
import { isCorrectMatch, isArtistMatch } from '@/lib/match-utils';

const resolveCache = new Map<string, string>();
// Bump this version to instantly invalidate all previously cached resolve results.
const CACHE_VERSION = 'v3';

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

    // Use only the primary artist for search queries (first name when comma-separated or featured)
    const primaryArtist = artist
      .split(/,|\s+&\s+|\s+feat\.?\s+|\s+ft\.?\s+/i)[0]
      .trim();
    
    // Check resolve cache (versioned to auto-invalidate stale entries)
    const cacheKey = `${CACHE_VERSION}_${artist.toLowerCase().trim()}_${title.toLowerCase().trim()}_${album?.toLowerCase().trim() || ''}_${mode}_${isExplicitRequest}`;
    if (resolveCache.has(cacheKey)) {
      const cachedData = resolveCache.get(cacheKey);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          console.log(`[Resolve API] Cache HIT for key: "${cacheKey}" -> videoId: ${parsedData.videoId}`);
          return NextResponse.json(parsedData);
        } catch (e) {
          return NextResponse.json({ videoId: cachedData });
        }
      }
    }

    let query = mode === 'video' 
      ? `${primaryArtist} ${title} Official Video` 
      : `${primaryArtist} ${title} ${album ? album + ' ' : ''}${isExplicitRequest ? 'Explicit ' : ''}Topic`;
    console.log(`[Resolve API] Searching YouTube Music for (${mode}): "${query}"`);
    let searchData = await ytMusicSearch(query);

    // Fallback if no songs found with the specific query (e.g. if the album name caused no results)
    if (album && mode === 'song' && (!searchData.songs || searchData.songs.length === 0)) {
      query = `${primaryArtist} ${title} ${isExplicitRequest ? 'Explicit ' : ''}Topic`;
      console.log(`[Resolve API] Fallback search without album name: "${query}"`);
      searchData = await ytMusicSearch(query);
    }

    // Fallback if no songs found with the explicit query keyword
    if (isExplicitRequest && mode === 'song' && (!searchData.songs || searchData.songs.length === 0)) {
      query = `${primaryArtist} ${title} Topic`;
      console.log(`[Resolve API] Fallback search without explicit keyword: "${query}"`);
      searchData = await ytMusicSearch(query);
    }

    const findBestInGroup = (group: any[]) => {
      const firstItem = group[0];
      const baseTitle = firstItem.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
      
      // Prefer explicit version if requested, otherwise prefer non-clean version
      if (isExplicitRequest) {
        const explicitMatch = group.slice(0, 5).find((i: any) => {
          const iTitle = i.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
          return iTitle === baseTitle && i.isExplicit;
        });
        if (explicitMatch) return explicitMatch;
      }

      const uncensoredMatch = group.slice(0, 5).find((i: any) => {
        const iTitle = i.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
        return iTitle === baseTitle && !/\b(clean|censored|radio\s+edit)\b/i.test(i.title);
      });
      return uncensoredMatch || firstItem;
    };

    const selectBestFromGroup = (group: any[]) => {
      if (mode === 'song') {
        // PRIMARY FILTER: isTopicAudio flag (detected from raw subtitle before '- Topic' is stripped).
        // Topic channel audio is the authoritative audio release on YouTube Music.
        const topicItems = group.filter(i => i.isTopicAudio === true);
        if (topicItems.length > 0) {
          console.log(`[Resolve API] Found ${topicItems.length} Topic channel audio result(s)`);
          return findBestInGroup(topicItems);
        }

        // SECONDARY FILTER: exclude VEVO and official artist channels
        const audioItems = group.filter(i => 
          !i.channelTitle.toLowerCase().includes('vevo') &&
          !i.channelTitle.toLowerCase().includes('official')
        );
        if (audioItems.length > 0) {
          console.log(`[Resolve API] No Topic results, using ${audioItems.length} non-VEVO audio result(s)`);
          return findBestInGroup(audioItems);
        }
      } else if (mode === 'video') {
        const clipItems = group.filter(i => !i.isTopicAudio);
        if (clipItems.length > 0) return findBestInGroup(clipItems);
      }
      return findBestInGroup(group);
    };

    const getBestMatch = (items: any[]) => {
      // Step 1: filter by title and artist correctness
      const validItems = items.filter(i => isCorrectMatch(title, i.title) && isArtistMatch(artist, i.channelTitle));
      if (!validItems || validItems.length === 0) return null;
      
      // Step 2: if album context is provided, STRICTLY require album match.
      // This is critical for disambiguating duplicate-named songs (e.g. Yeat has 2 songs
      // named "Back Home" on different albums — without this filter we'd always get the wrong one).
      if (album) {
        const cleanRequestedAlbum = album.toLowerCase().replace(/[^a-z0-9]/g, '');
        const albumMatchItems = validItems.filter(i => {
          if (!i.albumName) return false;
          const cleanItemAlbum = i.albumName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanItemAlbum.includes(cleanRequestedAlbum) || cleanRequestedAlbum.includes(cleanItemAlbum);
        });
        
        if (albumMatchItems.length > 0) {
          console.log(`[Resolve API] Album filter matched ${albumMatchItems.length} item(s) for album "${album}"`);
          return selectBestFromGroup(albumMatchItems);
        }
        
        // If no album-matched items (some songs don't have albumName in search results),
        // fall through to unfiltered validItems only as last resort.
        console.log(`[Resolve API] No album-matched items for "${album}", falling back to artist+title match`);
      }

      return selectBestFromGroup(validItems);
    };

    let videoId = '';
    let trackMatch: any = null;
    
    if (mode === 'video') {
      if (searchData.videos && searchData.videos.length > 0) {
        const match = getBestMatch(searchData.videos);
        if (match) {
          videoId = match.id;
          trackMatch = match;
          console.log(`[Resolve API] Found video clip match: "${match.title}" with videoId: ${videoId}`);
        }
      }
      if (!videoId && searchData.topResult && (searchData.topResult.type === 'video' || searchData.topResult.resultType === 'video')) {
        if (isCorrectMatch(title, searchData.topResult.title) && isArtistMatch(artist, searchData.topResult.channelTitle || searchData.topResult.author)) {
          videoId = searchData.topResult.id;
          trackMatch = searchData.topResult;
          console.log(`[Resolve API] Found top result video match: "${searchData.topResult.title}" with videoId: ${videoId}`);
        }
      }
      if (!videoId && searchData.songs && searchData.songs.length > 0) {
        const match = getBestMatch(searchData.songs);
        if (match) {
          videoId = match.id;
          trackMatch = match;
          console.log(`[Resolve API] Fallback to song match for video: "${match.title}" with videoId: ${videoId}`);
        }
      }
    } else {
      if (searchData.songs && searchData.songs.length > 0) {
        const match = getBestMatch(searchData.songs);
        if (match) {
          videoId = match.id;
          trackMatch = match;
          console.log(`[Resolve API] Found song match: "${match.title}" with videoId: ${videoId}`);
        }
      }
      if (!videoId && searchData.topResult && (searchData.topResult.type === 'music' || searchData.topResult.resultType === 'song')) {
        if (isCorrectMatch(title, searchData.topResult.title) && isArtistMatch(artist, searchData.topResult.channelTitle || searchData.topResult.author)) {
          videoId = searchData.topResult.id;
          trackMatch = searchData.topResult;
          console.log(`[Resolve API] Found top result match: "${searchData.topResult.title}" with videoId: ${videoId}`);
        }
      }
      // Removed fallback to searchData.videos to strictly avoid playing music videos when song mode is requested.
    }

    if (videoId) {
      const responseData = { videoId, track: trackMatch };
      resolveCache.set(cacheKey, JSON.stringify(responseData));
      // Optional: limit cache size
      if (resolveCache.size > 500) {
        const firstKey = resolveCache.keys().next().value;
        if (firstKey) resolveCache.delete(firstKey);
      }
      return NextResponse.json(responseData);
    } else {
      console.log(`[Resolve API] No matches found, returning fallback empty`);
      return NextResponse.json({ videoId: null });
    }
  } catch (error: any) {
    console.error('[Resolve API] Error resolving track to YouTube ID:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { ytMusicSearch } from '@/lib/youtubei';
import ytAdapter from '@/lib/yt-music-adapter';
import { isCorrectMatch, isArtistMatch } from '@/lib/match-utils';

const resolveCache = new Map<string, string>();

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
    
    // Check resolve cache
    const cacheKey = `${artist.toLowerCase().trim()}_${title.toLowerCase().trim()}_${album?.toLowerCase().trim() || ''}_${mode}_${isExplicitRequest}`;
    if (resolveCache.has(cacheKey)) {
      const cachedData = resolveCache.get(cacheKey);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          console.log(`[Resolve API] Cache HIT for key: "${cacheKey}" -> videoId: ${parsedData.videoId}`);
          return NextResponse.json(parsedData);
        } catch (e) {
          // fallback if cache was just the videoId string (from before this change)
          return NextResponse.json({ videoId: cachedData });
        }
      }
    }

    let query = mode === 'video' 
      ? `${artist} ${title} Official Video` 
      : `${artist} ${title} ${album ? album + ' ' : ''}${isExplicitRequest ? 'Explicit' : ''} Topic`;
    console.log(`[Resolve API] Searching YouTube Music for (${mode}): "${query}"`);
    let searchData = await ytMusicSearch(query);

    // Fallback if no songs found with the specific query (e.g. if the album name caused no results)
    if (album && mode === 'song' && (!searchData.songs || searchData.songs.length === 0)) {
      query = `${artist} ${title} ${isExplicitRequest ? 'Explicit' : ''} Topic`;
      console.log(`[Resolve API] Fallback search without album name: "${query}"`);
      searchData = await ytMusicSearch(query);
    }

    // Fallback if no songs found with the explicit query keyword
    if (isExplicitRequest && mode === 'song' && (!searchData.songs || searchData.songs.length === 0)) {
      query = `${artist} ${title} Topic`;
      console.log(`[Resolve API] Fallback search without explicit keyword: "${query}"`);
      searchData = await ytMusicSearch(query);
    }

    const findBestInGroup = (group: any[]) => {
      const firstItem = group[0];
      const baseTitle = firstItem.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
      
      const explicitMatch = group.slice(0, 5).find((i: any) => {
        const iTitle = i.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
        return iTitle === baseTitle && i.isExplicit;
      });
      if (explicitMatch) return explicitMatch;

      const uncensoredMatch = group.slice(0, 5).find((i: any) => {
        const iTitle = i.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
        return iTitle === baseTitle && !/\b(clean|censored|radio\s+edit)\b/i.test(i.title);
      });
      return uncensoredMatch || firstItem;
    };

    const selectBestFromGroup = (group: any[]) => {
      if (mode === 'song') {
        // Enforce Topic channels strictly for songs to guarantee audio releases
        const topicItems = group.filter(i => 
          i.channelTitle.toLowerCase().includes('topic')
        );
        if (topicItems.length > 0) {
          return findBestInGroup(topicItems);
        }

        // If no explicit topic channel, aggressively filter out VEVO and main channels!
        const strictAudioItems = group.filter(i => 
          !i.channelTitle.toLowerCase().includes('vevo') &&
          i.channelTitle.toLowerCase() !== artist.toLowerCase() &&
          !i.channelTitle.toLowerCase().includes('official')
        );
        if (strictAudioItems.length > 0) {
          return findBestInGroup(strictAudioItems);
        }
      } else if (mode === 'video') {
        // Enforce non-Topic channels (official artist channel/VEVO) for music videos
        const clipItems = group.filter(i => !i.channelTitle.toLowerCase().includes('topic'));
        if (clipItems.length > 0) {
          return findBestInGroup(clipItems);
        }
      }
      return findBestInGroup(group);
    };

    const getBestMatch = (items: any[]) => {
      // Filter out items that are not correct title matches or artist matches
      const validItems = items.filter(i => isCorrectMatch(title, i.title) && isArtistMatch(artist, i.channelTitle));
      if (!validItems || validItems.length === 0) return null;
      
      // If we have an album constraint, filter/prioritize items matching the album name!
      if (album) {
        const cleanRequestedAlbum = album.toLowerCase().replace(/[^a-z0-9]/g, '');
        const albumMatchItems = validItems.filter(i => {
          if (!i.albumName) return false;
          const cleanItemAlbum = i.albumName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanItemAlbum.includes(cleanRequestedAlbum) || cleanRequestedAlbum.includes(cleanItemAlbum);
        });
        if (albumMatchItems.length > 0) {
          return selectBestFromGroup(albumMatchItems);
        }
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

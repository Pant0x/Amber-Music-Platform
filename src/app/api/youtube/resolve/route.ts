import { NextResponse } from 'next/server';
import { ytMusicSearch } from '@/lib/youtubei';
import ytAdapter from '@/lib/yt-music-adapter';

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
    
    // Check resolve cache
    const cacheKey = `${artist.toLowerCase().trim()}_${title.toLowerCase().trim()}_${mode}_${isExplicitRequest}`;
    if (resolveCache.has(cacheKey)) {
      const cachedVideoId = resolveCache.get(cacheKey);
      console.log(`[Resolve API] Cache HIT for key: "${cacheKey}" -> videoId: ${cachedVideoId}`);
      return NextResponse.json({ videoId: cachedVideoId });
    }

    const query = mode === 'video' 
      ? `${artist} ${title} Official Video` 
      : `${artist} - Topic ${title}${isExplicitRequest ? ' Explicit' : ''}`;
    console.log(`[Resolve API] Searching YouTube Music for (${mode}): "${query}"`);
    const searchData = await ytMusicSearch(query);

    const getBestMatch = (items: any[]) => {
      if (!items || items.length === 0) return null;
      const firstItem = items[0];
      const baseTitle = firstItem.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
      
      const explicitMatch = items.slice(0, 5).find((i: any) => {
        const iTitle = i.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
        return iTitle === baseTitle && i.isExplicit;
      });
      if (explicitMatch) return explicitMatch;

      const uncensoredMatch = items.slice(0, 5).find((i: any) => {
        const iTitle = i.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
        return iTitle === baseTitle && !/\b(clean|censored|radio\s+edit)\b/i.test(i.title);
      });
      return uncensoredMatch || firstItem;
    };

    let videoId = '';
    
    if (mode === 'video') {
      if (searchData.videos && searchData.videos.length > 0) {
        const match = getBestMatch(searchData.videos);
        videoId = match.id;
        console.log(`[Resolve API] Found video clip match: "${match.title}" with videoId: ${videoId}`);
      } else if (searchData.topResult && (searchData.topResult.type === 'video' || searchData.topResult.resultType === 'video')) {
        videoId = searchData.topResult.id;
        console.log(`[Resolve API] Found top result video match: "${searchData.topResult.title}" with videoId: ${videoId}`);
      } else if (searchData.songs && searchData.songs.length > 0) {
        const match = getBestMatch(searchData.songs);
        videoId = match.id;
        console.log(`[Resolve API] Fallback to song match for video: "${match.title}" with videoId: ${videoId}`);
      }
    } else {
      if (searchData.songs && searchData.songs.length > 0) {
        const match = getBestMatch(searchData.songs);
        videoId = match.id;
        console.log(`[Resolve API] Found song match: "${match.title}" with videoId: ${videoId}`);
      } else if (searchData.topResult && (searchData.topResult.type === 'music' || searchData.topResult.resultType === 'song')) {
        videoId = searchData.topResult.id;
        console.log(`[Resolve API] Found top result match: "${searchData.topResult.title}" with videoId: ${videoId}`);
      } else if (searchData.videos && searchData.videos.length > 0) {
        const match = getBestMatch(searchData.videos);
        videoId = match.id;
        console.log(`[Resolve API] Fallback to video match: "${match.title}" with videoId: ${videoId}`);
      }
    }

    if (!videoId) {
      console.log(`[Resolve API] No matches found, returning fallback empty`);
      return NextResponse.json({ videoId: null });
    }

    // Populate resolve cache
    resolveCache.set(cacheKey, videoId);

    return NextResponse.json({ videoId });
  } catch (error: any) {
    console.error('[Resolve API] Error resolving track to YouTube ID:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

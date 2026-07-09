import { NextResponse } from 'next/server';
import { ytMusicSearch } from '@/lib/youtubei';
import ytAdapter from '@/lib/yt-music-adapter';

const resolveCache = new Map<string, string>();

function isCorrectMatch(requestedTitle: string, matchedTitle: string): boolean {
  // Clean titles by removing common garbage tags
  const cleanReq = requestedTitle.toLowerCase()
    .replace(/\b(feat|ft|with|prod|explicit|clean|official|video|audio|lyrics)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
  const cleanMat = matchedTitle.toLowerCase()
    .replace(/\b(feat|ft|with|prod|explicit|clean|official|video|audio|lyrics)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  // Get words
  const reqWords = cleanReq.split(/\s+/).filter(w => w.length > 1);
  if (reqWords.length === 0) return true; // fallback

  // Check if at least 60% of the requested title words are in the matched title
  let matchCount = 0;
  for (const word of reqWords) {
    if (cleanMat.includes(word)) {
      matchCount++;
    } else {
      // Handle simple typos or special characters (e.g. feël vs feel)
      const cleanMatWords = cleanMat.split(/\s+/);
      const isClose = cleanMatWords.some(w => {
        return w.startsWith(word) || word.startsWith(w) || 
               w.replace(/[ëéèê]/g, 'e').includes(word) ||
               word.replace(/[ëéèê]/g, 'e').includes(w);
      });
      if (isClose) matchCount++;
    }
  }

  const score = matchCount / reqWords.length;
  return score >= 0.6;
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
      // Filter out items that are not correct title matches
      const validItems = items.filter(i => isCorrectMatch(title, i.title));
      if (!validItems || validItems.length === 0) return null;
      
      const firstItem = validItems[0];
      const baseTitle = firstItem.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
      
      const explicitMatch = validItems.slice(0, 5).find((i: any) => {
        const iTitle = i.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
        return iTitle === baseTitle && i.isExplicit;
      });
      if (explicitMatch) return explicitMatch;

      const uncensoredMatch = validItems.slice(0, 5).find((i: any) => {
        const iTitle = i.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
        return iTitle === baseTitle && !/\b(clean|censored|radio\s+edit)\b/i.test(i.title);
      });
      return uncensoredMatch || firstItem;
    };

    let videoId = '';
    
    if (mode === 'video') {
      if (searchData.videos && searchData.videos.length > 0) {
        const match = getBestMatch(searchData.videos);
        if (match) {
          videoId = match.id;
          console.log(`[Resolve API] Found video clip match: "${match.title}" with videoId: ${videoId}`);
        }
      }
      if (!videoId && searchData.topResult && (searchData.topResult.type === 'video' || searchData.topResult.resultType === 'video')) {
        if (isCorrectMatch(title, searchData.topResult.title)) {
          videoId = searchData.topResult.id;
          console.log(`[Resolve API] Found top result video match: "${searchData.topResult.title}" with videoId: ${videoId}`);
        }
      }
      if (!videoId && searchData.songs && searchData.songs.length > 0) {
        const match = getBestMatch(searchData.songs);
        if (match) {
          videoId = match.id;
          console.log(`[Resolve API] Fallback to song match for video: "${match.title}" with videoId: ${videoId}`);
        }
      }
    } else {
      if (searchData.songs && searchData.songs.length > 0) {
        const match = getBestMatch(searchData.songs);
        if (match) {
          videoId = match.id;
          console.log(`[Resolve API] Found song match: "${match.title}" with videoId: ${videoId}`);
        }
      }
      if (!videoId && searchData.topResult && (searchData.topResult.type === 'music' || searchData.topResult.resultType === 'song')) {
        if (isCorrectMatch(title, searchData.topResult.title)) {
          videoId = searchData.topResult.id;
          console.log(`[Resolve API] Found top result match: "${searchData.topResult.title}" with videoId: ${videoId}`);
        }
      }
      if (!videoId && searchData.videos && searchData.videos.length > 0) {
        const match = getBestMatch(searchData.videos);
        if (match) {
          videoId = match.id;
          console.log(`[Resolve API] Fallback to video match: "${match.title}" with videoId: ${videoId}`);
        }
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

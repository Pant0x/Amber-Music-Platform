import { NextResponse } from 'next/server';
import { ytMusicSearch } from '@/lib/youtubei';
import ytAdapter from '@/lib/yt-music-adapter';

const resolveCache = new Map<string, string>();

function cleanSongTitle(t: string): string {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\([^)]*(feat|ft|with|prod|video|audio|visualizer|lyric|explicit|clean|leak)[^)]*\)/gi, '')
    .replace(/\[[^\]]*(feat|ft|with|prod|video|audio|visualizer|lyric|explicit|clean|leak)[^\]]*\]/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCorrectMatch(requestedTitle: string, matchedTitle: string): boolean {
  const cleanReq = cleanSongTitle(requestedTitle);
  const cleanMat = cleanSongTitle(matchedTitle);

  // Strict phrase containment check: one cleaned title must fully contain the other
  return cleanMat.includes(cleanReq) || cleanReq.includes(cleanMat);
}

const ALLOWED_GENERIC_CHANNELS = [
  'vevo', 'lyrical lemonade', 'cole bennett', 'ovo sound', 'spinnin', 'atlantic',
  'ultra', 'sony', 'universal', 'warner', 'records', 'music', 'cactus jack', 'grade a',
  'opium', 'interscope', 'def jam', 'republic', 'columbia', 'rca', 'epic', 'various artists', 'topic'
];

function isArtistMatch(requestedArtist: string, channelTitle: string): boolean {
  if (!requestedArtist || !channelTitle) return true; // fallback

  const cleanArtist = requestedArtist.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanChannel = channelTitle.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Split requested artists by separators like ",", "&", "and", "feat", etc.
  const individualArtists = cleanArtist
    .split(/,|\s+&\s+|\s+and\s+|\s+feat\.?\s+/i)
    .map(name => name.trim())
    .filter(Boolean);

  if (individualArtists.length === 0) return true;

  // 1. Direct match with channel name
  const isDirect = individualArtists.some(artistName => {
    if (artistName.length <= 2) {
      const regex = new RegExp(`\\b${artistName}\\b`, 'i');
      return regex.test(cleanChannel);
    }
    return cleanChannel.includes(artistName);
  });

  if (isDirect) return true;

  // 2. Allowed generic channels check
  const isGeneric = ALLOWED_GENERIC_CHANNELS.some(keyword => cleanChannel.includes(keyword));
  if (isGeneric) return true;

  return false;
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

    const getBestMatch = (items: any[]) => {
      // Filter out items that are not correct title matches or artist matches
      const validItems = items.filter(i => isCorrectMatch(title, i.title) && isArtistMatch(artist, i.channelTitle));
      if (!validItems || validItems.length === 0) return null;
      
      if (mode === 'song') {
        // Enforce Topic channels strictly for songs to guarantee audio releases
        const topicItems = validItems.filter(i => i.channelTitle.toLowerCase().includes('topic'));
        if (topicItems.length > 0) {
          return findBestInGroup(topicItems);
        }
      } else if (mode === 'video') {
        // Enforce non-Topic channels (official artist channel/VEVO) for music videos
        const clipItems = validItems.filter(i => !i.channelTitle.toLowerCase().includes('topic'));
        if (clipItems.length > 0) {
          return findBestInGroup(clipItems);
        }
      }

      return findBestInGroup(validItems);
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
        if (isCorrectMatch(title, searchData.topResult.title) && isArtistMatch(artist, searchData.topResult.channelTitle || searchData.topResult.author)) {
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
        if (isCorrectMatch(title, searchData.topResult.title) && isArtistMatch(artist, searchData.topResult.channelTitle || searchData.topResult.author)) {
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

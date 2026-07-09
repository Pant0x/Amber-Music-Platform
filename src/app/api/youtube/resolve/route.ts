import { NextResponse } from 'next/server';
import { ytMusicSearch } from '@/lib/youtubei';
import ytAdapter from '@/lib/yt-music-adapter';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');

    if (!title || !artist) {
      return NextResponse.json({ error: 'Missing title or artist parameters' }, { status: 400 });
    }

    const explicit = searchParams.get('explicit') === 'true';
    const mode = searchParams.get('mode') || 'song';

    const query = mode === 'video' 
      ? `${artist} ${title} Official Video` 
      : `${artist} - Topic ${title}${explicit ? ' Explicit' : ''}`;
    console.log(`[Resolve API] Searching YouTube Music for (${mode}, explicit=${explicit}): "${query}"`);
    // Try node-youtube-music adapter first (server-side). If unavailable, fallback to internal parser.
    let searchData: any = null;
    try {
      const adapterRes = await ytAdapter.searchYTMusic(query);
      if (adapterRes) {
        searchData = adapterRes;
      }
    } catch (e) {
      console.warn('Adapter search failed, falling back to internal parser', e);
    }
    if (!searchData) searchData = await ytMusicSearch(query);

    let videoId = '';
    
    if (mode === 'video') {
      if (searchData.videos && searchData.videos.length > 0) {
        videoId = searchData.videos[0].id;
        console.log(`[Resolve API] Found video clip match: "${searchData.videos[0].title}" with videoId: ${videoId}`);
      } else if (searchData.topResult && (searchData.topResult.type === 'video' || searchData.topResult.resultType === 'video')) {
        videoId = searchData.topResult.id;
        console.log(`[Resolve API] Found top result video match: "${searchData.topResult.title}" with videoId: ${videoId}`);
      } else if (searchData.songs && searchData.songs.length > 0) {
        videoId = searchData.songs[0].id;
        console.log(`[Resolve API] Fallback to song match for video: "${searchData.songs[0].title}" with videoId: ${videoId}`);
      }
    } else {
      if (searchData.songs && searchData.songs.length > 0) {
        // Find explicit version if explicit is requested, else clean/non-explicit song
        const bestMatch = searchData.songs.find((s: any) => explicit ? s.isExplicit : !s.isExplicit) || searchData.songs[0];
        videoId = bestMatch.id;
        console.log(`[Resolve API] Found song match: "${bestMatch.title}" by "${bestMatch.channelTitle}" with videoId: ${videoId} (Explicit Match: ${bestMatch.isExplicit})`);
      } else if (searchData.topResult && (searchData.topResult.type === 'music' || searchData.topResult.resultType === 'song')) {
        videoId = searchData.topResult.id;
        console.log(`[Resolve API] Found top result match: "${searchData.topResult.title}" with videoId: ${videoId}`);
      } else if (searchData.videos && searchData.videos.length > 0) {
        // Find a video that matches explicit preference and lacks Music Video tags
        const bestVideo = searchData.videos.find((v: any) => {
          const titleLower = v.title.toLowerCase();
          const matchesTitle = !titleLower.includes('music video') && 
                               !titleLower.includes('director') && 
                               !titleLower.includes('official video');
          const matchesExplicit = explicit ? v.isExplicit : !v.isExplicit;
          return matchesTitle && matchesExplicit;
        }) || searchData.videos[0];
        videoId = bestVideo.id;
        console.log(`[Resolve API] Fallback to video match: "${bestVideo.title}" with videoId: ${videoId}`);
      }
    }

    if (!videoId) {
      console.log(`[Resolve API] No matches found, returning fallback empty`);
      return NextResponse.json({ videoId: null });
    }

    return NextResponse.json({ videoId });
  } catch (error: any) {
    console.error('[Resolve API] Error resolving track to YouTube ID:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

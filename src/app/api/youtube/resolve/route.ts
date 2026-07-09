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

    const mode = searchParams.get('mode') || 'song';

    const query = mode === 'video' ? `${artist} ${title} Official Video` : `${artist} - Topic ${title}`;
    console.log(`[Resolve API] Searching YouTube Music for (${mode}): "${query}"`);
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
        const explicitVideo = searchData.videos.find((v: any) => v.isExplicit);
        const uncensoredVideo = searchData.videos.find((v: any) => !/\b(clean|censored|radio\s+edit)\b/i.test(v.title));
        videoId = explicitVideo ? explicitVideo.id : (uncensoredVideo ? uncensoredVideo.id : searchData.videos[0].id);
        console.log(`[Resolve API] Found video clip match: "${explicitVideo ? explicitVideo.title : (uncensoredVideo ? uncensoredVideo.title : searchData.videos[0].title)}" with videoId: ${videoId}`);
      } else if (searchData.topResult && (searchData.topResult.type === 'video' || searchData.topResult.resultType === 'video')) {
        videoId = searchData.topResult.id;
        console.log(`[Resolve API] Found top result video match: "${searchData.topResult.title}" with videoId: ${videoId}`);
      } else if (searchData.songs && searchData.songs.length > 0) {
        const explicitSong = searchData.songs.find((s: any) => s.isExplicit);
        const uncensoredSong = searchData.songs.find((s: any) => !/\b(clean|censored|radio\s+edit)\b/i.test(s.title));
        videoId = explicitSong ? explicitSong.id : (uncensoredSong ? uncensoredSong.id : searchData.songs[0].id);
        console.log(`[Resolve API] Fallback to song match for video: "${explicitSong ? explicitSong.title : (uncensoredSong ? uncensoredSong.title : searchData.songs[0].title)}" with videoId: ${videoId}`);
      }
    } else {
      if (searchData.songs && searchData.songs.length > 0) {
        const explicitSong = searchData.songs.find((s: any) => s.isExplicit);
        const uncensoredSong = searchData.songs.find((s: any) => !/\b(clean|censored|radio\s+edit)\b/i.test(s.title));
        videoId = explicitSong ? explicitSong.id : (uncensoredSong ? uncensoredSong.id : searchData.songs[0].id);
        console.log(`[Resolve API] Found song match: "${explicitSong ? explicitSong.title : (uncensoredSong ? uncensoredSong.title : searchData.songs[0].title)}" with videoId: ${videoId}`);
      } else if (searchData.topResult && (searchData.topResult.type === 'music' || searchData.topResult.resultType === 'song')) {
        videoId = searchData.topResult.id;
        console.log(`[Resolve API] Found top result match: "${searchData.topResult.title}" with videoId: ${videoId}`);
      } else if (searchData.videos && searchData.videos.length > 0) {
        // Find a video that lacks "Music Video", "Director", "Official Video" in the title
        const pureVideo = searchData.videos.find((v: any) => {
          const titleLower = v.title.toLowerCase();
          return !titleLower.includes('music video') && 
                 !titleLower.includes('director') && 
                 !titleLower.includes('official video') &&
                 !/\b(clean|censored|radio\s+edit)\b/i.test(v.title);
        });
        videoId = pureVideo ? pureVideo.id : searchData.videos[0].id;
        console.log(`[Resolve API] Fallback to video match: "${pureVideo ? pureVideo.title : searchData.videos[0].title}" with videoId: ${videoId}`);
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

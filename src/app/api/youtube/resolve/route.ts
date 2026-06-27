import { NextResponse } from 'next/server';
import { ytMusicSearch } from '@/lib/youtubei';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');

    if (!title || !artist) {
      return NextResponse.json({ error: 'Missing title or artist parameters' }, { status: 400 });
    }

    const query = `${artist} - Topic ${title}`;
    console.log(`[Resolve API] Searching YouTube Music for: "${query}"`);
    const searchData = await ytMusicSearch(query);

    let videoId = '';
    
    if (searchData.songs && searchData.songs.length > 0) {
      videoId = searchData.songs[0].id;
      console.log(`[Resolve API] Found song match: "${searchData.songs[0].title}" by "${searchData.songs[0].channelTitle}" with videoId: ${videoId}`);
    } else if (searchData.topResult && (searchData.topResult.type === 'music' || searchData.topResult.resultType === 'song')) {
      videoId = searchData.topResult.id;
      console.log(`[Resolve API] Found top result match: "${searchData.topResult.title}" with videoId: ${videoId}`);
    } else if (searchData.videos && searchData.videos.length > 0) {
      // Find a video that lacks "Music Video", "Director", "Official Video" in the title
      const pureVideo = searchData.videos.find((v: any) => {
        const titleLower = v.title.toLowerCase();
        return !titleLower.includes('music video') && 
               !titleLower.includes('director') && 
               !titleLower.includes('official video');
      });
      videoId = pureVideo ? pureVideo.id : searchData.videos[0].id;
      console.log(`[Resolve API] Fallback to video match: "${pureVideo ? pureVideo.title : searchData.videos[0].title}" with videoId: ${videoId}`);
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

import { NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify';
import { cleanArtistName } from '@/lib/youtubei';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');

    if (!title) {
      return NextResponse.json({ error: 'Missing title parameter' }, { status: 400 });
    }

    // Clean up typical YouTube titles if they have feat keywords so we search Spotify cleanly
    const cleanTitle = title.replace(/\(feat\..+?\)|\(with.+?\)|\(ft\..+?\)/i, '').trim();
    const query = artist ? `${cleanArtistName(artist)} ${cleanTitle}` : cleanTitle;

    let enrichedData: any = null;

    // 1. Try Spotify first
    try {
      console.log(`[Spotify Resolve API] Searching Spotify for: "${query}"`);
      const spotifyApi = await getSpotifyApi();
      const searchRes = await spotifyApi.searchTracks(query, { limit: 5 });
      const tracks = searchRes.body.tracks?.items || [];

      if (tracks.length > 0) {
        const match = tracks[0];
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
        console.log(`[Spotify Resolve API] Querying YouTube Music fallback for: "${query}"`);
        const { ytMusicSearch } = await import('@/lib/youtubei');
        const searchRes = await ytMusicSearch(query);
        const songs = searchRes.songs || [];
        
        if (songs.length > 0) {
          const match = songs[0];
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
      return NextResponse.json({ enriched: false });
    }

    return NextResponse.json(enrichedData);
  } catch (error: any) {
    console.error('[Spotify Resolve API] Outer error in resolver:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

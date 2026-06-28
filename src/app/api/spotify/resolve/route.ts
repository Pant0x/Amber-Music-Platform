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

    console.log(`[Spotify Resolve API] Searching Spotify for: "${query}"`);
    const spotifyApi = await getSpotifyApi();
    const searchRes = await spotifyApi.searchTracks(query, { limit: 5 });
    const tracks = searchRes.body.tracks?.items || [];

    if (tracks.length === 0) {
      return NextResponse.json({ enriched: false });
    }

    const match = tracks[0];
    const artistsStr = match.artists.map((a: any) => a.name).join(', ');

    return NextResponse.json({
      enriched: true,
      title: match.name,
      channelTitle: artistsStr,
      isExplicit: match.explicit
    });
  } catch (error: any) {
    console.error('[Spotify Resolve API] Error resolving metadata from Spotify:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

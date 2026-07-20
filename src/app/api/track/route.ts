import { NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing track ID' }, { status: 400 });
    }

    // 1. If it looks like a Spotify ID (typically 22 chars alphanumeric)
    if (id.length === 22 && !id.includes('-') && !id.includes('_')) {
      console.debug(`[Track Resolve API] Resolving Spotify Track ID: ${id}`);
      try {
        const spotifyApi = await getSpotifyApi();
        const trackRes = await spotifyApi.getTrack(id);
        const track = trackRes.body;

        if (track) {
          const durationMs = track.duration_ms || 180000;
          const mins = Math.floor(durationMs / 60000);
          const secs = Math.floor((durationMs % 60000) / 1000);
          const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

          return NextResponse.json({
            id: track.id,
            title: track.name,
            channelTitle: track.artists.map((a: any) => a.name).join(', '),
            thumbnailUrl: track.album?.images?.[0]?.url || '',
            publishedAt: track.album?.release_date || new Date().toISOString(),
            type: 'music',
            origin: 'spotify',
            artistId: track.artists[0]?.id || '',
            duration: durationStr,
            isExplicit: track.explicit || false,
            playbackMode: 'song'
          });
        }
      } catch (err) {
        console.error('[Track Resolve API] Spotify lookup failed, falling back to YouTube resolution:', err);
      }
    }

    // 2. Fallback / YouTube Video ID lookup using public NoEmbed oEmbed API
    console.debug(`[Track Resolve API] Resolving YouTube Video ID: ${id}`);
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title && data.author_name) {
          return NextResponse.json({
            id: id,
            title: data.title,
            channelTitle: data.author_name,
            thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
            publishedAt: new Date().toISOString(),
            type: 'music',
            origin: 'youtube',
            playbackMode: 'song',
            artistId: '',
            duration: '3:30',
            isExplicit: false
          });
        }
      }
    } catch (err) {
      console.error('[Track Resolve API] YouTube oEmbed resolution failed:', err);
    }

    // Final basic metadata fallback
    return NextResponse.json({
      id: id,
      title: 'Shared Track',
      channelTitle: 'Unknown Artist',
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      publishedAt: new Date().toISOString(),
      type: 'music',
      origin: 'youtube',
      playbackMode: 'song',
      artistId: '',
      duration: '3:30',
      isExplicit: false
    });

  } catch (error) {
    console.error('[Track Resolve API] Error in resolver:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

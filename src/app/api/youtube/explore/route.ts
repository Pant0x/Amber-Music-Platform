import { NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify';
import { ytMusicSearch, cleanArtistName, upgradeThumbnailUrl, cleanTopicGlobally } from '@/lib/youtubei';

export const revalidate = 3600; // Cache for 1 hour to prevent Spotify rate limits

const runYoutubeExploreFallback = async () => {
  console.debug('[Explore API] Falling back to YouTube Music Explore data...');
  try {
    // Parallel searches for popular hits and new releases on YouTube Music
    const [chartsRes, newReleasesRes] = await Promise.all([
      ytMusicSearch('trending hits'),
      ytMusicSearch('new albums release')
    ]);

    const charts = (chartsRes.songs || []).slice(0, 16).map((item: any) => ({
      id: item.id,
      title: cleanArtistName(item.title),
      channelTitle: cleanArtistName(item.channelTitle),
      thumbnailUrl: upgradeThumbnailUrl(item.thumbnailUrl),
      publishedAt: item.publishedAt || new Date().toISOString(),
      type: 'music',
      origin: 'youtube',
      artistId: item.channelId || '',
      duration: item.duration || '3:00',
      isExplicit: item.isExplicit || false
    }));

    const newReleases = (newReleasesRes.albums || []).slice(0, 16).map((item: any) => ({
      id: item.id,
      title: cleanArtistName(item.title),
      channelTitle: cleanArtistName(item.channelTitle),
      thumbnailUrl: upgradeThumbnailUrl(item.thumbnailUrl),
      publishedAt: item.publishedAt || new Date().toISOString(),
      type: 'playlist',
      releaseType: item.releaseType || 'Album',
      origin: 'youtube',
      artistId: item.channelId || ''
    }));

    return NextResponse.json(
      cleanTopicGlobally({ charts, newReleases }),
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600'
        }
      }
    );
  } catch (err) {
    console.error('[Explore API] YouTube fallback search failed:', err);
    return NextResponse.json(
      { charts: [], newReleases: [] },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60'
        }
      }
    );
  }
};

export async function GET() {
  try {
    const spotifyApi = await getSpotifyApi();

    // Fetch Spotify Global Top 50 and New Releases in parallel
    // Playlist ID for Spotify Global Top 50 is: 37i9dQZEVXbMDoHDGih2h2
    const [playlistRes, newReleasesRes] = await Promise.all([
      spotifyApi.getPlaylistTracks('37i9dQZEVXbMDoHDGih2h2', { limit: 16 }),
      spotifyApi.getNewReleases({ limit: 16 })
    ]);

    // Map Global Top 50 tracks to charts
    const charts = (playlistRes.body.items || []).map((itemObj: any) => {
      const item = itemObj.track;
      if (!item) return null;

      const durationMs = item.duration_ms || 180000;
      const mins = Math.floor(durationMs / 60000);
      const secs = Math.floor((durationMs % 60000) / 1000);
      const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      return {
        id: item.id,
        title: cleanArtistName(item.name),
        channelTitle: cleanArtistName(item.artists.map((a: any) => a.name).join(', ')),
        thumbnailUrl: item.album?.images?.[0]?.url || item.album?.images?.[1]?.url || '',
        publishedAt: item.album?.release_date || new Date().toISOString(),
        type: 'music',
        origin: 'spotify',
        artistId: item.artists[0]?.id || '',
        duration: durationStr,
        isExplicit: item.explicit || false
      };
    }).filter(Boolean);

    // Map New Releases
    const newReleases = (newReleasesRes.body.albums?.items || []).map((item: any) => ({
      id: item.id,
      title: cleanArtistName(item.name),
      channelTitle: cleanArtistName(item.artists.map((a: any) => a.name).join(', ')),
      thumbnailUrl: item.images?.[0]?.url || item.images?.[1]?.url || '',
      publishedAt: item.release_date || new Date().toISOString(),
      type: 'playlist',
      releaseType: item.album_type || 'Album',
      origin: 'spotify',
      artistId: item.artists[0]?.id || ''
    }));

    return NextResponse.json(
      cleanTopicGlobally({ charts, newReleases }),
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    console.error('[Explore API] Spotify explore failed, triggering YouTube fallback:', error);
    return await runYoutubeExploreFallback();
  }
}

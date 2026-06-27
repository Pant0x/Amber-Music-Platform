import { NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify';
import { ytMusicSearch, cleanTopicGlobally } from '@/lib/youtubei';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ topResult: null, songs: [], videos: [], artists: [], albums: [], communityPlaylists: [] });
  }

  const getSearchQueryWithAudioSuffix = (origQuery: string): string => {
    const isSpecialSearch = /\b(video|live|remix|cover|edit|slowed|sped|album|playlist|topic|channel|mix)\b/i.test(origQuery);
    return isSpecialSearch ? origQuery : `${origQuery} Official Audio`;
  };

  // YouTube Music search fallback
  const runYoutubeSearchFallback = async () => {
    console.log('[Search API] Falling back to YouTube Music search...');
    const data = await ytMusicSearch(getSearchQueryWithAudioSuffix(query));
    return NextResponse.json(cleanTopicGlobally({
      topResult: data.topResult,
      songs: data.songs?.slice(0, 20) || [],
      videos: data.videos?.slice(0, 10) || [],
      artists: data.artists?.slice(0, 10) || [],
      albums: data.albums?.slice(0, 10) || [],
      communityPlaylists: data.communityPlaylists?.slice(0, 10) || []
    }));
  };

  try {
    const spotifyApi = await getSpotifyApi();

    // Perform Spotify search and YouTube Music search in parallel
    const [spotifyRes, ytRes] = await Promise.allSettled([
      spotifyApi.search(query, ['track', 'artist', 'album', 'playlist'], { limit: 20 }),
      ytMusicSearch(getSearchQueryWithAudioSuffix(query))
    ]);

    // Check if Spotify search failed completely
    if (spotifyRes.status === 'rejected') {
      console.error('[Search API] Spotify search failed:', spotifyRes.reason);
      return await runYoutubeSearchFallback();
    }

    let songs: any[] = [];
    let artists: any[] = [];
    let albums: any[] = [];
    let communityPlaylists: any[] = [];
    let videos: any[] = [];

    const data = spotifyRes.value.body;
    
    // Map Spotify tracks to songs
    if (data.tracks?.items) {
      songs = data.tracks.items.map((item: any) => {
        const durationMs = item.duration_ms || 180000;
        const mins = Math.floor(durationMs / 60000);
        const secs = Math.floor((durationMs % 60000) / 1000);
        const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        return {
          id: item.id,
          title: item.name,
          channelTitle: item.artists.map((a: any) => a.name).join(', '),
          thumbnailUrl: item.album?.images?.[0]?.url || item.album?.images?.[1]?.url || '',
          publishedAt: item.album?.release_date || new Date().toISOString(),
          type: 'music',
          origin: 'spotify',
          artistId: item.artists[0]?.id || '',
          channelId: item.artists[0]?.id || '',
          duration: durationStr,
          isExplicit: item.explicit || false
        };
      });
    }

    // Map Spotify artists to artists
    if (data.artists?.items) {
      artists = data.artists.items.map((item: any) => ({
        id: item.id,
        title: item.name,
        channelTitle: 'Artist',
        thumbnailUrl: item.images?.[0]?.url || item.images?.[1]?.url || '',
        subtitle: `${item.followers?.total?.toLocaleString() || '0'} followers`,
        publishedAt: new Date().toISOString(),
        type: 'channel',
        origin: 'spotify',
        channelId: item.id
      }));
    }

    // Map Spotify albums to albums
    if (data.albums?.items) {
      albums = data.albums.items.map((item: any) => ({
        id: item.id,
        title: item.name,
        channelTitle: item.artists.map((a: any) => a.name).join(', '),
        thumbnailUrl: item.images?.[0]?.url || item.images?.[1]?.url || '',
        publishedAt: item.release_date || new Date().toISOString(),
        type: 'playlist',
        releaseType: item.album_type || 'Album',
        origin: 'spotify',
        artistId: item.artists[0]?.id || ''
      }));
    }

    // Map Spotify playlists to communityPlaylists
    if (data.playlists?.items) {
      communityPlaylists = data.playlists.items.map((item: any) => ({
        id: item.id,
        title: item.name,
        channelTitle: item.owner?.display_name || 'Spotify',
        thumbnailUrl: item.images?.[0]?.url || '',
        publishedAt: new Date().toISOString(),
        type: 'playlist',
        origin: 'spotify'
      }));
    }

    // Process YouTube Music search results for videos
    if (ytRes.status === 'fulfilled') {
      const ytData = ytRes.value;
      if (ytData.videos) {
        videos = ytData.videos;
      }
    }

    // Construct topResult
    let topResult: any = null;
    if (songs.length > 0) {
      topResult = {
        ...songs[0],
        type: 'music',
        resultType: 'song'
      };
    } else if (artists.length > 0) {
      topResult = {
        ...artists[0],
        type: 'channel',
        resultType: 'artist'
      };
    }

    return NextResponse.json(cleanTopicGlobally({
      topResult,
      songs,
      videos,
      artists,
      albums,
      communityPlaylists
    }));
  } catch (error) {
    console.error('[Search API] Outer error, triggering YouTube search fallback:', error);
    try {
      return await runYoutubeSearchFallback();
    } catch (fallbackError) {
      console.error('[Search API] Fallback failed:', fallbackError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
}

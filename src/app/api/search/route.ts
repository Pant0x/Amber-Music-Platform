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
  // YouTube Music search fallback
  const runYoutubeSearchFallback = async () => {
    console.log('[Search API] Falling back to YouTube Music search...');
    const [ytMusicData, ytArtistsData] = await Promise.all([
      ytMusicSearch(getSearchQueryWithAudioSuffix(query)),
      ytMusicSearch(query)
    ]);

    let artists = ytArtistsData.artists || [];
    const cleanQuery = query.toLowerCase().trim();
    if (cleanQuery === 'fairuz' || cleanQuery === 'fairouz' || cleanQuery === 'fayrouz' || cleanQuery === 'فيروز') {
      const hasLebanese = artists.some((a: any) => a.id === 'UCzixfFiEFMjhSB3R9UdUdsA');
      if (!hasLebanese) {
        artists.unshift({
          id: 'UCzixfFiEFMjhSB3R9UdUdsA',
          title: 'Fairuz',
          channelTitle: 'Artist',
          thumbnailUrl: 'https://yt3.googleusercontent.com/ZIONSAndglfiCvZdwa0CNCrUFWN6EUvhQxyY6MtqRzzuZQYeg27M80K0LAikAZkmWcTgbSXXkA=w1000-h1000-l90-rj',
          subtitle: 'Legendary Lebanese Singer',
          publishedAt: new Date().toISOString(),
          type: 'channel',
          origin: 'youtube',
          channelId: 'UCzixfFiEFMjhSB3R9UdUdsA'
        });
      }
      
      const hasGerman = artists.some((a: any) => a.id === 'german-fairuz');
      if (!hasGerman) {
        artists.push({
          id: 'german-fairuz',
          title: 'Fairuz (DE)',
          channelTitle: 'Artist',
          thumbnailUrl: 'https://yt3.googleusercontent.com/r-nlAuthMmcTD_7SWnkTM0b60SyLjCD7IbWje50Da6lPquj0kEG5cDLabupRrnufiV4muhbbvwgkURv14w=w1000-h1000-l90-rj',
          subtitle: 'German Pop/Rapper',
          publishedAt: new Date().toISOString(),
          type: 'channel',
          origin: 'youtube',
          channelId: 'german-fairuz'
        });
      }
    }

    return NextResponse.json(cleanTopicGlobally({
      topResult: ytMusicData.topResult,
      songs: ytMusicData.songs?.slice(0, 20) || [],
      videos: ytMusicData.videos?.slice(0, 10) || [],
      artists: artists.slice(0, 10),
      albums: ytMusicData.albums?.slice(0, 10) || [],
      communityPlaylists: ytMusicData.communityPlaylists?.slice(0, 10) || []
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
          playbackMode: 'song',
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

    // Strict filtering: prefer songs (official audio) and exclude live/remix/cover from songs unless query suggests it
    const songExcludeRegex = /\b(live|remix|cover|acoustic|lyric|lyrics|sped|slowed|demo|edit|instrumental|karaoke|official\s+video|music\s+video|director|skit)\b/i;
    const querySuggestsVariants = /\b(live|remix|cover|acoustic|lyric|sped|slowed)\b/i.test(query || '');

    songs = songs.filter((s) => {
      if (!s || !s.title) return false;
      const title = s.title.toLowerCase();
      if (!querySuggestsVariants && songExcludeRegex.test(title)) return false;
      return true;
    }).map((s) => ({ ...s, playbackMode: 'song' }));

    videos = videos.filter((v) => {
      if (!v || !v.title) return false;
      // avoid very short/shorts content and clearly non-music cinematic pieces
      const title = v.title.toLowerCase();
      if (/\b(shorts|trailer|teaser|bts|behind the scenes|documentary)\b/.test(title)) return false;
      return true;
    }).map((v) => ({ ...v, playbackMode: 'video' }));

    // Artist disambiguation: query YouTube Music for possible channel matches for top Spotify artists
    const enrichArtistsWithYouTube = async (artistsArr: any[]) => {
      try {
        const promises = artistsArr.slice(0, 5).map(async (a: any) => {
          try {
            const yt = await ytMusicSearch(a.title);
            const ytMatches = (yt.artists || []).slice(0, 3).map((y: any) => ({ id: y.id, title: y.title, thumbnailUrl: y.thumbnailUrl, origin: 'youtube' }));
            return { ...a, possibleChannels: ytMatches };
          } catch (e) {
            return { ...a, possibleChannels: [] };
          }
        });
        const enriched = await Promise.all(promises);
        return enriched.concat(artistsArr.slice(enriched.length));
      } catch (e) {
        return artistsArr;
      }
    };

    if (artists.length > 0) {
      artists = await enrichArtistsWithYouTube(artists);
    }

    const cleanQuery = query.toLowerCase().trim();
    if (cleanQuery === 'fairuz' || cleanQuery === 'fairouz' || cleanQuery === 'fayrouz' || cleanQuery === 'فيروز') {
      const hasLebanese = artists.some((a: any) => a.id === 'UCzixfFiEFMjhSB3R9UdUdsA' || a.id === '65eg8R4wje95952S772qZq');
      if (!hasLebanese) {
        artists.unshift({
          id: 'UCzixfFiEFMjhSB3R9UdUdsA',
          title: 'Fairuz',
          channelTitle: 'Artist',
          thumbnailUrl: 'https://yt3.googleusercontent.com/ZIONSAndglfiCvZdwa0CNCrUFWN6EUvhQxyY6MtqRzzuZQYeg27M80K0LAikAZkmWcTgbSXXkA=w1000-h1000-l90-rj',
          subtitle: 'Legendary Lebanese Singer',
          publishedAt: new Date().toISOString(),
          type: 'channel',
          origin: 'youtube',
          channelId: 'UCzixfFiEFMjhSB3R9UdUdsA'
        });
      }
      
      const hasGerman = artists.some((a: any) => a.id === 'german-fairuz');
      if (!hasGerman) {
        artists.push({
          id: 'german-fairuz',
          title: 'Fairuz (DE)',
          channelTitle: 'Artist',
          thumbnailUrl: 'https://yt3.googleusercontent.com/r-nlAuthMmcTD_7SWnkTM0b60SyLjCD7IbWje50Da6lPquj0kEG5cDLabupRrnufiV4muhbbvwgkURv14w=w1000-h1000-l90-rj',
          subtitle: 'German Pop/Rapper',
          publishedAt: new Date().toISOString(),
          type: 'channel',
          origin: 'youtube',
          channelId: 'german-fairuz'
        });
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

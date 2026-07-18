import { NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify';
import { ytMusicSearch, cleanTopicGlobally } from '@/lib/youtubei';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ topResult: null, songs: [], artists: [], albums: [], communityPlaylists: [] });
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

    // Determine top result: prefer the artist if the raw search query yielded an artist top result
    const topResult = (ytArtistsData.topResult && (ytArtistsData.topResult.type === 'channel' || ytArtistsData.topResult.resultType === 'artist'))
      ? ytArtistsData.topResult
      : ytMusicData.topResult;

    return NextResponse.json(cleanTopicGlobally({
      topResult,
      songs: ytMusicData.songs?.slice(0, 20) || [],
      artists: artists.slice(0, 10),
      albums: ytMusicData.albums?.slice(0, 10) || [],
      communityPlaylists: ytMusicData.communityPlaylists?.slice(0, 10) || []
    }));
  };
  // SerpApi YouTube search fallback
  const runSerpApiSearch = async () => {
    const serpApiKey = process.env.SERPAPI_API_KEY;
    if (!serpApiKey) {
      return await runYoutubeSearchFallback();
    }

    console.log('[Search API] Querying SerpApi for search results...');
    try {
      const url = `https://serpapi.com/search.json?engine=youtube&search_query=${encodeURIComponent(query)}&api_key=${serpApiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`SerpApi response not ok: ${res.status}`);
      }
      const data = await res.json();

      // Map SerpApi video_results to songs
      const songs = (data.video_results || []).map((v: any) => {
        const id = v.video_id || '';
        return {
          id,
          title: v.title,
          channelTitle: v.channel?.name || 'Unknown Channel',
          thumbnailUrl: v.thumbnail?.static || v.thumbnail || '',
          publishedAt: v.published_date || new Date().toISOString(),
          type: 'music',
          origin: 'youtube',
          playbackMode: 'song',
          artistId: v.channel?.link?.split('/channel/')?.[1] || v.channel?.link?.split('/@')?.[1] || '',
          channelId: v.channel?.link?.split('/channel/')?.[1] || v.channel?.link?.split('/@')?.[1] || '',
          duration: v.length || '3:30',
          isExplicit: false
        };
      });

      // Map SerpApi channel_results to artists
      const artists = (data.channel_results || []).map((c: any) => {
        const id = c.channel_id || c.link?.split('/channel/')?.[1] || c.link?.split('/@')?.[1] || c.handle || '';
        return {
          id,
          title: c.title,
          channelTitle: 'Artist',
          thumbnailUrl: c.thumbnail || '',
          subtitle: c.subscribers ? `${c.subscribers.toLocaleString()} subscribers` : 'Artist',
          publishedAt: new Date().toISOString(),
          type: 'channel',
          origin: 'youtube',
          channelId: id
        };
      });

      // Map SerpApi playlist_results to albums/communityPlaylists
      const albums = (data.playlist_results || []).map((p: any) => {
        const id = p.playlist_id || p.link?.split('list=')?.[1] || '';
        return {
          id,
          title: p.title,
          channelTitle: p.channel?.name || 'YouTube Playlist',
          thumbnailUrl: p.thumbnail || '',
          publishedAt: new Date().toISOString(),
          type: 'playlist',
          releaseType: 'Playlist',
          origin: 'youtube',
          artistId: p.channel?.link?.split('/channel/')?.[1] || p.channel?.link?.split('/@')?.[1] || ''
        };
      });

      // Construct a top result: prefer the first artist/channel or the first song
      let topResult = null;
      if (artists.length > 0) {
        topResult = {
          ...artists[0],
          resultType: 'artist'
        };
      } else if (songs.length > 0) {
        topResult = {
          ...songs[0],
          resultType: 'song',
          type: 'song'
        };
      }

      return NextResponse.json(cleanTopicGlobally({
        topResult,
        songs: songs.slice(0, 20),
        artists: artists.slice(0, 10),
        albums: albums.slice(0, 10),
        communityPlaylists: albums.slice(0, 10)
      }));

    } catch (err) {
      console.error('[Search API] SerpApi search error:', err);
      return await runYoutubeSearchFallback();
    }
  };

  try {
    const spotifyApi = await getSpotifyApi();

    // Perform Spotify search
    const [spotifyRes] = await Promise.allSettled([
      spotifyApi.search(query, ['track', 'artist', 'album', 'playlist'], { limit: 20 })
    ]);

    // Check if Spotify search failed completely
    if (spotifyRes.status === 'rejected') {
      console.error('[Search API] Spotify search failed:', spotifyRes.reason);
      if (process.env.SERPAPI_API_KEY) {
        return await runSerpApiSearch();
      }
      return await runYoutubeSearchFallback();
    }

    let songs: any[] = [];
    let artists: any[] = [];
    let albums: any[] = [];
    let communityPlaylists: any[] = [];

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

    // Strict filtering: prefer songs (official audio) and exclude live/remix/cover from songs unless query suggests it
    const songExcludeRegex = /\b(live|remix|cover|acoustic|lyric|lyrics|sped|slowed|demo|edit|instrumental|karaoke|official\s+video|music\s+video|director|skit)\b/i;
    const querySuggestsVariants = /\b(live|remix|cover|acoustic|lyric|sped|slowed)\b/i.test(query || '');

    songs = songs.filter((s) => {
      if (!s || !s.title) return false;
      const title = s.title.toLowerCase();
      if (!querySuggestsVariants && songExcludeRegex.test(title)) return false;
      return true;
    }).map((s) => ({ ...s, playbackMode: 'song' }));

    // Deduplicate clean vs explicit versions of the same song, favoring explicit/uncensored
    const dedupedSongs: any[] = [];
    songs.forEach((song) => {
      const cleanTitle = song.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
      const cleanArtist = song.channelTitle.toLowerCase().trim();
      
      const dupIdx = dedupedSongs.findIndex((s) => {
        const sCleanTitle = s.title.toLowerCase().replace(/\b(clean|censored|radio\s+edit|explicit)\b/gi, '').replace(/\[.*\]|\(.*\)/g, '').trim();
        const sCleanArtist = s.channelTitle.toLowerCase().trim();
        return sCleanTitle === cleanTitle && sCleanArtist === cleanArtist;
      });

      if (dupIdx !== -1) {
        const existing = dedupedSongs[dupIdx];
        if (song.isExplicit && !existing.isExplicit) {
          dedupedSongs[dupIdx] = song; // Prefer the explicit/uncensored version
        }
      } else {
        dedupedSongs.push(song);
      }
    });
    songs = dedupedSongs;

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

    // Construct topResult (Spotify style: prefer artist if matching query)
    let topResult: any = null;
    const firstArtist = artists[0];
    const firstSong = songs[0];

    if (firstArtist && (
      firstArtist.title.toLowerCase().trim() === cleanQuery ||
      cleanQuery.includes(firstArtist.title.toLowerCase().trim())
    )) {
      topResult = {
        ...firstArtist,
        type: 'channel',
        resultType: 'artist'
      };
    } else if (firstSong) {
      topResult = {
        ...firstSong,
        type: 'music',
        resultType: 'song'
      };
    } else if (firstArtist) {
      topResult = {
        ...firstArtist,
        type: 'channel',
        resultType: 'artist'
      };
    }

    return NextResponse.json(cleanTopicGlobally({
      topResult,
      songs,
      artists,
      albums,
      communityPlaylists
    }));
  } catch (error) {
    console.error('[Search API] Outer error, triggering YouTube search fallback:', error);
    try {
      if (process.env.SERPAPI_API_KEY) {
        return await runSerpApiSearch();
      }
      return await runYoutubeSearchFallback();
    } catch (fallbackError) {
      console.error('[Search API] Fallback failed:', fallbackError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
}

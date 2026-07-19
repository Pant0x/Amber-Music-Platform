import { NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify';
import { ytMusicBrowse, parseTrackSubtitle, cleanArtistName, upgradeThumbnailUrl, cleanTopicGlobally } from '@/lib/youtubei';

const playlistCache = new Map<string, any>();
// Bump to invalidate stale cached playlists (e.g. after adding albumName to tracks).
const PLAYLIST_CACHE_VERSION = 'v2';

const runYoutubePlaylistFallback = async (playlistId: string) => {
  console.log(`[Playlist API] Falling back to YouTube Music for playlistId: ${playlistId}`);
  try {
    const data = await ytMusicBrowse(playlistId);
    
    // Extract metadata using microformatDataRenderer
    const mf = data.microformat?.microformatDataRenderer;
    const metadata = {
      id: playlistId,
      title: mf?.title ? cleanArtistName(mf.title) : 'YouTube Playlist',
      description: mf?.description || '',
      channelTitle: 'YouTube Music',
      channelId: '',
      thumbnailUrl: mf?.thumbnail?.thumbnails?.[0]?.url ? upgradeThumbnailUrl(mf.thumbnail.thumbnails[0].url) : '',
      videoCount: 0
    };

    let headerArtistName = '';
    let headerArtistId = '';

    const findHeaderInfo = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.musicResponsiveHeaderRenderer) {
        const header = obj.musicResponsiveHeaderRenderer;
        headerArtistName = header.straplineTextOne?.runs?.[0]?.text || '';
        headerArtistId = header.straplineTextOne?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
        return;
      }
      for (const key of Object.keys(obj)) {
        findHeaderInfo(obj[key]);
      }
    };
    findHeaderInfo(data);

    if (headerArtistName) {
      metadata.channelTitle = cleanArtistName(headerArtistName);
      metadata.channelId = headerArtistId;
    }

    // Traverse and collect tracks
    const tracks: any[] = [];
    const seenIds = new Set<string>();

    const extractThumbnail = (item: any) => {
      const thumbs = item?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || item?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails;
      if (!thumbs) return '';
      return upgradeThumbnailUrl(thumbs[thumbs.length - 1]?.url || thumbs[0]?.url || '');
    };

    const traverse = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      if (obj.musicResponsiveListItemRenderer) {
        const item = obj.musicResponsiveListItemRenderer;
        const flexColumns = item.flexColumns || [];
        const titleRun = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0];
        const subtitleRuns = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        
        const title = titleRun?.text;
        const id = item.playlistItemData?.videoId || titleRun?.navigationEndpoint?.watchEndpoint?.videoId;
        
        if (title && id && !seenIds.has(id)) {
          seenIds.add(id);
          
          // Find duration
          let durationStr = '3:00';
          const fixedColumns = item.fixedColumns || [];
          const durationText = fixedColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
          if (durationText && durationText.includes(':')) {
            durationStr = durationText;
          } else {
            const lastRun = subtitleRuns[subtitleRuns.length - 1]?.text;
            if (lastRun && lastRun.includes(':')) {
              durationStr = lastRun;
            }
          }

          const { artistName, artistId: subArtistId } = parseTrackSubtitle(subtitleRuns);
          // If the resolved artist name is "Unknown Artist" or "Various Artists" and we have a headerArtistName, fallback to headerArtistName.
          let finalArtist = artistName;
          let finalArtistId = subArtistId;
          
          if ((finalArtist === 'Unknown Artist' || finalArtist === 'Various Artists') && headerArtistName) {
            finalArtist = headerArtistName;
            finalArtistId = headerArtistId;
          } else if (finalArtist === 'Unknown Artist') {
            finalArtist = 'Various Artists';
          }

          const trackThumb = extractThumbnail(item);
          tracks.push({
            id,
            title: cleanArtistName(title),
            channelTitle: finalArtist,
            thumbnailUrl: trackThumb || metadata.thumbnailUrl,
            publishedAt: new Date().toISOString(),
            type: 'music',
            origin: 'youtube',
            artistId: finalArtistId || '',
            duration: durationStr,
            isExplicit: item.badges?.some((b: any) => b.musicInlineBadgeRenderer?.icon?.iconType === 'MUSIC_EXPLICIT_BADGE') || false
          });
        }
      }
      
      for (const key of Object.keys(obj)) {
        traverse(obj[key]);
      }
    };

    traverse(data);
    metadata.videoCount = tracks.length;

    // For albums, use the first track's artist name as channelTitle
    if (playlistId.startsWith('MPRE') && tracks.length > 0 && !metadata.channelId) {
      metadata.channelTitle = tracks[0].channelTitle;
      metadata.channelId = tracks[0].artistId;
    }

    // Stamp albumName and albumId onto every track from an album browse.
    // This is critical so the resolver can distinguish between two songs
    // with the same name on different albums (e.g. "Back Home" on 2093 vs another album).
    if (playlistId.startsWith('MPRE') && metadata.title) {
      for (const track of tracks) {
        track.albumName = metadata.title;
        track.albumId = playlistId;
      }
    }

    const result = cleanTopicGlobally({ metadata, tracks });
    if (playlistCache.size > 100) {
      playlistCache.clear();
    }
    playlistCache.set(`${PLAYLIST_CACHE_VERSION}_${playlistId}`, result);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Playlist API Fallback] Failed to fetch YouTube playlist details:', err);
    return NextResponse.json({ error: 'Failed to retrieve playlist details' }, { status: 500 });
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get('id');

  if (!playlistId) {
    return NextResponse.json({ error: 'Missing playlist or album ID' }, { status: 400 });
  }

  const cacheKey = `${PLAYLIST_CACHE_VERSION}_${playlistId}`;
  if (playlistCache.has(cacheKey)) {
    const cached = playlistCache.get(cacheKey);
    console.log(`[Playlist API] Cache HIT for playlistId: "${playlistId}"`);
    return NextResponse.json(cached);
  }

  // Route non-Spotify IDs directly to YouTube
  const looksLikeSpotify = playlistId.length === 22 && !playlistId.startsWith('VL') && !playlistId.startsWith('MPRE');
  if (!looksLikeSpotify) {
    return await runYoutubePlaylistFallback(playlistId);
  }

  try {
    const spotifyApi = await getSpotifyApi();

    // Try fetching it as a Spotify Playlist
    try {
      console.log(`[Playlist API] Trying to fetch as playlist: ${playlistId}`);
      const playlistRes = await spotifyApi.getPlaylist(playlistId);
      const playlistData = playlistRes.body;

      const metadata = {
        id: playlistData.id,
        title: cleanArtistName(playlistData.name),
        description: playlistData.description || '',
        channelTitle: cleanArtistName(playlistData.owner?.display_name || 'Spotify'),
        channelId: playlistData.owner?.id || '',
        thumbnailUrl: playlistData.images?.[0]?.url || '',
        videoCount: playlistData.tracks?.total || 0
      };

      // Map playlist items to tracks
      const tracks = (playlistData.tracks?.items || []).map((itemObj: any) => {
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
          channelId: item.artists[0]?.id || '',
          duration: durationStr,
          isExplicit: item.explicit || false
        };
      }).filter(Boolean);

      const playlistResult = cleanTopicGlobally({ metadata, tracks });
      if (playlistCache.size > 100) {
        playlistCache.clear();
      }
      playlistCache.set(cacheKey, playlistResult);
      return NextResponse.json(playlistResult);
    } catch (playlistError) {
      console.log(`[Playlist API] Fetch as playlist failed, trying as album: ${playlistId}`);
      
      // Fallback: try fetching it as an Album
      const albumRes = await spotifyApi.getAlbum(playlistId);
      const albumData = albumRes.body;

      const metadata = {
        id: albumData.id,
        title: cleanArtistName(albumData.name),
        description: `Album by ${albumData.artists.map((a: any) => a.name).join(', ')}. Released: ${albumData.release_date || 'N/A'}.`,
        channelTitle: cleanArtistName(albumData.artists.map((a: any) => a.name).join(', ')),
        channelId: albumData.artists[0]?.id || '',
        thumbnailUrl: albumData.images?.[0]?.url || '',
        videoCount: albumData.tracks?.total || 0
      };

      // Map album tracks
      const tracks = (albumData.tracks?.items || []).map((item: any) => {
        const durationMs = item.duration_ms || 180000;
        const mins = Math.floor(durationMs / 60000);
        const secs = Math.floor((durationMs % 60000) / 1000);
        const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

        return {
          id: item.id,
          title: cleanArtistName(item.name),
          channelTitle: cleanArtistName(item.artists.map((a: any) => a.name).join(', ')),
          thumbnailUrl: albumData.images?.[0]?.url || '',
          publishedAt: albumData.release_date || new Date().toISOString(),
          type: 'music',
          origin: 'spotify',
          artistId: item.artists[0]?.id || '',
          channelId: item.artists[0]?.id || '',
          duration: durationStr,
          isExplicit: item.explicit || false
        };
      });

      const albumResult = cleanTopicGlobally({ metadata, tracks });
      if (playlistCache.size > 100) {
        playlistCache.clear();
      }
      playlistCache.set(cacheKey, albumResult);
      return NextResponse.json(albumResult);
    }
  } catch (error: any) {
    console.error('[Playlist API] Spotify failed, triggering YouTube playlist fallback:', error);
    return await runYoutubePlaylistFallback(playlistId);
  }
}

import { NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify';
import { ytMusicSearch, ytMusicBrowse, ytMusicArtistDiscography, cleanArtistName, upgradeThumbnailUrl, parseSubscriberCount, cleanTopicGlobally } from '@/lib/youtubei';

const sortReleasesNewestToOldest = (items: any[]) => {
  const getReleaseTime = (dateStr: string) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
    const match = dateStr.match(/\b(19|20)\d{2}\b/);
    if (match) {
      const year = parseInt(match[0], 10);
      return new Date(`${year}-01-01T00:00:00Z`).getTime();
    }
    return 0;
  };

  const getReleasePriority = (item: any) => {
    const type = (item.releaseType || 'Album').toLowerCase();
    if (type.includes('album')) return 3;
    if (type.includes('ep')) return 2;
    if (type.includes('single')) return 1;
    return 0;
  };

  return [...items].sort((a, b) => {
    const timeA = getReleaseTime(a.publishedAt);
    const timeB = getReleaseTime(b.publishedAt);
    if (timeA !== timeB) {
      return timeB - timeA;
    }
    const prioA = getReleasePriority(a);
    const prioB = getReleasePriority(b);
    if (prioA !== prioB) {
      return prioB - prioA;
    }
    return (a.title || '').localeCompare(b.title || '');
  });
};

const isLowQualityChannel = (name: string): boolean => {
  if (!name) return true;
  const lower = name.toLowerCase();
  return lower.includes('unknown artist') || 
         lower.includes('various artists') || 
         lower.includes('placeholder') || 
         lower.trim() === 'music' || 
         lower.trim() === 'artist';
};

const runYoutubeChannelFallback = async (artistId: string | null, name: string | null) => {
  console.log(`[Artist API] Falling back to YouTube Music for artistId: ${artistId}, name: "${name}"`);
  try {
    let resolvedId = artistId;
    
    // If ID is missing or is a Spotify ID (non-UC, length 22), resolve official YouTube channel browseId
    const looksLikeSpotifyId = !resolvedId || (resolvedId.length === 22 && !resolvedId.startsWith('UC') && !resolvedId.startsWith('FEmusic'));
    
    if (looksLikeSpotifyId && name) {
      console.log(`[Artist API Fallback] Searching YouTube Music for artist name: "${name}"`);
      const searchRes = await ytMusicSearch(name);
      
      const topResult = searchRes.topResult;
      const isArtistTop = topResult && (topResult.resultType === 'artist' || topResult.type === 'channel');
      const ytArtist = isArtistTop ? topResult : searchRes.artists?.[0];
      
      if (ytArtist?.id) {
        resolvedId = ytArtist.id;
        console.log(`[Artist API Fallback] Resolved YouTube artist browseId: ${resolvedId}`);
      }
    }

    if (!resolvedId) {
      return NextResponse.json({ error: 'Missing artist ID or artist could not be resolved' }, { status: 400 });
    }

    // Fetch official details using YouTube Music browse
    const browseData = await ytMusicBrowse(resolvedId);
    
    // Parse profile details from browseData microformat
    const mf = browseData.microformat?.microformatDataRenderer;
    
    // Find background banner image from immersive header or visual header
    let bannerUrl = '';
    let avatarUrl = '';
    const header = browseData.header;
    if (header?.musicImmersiveHeaderRenderer) {
      const thumbs = header.musicImmersiveHeaderRenderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails;
      bannerUrl = thumbs?.[thumbs.length - 1]?.url || '';
    } else if (header?.musicVisualHeaderRenderer) {
      const thumbs = header.musicVisualHeaderRenderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails;
      avatarUrl = thumbs?.[thumbs.length - 1]?.url || '';
    }

    // Try to find subscription size / subscriber count
    let subscriberCount = '';
    const findSubscribers = (obj: any) => {
      if (!obj || typeof obj !== 'object' || subscriberCount) return;
      if (obj.longSubscriberCountText?.runs?.[0]?.text) {
        subscriberCount = obj.longSubscriberCountText.runs[0].text;
        return;
      }
      if (obj.subscriberCountText?.runs?.[0]?.text) {
        subscriberCount = obj.subscriberCountText.runs[0].text;
        return;
      }
      if (obj.formattedSubscriptionSize && typeof obj.formattedSubscriptionSize === 'string') {
        subscriberCount = obj.formattedSubscriptionSize;
        return;
      }
      if (obj.monthlyListenerCount?.runs?.[0]?.text) {
        subscriberCount = obj.monthlyListenerCount.runs[0].text;
        return;
      }
      for (const key of Object.keys(obj)) {
        findSubscribers(obj[key]);
      }
    };
    findSubscribers(browseData);

    const profile = {
      id: resolvedId,
      title: mf?.title ? cleanArtistName(mf.title) : (name ? cleanArtistName(name) : 'YouTube Artist'),
      description: mf?.description || 'YouTube Verified Artist.',
      customUrl: mf?.urlCanonical || '',
      avatarUrl: avatarUrl ? upgradeThumbnailUrl(avatarUrl) : (bannerUrl ? upgradeThumbnailUrl(bannerUrl) : ''),
      bannerUrl: bannerUrl ? upgradeThumbnailUrl(bannerUrl) : (avatarUrl ? upgradeThumbnailUrl(avatarUrl) : ''),
      subscriberCount: parseSubscriberCount(subscriberCount),
      videoCount: '0'
    };

    // Now get the discography songs, albums, and singles
    const discography = await ytMusicArtistDiscography(resolvedId);
    
    const topSongs = (discography.topSongs || [])
      .filter((song: any) => {
        if (!song.title || isLowQualityChannel(song.channelTitle)) return false;
        const titleLower = song.title.toLowerCase();
        if (titleLower.includes('official video') || 
            titleLower.includes('music video') || 
            titleLower.includes('director') || 
            titleLower.includes('skit')) {
          return false;
        }
        return true;
      })
      .map((song: any) => ({
        ...song,
        title: cleanArtistName(song.title),
        channelTitle: song.channelTitle && song.channelTitle !== 'Unknown Artist' 
          ? cleanArtistName(song.channelTitle) 
          : profile.title,
        thumbnailUrl: upgradeThumbnailUrl(song.thumbnailUrl)
      }));

    const seenAlbumIds = new Set<string>();
    const albumsRaw = (discography.albums || [])
      .filter((album: any) => {
        if (!album.id || seenAlbumIds.has(album.id)) return false;
        seenAlbumIds.add(album.id);
        return true;
      })
      .map((album: any) => ({
        ...album,
        title: cleanArtistName(album.title),
        channelTitle: album.channelTitle && album.channelTitle !== 'Unknown Artist'
          ? cleanArtistName(album.channelTitle)
          : profile.title,
        thumbnailUrl: upgradeThumbnailUrl(album.thumbnailUrl),
        releaseType: 'Album'
      }));

    const seenSingleIds = new Set<string>();
    const singlesRaw = (discography.singles || [])
      .filter((single: any) => {
        if (!single.id || seenSingleIds.has(single.id)) return false;
        seenSingleIds.add(single.id);
        return true;
      })
      .map((single: any) => ({
        ...single,
        title: cleanArtistName(single.title),
        channelTitle: single.channelTitle && single.channelTitle !== 'Unknown Artist'
          ? cleanArtistName(single.channelTitle)
          : profile.title,
        thumbnailUrl: upgradeThumbnailUrl(single.thumbnailUrl),
        releaseType: 'Single/EP'
      }));

    const seenSongIds = new Set<string>(topSongs.map((s: any) => s.id));

    // Fetch collaborative search albums/singles and songs to catch features
    try {
      console.log(`[Artist API Fallback] Searching YouTube Music for collaborative releases and songs for: "${profile.title}"`);
      const [searchRes, searchSongsRes] = await Promise.all([
        ytMusicSearch(profile.title),
        ytMusicSearch(`${profile.title} songs`)
      ]);

      // Merge results
      const searchSongs = [
        ...(searchRes.songs || []),
        ...(searchSongsRes.songs || [])
      ];
      
      const searchAlbums = [
        ...(searchRes.albums || []),
        ...(searchSongsRes.albums || [])
      ];

      // 1. Process search songs
      for (const song of searchSongs) {
        // Add to topSongs if not seen
        if (song.id && !seenSongIds.has(song.id)) {
          seenSongIds.add(song.id);
          topSongs.push({
            ...song,
            title: cleanArtistName(song.title),
            channelTitle: song.channelTitle && song.channelTitle !== 'Unknown Artist'
              ? cleanArtistName(song.channelTitle)
              : profile.title,
            thumbnailUrl: upgradeThumbnailUrl(song.thumbnailUrl)
          });
        }
        // Add the song's album to albumsRaw/singlesRaw if found
        if (song.albumId && song.albumName) {
          if (!seenAlbumIds.has(song.albumId)) {
            seenAlbumIds.add(song.albumId);
            albumsRaw.push({
              id: song.albumId,
              title: cleanArtistName(song.albumName),
              channelTitle: song.channelTitle && song.channelTitle !== 'Unknown Artist'
                ? cleanArtistName(song.channelTitle)
                : profile.title,
              thumbnailUrl: upgradeThumbnailUrl(song.thumbnailUrl),
              releaseType: 'Album',
              origin: 'youtube'
            });
          }
        }
      }

      // 2. Process search albums
      for (const sa of searchAlbums) {
        const isSingleOrEp = sa.releaseType?.toLowerCase() === 'single' || sa.releaseType?.toLowerCase() === 'ep';
        if (isSingleOrEp) {
          if (sa.id && !seenSingleIds.has(sa.id)) {
            seenSingleIds.add(sa.id);
            singlesRaw.push({
              ...sa,
              title: cleanArtistName(sa.title),
              channelTitle: sa.channelTitle && sa.channelTitle !== 'Unknown Artist'
                ? cleanArtistName(sa.channelTitle)
                : profile.title,
              thumbnailUrl: upgradeThumbnailUrl(sa.thumbnailUrl),
              releaseType: sa.releaseType || 'Single/EP'
            });
          }
        } else {
          if (sa.id && !seenAlbumIds.has(sa.id)) {
            seenAlbumIds.add(sa.id);
            albumsRaw.push({
              ...sa,
              title: cleanArtistName(sa.title),
              channelTitle: sa.channelTitle && sa.channelTitle !== 'Unknown Artist'
                ? cleanArtistName(sa.channelTitle)
                : profile.title,
              thumbnailUrl: upgradeThumbnailUrl(sa.thumbnailUrl),
              releaseType: sa.releaseType || 'Album'
            });
          }
        }
      }
    } catch (searchErr) {
      console.error('[Artist API Fallback] Failed fetching search releases fallback:', searchErr);
    }

    const albums = sortReleasesNewestToOldest(albumsRaw);
    const singles = sortReleasesNewestToOldest(singlesRaw);

    const featuredPlaylists = (discography.featuredPlaylists || [])
      .map((item: any) => ({
        ...item,
        title: cleanArtistName(item.title),
        channelTitle: cleanArtistName(item.channelTitle),
        thumbnailUrl: upgradeThumbnailUrl(item.thumbnailUrl),
        releaseType: 'Playlist'
      }));

    // Deduplicate, merge and sort albums + singles for allPlaylists newest-to-oldest
    const seenIds = new Set<string>();
    const allPlaylists = sortReleasesNewestToOldest(
      [...albums, ...singles].filter(item => {
        if (!item.id || seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      })
    );

    // Parse related artists from browse response
    let relatedArtists: any[] = [];
    try {
      const foundRelated: any[] = [];
      const findRelated = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj.musicTwoRowItemRenderer) {
          const item = obj.musicTwoRowItemRenderer;
          const subtitle = item.subtitle?.runs?.[0]?.text?.toLowerCase();
          const titleText = item.title?.runs?.[0]?.text;
          const bId = item.navigationEndpoint?.browseEndpoint?.browseId;
          const thumbs = item.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails;
          if (subtitle === 'artist' && titleText && bId && bId !== resolvedId) {
            foundRelated.push({
              id: bId,
              title: cleanArtistName(titleText),
              thumbnailUrl: thumbs?.[thumbs.length - 1]?.url ? upgradeThumbnailUrl(thumbs[thumbs.length - 1].url) : '',
              type: 'channel',
              origin: 'youtube'
            });
          }
        }
        for (const key of Object.keys(obj)) {
          findRelated(obj[key]);
        }
      };
      findRelated(browseData);
      
      const seenRelatedIds = new Set<string>();
      relatedArtists = foundRelated.filter(item => {
        if (seenRelatedIds.has(item.id) || isLowQualityChannel(item.title)) return false;
        seenRelatedIds.add(item.id);
        return true;
      }).slice(0, 10);
    } catch (e) {
      console.error('[Artist API Fallback] Failed parsing related artists:', e);
    }

    // Query official YouTube videos of the artist
    let videos: any[] = [];
    try {
      const ytData = await ytMusicSearch(`${profile.title} music video`);
      if (ytData.videos) {
        videos = ytData.videos.slice(0, 10).map((v: any) => ({
          ...v,
          title: cleanArtistName(v.title),
          channelTitle: cleanArtistName(v.channelTitle),
          thumbnailUrl: upgradeThumbnailUrl(v.thumbnailUrl)
        }));
      }
    } catch (e) {
      console.error('[Artist API Fallback] YouTube search failed:', e);
    }

    return NextResponse.json(cleanTopicGlobally({
      profile,
      videos,
      topSongs,
      albums,
      singles,
      allPlaylists,
      featuredPlaylists,
      relatedArtists
    }));
  } catch (error) {
    console.error('[Artist API Fallback] Outer error in YouTube artist fallback:', error);
    return NextResponse.json({ error: 'Failed to retrieve YouTube artist details' }, { status: 500 });
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let artistId = searchParams.get('id');
  const name = searchParams.get('name');

  if ((name && isLowQualityChannel(name)) || (artistId && isLowQualityChannel(artistId))) {
    return NextResponse.json({ error: 'Blocked placeholder or low-quality artist entity' }, { status: 400 });
  }

  try {
    const spotifyApi = await getSpotifyApi();

    // 1. Resolve artistId from name if not provided
    if (!artistId && name) {
      console.log(`[Artist API] Resolving artistId for name: "${name}"`);
      const searchRes = await spotifyApi.searchArtists(name, { limit: 1 });
      if (searchRes.body.artists?.items && searchRes.body.artists.items.length > 0) {
        const matchedArtist = searchRes.body.artists.items[0];
        if (isLowQualityChannel(matchedArtist.name)) {
          return NextResponse.json({ error: 'Blocked placeholder artist' }, { status: 400 });
        }
        artistId = matchedArtist.id;
      }
    }

    if (!artistId) {
      return await runYoutubeChannelFallback(artistId, name);
    }

    if (artistId.startsWith('UC') || artistId.startsWith('FEmusic')) {
      return await runYoutubeChannelFallback(artistId, name);
    }

    console.log(`[Artist API] Fetching details for artist ID: ${artistId}`);

    // Fetch artist profile, top tracks, and albums/singles/features separately in parallel
    const [artistRes, topTracksRes, albumsRes, singlesRes, appearsOnRes, relatedRes] = await Promise.all([
      spotifyApi.getArtist(artistId),
      spotifyApi.getArtistTopTracks(artistId, 'US'),
      spotifyApi.getArtistAlbums(artistId, { limit: 50, country: 'US', include_groups: 'album' }),
      spotifyApi.getArtistAlbums(artistId, { limit: 50, country: 'US', include_groups: 'single' }),
      spotifyApi.getArtistAlbums(artistId, { limit: 50, country: 'US', include_groups: 'appears_on' }),
      spotifyApi.getArtistRelatedArtists(artistId)
    ]);

    const artistData = artistRes.body;
    
    // Map profile
    const profile = {
      id: artistData.id,
      title: cleanArtistName(artistData.name),
      description: `Spotify Verified Artist. Popularity: ${artistData.popularity}/100. Genres: ${artistData.genres?.join(', ') || 'N/A'}.`,
      customUrl: artistData.external_urls?.spotify || '',
      avatarUrl: artistData.images?.[0]?.url || artistData.images?.[1]?.url || '',
      bannerUrl: artistData.images?.[0]?.url || '', // Use largest image as banner
      subscriberCount: artistData.followers?.total?.toString() || '0',
      videoCount: '0'
    };

    // Map top tracks
    const topSongs = (topTracksRes.body.tracks || []).map((item: any) => {
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
    });

    // Map albums and singles with chronological sorting
    const allItems = [
      ...(albumsRes.body?.items || []),
      ...(singlesRes.body?.items || []),
      ...(appearsOnRes.body?.items || [])
    ];
    
    const getSpotifyReleaseType = (item: any): 'Album' | 'Single' | 'EP' => {
      const totalTracks = item.total_tracks || 1;
      const lowerName = item.name.toLowerCase();
      if (lowerName.includes('(single)') || lowerName.includes(' - single')) return 'Single';
      if (lowerName.includes('(ep)') || lowerName.includes(' - ep')) return 'EP';
      if (totalTracks >= 1 && totalTracks <= 3) return 'Single';
      if (totalTracks >= 4 && totalTracks <= 6) return 'EP';
      return 'Album';
    };

    const mappedReleases = allItems.map((item: any) => {
      const relType = getSpotifyReleaseType(item);
      return {
        id: item.id,
        title: cleanArtistName(item.name),
        channelTitle: cleanArtistName(item.artists.map((a: any) => a.name).join(', ')),
        thumbnailUrl: item.images?.[0]?.url || item.images?.[1]?.url || '',
        publishedAt: item.release_date || new Date().toISOString(),
        type: 'playlist',
        releaseType: relType,
        origin: 'spotify',
        artistId: item.artists[0]?.id || ''
      };
    });

    const albums = sortReleasesNewestToOldest(
      mappedReleases.filter(item => item.releaseType === 'Album')
    );

    const singles = sortReleasesNewestToOldest(
      mappedReleases.filter(item => item.releaseType === 'Single' || item.releaseType === 'EP')
    );

    // Merge and deduplicate for allPlaylists, sorted newest-to-oldest
    const seenIds = new Set<string>();
    const allPlaylists = sortReleasesNewestToOldest(
      [...albums, ...singles].filter(item => {
        if (!item.id || seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      })
    );

    // Map related artists
    const relatedArtists = (relatedRes.body.artists || [])
      .filter((item: any) => !isLowQualityChannel(item.name))
      .map((item: any) => ({
        id: item.id,
        title: cleanArtistName(item.name),
        thumbnailUrl: item.images?.[0]?.url || item.images?.[1]?.url || '',
        type: 'channel',
        origin: 'spotify'
      }));

    // Fetch popular videos from YouTube
    let videos: any[] = [];
    try {
      console.log(`[Artist API] Searching YouTube for videos of artist: "${profile.title}"`);
      const ytData = await ytMusicSearch(`${profile.title} music video`);
      if (ytData.videos) {
        videos = ytData.videos.slice(0, 10).map((v: any) => ({
          ...v,
          title: cleanArtistName(v.title),
          channelTitle: cleanArtistName(v.channelTitle),
          thumbnailUrl: upgradeThumbnailUrl(v.thumbnailUrl)
        }));
      }
    } catch (e) {
      console.error('[Artist API] YouTube search fallback failed:', e);
    }

    return NextResponse.json(cleanTopicGlobally({
      profile,
      videos,
      topSongs,
      albums,
      singles,
      allPlaylists,
      featuredPlaylists: [],
      relatedArtists
    }));
  } catch (error) {
    console.error('[Artist API] Spotify failed, triggering YouTube artist fallback:', error);
    return await runYoutubeChannelFallback(artistId, name);
  }
}

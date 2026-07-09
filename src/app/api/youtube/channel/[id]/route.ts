import { NextResponse } from 'next/server';
import { getSpotifyApi } from '@/lib/spotify';
import { ytMusicSearch, ytMusicBrowse, ytMusicArtistDiscography, cleanArtistName, upgradeThumbnailUrl, parseSubscriberCount, cleanTopicGlobally } from '@/lib/youtubei';
import createSupabaseServerClient from '@/lib/supabase-server';

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

const isGermanFairuzRelease = (title: string): boolean => {
  if (!title) return false;
  const titleLower = title.toLowerCase().trim();
  const germanKeywords = [
    'allein', 'kaputt', 'kein wort', 'abfuck', 'endorphine',
    'liebe nur geliehen', 'bla bla', 'dafür', 'dafur', 'nasib',
    'bonding', 'your beautiful smile', 'ca va', 'verpasst',
    'haus am meer', 'diva', '1 dafür', 'dafür 1', 'dafur 1', '1 dafur'
  ];
  return germanKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(titleLower) || titleLower === keyword;
  });
};

const filterReleasesForArtist = (id: string, items: any[]): any[] => {
  if (!items) return [];
  if (id === 'german-fairuz') {
    return items.filter(item => isGermanFairuzRelease(item.title));
  }
  const isLebanese = id === 'UCzixfFiEFMjhSB3R9UdUdsA' || id === '65eg8R4wje95952S772qZq';
  if (isLebanese) {
    return items.filter(item => !isGermanFairuzRelease(item.title));
  }
  return items;
};

const runYoutubeChannelFallback = async (artistId: string | null, name: string | null, originalId?: string) => {
  console.log(`[Artist API] Falling back to YouTube Music for artistId: ${artistId}, name: "${name}" (originalId: ${originalId})`);
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

    const isGermanVirtual = originalId === 'german-fairuz';

    const profile = {
      id: originalId || resolvedId,
      title: isGermanVirtual ? 'Fairuz (DE)' : (mf?.title ? cleanArtistName(mf.title) : (name ? cleanArtistName(name) : 'YouTube Artist')),
      description: isGermanVirtual ? 'German pop/rap singer.' : (mf?.description || 'YouTube Verified Artist.'),
      customUrl: mf?.urlCanonical || '',
      avatarUrl: isGermanVirtual ? 'https://yt3.googleusercontent.com/r-nlAuthMmcTD_7SWnkTM0b60SyLjCD7IbWje50Da6lPquj0kEG5cDLabupRrnufiV4muhbbvwgkURv14w=w1000-h1000-l90-rj' : (avatarUrl ? upgradeThumbnailUrl(avatarUrl) : (bannerUrl ? upgradeThumbnailUrl(bannerUrl) : '')),
      bannerUrl: isGermanVirtual ? 'https://yt3.googleusercontent.com/r-nlAuthMmcTD_7SWnkTM0b60SyLjCD7IbWje50Da6lPquj0kEG5cDLabupRrnufiV4muhbbvwgkURv14w=w1000-h1000-l90-rj' : (bannerUrl ? upgradeThumbnailUrl(bannerUrl) : (avatarUrl ? upgradeThumbnailUrl(avatarUrl) : '')),
      subscriberCount: isGermanVirtual ? '500000' : parseSubscriberCount(subscriberCount),
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

      const searchSongs = [
        ...(searchRes.songs || []),
        ...(searchSongsRes.songs || [])
      ];
      
      const searchAlbums = [
        ...(searchRes.albums || []),
        ...(searchSongsRes.albums || [])
      ];

      const artistNameLower = profile.title.toLowerCase();
      const artistRegex = new RegExp(`\\b${artistNameLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      
      for (const song of searchSongs) {
        const songTitleLower = song.title.toLowerCase();
        const songArtists = (song.channelTitle || '')
          .split(/,|\s+&\s+|\s+and\s+/i)
          .map((n: string) => n.trim().toLowerCase())
          .filter(Boolean);
          
        const isActuallyArtist = 
          songArtists.some((a: string) => a === artistNameLower) ||
          artistRegex.test(song.channelTitle || '') ||
          artistRegex.test(songTitleLower);
          
        if (!isActuallyArtist) continue;

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

      for (const sa of searchAlbums) {
        const saArtists = (sa.channelTitle || '')
          .split(/,|\s+&\s+|\s+and\s+/i)
          .map((n: string) => n.trim().toLowerCase())
          .filter(Boolean);
          
        const isActuallyAlbumArtist = 
          saArtists.some((a: string) => a === artistNameLower) ||
          artistRegex.test(sa.title.toLowerCase()) ||
          artistRegex.test(sa.channelTitle || '');
          
        if (!isActuallyAlbumArtist) continue;

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

    // Fetch user's local database history matched collaborative songs
    try {
      const supabase = createSupabaseServerClient();
      if (supabase) {
        console.log(`[Artist API Fallback] Fetching local database listen history for artist: "${profile.title}"`);
        const { data: matchedRows, error: dbErr } = await supabase
          .from('listen_history')
          .select('metadata')
          .not('metadata', 'is', null)
          .limit(500);

        if (!dbErr && matchedRows) {
          const artistNameLower = profile.title.toLowerCase();
          const artistRegex = new RegExp(`\\b${artistNameLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');

          for (const row of matchedRows) {
            const track = row.metadata;
            if (!track || !track.title) continue;

            const songTitleLower = track.title.toLowerCase();
            const songArtists = (track.channelTitle || '')
              .split(/,|\s+&\s+|\s+and\s+/i)
              .map((n: string) => n.trim().toLowerCase())
              .filter(Boolean);

            const isActuallyArtist = 
              songArtists.some((a: string) => a === artistNameLower) ||
              artistRegex.test(track.channelTitle || '') ||
              artistRegex.test(songTitleLower);

            if (isActuallyArtist && track.id && !seenSongIds.has(track.id)) {
              seenSongIds.add(track.id);
              topSongs.push({
                id: track.id,
                title: cleanArtistName(track.title),
                channelTitle: track.channelTitle && track.channelTitle !== 'Unknown Artist'
                  ? cleanArtistName(track.channelTitle)
                  : profile.title,
                thumbnailUrl: upgradeThumbnailUrl(track.thumbnailUrl || ''),
                duration: track.duration || '3:00',
                isExplicit: track.isExplicit || false,
                albumId: track.albumId || null,
                albumName: track.albumName || null
              });

              if (track.albumId && track.albumName && !seenAlbumIds.has(track.albumId)) {
                seenAlbumIds.add(track.albumId);
                albumsRaw.push({
                  id: track.albumId,
                  title: cleanArtistName(track.albumName),
                  channelTitle: track.channelTitle && track.channelTitle !== 'Unknown Artist'
                    ? cleanArtistName(track.channelTitle)
                    : profile.title,
                  thumbnailUrl: upgradeThumbnailUrl(track.thumbnailUrl || ''),
                  releaseType: 'Album',
                  origin: 'youtube'
                });
              }
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn('[Artist API Fallback] Supabase history resolution failed (Supabase might not be fully configured):', dbErr);
    }

    // Dynamic Single-release fallback for songs without parent albums
    for (const song of topSongs) {
      const cleanedSongTitle = cleanArtistName(song.title);
      const lowerSongTitle = cleanedSongTitle.toLowerCase();
      
      const isAlreadyRelease = 
        albumsRaw.some((a: any) => a.title.toLowerCase() === lowerSongTitle) ||
        singlesRaw.some((s: any) => s.title.toLowerCase() === lowerSongTitle);
        
      if (!isAlreadyRelease) {
        if (song.id && !seenSingleIds.has(song.id)) {
          seenSingleIds.add(song.id);
          singlesRaw.push({
            id: song.id,
            title: cleanedSongTitle,
            channelTitle: song.channelTitle || profile.title,
            thumbnailUrl: song.thumbnailUrl,
            releaseType: 'Single',
            origin: 'youtube',
            type: 'music',
            duration: song.duration || '3:00',
            isExplicit: song.isExplicit || false
          });
        }
      }
    }

    // Apply Metadata Disambiguation filtering here
    const filteredTopSongs = filterReleasesForArtist(originalId || resolvedId, topSongs);
    const filteredAlbums = filterReleasesForArtist(originalId || resolvedId, albumsRaw);
    const filteredSingles = filterReleasesForArtist(originalId || resolvedId, singlesRaw);

    const albums = sortReleasesNewestToOldest(filteredAlbums);
    const singles = sortReleasesNewestToOldest(filteredSingles);

    const featuredPlaylists = (discography.featuredPlaylists || [])
      .map((item: any) => ({
        ...item,
        title: cleanArtistName(item.title),
        channelTitle: cleanArtistName(item.channelTitle),
        thumbnailUrl: upgradeThumbnailUrl(item.thumbnailUrl),
        releaseType: 'Playlist'
      }));

    const seenIds = new Set<string>();
    const allPlaylists = sortReleasesNewestToOldest(
      [...albums, ...singles].filter(item => {
        if (!item.id || seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      })
    );

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
      topSongs: filteredTopSongs,
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const decodedId = decodeURIComponent(rawId);

  let artistId: string | null = null;
  let name: string | null = null;

  const isId = decodedId.startsWith('UC') || decodedId.startsWith('FE') || decodedId.startsWith('FEmusic') || decodedId.length === 22 || decodedId === 'german-fairuz';
  if (isId) {
    artistId = decodedId;
  } else {
    name = decodedId;
  }

  if ((name && isLowQualityChannel(name)) || (artistId && isLowQualityChannel(artistId))) {
    return NextResponse.json({ error: 'Blocked placeholder or low-quality artist entity' }, { status: 400 });
  }

  const isGermanVirtual = artistId === 'german-fairuz';
  const queryArtistId = isGermanVirtual ? 'UCzixfFiEFMjhSB3R9UdUdsA' : artistId;
  const queryName = isGermanVirtual ? 'Fairuz' : name;

  try {
    const spotifyApi = await getSpotifyApi();

    if (!queryArtistId && queryName) {
      console.log(`[Artist API] Resolving artistId for name: "${queryName}"`);
      const searchRes = await spotifyApi.searchArtists(queryName, { limit: 1 });
      if (searchRes.body.artists?.items && searchRes.body.artists.items.length > 0) {
        const matchedArtist = searchRes.body.artists.items[0];
        if (isLowQualityChannel(matchedArtist.name)) {
          return NextResponse.json({ error: 'Blocked placeholder artist' }, { status: 400 });
        }
        artistId = matchedArtist.id;
      }
    }

    if (!artistId) {
      return await runYoutubeChannelFallback(artistId, queryName, decodedId);
    }

    if (artistId.startsWith('UC') || artistId.startsWith('FEmusic') || isGermanVirtual) {
      return await runYoutubeChannelFallback(queryArtistId, queryName, decodedId);
    }

    console.log(`[Artist API] Fetching details for artist ID: ${artistId}`);

    const [artistRes, topTracksRes, albumsRes, singlesRes, appearsOnRes, relatedRes] = await Promise.all([
      spotifyApi.getArtist(artistId),
      spotifyApi.getArtistTopTracks(artistId, 'US'),
      spotifyApi.getArtistAlbums(artistId, { limit: 50, country: 'US', include_groups: 'album' }),
      spotifyApi.getArtistAlbums(artistId, { limit: 50, country: 'US', include_groups: 'single' }),
      spotifyApi.getArtistAlbums(artistId, { limit: 50, country: 'US', include_groups: 'appears_on' }),
      spotifyApi.getArtistRelatedArtists(artistId)
    ]);

    const artistData = artistRes.body;
    
    const profile = {
      id: decodedId,
      title: isGermanVirtual ? 'Fairuz (DE)' : cleanArtistName(artistData.name),
      description: isGermanVirtual ? 'German pop/rap singer.' : `Spotify Verified Artist. Popularity: ${artistData.popularity}/100. Genres: ${artistData.genres?.join(', ') || 'N/A'}.`,
      customUrl: artistData.external_urls?.spotify || '',
      avatarUrl: isGermanVirtual ? 'https://yt3.googleusercontent.com/r-nlAuthMmcTD_7SWnkTM0b60SyLjCD7IbWje50Da6lPquj0kEG5cDLabupRrnufiV4muhbbvwgkURv14w=w1000-h1000-l90-rj' : (artistData.images?.[0]?.url || artistData.images?.[1]?.url || ''),
      bannerUrl: isGermanVirtual ? 'https://yt3.googleusercontent.com/r-nlAuthMmcTD_7SWnkTM0b60SyLjCD7IbWje50Da6lPquj0kEG5cDLabupRrnufiV4muhbbvwgkURv14w=w1000-h1000-l90-rj' : (artistData.images?.[0]?.url || ''),
      subscriberCount: artistData.followers?.total?.toString() || '0',
      videoCount: '0'
    };

    const topSongs: any[] = (topTracksRes.body.tracks || []).map((item: any) => {
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

    const albumsRaw: any[] = mappedReleases.filter(item => item.releaseType === 'Album');
    const singlesRaw: any[] = mappedReleases.filter(item => item.releaseType === 'Single' || item.releaseType === 'EP');

    const seenSongIds = new Set<string>(topSongs.map((s: any) => s.id));
    const seenAlbumIds = new Set<string>(albumsRaw.map((a: any) => a.id));
    const seenSingleIds = new Set<string>(singlesRaw.map((s: any) => s.id));

    try {
      const supabase = createSupabaseServerClient();
      if (supabase) {
        console.log(`[Artist API Spotify] Fetching local database listen history for artist: "${profile.title}"`);
        const { data: matchedRows, error: dbErr } = await supabase
          .from('listen_history')
          .select('metadata')
          .not('metadata', 'is', null)
          .limit(500);

        if (!dbErr && matchedRows) {
          const artistNameLower = profile.title.toLowerCase();
          const artistRegex = new RegExp(`\\b${artistNameLower.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');

          for (const row of matchedRows) {
            const track = row.metadata;
            if (!track || !track.title) continue;

            const songTitleLower = track.title.toLowerCase();
            const songArtists = (track.channelTitle || '')
              .split(/,|\s+&\s+|\s+and\s+/i)
              .map((n: string) => n.trim().toLowerCase())
              .filter(Boolean);

            const isActuallyArtist = 
              songArtists.some((a: string) => a === artistNameLower) ||
              artistRegex.test(track.channelTitle || '') ||
              artistRegex.test(songTitleLower);

            if (isActuallyArtist && track.id && !seenSongIds.has(track.id)) {
              seenSongIds.add(track.id);
              topSongs.push({
                id: track.id,
                title: cleanArtistName(track.title),
                channelTitle: track.channelTitle && track.channelTitle !== 'Unknown Artist'
                  ? cleanArtistName(track.channelTitle)
                  : profile.title,
                thumbnailUrl: upgradeThumbnailUrl(track.thumbnailUrl || ''),
                duration: track.duration || '3:00',
                isExplicit: track.isExplicit || false,
                albumId: track.albumId || null,
                albumName: track.albumName || null
              });

              if (track.albumId && track.albumName && !seenAlbumIds.has(track.albumId)) {
                seenAlbumIds.add(track.albumId);
                albumsRaw.push({
                  id: track.albumId,
                  title: cleanArtistName(track.albumName),
                  channelTitle: track.channelTitle && track.channelTitle !== 'Unknown Artist'
                    ? cleanArtistName(track.channelTitle)
                    : profile.title,
                  thumbnailUrl: upgradeThumbnailUrl(track.thumbnailUrl || ''),
                  releaseType: 'Album',
                  origin: 'youtube'
                });
              }
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn('[Artist API Spotify] Supabase history resolution failed:', dbErr);
    }

    for (const song of topSongs) {
      const cleanedSongTitle = cleanArtistName(song.title);
      const lowerSongTitle = cleanedSongTitle.toLowerCase();

      const isAlreadyRelease = 
        albumsRaw.some((a: any) => a.title.toLowerCase() === lowerSongTitle) ||
        singlesRaw.some((s: any) => s.title.toLowerCase() === lowerSongTitle);

      if (!isAlreadyRelease) {
        if (song.id && !seenSingleIds.has(song.id)) {
          seenSingleIds.add(song.id);
          singlesRaw.push({
            id: song.id,
            title: cleanedSongTitle,
            channelTitle: song.channelTitle || profile.title,
            thumbnailUrl: song.thumbnailUrl,
            releaseType: 'Single',
            origin: 'youtube',
            type: 'music',
            duration: song.duration || '3:00',
            isExplicit: song.isExplicit || false
          });
        }
      }
    }

    const filteredTopSongs = filterReleasesForArtist(decodedId, topSongs);
    const filteredAlbumsRaw = filterReleasesForArtist(decodedId, albumsRaw);
    const filteredSinglesRaw = filterReleasesForArtist(decodedId, singlesRaw);

    const albums = sortReleasesNewestToOldest(filteredAlbumsRaw);
    const singles = sortReleasesNewestToOldest(filteredSinglesRaw);

    const seenIds = new Set<string>();
    const allPlaylists = sortReleasesNewestToOldest(
      [...albums, ...singles].filter(item => {
        if (!item.id || seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      })
    );

    const relatedArtists = (relatedRes.body.artists || [])
      .filter((item: any) => !isLowQualityChannel(item.name))
      .map((item: any) => ({
        id: item.id,
        title: cleanArtistName(item.name),
        thumbnailUrl: item.images?.[0]?.url || item.images?.[1]?.url || '',
        type: 'channel',
        origin: 'spotify'
      }));

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
      topSongs: filteredTopSongs,
      albums,
      singles,
      allPlaylists,
      featuredPlaylists: [],
      relatedArtists
    }));
  } catch (error) {
    console.error('[Artist API] Spotify failed, triggering YouTube artist fallback:', error);
    return await runYoutubeChannelFallback(queryArtistId, queryName, decodedId);
  }
}

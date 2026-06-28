export function cleanArtistName(name: string): string {
  if (!name) return '';
  let cleaned = name.replace(/\s*[-–—]\s*(?:Album|Single|EP)\s+by\s+.+$/i, '');
  cleaned = cleaned.replace(/\s*[-–—]\s*(?:Album|Single|EP)\s*$/i, '');
  cleaned = cleaned.replace(/\s*[-–—]\s*Topic\s*$/i, '');
  cleaned = cleaned.replace(/VEVO\s*$/i, '');
  cleaned = cleaned.replace(/\s*VEVO\s*$/i, '');
  return cleaned.trim();
}

export function isJunkArtistOrChannel(name: string): boolean {
  if (!name) return true;
  const lower = name.toLowerCase();
  return lower.includes('unknown artist') || 
         lower.includes('various artists') || 
         lower.includes('placeholder') || 
         lower.trim() === 'music' || 
         lower.trim() === 'artist';
}

export function upgradeThumbnailUrl(url: string, targetSize = 1000): string {
  if (!url) return '';
  let upgraded = url;
  
  // Replace =wXXX-hXXX with =wTARGET-hTARGET
  upgraded = upgraded.replace(/=w\d+-h\d+/, `=w${targetSize}-h${targetSize}`);
  // Replace =sXXX with =sTARGET
  upgraded = upgraded.replace(/=s\d+/, `=s${targetSize}`);
  
  // Upgrade standard ytimg.com thumbnails safely without producing sdhqdefault.jpg
  if (upgraded.includes('ytimg.com')) {
    upgraded = upgraded.replace(/\/(default|mqdefault|hqdefault|sddefault|maxresdefault)\.jpg/, '/hqdefault.jpg');
  }
  
  return upgraded;
}

export function parseSubscriberCount(subStr: string): string {
  if (!subStr) return '0';
  const clean = subStr.replace(/\s+/g, '').toUpperCase();
  const match = clean.match(/([\d,.]+)([KM]?)/);
  if (!match) return '0';
  
  const numStr = match[1].replace(/,/g, '');
  const val = parseFloat(numStr);
  const suffix = match[2];
  
  if (isNaN(val)) return '0';
  
  let multiplier = 1;
  if (suffix === 'K') multiplier = 1000;
  else if (suffix === 'M') multiplier = 1000000;
  
  return Math.round(val * multiplier).toString();
}

export function cleanTopicGlobally<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'string') {
    let cleaned = obj.replace(/\s*[-–—]\s*Topic\s*$/i, '');
    cleaned = cleaned.replace(/VEVO\s*$/i, '');
    cleaned = cleaned.replace(/\s*VEVO\s*$/i, '');
    return cleaned.trim() as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanTopicGlobally(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = cleanTopicGlobally((obj as any)[key]);
    }
    return cleaned as T;
  }
  return obj;
}

export function parseTrackSubtitle(subtitleRuns: any[], itemTitle?: string) {
  let artistName = 'Unknown Artist';
  let artistId = '';
  
  if (!subtitleRuns || subtitleRuns.length === 0) {
    return { artistName, artistId };
  }

  // Filter out dot dividers
  const textRuns = subtitleRuns.filter((r: any) => r?.text && r.text !== ' • ' && r.text.trim() !== '•');
  if (textRuns.length === 0) return { artistName, artistId };

  const firstText = textRuns[0].text.toLowerCase();
  const isTypeLabel = ['song', 'video', 'album', 'single', 'ep', 'playlist'].includes(firstText);
  const startIndex = isTypeLabel ? 1 : 0;

  const collectedArtists: string[] = [];
  let primaryArtistId = '';

  for (let i = startIndex; i < textRuns.length; i++) {
    const run = textRuns[i];
    const text = run.text.trim();
    const lowerText = text.toLowerCase();
    
    // Stop if we hit views, duration, year, or release indicators
    if (
      lowerText.includes('views') || 
      lowerText.includes('plays') || 
      /^\d{4}$/.test(text) || 
      /^\d+:\d+$/.test(text)
    ) {
      break;
    }

    const runBrowseId = run.navigationEndpoint?.browseEndpoint?.browseId || '';
    if (runBrowseId.startsWith('MPRE') || runBrowseId.startsWith('FEmusic_release')) {
      break;
    }

    if (text && text !== ',' && text !== '&' && text.toLowerCase() !== 'and') {
      collectedArtists.push(text);
      if (!primaryArtistId && runBrowseId) {
        primaryArtistId = runBrowseId;
      }
    }
  }

  if (collectedArtists.length > 0) {
    artistName = collectedArtists.join(', ');
    artistId = primaryArtistId;
  }

  // Pull features from the item title if provided, and merge them!
  if (itemTitle) {
    const featRegex = /\s*[([{-]?(?:feat|featuring|ft|with|w\/)\.?\s+([^)\]}]+)[)\]}]?/i;
    const match = itemTitle.match(featRegex);
    if (match) {
      const featString = match[1].trim();
      const titleFeatArtists = featString
        .split(/,|\s+&\s+|\s+and\s+/i)
        .map(name => name.trim())
        .filter(Boolean);
        
      const existingArtists = artistName
        .split(/,|\s+&\s+|\s+and\s+/i)
        .map(name => name.trim().toLowerCase());
        
      const newFeats = titleFeatArtists.filter(fa => !existingArtists.includes(fa.toLowerCase()));
      if (newFeats.length > 0) {
        if (artistName === 'Unknown Artist') {
          artistName = newFeats.join(', ');
        } else {
          artistName = artistName + ', ' + newFeats.join(', ');
        }
      }
    }
  }

  return { 
    artistName: cleanArtistName(artistName), 
    artistId 
  };
}

export function isLikelyShortOrJunk(item: any): boolean {
  if (!item) return true;
  const title = (item.title || item.name || '').toString().toLowerCase();
  if (title.includes('#shorts') || title.includes('shorts')) return true;
  const duration = item.duration || item.lengthSeconds || item.durationSeconds || 0;
  if (typeof duration === 'string' && duration.includes(':')) {
    // convert mm:ss to seconds
    const parts = duration.split(':').map((p: string) => parseInt(p, 10));
    if (parts.length === 2) {
      const secs = parts[0] * 60 + parts[1];
      if (secs > 0 && secs < 60) return true;
    }
  } else if (typeof duration === 'number' && duration > 0 && duration < 60) {
    return true;
  }

  const channel = (item.channelTitle || item.author || '').toString().toLowerCase();
  if (channel.includes('various artists') || channel.includes('unknown artist') || channel.trim() === '') return true;
  return false;
}

export async function fetchYTMusic(endpoint: string, body: any) {
  const url = `https://music.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'WEB_REMIX',
          clientVersion: '1.20230508.00.00'
        }
      },
      ...body
    })
  });
  if (!res.ok) throw new Error('YouTube Music API failed');
  return res.json();
}

function parseExplicitBadge(badges: any[] = []): boolean {
  if (!badges) return false;
  return badges.some((b: any) => 
    b?.musicInlineBadgeRenderer?.icon?.iconType === 'MUSIC_EXPLICIT_BADGE'
  );
}

export async function ytMusicSearch(query: string, params?: string) {
  const data = await fetchYTMusic('search', { query, params });
  
  let topResult: any = null;
  const songs: any[] = [];
  const videos: any[] = [];
  const artists: any[] = [];
  const albums: any[] = [];
  const communityPlaylists: any[] = [];

  const extractThumbnail = (item: any) => {
    const thumbs = item?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || item?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails;
    if (!thumbs) return '';
    return upgradeThumbnailUrl(thumbs[thumbs.length - 1]?.url || thumbs[0]?.url || '');
  };

  const traverse = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;

    // Parse the hero "Top Result" card
    if (obj.musicCardShelfRenderer && !topResult) {
      const card = obj.musicCardShelfRenderer;
      const title = card.title?.runs?.[0]?.text;
      const browseId = card.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
      const subtitleRuns = card.subtitle?.runs || [];
      const subtitleType = subtitleRuns[0]?.text?.toLowerCase() || '';
      const subtitleInfo = subtitleRuns.slice(2).map((r: any) => r.text).join('');

      const thumbs = card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
      const thumbnailUrl = upgradeThumbnailUrl(thumbs[thumbs.length - 1]?.url || thumbs[0]?.url || '');

      if (title && browseId) {
        topResult = {
          id: browseId,
          title: cleanArtistName(title),
          channelTitle: subtitleType === 'artist' ? 'Artist' : cleanArtistName(subtitleInfo),
          thumbnailUrl,
          type: subtitleType === 'artist' ? 'channel' : subtitleType === 'song' ? 'music' : subtitleType === 'album' ? 'playlist' : 'channel',
          origin: 'youtube',
          channelId: browseId,
          resultType: subtitleType,
          subtitle: cleanArtistName(subtitleInfo)
        };
      }
    }
    
    // Look for MusicResponsiveListItemRenderer
    if (obj.musicResponsiveListItemRenderer) {
      const item = obj.musicResponsiveListItemRenderer;
      const flexColumns = item.flexColumns || [];
      const titleRun = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0];
      const subtitleRuns = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
      
      const title = titleRun?.text;
      const id = item.playlistItemData?.videoId || titleRun?.navigationEndpoint?.watchEndpoint?.videoId;
      const browseId = item.navigationEndpoint?.browseEndpoint?.browseId || titleRun?.navigationEndpoint?.browseEndpoint?.browseId;
      const typeText = subtitleRuns[0]?.text?.toLowerCase() || '';

      const isExplicit = parseExplicitBadge(item.badges);

      if (title) {
        if (typeText === 'song') {
          const { artistName, artistId: subArtistId } = parseTrackSubtitle(subtitleRuns, title);
          const durationRun = subtitleRuns.find((r: any) => r?.text && /^\d+:\d{1,2}$/.test(r.text.trim()));
          const durationStr = durationRun ? durationRun.text.trim() : '3:00';
          
          const albumRun = subtitleRuns.find((r: any) => {
            const bId = r.navigationEndpoint?.browseEndpoint?.browseId || '';
            return bId.startsWith('MPRE') || bId.startsWith('FEmusic_release');
          });
          const albumName = albumRun ? albumRun.text : null;
          const albumId = albumRun ? albumRun.navigationEndpoint?.browseEndpoint?.browseId : null;

          songs.push({
            id: id || browseId,
            title: cleanArtistName(title),
            channelTitle: artistName,
            thumbnailUrl: extractThumbnail(item),
            publishedAt: new Date().toISOString(),
            type: 'music',
            origin: 'youtube',
            channelId: subArtistId || '',
            duration: durationStr,
            isExplicit,
            albumName,
            albumId
          });
        } else if (typeText === 'video') {
          const { artistName, artistId: subArtistId } = parseTrackSubtitle(subtitleRuns, title);
          const durationRun = subtitleRuns.find((r: any) => r?.text && /^\d+:\d{1,2}$/.test(r.text.trim()));
          const durationStr = durationRun ? durationRun.text.trim() : '3:00';
          
          // Filter videos to fit within normal song length (between 1 and 8 minutes)
          const parts = durationStr.split(':');
          const durationSecs = parts.length === 2 
            ? parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
            : parts.length === 3 
              ? parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10)
              : 180;
              
          const lowercaseTitle = title.toLowerCase();
          const isCinematicOrSkit = /\b(cinematic|skit|movie|film|trailer|teaser|behind\s+the\s+scenes|bts|documentary|intro|outro)\b/i.test(lowercaseTitle);
          
          if (durationSecs >= 60 && durationSecs <= 480 && !isCinematicOrSkit) {
            videos.push({
              id: id || browseId,
              title: cleanArtistName(title),
              channelTitle: artistName,
              thumbnailUrl: extractThumbnail(item),
              publishedAt: new Date().toISOString(),
              type: 'video',
              origin: 'youtube',
              channelId: subArtistId || '',
              views: subtitleRuns.length > 4 ? subtitleRuns[4]?.text : undefined,
              duration: durationStr,
              isExplicit
            });
          }
        } else if (typeText === 'artist') {
          artists.push({
            id: browseId,
            title: cleanArtistName(title),
            channelTitle: 'Artist',
            thumbnailUrl: extractThumbnail(item),
            subtitle: subtitleRuns.length > 2 ? subtitleRuns[2]?.text : '',
            publishedAt: new Date().toISOString(),
            type: 'channel',
            origin: 'youtube',
            channelId: browseId
          });
        } else if (typeText === 'album' || typeText === 'ep' || typeText === 'single') {
          const { artistName, artistId: subArtistId } = parseTrackSubtitle(subtitleRuns, title);
          albums.push({
            id: browseId,
            title: cleanArtistName(title),
            channelTitle: artistName,
            thumbnailUrl: extractThumbnail(item),
            publishedAt: subtitleRuns[subtitleRuns.length - 1]?.text || new Date().toISOString(),
            type: 'playlist',
            releaseType: subtitleRuns[0]?.text || 'Album',
            origin: 'youtube',
            channelId: subArtistId || '',
            isExplicit
          });
        } else if (typeText === 'playlist') {
          const { artistName, artistId: subArtistId } = parseTrackSubtitle(subtitleRuns, title);
          communityPlaylists.push({
            id: browseId,
            title: cleanArtistName(title),
            channelTitle: artistName,
            thumbnailUrl: extractThumbnail(item),
            publishedAt: new Date().toISOString(),
            type: 'playlist',
            origin: 'youtube',
            channelId: subArtistId || '',
          });
        }
      }
    }
    
    // Recursively traverse
    for (const key of Object.keys(obj)) {
      traverse(obj[key]);
    }
  };

  traverse(data);

  return {
    topResult: topResult && isJunkArtistOrChannel(topResult.title) ? null : topResult,
    songs: songs.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i && !isJunkArtistOrChannel(v.channelTitle)),
    videos: videos.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i && !isJunkArtistOrChannel(v.channelTitle)),
    artists: artists.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i && !isJunkArtistOrChannel(v.title)),
    albums: albums.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i && !isJunkArtistOrChannel(v.channelTitle)),
    communityPlaylists: communityPlaylists.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i),
  };
}

export async function ytMusicBrowse(browseId: string) {
  const data = await fetchYTMusic('browse', { browseId });
  return data;
}

export async function ytMusicArtistDiscography(artistId: string) {
  const data = await fetchYTMusic('browse', { browseId: artistId });
  
  const topSongs: any[] = [];
  const albums: any[] = [];
  const singles: any[] = [];
  const featuredPlaylists: any[] = [];
  
  const extractThumbnail = (item: any) => {
    const thumbs = item?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || item?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails;
    if (!thumbs) return '';
    return upgradeThumbnailUrl(thumbs[thumbs.length - 1]?.url || thumbs[0]?.url || '');
  };

  const processItems = (itemsToProcess: any[], targetArray: any[], type: string) => {
    for (const rawItem of itemsToProcess) {
      const item = rawItem.musicTwoRowItemRenderer || rawItem.musicResponsiveListItemRenderer;
      if (!item) continue;
      
      const isResponsive = !!rawItem.musicResponsiveListItemRenderer;
      
      const titleRun = isResponsive 
        ? item.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]
        : item.title?.runs?.[0];
        
      const subtitleRuns = isResponsive
        ? item.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []
        : item.subtitle?.runs || [];
      
      const title = titleRun?.text;
      const id = isResponsive
        ? (item.playlistItemData?.videoId || titleRun?.navigationEndpoint?.watchEndpoint?.videoId || item.navigationEndpoint?.watchEndpoint?.videoId)
        : (item.navigationEndpoint?.browseEndpoint?.browseId || item.playlistItemData?.videoId || titleRun?.navigationEndpoint?.watchEndpoint?.videoId);
        
      const isExplicit = parseExplicitBadge(item.subtitleBadges || item.badges);
      
      if (title && id) {
        const { artistName, artistId: subArtistId } = parseTrackSubtitle(subtitleRuns, title);
        
        const lowerTitle = title.toLowerCase();
        let releaseType = 'Album';
        if (artistName.toLowerCase() === 'youtube music' || artistName.toLowerCase() === 'youtube') {
          releaseType = 'Playlist';
        } else if (lowerTitle.includes('(single)') || lowerTitle.includes(' - single')) {
          releaseType = 'Single';
        } else if (lowerTitle.includes('(ep)') || lowerTitle.includes(' - ep')) {
          releaseType = 'EP';
        } else {
          for (const run of subtitleRuns) {
            if (run && run.text) {
              const textLower = run.text.toLowerCase();
              if (textLower === 'single') releaseType = 'Single';
              else if (textLower === 'ep') releaseType = 'EP';
              else if (textLower === 'album') releaseType = 'Album';
            }
          }
        }

        // Dynamically route items to correct list based on parsed releaseType
        let destinationArray = targetArray;
        if (type === 'playlist') {
          if (releaseType === 'Playlist') {
            destinationArray = featuredPlaylists;
          } else if (releaseType === 'Single' || releaseType === 'EP') {
            destinationArray = singles;
          } else {
            destinationArray = albums;
          }
        }

        destinationArray.push({
          id,
          title: cleanArtistName(title),
          channelTitle: artistName,
          thumbnailUrl: extractThumbnail(item),
          publishedAt: subtitleRuns[subtitleRuns.length - 1]?.text || new Date().toISOString(),
          type,
          origin: 'youtube',
          channelId: subArtistId || artistId,
          isExplicit,
          releaseType
        });
      }
    }
  };

  let moreSongsBrowseId = '';

  const processCarousel = async (carousel: any) => {
    const headerTitle = carousel?.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text?.toLowerCase() || '';
    const moreBrowseId = carousel?.header?.musicCarouselShelfBasicHeaderRenderer?.moreContentButton?.buttonRenderer?.navigationEndpoint?.browseEndpoint?.browseId;

    if (headerTitle.includes('song')) {
      if (moreBrowseId) {
        moreSongsBrowseId = moreBrowseId;
      }
      processItems(carousel.contents || [], topSongs, 'music');
    } else if (headerTitle.includes('album')) {
      processItems(carousel.contents || [], albums, 'playlist');
      if (moreBrowseId) {
        try {
          const moreData = await ytMusicBrowse(moreBrowseId);
          const listItems: any[] = [];
          const traverseItems = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.musicTwoRowItemRenderer || obj.musicResponsiveListItemRenderer) {
              listItems.push(obj);
            } else {
              for (const key of Object.keys(obj)) {
                traverseItems(obj[key]);
              }
            }
          };
          traverseItems(moreData);
          processItems(listItems, albums, 'playlist');
        } catch (err) {
          console.error('[Discography] Failed to load more albums:', err);
        }
      }
    } else if (headerTitle.includes('single') || headerTitle.includes('ep')) {
      processItems(carousel.contents || [], singles, 'playlist');
      if (moreBrowseId) {
        try {
          const moreData = await ytMusicBrowse(moreBrowseId);
          const listItems: any[] = [];
          const traverseItems = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.musicTwoRowItemRenderer || obj.musicResponsiveListItemRenderer) {
              listItems.push(obj);
            } else {
              for (const key of Object.keys(obj)) {
                traverseItems(obj[key]);
              }
            }
          };
          traverseItems(moreData);
          processItems(listItems, singles, 'playlist');
        } catch (err) {
          console.error('[Discography] Failed to load more singles:', err);
        }
      }
    } else if (headerTitle.includes('featured on') || headerTitle.includes('appears on') || headerTitle.includes('collaboration')) {
      processItems(carousel.contents || [], albums, 'playlist');
      if (moreBrowseId) {
        try {
          const moreData = await ytMusicBrowse(moreBrowseId);
          const listItems: any[] = [];
          const traverseItems = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.musicTwoRowItemRenderer || obj.musicResponsiveListItemRenderer) {
              listItems.push(obj);
            } else {
              for (const key of Object.keys(obj)) {
                traverseItems(obj[key]);
              }
            }
          };
          traverseItems(moreData);
          processItems(listItems, albums, 'playlist');
        } catch (err) {
          console.error('[Discography] Failed to load more featured releases:', err);
        }
      }
    }
  };

  const processShelf = async (shelf: any) => {
    const titleText = shelf?.title?.runs?.[0]?.text?.toLowerCase() || '';
    const bottomBrowseId = shelf?.bottomEndpoint?.browseEndpoint?.browseId;
    
    if (titleText.includes('song')) {
      if (bottomBrowseId) {
        moreSongsBrowseId = bottomBrowseId;
      }
      processItems(shelf.contents || [], topSongs, 'music');
    } else if (titleText.includes('album')) {
      processItems(shelf.contents || [], albums, 'playlist');
      if (bottomBrowseId) {
        try {
          const moreData = await ytMusicBrowse(bottomBrowseId);
          const listItems: any[] = [];
          const traverseItems = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.musicTwoRowItemRenderer || obj.musicResponsiveListItemRenderer) {
              listItems.push(obj);
            } else {
              for (const key of Object.keys(obj)) {
                traverseItems(obj[key]);
              }
            }
          };
          traverseItems(moreData);
          processItems(listItems, albums, 'playlist');
        } catch (err) {
          console.error('[Discography] Failed to load more albums from shelf:', err);
        }
      }
    } else if (titleText.includes('single') || titleText.includes('ep')) {
      processItems(shelf.contents || [], singles, 'playlist');
      if (bottomBrowseId) {
        try {
          const moreData = await ytMusicBrowse(bottomBrowseId);
          const listItems: any[] = [];
          const traverseItems = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.musicTwoRowItemRenderer || obj.musicResponsiveListItemRenderer) {
              listItems.push(obj);
            } else {
              for (const key of Object.keys(obj)) {
                traverseItems(obj[key]);
              }
            }
          };
          traverseItems(moreData);
          processItems(listItems, singles, 'playlist');
        } catch (err) {
          console.error('[Discography] Failed to load more singles from shelf:', err);
        }
      }
    } else if (titleText.includes('featured on') || titleText.includes('appears on') || titleText.includes('collaboration')) {
      processItems(shelf.contents || [], albums, 'playlist');
      if (bottomBrowseId) {
        try {
          const moreData = await ytMusicBrowse(bottomBrowseId);
          const listItems: any[] = [];
          const traverseItems = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.musicTwoRowItemRenderer || obj.musicResponsiveListItemRenderer) {
              listItems.push(obj);
            } else {
              for (const key of Object.keys(obj)) {
                traverseItems(obj[key]);
              }
            }
          };
          traverseItems(moreData);
          processItems(listItems, albums, 'playlist');
        } catch (err) {
          console.error('[Discography] Failed to load more featured releases from shelf:', err);
        }
      }
    }
  };

  const traverse = async (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.musicCarouselShelfRenderer) {
      await processCarousel(obj.musicCarouselShelfRenderer);
    } else if (obj.musicShelfRenderer) {
      await processShelf(obj.musicShelfRenderer);
    }
    for (const key of Object.keys(obj)) {
      await traverse(obj[key]);
    }
  };

  await traverse(data);

  // If there is a "Show all" / "More" playlist of top songs, load all of them
  if (moreSongsBrowseId) {
    try {
      console.log(`[Discography] Fetching more popular tracks from playlist: ${moreSongsBrowseId}`);
      const moreSongsData = await ytMusicBrowse(moreSongsBrowseId);
      const playlistTracks: any[] = [];
      
      const traverseTracks = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj.musicResponsiveListItemRenderer) {
          playlistTracks.push(obj);
        } else {
          for (const key of Object.keys(obj)) {
            traverseTracks(obj[key]);
          }
        }
      };
      traverseTracks(moreSongsData);
      
      if (playlistTracks.length > 0) {
        // Clear topSongs and populate with all the tracks from the playlist
        topSongs.length = 0;
        processItems(playlistTracks, topSongs, 'music');
        console.log(`[Discography] Successfully loaded ${topSongs.length} popular tracks`);
      }
    } catch (err) {
      console.error('[Discography] Failed to load popular tracks playlist:', err);
    }
  }

  return { topSongs, albums, singles, featuredPlaylists };
}

export async function getYTMusicLyricsBrowseId(videoId: string): Promise<string | null> {
  try {
    const nextData = await fetchYTMusic('next', { videoId });
    const tabs = nextData?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs;
    if (tabs) {
      for (const tab of tabs) {
        const tabRenderer = tab.tabRenderer;
        const title = tabRenderer?.title?.toString() || '';
        const browseId = tabRenderer?.endpoint?.browseEndpoint?.browseId;
        if (browseId && (title.toLowerCase() === 'lyrics' || browseId.startsWith('MPLY'))) {
          return browseId;
        }
      }
    }
  } catch (err) {
    console.error('Failed to get YouTube Music lyrics browse ID:', err);
  }
  return null;
}

export async function getYTMusicLyrics(browseId: string): Promise<string | null> {
  try {
    const browseData = await fetchYTMusic('browse', { browseId });
    const shelf = browseData.contents?.sectionListRenderer?.contents?.[0]?.musicDescriptionShelfRenderer;
    if (shelf) {
      const descriptionText = shelf.description?.runs?.[0]?.text;
      const footerText = shelf.footer?.runs?.[0]?.text;
      if (descriptionText) {
        if (footerText) {
          return `${descriptionText}\n\n${footerText}`;
        }
        return descriptionText;
      }
    }
  } catch (err) {
    console.error('Failed to fetch YouTube Music lyrics:', err);
  }
  return null;
}

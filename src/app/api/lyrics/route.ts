import { NextResponse } from 'next/server';
import { getYTMusicLyricsBrowseId, getYTMusicLyrics, ytMusicSearch } from '@/lib/youtubei';
import { isCorrectMatch, isArtistMatch } from '@/lib/match-utils';

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

async function getGeniusAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiresAt) return cachedAccessToken;

  const clientId = process.env.GENIUS_CLIENT_ID;
  const clientSecret = process.env.GENIUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    const res = await fetch('https://api.genius.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (res.ok) {
      const data = await res.json();
      cachedAccessToken = data.access_token;
      // Refresh 10 minutes before expiry (default Genius token lifetime is ~60 min)
      tokenExpiresAt = Date.now() + 50 * 60 * 1000;
      return cachedAccessToken;
    }
  } catch (err) {
    console.error("Error authenticating with Genius:", err);
  }
  return null;
}


// Scrape Genius Web Page
async function fetchLyricsFromGenius(artist: string, title: string): Promise<string | null> {
  const token = await getGeniusAccessToken();
  if (!token) return null;

  try {
    const query = `${artist} ${title}`;
    const searchRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const hits = searchData.response?.hits || [];
    if (hits.length === 0) return null;

    // Filter hits by title and artist match
    const matchedHit = hits.find((h: any) =>
      h.result &&
      isCorrectMatch(title, h.result.title) &&
      isArtistMatch(artist, h.result.primary_artist?.name)
    );

    if (!matchedHit) {
      console.log(`[Genius Lyrics] No verified match for "${artist} - ${title}" in search hits.`);
      return null;
    }

    const bestSong = matchedHit.result;
    const songUrl = bestSong?.url;
    if (!songUrl) return null;

    const pageRes = await fetch(songUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    const containerRegex = /<div[^>]*data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    let lyricsHTML = '';
    while ((match = containerRegex.exec(html)) !== null) {
      lyricsHTML += match[1] + '\n';
    }

    if (!lyricsHTML) {
      const oldRegex = /<div class="lyrics">([\s\S]*?)<\/div>/;
      const oldMatch = html.match(oldRegex);
      if (oldMatch) lyricsHTML = oldMatch[1];
    }

    if (lyricsHTML) {
      let cleaned = lyricsHTML
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'")
        .trim();

      // Remove contributors and trailing credits
      cleaned = cleaned
        .replace(/^\d+\s*Contributors[\s\S]*?(?=\n|\[)/i, '')
        .replace(/You might also like$/i, '')
        .trim();

      return cleaned;
    }
  } catch (err) {
    console.error("Failed scraping lyrics from Genius:", err);
  }
  return null;
}

// LRC Time Parser helper
function parseLrc(lrcText: string): { text: string; time: number }[] {
  const lines = lrcText.split('\n');
  const result: { text: string; time: number }[] = [];

  // Format: [01:23.45] lyric text or [01:23.456]
  const timeRegex = /^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      result.push({ text: '', time: -999 });
      continue;
    }

    const match = trimmed.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const msStr = match[3] || '0';
      const milliseconds = parseInt(msStr, 10);

      const fractionalPart = milliseconds / Math.pow(10, msStr.length);
      const totalSeconds = minutes * 60 + seconds + fractionalPart;
      const text = match[4].trim();

      result.push({ text, time: Math.round(totalSeconds * 10) / 10 });
    } else {
      // Ignore LRC header metadata like [ar: Travis Scott]
      if (trimmed.startsWith('[') && trimmed.includes(':') && trimmed.endsWith(']')) {
        continue;
      }
      result.push({ text: trimmed, time: -999 });
    }
  }
  return result;
}

async function fetchOfficialYTMusicLyrics(videoId: string, title: string, artist: string): Promise<string | null> {
  // If we have a videoId, try to get lyrics browseId directly
  if (videoId) {
    try {
      console.log(`[API Lyrics] Fetching browseId directly for videoId: ${videoId}`);
      const browseId = await getYTMusicLyricsBrowseId(videoId);
      if (browseId) {
        console.log(`[API Lyrics] Found browseId: ${browseId}`);
        const lyrics = await getYTMusicLyrics(browseId);
        if (lyrics) return lyrics;
      }
    } catch (err) {
      console.error('[API Lyrics] Failed to get lyrics directly:', err);
    }
  }

  // If directly using videoId failed or videoId was missing, search for the song on YouTube Music
  try {
    const query = `${artist} ${title}`;
    console.log(`[API Lyrics] Searching YT Music for: "${query}" to find official song...`);
    const searchData = await ytMusicSearch(query);
    const song = searchData.songs?.[0];
    if (song && song.id) {
      // Very basic sanity check: if the returned song title is completely unrelated, skip it
      const sTitle = song.title.toLowerCase();
      const qTitle = title.toLowerCase();
      // If none of the words from the requested title are in the found song title, it's likely a bad match for an unreleased song
      const queryWords = qTitle.split(/\s+/).filter(w => w.length > 2);
      const isBadMatch = queryWords.length > 0 && !queryWords.some(w => sTitle.includes(w));

      if (!isBadMatch) {
        console.log(`[API Lyrics] Found official song ID: ${song.id} ("${song.title}" by "${song.channelTitle}")`);
        const browseId = await getYTMusicLyricsBrowseId(song.id);
        if (browseId) {
          console.log(`[API Lyrics] Found browseId for searched song: ${browseId}`);
          const lyrics = await getYTMusicLyrics(browseId);
          if (lyrics) return lyrics;
        }
      }
    }
  } catch (err) {
    console.error('[API Lyrics] Failed to search or fetch lyrics from YT Music:', err);
  }
  return null;
}

const lyricsCache = new Map<string, { lyrics: string; lines: any[]; isSynced: boolean }>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Unknown Song';
    const artist = searchParams.get('artist') || 'Unknown Artist';
    const durationStr = searchParams.get('duration') || '3:00';
    const videoId = searchParams.get('videoId') || '';

    // Cache Lookup
    const cacheKey = videoId || `spotify_${artist.toLowerCase().trim()}_${title.toLowerCase().trim()}`;
    if (lyricsCache.has(cacheKey)) {
      const cached = lyricsCache.get(cacheKey)!;
      console.log(`[API Lyrics] Cache HIT for key: "${cacheKey}"`);
      return NextResponse.json(cached);
    }

    // Parse duration to seconds
    let totalSeconds = 180;
    if (durationStr && durationStr.includes(':')) {
      const parts = durationStr.split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10);
        const secs = parseInt(parts[1], 10);
        if (!isNaN(mins) && !isNaN(secs)) {
          totalSeconds = mins * 60 + secs;
        }
      }
    }

    const cleanTitle = title
      .replace(/\([^)]*(feat|ft|with|prod|video|audio|visualizer|lyric|explicit|clean|leak)[^)]*\)/gi, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/-.*(remix|edit|mix|video|audio|explicit|clean).*/gi, '')
      .replace(/\b(official|music video|audio|visualizer|explicit|leak)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanArtist = artist.replace(/ - Topic/g, '').trim();

    let lyricsText = '';
    let syncedLines: { text: string; time: number }[] = [];
    let isSynced = false;

    // --- LAYER 1: LRCLIB EXACT GET ---
    try {
      const lrcGetUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
      const lrcRes = await fetch(lrcGetUrl, {
        headers: {
          'User-Agent': 'CloudMusic/1.0.0 (https://github.com/better-lyrics/better-lyrics)'
        }
      });

      if (lrcRes.ok) {
        const lrcData = await lrcRes.json();
        if (lrcData.syncedLyrics) {
          syncedLines = parseLrc(lrcData.syncedLyrics);
          lyricsText = lrcData.syncedLyrics;
          isSynced = true;
          console.log('[API Lyrics] Successfully fetched synced lyrics from LRCLIB EXACT GET!');
        } else if (lrcData.plainLyrics) {
          lyricsText = lrcData.plainLyrics;
        }
      }
    } catch (err) {
      console.error("LRCLIB direct fetch error:", err);
    }

    // --- LAYER 2: LRCLIB SEARCH QUERY ---
    if (!isSynced) {
      try {
        const query = `${cleanArtist} ${cleanTitle}`;
        const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'User-Agent': 'CloudMusic/1.0.0 (https://github.com/better-lyrics/better-lyrics)'
          }
        });

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData && searchData.length > 0) {
            // Prefer an item that has syncedLyrics
            const bestMatch = searchData.find((item: any) => item.syncedLyrics) || searchData[0];
            if (bestMatch.syncedLyrics) {
              syncedLines = parseLrc(bestMatch.syncedLyrics);
              lyricsText = bestMatch.syncedLyrics;
              isSynced = true;
              console.log('[API Lyrics] Successfully fetched synced lyrics from LRCLIB SEARCH QUERY!');
            } else if (bestMatch.plainLyrics && !lyricsText) {
              lyricsText = bestMatch.plainLyrics;
            }
          }
        }
      } catch (err) {
        console.error("LRCLIB query search error:", err);
      }
    }

    // --- LAYER 3: OFFICIAL YOUTUBE MUSIC LYRICS FALLBACK ---
    if (!lyricsText) {
      try {
        const ytLyrics = await fetchOfficialYTMusicLyrics(videoId, cleanTitle, cleanArtist);
        if (ytLyrics) {
          lyricsText = ytLyrics;
          console.log('[API Lyrics] Successfully fetched fallback lyrics from YouTube Music API!');
        }
      } catch (err) {
        console.error('[API Lyrics] Error in YouTube Music lyrics fetch layer:', err);
      }
    }

    // --- LAYER 4: GENIUS WEB SCRAPER FALLBACK ---
    if (!lyricsText) {
      const geniusText = await fetchLyricsFromGenius(cleanArtist, cleanTitle);
      if (geniusText) {
        lyricsText = geniusText;
        console.log('[API Lyrics] Successfully fetched fallback lyrics from Genius!');
      }
    }

    // --- LAYER 4: NO TEMPLATE STATIC FALLBACK (Disabled per user request) ---
    if (!lyricsText) {
      return NextResponse.json({
        lyrics: '',
        lines: []
      });
    }

    // If lyrics are found but not synced yet, distribute them evenly across duration
    if (!isSynced && lyricsText) {
      const rawLines = lyricsText.split('\n');
      const nonSpacerLines = rawLines.filter(l => l.trim().length > 0);
      const totalLinesCount = nonSpacerLines.length;

      const startOffset = 2; // seconds
      const endOffset = totalSeconds * 0.92;
      const interval = (endOffset - startOffset) / Math.max(totalLinesCount - 1, 1);

      let currentIndex = 0;
      syncedLines = rawLines.map((lineText) => {
        const trimmed = lineText.trim();
        if (trimmed.length === 0) {
          return { text: '', time: -999 };
        }

        const timeStamp = Math.round((startOffset + currentIndex * interval) * 10) / 10;
        currentIndex++;

        return {
          text: lineText,
          time: timeStamp
        };
      });
    }

    const result = {
      lyrics: lyricsText,
      lines: syncedLines,
      isSynced: isSynced
    };

    if (lyricsText) {
      if (lyricsCache.size > 200) {
        lyricsCache.clear();
      }
      // Populate cache
      lyricsCache.set(cacheKey, result);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Unified Lyrics Endpoint Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

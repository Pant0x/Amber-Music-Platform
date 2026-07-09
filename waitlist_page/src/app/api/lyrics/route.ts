import { NextResponse } from 'next/server';

let cachedAccessToken: string | null = null;

async function getGeniusAccessToken() {
  if (cachedAccessToken) return cachedAccessToken;

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

    const bestSong = hits[0].result;
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
      if (trimmed.startsWith('[') && trimmed.includes(':') && trimmed.endsWith(']')) {
        continue;
      }
      result.push({ text: trimmed, time: -999 });
    }
  }
  return result;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Unknown Song';
    const artist = searchParams.get('artist') || 'Unknown Artist';
    const durationStr = searchParams.get('duration') || '3:00';

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
      .replace(/\(feat\.?[^\)]*\)/gi, '')
      .replace(/\(with[^\)]*\)/gi, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/- Remix/gi, '')
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
          'User-Agent': 'PantootyMusicPlayer/1.0.0 (https://github.com/better-lyrics/better-lyrics)'
        }
      });
      
      if (lrcRes.ok) {
        const lrcData = await lrcRes.json();
        if (lrcData.syncedLyrics) {
          syncedLines = parseLrc(lrcData.syncedLyrics);
          lyricsText = lrcData.syncedLyrics;
          isSynced = true;
        } else if (lrcData.plainLyrics) {
          lyricsText = lrcData.plainLyrics;
        }
      }
    } catch (err) {
      console.error("LRCLIB direct fetch error:", err);
    }

    // --- LAYER 2: LRCLIB SEARCH QUERY ---
    if (!lyricsText) {
      try {
        const query = `${cleanArtist} ${cleanTitle}`;
        const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'User-Agent': 'PantootyMusicPlayer/1.0.0 (https://github.com/better-lyrics/better-lyrics)'
          }
        });
        
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData && searchData.length > 0) {
            const bestMatch = searchData[0];
            if (bestMatch.syncedLyrics) {
              syncedLines = parseLrc(bestMatch.syncedLyrics);
              lyricsText = bestMatch.syncedLyrics;
              isSynced = true;
            } else if (bestMatch.plainLyrics) {
              lyricsText = bestMatch.plainLyrics;
            }
          }
        }
      } catch (err) {
        console.error("LRCLIB query search error:", err);
      }
    }

    // --- LAYER 3: GENIUS WEB SCRAPER FALLBACK ---
    if (!lyricsText) {
      const geniusText = await fetchLyricsFromGenius(cleanArtist, cleanTitle);
      if (geniusText) {
        lyricsText = geniusText;
      }
    }

    if (!lyricsText) {
      return NextResponse.json({
        lyrics: '',
        lines: []
      });
    }

    if (!isSynced && lyricsText) {
      const rawLines = lyricsText.split('\n');
      const nonSpacerLines = rawLines.filter(l => l.trim().length > 0);
      const totalLinesCount = nonSpacerLines.length;

      const startOffset = 2;
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

    return NextResponse.json({
      lyrics: lyricsText,
      lines: syncedLines,
      isSynced: isSynced
    });
  } catch (error: any) {
    console.error('Waitlist Lyrics Endpoint Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

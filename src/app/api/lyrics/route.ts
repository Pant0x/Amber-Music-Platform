import { NextResponse } from 'next/server';
import { getYTMusicLyricsBrowseId, getYTMusicLyrics, ytMusicSearch } from '@/lib/youtubei';

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

function generateFallbackLyrics(title: string, artist: string) {
  const artistLower = artist.toLowerCase();
  const titleLower = title.toLowerCase();
  const lines: string[] = [];

  let genre = 'pop';
  if (
    artistLower.includes('drake') || 
    artistLower.includes('travis') || 
    artistLower.includes('yeat') || 
    artistLower.includes('carti') || 
    artistLower.includes('future') || 
    artistLower.includes('metro') ||
    titleLower.includes('mode') ||
    titleLower.includes('beat')
  ) {
    genre = 'hiphop';
  } else if (
    artistLower.includes('lofi') || 
    titleLower.includes('lofi') || 
    titleLower.includes('chill') || 
    titleLower.includes('relax') ||
    titleLower.includes('focus')
  ) {
    genre = 'lofi';
  }

  if (genre === 'hiphop') {
    lines.push(`[Intro: ${artist}]`);
    lines.push("Yeah, yeah");
    lines.push("We back in the zone, we runnin' this up");
    lines.push("");
    lines.push(`[Chorus]`);
    lines.push(`We rollin' deep through the night, yeah`);
    lines.push(`They want the fame and the light, but we keeping it tight`);
    lines.push(`This is ${title}, we doing it right`);
    lines.push(`No sleep till the morning, we setting the flight`);
    lines.push("");
    lines.push(`[Verse 1: ${artist}]`);
    lines.push(`I started in the basement, now we view the penthouse suite`);
    lines.push(`Cold winter nights, now the city at my feet`);
    lines.push(`They said I couldn't make it, now they play me on repeat`);
    lines.push(`Every single release is a statement on the street`);
    lines.push("");
    lines.push(`[Chorus]`);
    lines.push(`We rollin' deep through the night, yeah`);
    lines.push(`They want the fame and the light, but we keeping it tight`);
    lines.push("");
    lines.push(`[Verse 2]`);
    lines.push(`Late night thoughts, writing bars in the back seat`);
    lines.push(`Running up the charts, yeah, we set a new track speed`);
    lines.push(`Pantooty on the screen, music pumpin' in the scene`);
    lines.push("");
    lines.push(`[Outro]`);
    lines.push(`Yeah, run it back`);
    lines.push(`${title} on repeat`);
    lines.push(`${artist} signing out`);
  } else if (genre === 'lofi') {
    lines.push("[Ambient Rain sounds playing]");
    lines.push("[Soft Piano Chord progression starts]");
    lines.push("");
    lines.push("[Intro]");
    lines.push("Close your eyes");
    lines.push("Let the rhythm take your mind");
    lines.push("");
    lines.push("[Chorus]");
    lines.push(`Under the amber streetlights, we fade`);
    lines.push(`In this cozy little space we made`);
    lines.push(`Listening to ${title} as the hours drift away`);
    lines.push("");
    lines.push("[Verse]");
    lines.push("Raindrops tapping gently on the window glass");
    lines.push("Watching the reflections of the cars that pass");
    lines.push("Steam rising from a warm cup of tea");
    lines.push(`A perfect soundtrack for you and me`);
    lines.push("");
    lines.push("[Outro]");
    lines.push("Breathe in...");
    lines.push("Breathe out...");
  } else {
    lines.push(`[Intro: ${artist}]`);
    lines.push("Oh-oh, yeah");
    lines.push("");
    lines.push("[Chorus]");
    lines.push(`I can hear the music playing in the dark`);
    lines.push(`Every single note is like a burning spark`);
    lines.push(`With ${title}, we're gonna start a fire`);
    lines.push(`Taking it higher, our hearts' desire`);
    lines.push("");
    lines.push("[Verse 1]");
    lines.push("Walking down the crowded streets under the neon glow");
    lines.push("Looking for a sign, searching for a place to go");
    lines.push("But when this melody starts playing through my head");
    lines.push("I forget about the words that they said");
    lines.push("");
    lines.push("[Chorus]");
    lines.push(`I can hear the music playing in the dark`);
    lines.push(`With ${title}, we're gonna start a fire`);
    lines.push("");
    lines.push("[Outro]");
    lines.push("Yeah, we take it higher");
    lines.push(`This is ${title}...`);
  }

  return lines.join('\n');
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
      console.log(`[API Lyrics] Found official song ID: ${song.id} ("${song.title}" by "${song.channelTitle}")`);
      const browseId = await getYTMusicLyricsBrowseId(song.id);
      if (browseId) {
        console.log(`[API Lyrics] Found browseId for searched song: ${browseId}`);
        const lyrics = await getYTMusicLyrics(browseId);
        if (lyrics) return lyrics;
      }
    }
  } catch (err) {
    console.error('[API Lyrics] Failed to search or fetch lyrics from YT Music:', err);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Unknown Song';
    const artist = searchParams.get('artist') || 'Unknown Artist';
    const durationStr = searchParams.get('duration') || '3:00';
    const videoId = searchParams.get('videoId') || '';

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

    // Clean metadata from names
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

    // --- LAYER 0: OFFICIAL YOUTUBE MUSIC LYRICS ---
    try {
      const ytLyrics = await fetchOfficialYTMusicLyrics(videoId, cleanTitle, cleanArtist);
      if (ytLyrics) {
        lyricsText = ytLyrics;
        console.log('[API Lyrics] Successfully fetched lyrics from YouTube Music API!');
      }
    } catch (err) {
      console.error('[API Lyrics] Error in YouTube Music lyrics fetch layer:', err);
    }

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

    return NextResponse.json({
      lyrics: lyricsText,
      lines: syncedLines,
      isSynced: isSynced
    });
  } catch (error: any) {
    console.error('Unified Lyrics Endpoint Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

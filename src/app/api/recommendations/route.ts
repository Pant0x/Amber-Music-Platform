import { NextResponse } from 'next/server';
import { Track } from '@/types/music-player';
import { cleanTopicGlobally } from '@/lib/youtubei';

import ytAdapter from '@/lib/yt-music-adapter';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const history: Track[] = body.history || [];
    const searchHistory: string[] = body.searchHistory || [];
    const mood: string = body.mood || 'none';

    // 1. STAGE 1: CANDIDATE GENERATION POOLING
    const candidateMap = new Map<string, Track>();

    // Helper to query search and add to candidate map
    const fetchAndAddCandidates = async (query: string, limit: number = 10) => {
      try {
        // Prefer server-side node-youtube-music adapter when available
        const adapterRes = await ytAdapter.searchYTMusic(query).catch(() => null);
        if (adapterRes && adapterRes?.tracks?.length) {
          for (const item of adapterRes.tracks.slice(0, limit)) {
            const trackId = item?.videoId || item?.id;
            const titleLower = (item?.title || '').toLowerCase();
            const isCinematicOrVideo = titleLower.includes('music video') || titleLower.includes('director') || titleLower.includes('official video');
            if (trackId && !candidateMap.has(trackId) && !isCinematicOrVideo) {
              candidateMap.set(trackId, {
                id: trackId,
                title: item?.title || '',
                channelTitle: item?.artist || item?.channel || item?.author || '',
                thumbnailUrl: item?.thumbnail || '',
                publishedAt: item?.published || '',
                type: 'music',
                origin: 'youtube',
                channelId: item?.channelId || item?.artistId || ''
              });
            }
          }
          return;
        }

        // Fallback: use ytMusicSearch (music.youtube.com) parser defined in lib/youtubei
        const { ytMusicSearch } = await import('@/lib/youtubei');
        const fallback = await ytMusicSearch(query).catch(() => null);
        if (fallback) {
          const pool = [...(fallback.songs || []), ...(fallback.videos || [])];
          for (const item of pool.slice(0, limit)) {
            const trackId = item?.id;
            const titleLower = (item?.title || '').toLowerCase();
            const isCinematicOrVideo = titleLower.includes('music video') || titleLower.includes('director') || titleLower.includes('official video');
            if (trackId && !candidateMap.has(trackId) && !isCinematicOrVideo) {
              candidateMap.set(trackId, {
                id: trackId,
                title: item?.title || '',
                channelTitle: item?.channelTitle || item?.channel || '',
                thumbnailUrl: item?.thumbnailUrl || item?.thumbnail || '',
                publishedAt: item?.publishedAt || '',
                type: item?.type === 'video' ? 'video' : 'music',
                origin: 'youtube',
                channelId: item?.channelId || ''
              });
            }
          }
          return;
        }

        // Last-resort: do not call YouTube v3. If a YT key exists temporarily, avoid using it and log.
        console.warn('No YouTube adapter available for recommendations; skipping external YouTube v3 usage.');
      } catch (err) {
        console.error(`Candidate search failed for query "${query}":`, err);
      }
    };

    // Candidate Channel A: Selected Mood (high priority)
    if (mood && mood !== 'none') {
      let moodQuery = 'music';
      if (mood === 'focus') moodQuery = 'study lofi focus beats';
      else if (mood === 'energize') moodQuery = 'workout hype synthwave running music';
      else if (mood === 'relax') moodQuery = 'chill lofi sleep relax jazz';
      else if (mood === 'commute') moodQuery = 'happy acoustic driving roadtrip music';
      else if (mood === 'workout') moodQuery = 'gym electronic trap cardio beats';
      
      await fetchAndAddCandidates(moodQuery, 15);
    }

    // Candidate Channel B: Search History keywords
    if (searchHistory.length > 0) {
      // Fetch for the last 2 search queries
      const queriesToFetch = searchHistory.slice(-2);
      for (const query of queriesToFetch) {
        await fetchAndAddCandidates(query, 8);
      }
    }

    // Candidate Channel C: Watch History channels (recommend more from watched channels)
    if (history.length > 0) {
      // Find the unique channel names in history (last 3 items)
      const uniqueChannels = Array.from(new Set(history.slice(-3).map(t => t.channelTitle)));
      for (const ch of uniqueChannels) {
        if (ch) {
          await fetchAndAddCandidates(ch, 5);
        }
      }
    }

    // Candidate Channel D: Standard Fresh Music Chart Fallback
    // If our pool is small, inject popular music videos
    if (candidateMap.size < 15) {
      try {
        // Prefer adapter for chart/popular music when possible
        const adapterChart = await ytAdapter.searchYTMusic('popular music charts').catch(() => null);
        if (adapterChart && adapterChart?.tracks?.length) {
          for (const item of adapterChart.tracks.slice(0, 15)) {
            const trackId = item?.videoId || item?.id;
            const titleLower = (item?.title || '').toLowerCase();
            const isCinematicOrVideo = titleLower.includes('music video') || titleLower.includes('director') || titleLower.includes('official video');
            if (trackId && !candidateMap.has(trackId) && !isCinematicOrVideo) {
              candidateMap.set(trackId, {
                id: trackId,
                title: item?.title || '',
                channelTitle: item?.artist || item?.channel || '',
                thumbnailUrl: item?.thumbnail || '',
                publishedAt: item?.published || '',
                type: 'music',
                origin: 'youtube',
                channelId: item?.channelId || ''
              });
            }
          }
        } else {
          // fallback to ytMusicSearch 'chart' style query
          const { ytMusicSearch } = await import('@/lib/youtubei');
          const fallback = await ytMusicSearch('popular music').catch(() => null);
          if (fallback) {
            const pool = [...(fallback.songs || []), ...(fallback.videos || [])];
            for (const item of pool.slice(0, 15)) {
              const trackId = item?.id;
              const titleLower = (item?.title || '').toLowerCase();
              const isCinematicOrVideo = titleLower.includes('music video') || titleLower.includes('director') || titleLower.includes('official video');
              if (trackId && !candidateMap.has(trackId) && !isCinematicOrVideo) {
                candidateMap.set(trackId, {
                  id: trackId,
                  title: item?.title || '',
                  channelTitle: item?.channelTitle || item?.channel || '',
                  thumbnailUrl: item?.thumbnailUrl || item?.thumbnail || '',
                  publishedAt: item?.publishedAt || '',
                  type: item?.type === 'video' ? 'video' : 'music',
                  origin: 'youtube',
                  channelId: item?.channelId || ''
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Popular chart candidates query failed:', err);
      }
    }

    // 2. STAGE 2: RANKING SCORER
    const candidates = Array.from(candidateMap.values());
    const scoredCandidates = candidates.map(candidate => {
      let score = 0;

      // Feature A: Watch History Channel Matching
      const timesChannelWatched = history.filter(t => t.channelTitle === candidate.channelTitle).length;
      if (timesChannelWatched > 0) {
        score += Math.min(timesChannelWatched * 40, 120); // Boost up to +120 points for user favorites
      }

      // Feature B: Search History Token Matching
      searchHistory.forEach(query => {
        const queryTokens = query.toLowerCase().split(' ');
        const titleLower = candidate.title.toLowerCase();
        queryTokens.forEach(token => {
          if (token.length > 2 && titleLower.includes(token)) {
            score += 25; // Boost for keyword matching
          }
        });
      });

      // Feature C: Mood Keyword Boost
      if (mood && mood !== 'none') {
        const titleLower = candidate.title.toLowerCase();
        if (mood === 'focus' && (titleLower.includes('study') || titleLower.includes('lofi') || titleLower.includes('focus') || titleLower.includes('beats'))) {
          score += 100;
        } else if (mood === 'energize' && (titleLower.includes('hype') || titleLower.includes('workout') || titleLower.includes('cardio') || titleLower.includes('synthwave'))) {
          score += 100;
        } else if (mood === 'relax' && (titleLower.includes('chill') || titleLower.includes('sleep') || titleLower.includes('relax') || titleLower.includes('jazz'))) {
          score += 100;
        } else if (mood === 'workout' && (titleLower.includes('gym') || titleLower.includes('workout') || titleLower.includes('trap') || titleLower.includes('bass'))) {
          score += 100;
        }
      }

      // Feature D: Freshness Boost (Example Age)
      const publishDate = new Date(candidate.publishedAt).getTime();
      const ageInDays = (Date.now() - publishDate) / (1000 * 60 * 60 * 24);
      if (ageInDays < 7) {
        score += 50; // Brand new releases boost
      } else if (ageInDays < 30) {
        score += 30; // Fresh releases boost
      } else if (ageInDays < 365) {
        score += 10;
      }

      // Feature E: Recency Penalty (Deduplicate watched items)
      // Check if user watched this video very recently
      const historyIndex = history.findIndex(t => t.id === candidate.id);
      if (historyIndex !== -1) {
        // Penalty is larger if watched more recently
        const recencyPenalty = -150 + (historyIndex * 2); // watched recently gets heavy penalty
        score += recencyPenalty;
      }

      return { track: candidate, score };
    });

    // Sort by final score descending
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Take top 20 items
    const finalRecommendations = scoredCandidates.slice(0, 20).map(item => item.track);

    return NextResponse.json(cleanTopicGlobally({ items: finalRecommendations }));
  } catch (error: any) {
    console.error('Deep Recommendations API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

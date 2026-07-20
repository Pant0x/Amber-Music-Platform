import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const serpApiKey = process.env.SERPAPI_API_KEY;
    if (serpApiKey) {
      console.debug('[Trending API] Querying SerpApi for trending searches...');
      try {
        const url = `https://serpapi.com/search.json?engine=google_trends_trending_now&geo=US&api_key=${serpApiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // Extract top queries
          if (data.trending_searches && Array.isArray(data.trending_searches)) {
            const list = data.trending_searches.slice(0, 8).map((s: any) => ({
              name: s.query,
              type: 'Trending'
            }));
            if (list.length > 0) {
              return NextResponse.json(list);
            }
          }
        }
      } catch (err) {
        console.error('[Trending API] SerpApi trends fetch failed:', err);
      }
    }

    // Default high-profile music trends fallback
    const fallbackTrends = [
      { name: 'Yeat', type: 'Artist' },
      { name: 'Kendrick Lamar', type: 'Artist' },
      { name: 'Drake', type: 'Artist' },
      { name: 'Don Toliver', type: 'Artist' },
      { name: 'Travis Scott', type: 'Artist' },
      { name: 'Taylor Swift', type: 'Artist' },
      { name: 'Playboi Carti', type: 'Artist' },
      { name: 'Lofi Chill', type: 'Genre' }
    ];

    return NextResponse.json(fallbackTrends);
  } catch (error) {
    console.error('[Trending API] Error:', error);
    return NextResponse.json([]);
  }
}

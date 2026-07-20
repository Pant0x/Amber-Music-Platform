import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const suggestionsCache = new Map<string, string[]>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || !query.trim()) {
      return NextResponse.json([]);
    }

    const cleanQuery = query.trim().toLowerCase();
    if (suggestionsCache.has(cleanQuery)) {
      const cached = suggestionsCache.get(cleanQuery);
      return NextResponse.json(cached);
    }

    const returnWithCache = (list: string[]) => {
      if (suggestionsCache.size > 500) {
        suggestionsCache.clear();
      }
      suggestionsCache.set(cleanQuery, list);
      return NextResponse.json(list);
    };

    const serpApiKey = process.env.SERPAPI_API_KEY;
    if (serpApiKey) {
      console.debug('[Suggestions API] Querying SerpApi for autocomplete suggestions...');
      try {
        const url = `https://serpapi.com/search.json?engine=google_autocomplete&client=youtube&q=${encodeURIComponent(query.trim())}&api_key=${serpApiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && Array.isArray(data.suggestions)) {
            const list = data.suggestions.map((s: any) => s.value).slice(0, 8);
            return returnWithCache(list);
          }
        }
      } catch (err) {
        console.error('[Suggestions API] SerpApi suggestions call failed:', err);
      }
    }

    const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query.trim())}`;
    
    const res = await fetch(suggestUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      return returnWithCache([]);
    }

    const data = await res.json();
    // format is ["query", ["suggestion1", "suggestion2", ...]]
    if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
      const list = data[1].slice(0, 8); // Return top 8 suggestions
      return returnWithCache(list);
    }

    return returnWithCache([]);
  } catch (error) {
    console.error('[Suggestions API] Error:', error);
    return NextResponse.json([]);
  }
}

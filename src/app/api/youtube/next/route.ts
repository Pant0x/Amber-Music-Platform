import { NextResponse } from 'next/server';
import { ytMusicGetNext } from '@/lib/youtubei';
import { rateLimitByIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const nextCache = new Map<string, any[]>();

export async function GET(request: Request) {
  try {
    const limited = rateLimitByIp(request, 60);
    if (!limited.ok) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    if (nextCache.has(videoId)) {
      const cached = nextCache.get(videoId);
      console.debug(`[API Next] Cache HIT for videoId: "${videoId}"`);
      return NextResponse.json(cached);
    }

    const recommendations = await ytMusicGetNext(videoId);

    if (nextCache.size > 200) {
      nextCache.clear();
    }
    nextCache.set(videoId, recommendations);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('[API Next] Watch next recommendations failed:', error);
    return NextResponse.json([]);
  }
}

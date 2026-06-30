import { NextResponse } from 'next/server';
import { ytMusicGetNext } from '@/lib/youtubei';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }
    const recommendations = await ytMusicGetNext(videoId);
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('[API Next] Watch next recommendations failed:', error);
    return NextResponse.json([]);
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import createSupabaseServerClient from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { track_id, youtube_id, played_seconds, duration_seconds, metadata } = body;

    let supabase;
    try {
      supabase = createSupabaseServerClient();
    } catch (e) {
      console.error('Supabase server client init failed', e);
      return NextResponse.json({ error: 'Supabase not configured on server' }, { status: 500 });
    }

    const insert = {
      user_id: userId,
      track_id: track_id || null,
      youtube_id: youtube_id || null,
      played_seconds: typeof played_seconds === 'number' ? Math.floor(played_seconds) : null,
      duration_seconds: typeof duration_seconds === 'number' ? Math.floor(duration_seconds) : null,
      metadata: metadata || null
    };

    const { data, error } = await supabase.from('listen_history').insert([insert]);
    if (error) {
      console.error('Supabase insert error', error);
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, row: data?.[0] || null });
  } catch (e) {
    console.error('listen_history POST error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


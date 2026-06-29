import { NextResponse } from 'next/server';
import createSupabaseServerClient from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// Helper to extract client IP address
function getClientIp(req: Request): string {
  const forwardHeader = req.headers.get('x-forwarded-for');
  const realIpHeader = req.headers.get('x-real-ip');
  
  if (forwardHeader) {
    // x-forwarded-for can be a comma-separated list, first element is the real client IP
    const ip = forwardHeader.split(',')[0].trim();
    if (ip) return ip;
  }
  
  if (realIpHeader) {
    return realIpHeader.trim();
  }
  
  return '127.0.0.1'; // local fallback
}

// GET: fetch database status/data for client IP
export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    console.log(`[User Sync API] GET requested by IP: ${ip}`);

    let supabase;
    try {
      supabase = createSupabaseServerClient();
    } catch (e) {
      console.warn('[User Sync API] Supabase client initialization failed:', e);
      return NextResponse.json({
        ip_address: ip,
        display_name: 'Anonymous Listener',
        liked_tracks: [],
        subscribed_channels: [],
        playlists: [],
        history: []
      });
    }

    const { data, error } = await supabase
      .from('user_ip_data')
      .select('*')
      .eq('ip_address', ip)
      .single();

    if (error || !data) {
      // If row does not exist, insert default values
      const defaultRow = {
        ip_address: ip,
        display_name: 'Anonymous Listener',
        liked_tracks: [],
        subscribed_channels: [],
        playlists: [],
        history: []
      };

      const { error: insertErr } = await supabase
        .from('user_ip_data')
        .insert([defaultRow]);

      if (insertErr) {
        console.error('[User Sync API] Failed to create default IP row:', insertErr);
      }

      return NextResponse.json(defaultRow);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[User Sync API] GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: sync/save client IP data
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { display_name, liked_tracks, subscribed_channels, playlists, history } = body;

    let supabase;
    try {
      supabase = createSupabaseServerClient();
    } catch (e) {
      console.warn('[User Sync API] Supabase client initialization failed on POST:', e);
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { error } = await supabase
      .from('user_ip_data')
      .upsert({
        ip_address: ip,
        display_name: display_name || 'Anonymous Listener',
        liked_tracks: liked_tracks || [],
        subscribed_channels: subscribed_channels || [],
        playlists: playlists || [],
        history: history || [],
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('[User Sync API] Upsert error:', error);
      return NextResponse.json({ error: 'Sync save failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[User Sync API] POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

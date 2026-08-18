import { NextResponse } from 'next/server';
import { auth, getSupabaseUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

async function ensureUserProfile(userId: string) {
  if (!supabaseAdmin) return;
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      const supabaseUser = await getSupabaseUser();
      const meta = supabaseUser?.user_metadata || {};
      const displayName =
        typeof meta.full_name === 'string'
          ? meta.full_name
          : typeof meta.name === 'string'
            ? meta.name
            : supabaseUser?.email?.split('@')[0] || 'Listener'

      await supabaseAdmin
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: displayName,
          avatar_url:
            typeof meta.avatar_url === 'string'
              ? meta.avatar_url
              : typeof meta.picture === 'string'
                ? meta.picture
                : null,
          is_artist: false,
          is_admin: false,
          artist_status: 'none',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
    }
  } catch (e) {
    console.warn('[User Sync API] Auto-profile creation failed:', e);
  }
}

// GET: fetch database status/data for the logged-in user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserProfile(userId);

    if (!supabaseAdmin) {
      return NextResponse.json({
        user_id: userId,
        display_name: 'Anonymous Listener',
        onboarding_completed: false,
        liked_tracks: [],
        subscribed_channels: [],
        playlists: [],
        history: []
      });
    }

    const { data, error } = await supabaseAdmin
      .from('user_sync_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // If row does not exist, insert default values
      const defaultRow = {
        user_id: userId,
        display_name: 'Anonymous Listener',
        avatar_url: 'bg-gradient-to-tr from-blue-600 to-indigo-900',
        onboarding_completed: false,
        liked_tracks: [],
        subscribed_channels: [],
        playlists: [],
        history: []
      };

      const { error: insertErr } = await supabaseAdmin
        .from('user_sync_data')
        .insert([defaultRow]);

      if (insertErr) {
        console.error('[User Sync API] Failed to create default user row:', insertErr);
      }

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .single();

      return NextResponse.json({
        ...defaultRow,
        is_admin: profile?.is_admin || false
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      ...data,
      is_admin: profile?.is_admin || false
    });
  } catch (err) {
    console.error('[User Sync API] GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: sync/save user data
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserProfile(userId);

    const rawBody = await request.text();
    
    // Size validation: Prevent payloads larger than ~2MB
    if (rawBody.length > 2 * 1024 * 1024) {
      console.warn('[User Sync API] Payload too large, rejecting.');
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = JSON.parse(rawBody);
    const { display_name, avatar_url, onboarding_completed, liked_tracks, subscribed_channels, playlists, history } = body;

    // Input validation: sanitize string fields to prevent stored XSS
    const safeName = typeof display_name === 'string'
      ? display_name.replace(/<[^>]*>/g, '').trim().slice(0, 100)
      : 'Anonymous Listener';
    const safeAvatar = typeof avatar_url === 'string'
      ? avatar_url.replace(/<[^>]*>/g, '').trim().slice(0, 500)
      : 'bg-gradient-to-tr from-blue-600 to-indigo-900';

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    const { error } = await supabaseAdmin
      .from('user_sync_data')
      .upsert({
        user_id: userId,
        display_name: safeName || 'Anonymous Listener',
        avatar_url: safeAvatar || 'bg-gradient-to-tr from-blue-600 to-indigo-900',
        onboarding_completed: onboarding_completed === true,
        liked_tracks: Array.isArray(liked_tracks) ? liked_tracks : [],
        subscribed_channels: Array.isArray(subscribed_channels) ? subscribed_channels : [],
        playlists: Array.isArray(playlists) ? playlists : [],
        history: Array.isArray(history) ? history : [],
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


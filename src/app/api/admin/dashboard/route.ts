import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-server'

async function checkAdmin() {
  const { userId } = await auth()
  if (!userId) return false

  if (!supabaseAdmin) return false

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('user_id', userId)
    .single()

  return data?.is_admin === true
}

export async function GET() {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({
      stats: { total_users: 0, total_tracks: 0, total_plays: 0 },
      users: [],
      tracks: [],
    })
  }

  const [usersRes, tracksRes, playsRes, pendingArtistsRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('user_id, display_name, created_at').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('artist_tracks').select('id, title, artist_name, plays_count, created_at').order('created_at', { ascending: false }).limit(20),
    supabaseAdmin.from('artist_tracks').select('plays_count'),
    supabaseAdmin.from('profiles').select('user_id, display_name, avatar_url, bio, created_at').eq('artist_status', 'pending').order('created_at', { ascending: true }),
  ])

  const totalPlays = playsRes.data?.reduce((sum, t) => sum + (t.plays_count || 0), 0) ?? 0

  return NextResponse.json({
    stats: {
      total_users: usersRes.data?.length ?? 0,
      total_tracks: tracksRes.data?.length ?? 0,
      total_plays: totalPlays,
    },
    users: usersRes.data?.map(u => ({
      id: u.user_id,
      display_name: u.display_name || 'Unknown',
      created_at: u.created_at,
    })) ?? [],
    tracks: tracksRes.data ?? [],
    pending_artists: pendingArtistsRes.data ?? [],
  })
}

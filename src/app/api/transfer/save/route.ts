import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, tracks, source } = body

  if (!name || !Array.isArray(tracks)) {
    return NextResponse.json({ error: 'Missing name or tracks' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Fetch current user sync data
  const { data: userData } = await supabaseAdmin
    .from('user_sync_data')
    .select('playlists, display_name, avatar_url')
    .eq('user_id', userId)
    .single()

  const currentPlaylists = Array.isArray(userData?.playlists) ? userData.playlists : []

  const newPlaylist = {
    id: `pl_${Math.random().toString(36).substring(2, 9)}`,
    name: name.trim(),
    tracks,
    createdAt: new Date().toISOString(),
  }

  const updatedPlaylists = [...currentPlaylists, newPlaylist]

  // Upsert user sync data with the new playlist appended
  const { error: upsertErr } = await supabaseAdmin
    .from('user_sync_data')
    .upsert({
      user_id: userId,
      playlists: updatedPlaylists,
      display_name: userData?.display_name || 'Anonymous Listener',
      avatar_url: userData?.avatar_url || 'bg-gradient-to-tr from-blue-600 to-indigo-900',
      updated_at: new Date().toISOString(),
    })

  if (upsertErr) {
    console.error('[Playlist Save API] Upsert error:', upsertErr)
    return NextResponse.json({ error: 'Failed to persist playlist' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    playlist: newPlaylist,
  })
}


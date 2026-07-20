import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ files: [] })
  }

  const { data } = await supabaseAdmin
    .from('user_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ files: data || [] })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, artist, album, file_url, file_size, duration_seconds, bpm, musical_key, privacy_tier, mime_type } = body

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const shareToken = privacy_tier === 'unlisted'
    ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    : null

  const { data, error } = await supabaseAdmin
    .from('user_files')
    .insert({
      user_id: userId,
      title: title || 'Unknown Track',
      artist: artist || null,
      album: album || null,
      file_url,
      file_size: file_size ? Number(file_size) : null,
      duration_seconds: duration_seconds ? Number(duration_seconds) : null,
      bpm: bpm ? Number(bpm) : null,
      musical_key: musical_key || null,
      privacy_tier: privacy_tier || 'private',
      share_token: shareToken,
      mime_type: mime_type || 'audio/mpeg',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function PUT(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, title, artist, album, privacy_tier } = body

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title || 'Unknown Track'
  if (artist !== undefined) updates.artist = artist || null
  if (album !== undefined) updates.album = album || null
  if (privacy_tier !== undefined) {
    updates.privacy_tier = privacy_tier
    if (privacy_tier === 'unlisted') {
      updates.share_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    } else {
      updates.share_token = null
    }
  }

  const { error } = await supabaseAdmin
    .from('user_files')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing file id' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { error } = await supabaseAdmin
    .from('user_files')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

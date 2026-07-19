import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  let body: Record<string, unknown>
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const entries: Record<string, unknown> = {}
    for (const [key, value] of formData.entries()) {
      entries[key] = value
    }
    body = entries
  } else {
    body = await request.json()
  }

  const { title, artist_name, genre, tags, is_explicit, audio_url, cover_url, duration_seconds, bpm, musical_key } = body

  if (!title || !artist_name || !audio_url) {
    return NextResponse.json({ error: 'Missing required fields: title, artist_name, audio_url' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('artist_tracks')
    .insert({
      artist_id: userId,
      title: String(title),
      artist_name: String(artist_name),
      genre: genre ? String(genre) : null,
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? JSON.parse(tags) : null),
      is_explicit: is_explicit === true || is_explicit === 'true',
      audio_url: String(audio_url),
      cover_url: cover_url ? String(cover_url) : null,
      duration_seconds: duration_seconds ? Number(duration_seconds) : null,
      bpm: bpm ? Number(bpm) : null,
      musical_key: musical_key ? String(musical_key) : null,
      lyrics_status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('[Artist Upload] Error:', error)
    return NextResponse.json({ error: 'Failed to create track' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

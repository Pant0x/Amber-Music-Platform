import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const isSafeHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_artist, artist_status')
    .eq('user_id', userId)
    .single()

  const isArtist = profile?.is_artist === true && (profile?.artist_status === 'approved' || profile?.artist_status === 'active')
  if (!isArtist) {
    return NextResponse.json({ error: 'Artist account not approved' }, { status: 403 })
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

  if (typeof title !== 'string' || typeof artist_name !== 'string' || title.length > 200 || artist_name.length > 200) {
    return NextResponse.json({ error: 'title and artist_name must be strings under 200 chars' }, { status: 400 })
  }

  const audioUrl = String(audio_url)
  const coverUrl = cover_url ? String(cover_url) : null

  if (!isSafeHttpUrl(audioUrl)) {
    return NextResponse.json({ error: 'audio_url must be an http(s) URL' }, { status: 400 })
  }
  if (coverUrl && !isSafeHttpUrl(coverUrl)) {
    return NextResponse.json({ error: 'cover_url must be an http(s) URL' }, { status: 400 })
  }

  let parsedTags: string[] | null = null
  if (Array.isArray(tags)) {
    parsedTags = tags.map(String).filter(t => t.length <= 50).slice(0, 20)
  } else if (typeof tags === 'string' && tags.trim()) {
    try {
      const parsed = JSON.parse(tags)
      if (Array.isArray(parsed)) {
        parsedTags = parsed.map(String).filter(t => t.length <= 50).slice(0, 20)
      }
    } catch {
      // ignore malformed JSON tags
    }
  }

  const { data, error } = await supabaseAdmin
    .from('artist_tracks')
    .insert({
      artist_id: userId,
      title: String(title).slice(0, 200),
      artist_name: String(artist_name).slice(0, 200),
      genre: genre ? String(genre).slice(0, 100) : null,
      tags: parsedTags,
      is_explicit: is_explicit === true || is_explicit === 'true',
      audio_url: audioUrl,
      cover_url: coverUrl,
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

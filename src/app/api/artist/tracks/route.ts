import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
  const offset = Number(searchParams.get('offset')) || 0
  const artistId = searchParams.get('artist_id') || userId

  const { data, error, count } = await supabaseAdmin
    .from('artist_tracks')
    .select('*', { count: 'exact' })
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tracks: data, total: count })
}

export async function PUT(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing track id' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('artist_tracks')
    .select('artist_id')
    .eq('id', id)
    .single()

  if (!existing || existing.artist_id !== userId) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  }

  const allowedFields = ['title', 'artist_name', 'genre', 'tags', 'is_explicit', 'cover_url', 'lyrics_json']
  const clean: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (updates[field] !== undefined) clean[field] = updates[field]
  }
  clean.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('artist_tracks')
    .update(clean)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing track id' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('artist_tracks')
    .select('artist_id')
    .eq('id', id)
    .single()

  if (!existing || existing.artist_id !== userId) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('artist_tracks')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

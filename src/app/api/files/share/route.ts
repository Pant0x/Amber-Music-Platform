import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing share token' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from('user_files')
    .select('*')
    .eq('share_token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    artist: data.artist,
    album: data.album,
    file_url: data.file_url,
    duration_seconds: data.duration_seconds,
  })
}

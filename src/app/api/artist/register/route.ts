import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  let body: { displayName?: unknown; bio?: unknown; avatarUrl?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const displayName = typeof body.displayName === 'string' ? body.displayName.replace(/<[^>]*>/g, '').trim().slice(0, 100) : null
  const bio = typeof body.bio === 'string' ? body.bio.replace(/<[^>]*>/g, '').trim().slice(0, 2000) : ''
  const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl.slice(0, 500) : null

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .upsert({
      user_id: userId,
      display_name: displayName,
      bio,
      avatar_url: avatarUrl,
      is_artist: false,
      artist_status: 'pending',
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
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

  // Save to the user's local playlists via the existing mechanism
  // For now, we use the Zustand store — but this route is for server-side persistence
  // Once TanStack Query is set up, this would sync with a `playlists` table

  return NextResponse.json({
    success: true,
    playlist: {
      name,
      track_count: tracks.length,
      source,
    },
  })
}

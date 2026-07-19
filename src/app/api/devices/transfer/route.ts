import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { target_device_id, track_id, position } = body

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Update target device state
  await supabaseAdmin
    .from('devices')
    .update({
      current_track_id: track_id || null,
      current_position: position || 0,
      is_playing: true,
      last_seen: new Date().toISOString(),
    })
    .eq('id', target_device_id)
    .eq('user_id', userId)

  return NextResponse.json({
    success: true,
    message: 'Transfer initiated',
    target_device_id,
    track_id,
    position,
  })
}

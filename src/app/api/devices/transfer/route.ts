import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  // Accept both snake_case (API convention) and camelCase (client convention)
  const targetDeviceId = body.target_device_id || body.targetDeviceId || null
  const trackId = body.track_id || body.track?.id || null
  const position = typeof body.position === 'number' ? body.position : 0

  if (!targetDeviceId) {
    return NextResponse.json({ error: 'Missing target_device_id' }, { status: 400 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Update target device state
  await supabaseAdmin
    .from('devices')
    .update({
      current_track_id: trackId || null,
      current_position: position,
      is_playing: body.playing !== false,
      last_seen: new Date().toISOString(),
    })
    .eq('id', targetDeviceId)
    .eq('user_id', userId)

  return NextResponse.json({
    success: true,
    message: 'Transfer initiated',
    target_device_id: targetDeviceId,
    track_id: trackId,
    position,
  })
}

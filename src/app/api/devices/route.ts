import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ devices: [] })
  }

  const { data } = await supabaseAdmin
    .from('devices')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('last_seen', { ascending: false })

  return NextResponse.json({ devices: data || [] })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, device_type } = body

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  // Deactivate other devices for this user
  await supabaseAdmin
    .from('devices')
    .update({ is_active: false, last_seen: new Date().toISOString() })
    .eq('user_id', userId)

  // Register new device
  const { data, error } = await supabaseAdmin
    .from('devices')
    .insert({
      user_id: userId,
      name: name || 'Unknown Device',
      device_type: device_type || 'browser',
      is_active: true,
      last_seen: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { device_id, current_track_id, current_position, is_playing } = body

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const updates: Record<string, unknown> = { last_seen: new Date().toISOString() }
  if (current_track_id !== undefined) updates.current_track_id = current_track_id
  if (current_position !== undefined) updates.current_position = current_position
  if (is_playing !== undefined) updates.is_playing = is_playing

  const { error } = await supabaseAdmin
    .from('devices')
    .update(updates)
    .eq('id', device_id)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

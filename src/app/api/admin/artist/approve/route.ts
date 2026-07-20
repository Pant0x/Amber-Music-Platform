import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-server'

async function checkAdmin() {
  const { userId } = await auth()
  if (!userId) return false

  if (!supabaseAdmin) return false

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('user_id', userId)
    .single()

  return data?.is_admin === true
}

export async function POST(req: Request) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const { userId, approve } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const update = approve
      ? { is_artist: true, artist_status: 'approved', updated_at: new Date().toISOString() }
      : { is_artist: false, artist_status: 'none', updated_at: new Date().toISOString() }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(update)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[Admin Approve API] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'

const ALLOWED_BUCKETS = new Set(['artist_uploads', 'avatars'])

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { path, bucket } = await request.json()

  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  const targetBucket = bucket || 'artist_uploads'
  if (!ALLOWED_BUCKETS.has(targetBucket)) {
    return NextResponse.json({ error: 'Bucket not allowed' }, { status: 400 })
  }

  // Ownership check: every upload lives under <userId>/ — refuse anything else
  if (!path.startsWith(`${userId}/`)) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  }

  const { error } = await supabaseAdmin.storage
    .from(targetBucket)
    .remove([path])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
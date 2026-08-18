import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-server'
import { genId } from '@/utils/text'

const MAX_FILE_BYTES = 50 * 1024 * 1024

const BUCKET_RULES: Record<string, { mimePrefix: string; requiresArtist: boolean }> = {
  artist_uploads: { mimePrefix: 'audio/', requiresArtist: true },
  avatars: { mimePrefix: 'image/', requiresArtist: false },
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const bucket = (formData.get('bucket') as string) || 'artist_uploads'

  const rule = BUCKET_RULES[bucket]
  if (!rule) {
    return NextResponse.json({ error: 'Bucket not allowed' }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File exceeds 50MB limit' }, { status: 413 })
  }

  const mime = file.type || 'application/octet-stream'
  if (!mime.startsWith(rule.mimePrefix)) {
    return NextResponse.json({ error: `Only ${rule.mimePrefix}* files are allowed in this bucket` }, { status: 400 })
  }

  if (rule.requiresArtist) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_artist, artist_status')
      .eq('user_id', userId)
      .single()

    const isArtist = profile?.is_artist === true && (profile?.artist_status === 'approved' || profile?.artist_status === 'active')
    if (!isArtist) {
      return NextResponse.json({ error: 'Artist account not approved' }, { status: 403 })
    }
  }

  // Folders are always scoped to the authenticated user — never client-supplied.
  const folder = userId
  const ext = file.name.split('.').pop() || 'bin'
  const fileName = `${Date.now()}_${genId('file')}.${ext}`
  const filePath = `${folder}/${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('[Storage Upload] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return NextResponse.json({
    path: filePath,
    url: urlData.publicUrl,
    size: file.size,
    mimetype: file.type,
  })
}
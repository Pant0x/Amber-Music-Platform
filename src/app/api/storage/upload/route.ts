import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { genId } from '@/utils/text'

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
  const folder = (formData.get('folder') as string) || userId

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

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

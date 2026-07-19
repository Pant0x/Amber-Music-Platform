import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase-server'

interface WebhookEvent {
  type: string
  data: {
    id: string
    email_addresses?: { email_address: string }[]
    first_name?: string
    last_name?: string
    image_url?: string
    username?: string
  }
}

export async function POST(request: Request) {
  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Missing CLERK_WEBHOOK_SECRET' }, { status: 500 })
  }

  const payload = await request.text()
  const wh = new Webhook(secret)

  let evt: WebhookEvent
  try {
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const { id, first_name, last_name, image_url } = evt.data
    const displayName = [first_name, last_name].filter(Boolean).join(' ') || 'User'

    if (!supabaseAdmin) {
      console.warn('[Webhook] Supabase admin client not configured')
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        user_id: id,
        display_name: displayName,
        avatar_url: image_url || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      console.error('[Webhook] Upsert profile error:', error)
      return NextResponse.json({ error: 'Failed to sync profile' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

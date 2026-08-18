import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ isArtist: false })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase.from('profiles').select('is_artist, artist_status').eq('user_id', userId).single()
  return NextResponse.json({ 
    isArtist: data?.is_artist || false,
    artistStatus: data?.artist_status || 'none'
  })
}

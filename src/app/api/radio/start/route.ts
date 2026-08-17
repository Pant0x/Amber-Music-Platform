import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { rateLimitByIp } from '@/lib/rate-limit'

interface TrackInput {
  id: string
  title?: string
  artist?: string
  genre?: string
  bpm?: number | null
  key?: string | null
}

export async function POST(request: Request) {
  const limited = rateLimitByIp(request, 15)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body: { seed: TrackInput; count?: number } = await request.json()
  const { seed, count = 30 } = body

  if (!seed?.id) {
    return NextResponse.json({ error: 'Missing seed track id' }, { status: 400 })
  }

  let radioTracks: TrackInput[] = []

  // 1. Try to get similar tracks from artist uploads (genre/BPM match)
  if (supabaseAdmin && (seed.genre || seed.bpm)) {
    let query = supabaseAdmin
      .from('artist_tracks')
      .select('id, title, artist_name, genre, bpm, musical_key, plays_count, cover_url, duration_seconds')
      .eq('is_public', true)
      .limit(count)

    if (seed.genre) {
      query = query.eq('genre', seed.genre)
    }
    if (seed.bpm) {
      const bpmMin = Math.max(0, (seed.bpm || 120) - 20)
      const bpmMax = (seed.bpm || 120) + 20
      query = query.gte('bpm', bpmMin).lte('bpm', bpmMax)
    }

    const { data } = await query
    if (data) {
      const filtered = data.filter(t => t.id !== seed.id)
      const shuffled = filtered.sort(() => Math.random() - 0.5)
      radioTracks = shuffled.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist_name,
        genre: t.genre,
        bpm: t.bpm,
        key: t.musical_key,
      }))
    }
  }

  // 2. If not enough, call YouTube autoplay for more variety
  if (radioTracks.length < count) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/youtube/next?videoId=${encodeURIComponent(seed.id)}`)
      if (res.ok) {
        const ytTracks = await res.json()
        if (Array.isArray(ytTracks)) {
          const mapped = ytTracks.map((t: { id?: string; youtubeId?: string; videoId?: string; title?: string; channelTitle?: string; artist?: string; bpm?: number; key?: string }) => ({
            id: String(t.id || t.youtubeId || t.videoId || ''),
            title: t.title,
            artist: t.channelTitle || t.artist,
            bpm: t.bpm,
            key: t.key,
          }))
          radioTracks = [...radioTracks, ...mapped].slice(0, count)
        }
      }
    } catch {
      // fallback: just use what we have
    }
  }

  // 3. Deduplicate
  const seen = new Set<string>()
  const unique = radioTracks.filter(t => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  return NextResponse.json({
    tracks: unique,
    seed: seed.id,
    count: unique.length,
  })
}

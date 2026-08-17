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
  const limited = rateLimitByIp(request, 20)
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body: { seed: TrackInput; count?: number; offset?: number } = await request.json()
  const { seed, count = 10, offset = 0 } = body

  if (!seed?.id) {
    return NextResponse.json({ error: 'Missing seed track id' }, { status: 400 })
  }

  const pageCount = Math.min(Math.max(count, 1), 30)

  // Offset-based pagination over the same signal sources used by /api/radio/start
  let radioTracks: TrackInput[] = []

  if (supabaseAdmin) {
    let query = supabaseAdmin
      .from('artist_tracks')
      .select('id, title, artist_name, genre, bpm, musical_key, plays_count, cover_url, duration_seconds')
      .eq('is_public', true)
      .neq('id', seed.id)
      .order('plays_count', { ascending: false })
      .range(offset, offset + pageCount - 1)

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
      radioTracks = data.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist_name,
        genre: t.genre,
        bpm: t.bpm,
        key: t.musical_key,
      }))
    }
  }

  // Fall back to YouTube autoplay suggestions from the last seed when the
  // upload catalog is exhausted at this page
  if (radioTracks.length < pageCount) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/youtube/next?videoId=${encodeURIComponent(seed.id)}`
      )
      if (res.ok) {
        const ytTracks = await res.json()
        if (Array.isArray(ytTracks)) {
          const mapped = ytTracks.slice(offset).slice(0, pageCount - radioTracks.length).map((t: { id?: string; youtubeId?: string; videoId?: string; title?: string; channelTitle?: string; artist?: string; bpm?: number; key?: string }) => ({
            id: String(t.id || t.youtubeId || t.videoId || ''),
            title: t.title,
            artist: t.channelTitle || t.artist,
            bpm: t.bpm,
            key: t.key,
          }))
          radioTracks = [...radioTracks, ...mapped].slice(0, pageCount)
        }
      }
    } catch {
      // fallback: just use what we have
    }
  }

  return NextResponse.json({
    tracks: radioTracks,
    seed: seed.id,
    count: radioTracks.length,
    offset: offset + radioTracks.length,
  })
}
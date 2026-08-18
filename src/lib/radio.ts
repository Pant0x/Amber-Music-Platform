import { supabaseAdmin } from '@/lib/supabase-server'
import { ytMusicGetNext } from '@/lib/youtubei'

export interface RadioTrackInput {
  id: string
  title?: string
  artist?: string
  genre?: string
  bpm?: number | null
  key?: string | null
}

export interface RadioSeed {
  id: string
  title?: string
  artist?: string
  genre?: string
  bpm?: number | null
  key?: string | null
}

/**
 * Build radio candidates from two signal sources:
 *   1. public artist uploads matching seed genre/BPM (ordered by plays),
 *   2. YouTube Music autoplay suggestions for the seed track.
 * Shared by /api/radio/start and /api/radio/more — the YouTube fallback calls
 * ytMusicGetNext directly instead of the server fetching its own HTTP API.
 */
export async function buildRadioCandidates(
  seed: RadioSeed,
  count: number,
  offset = 0
): Promise<RadioTrackInput[]> {
  const candidates: RadioTrackInput[] = []

  if (supabaseAdmin && (seed.genre || seed.bpm)) {
    let query = supabaseAdmin
      .from('artist_tracks')
      .select('id, title, artist_name, genre, bpm, musical_key, plays_count, cover_url, duration_seconds')
      .eq('is_public', true)
      .neq('id', seed.id)
      .order('plays_count', { ascending: false })
      .range(offset, offset + count - 1)

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
      candidates.push(...data.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist_name,
        genre: t.genre,
        bpm: t.bpm,
        key: t.musical_key,
      })))
    }
  }

  if (candidates.length < count) {
    try {
      const ytTracks = await ytMusicGetNext(seed.id)
      if (ytTracks.length > 0) {
        const mapped: RadioTrackInput[] = ytTracks.map(t => ({
          id: String(t.id || ''),
          title: t.title,
          artist: t.channelTitle,
        }))
        candidates.push(...mapped)
      }
    } catch {
      // fall back to whatever catalog matches we already have
    }
  }

  const seen = new Set<string>()
  const unique = candidates.filter(t => {
    if (!t.id || t.id === seed.id || seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  return unique.slice(0, count)
}
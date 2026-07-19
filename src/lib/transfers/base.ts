export interface TransferTrack {
  id?: string
  title: string
  artist: string
  album?: string
  duration?: number
  isrc?: string
  thumbnail?: string
}

export interface TransferPlaylist {
  name: string
  description?: string
  tracks: TransferTrack[]
  source: string
}

export interface TransferAdapter {
  name: string
  parseUrl(url: string): { type: 'playlist' | 'file'; id?: string } | null
  fetchPlaylist(id: string): Promise<TransferPlaylist>
}

export async function matchTrack(
  track: TransferTrack,
  catalog: { search: (query: string) => Promise<TransferTrack[]> }
): Promise<{ match: TransferTrack | null; confidence: number }> {
  // Stage 1: ISRC match
  if (track.isrc) {
    const results = await catalog.search(`isrc:${track.isrc}`)
    if (results.length > 0) {
      return { match: results[0], confidence: 1.0 }
    }
  }

  // Stage 2: Title + Artist exact match
  const exactQuery = `${track.title} ${track.artist}`
  const results = await catalog.search(exactQuery)
  if (results.length > 0) {
    const best = results[0]
    const titleMatch = best.title.toLowerCase() === track.title.toLowerCase()
    const artistMatch = best.artist.toLowerCase() === track.artist.toLowerCase()

    if (titleMatch && artistMatch) {
      return { match: best, confidence: 0.95 }
    }
  }

  // Stage 3: Return best fuzzy match with score
  if (results.length > 0) {
    return { match: results[0], confidence: 0.6 }
  }

  return { match: null, confidence: 0 }
}

export function detectService(url: string): string | null {
  const patterns: Record<string, RegExp> = {
    spotify: /open\.spotify\.com\/(playlist|album|track)/,
    youtube: /(youtube\.com|youtu\.be)\/(playlist|watch)/,
    deezer: /deezer\.com\/(playlist|album|track)/,
    soundcloud: /soundcloud\.com\/[^/]+\/(sets|tracks)/,
    tidal: /tidal\.com\/(playlist|album|track)/,
    apple: /music\.apple\.com\/[^/]+\/(playlist|album)/,
    amazon: /music\.amazon\.com\/(playlists|albums|tracks)/,
    qobuz: /qobuz\.com\/(playlist|album|track)/,
    beatport: /beatport\.com\/(playlist|release|track)/,
  }

  for (const [service, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) return service
  }
  return null
}

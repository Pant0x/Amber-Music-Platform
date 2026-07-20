import type { TransferAdapter, TransferPlaylist } from './base'
import { detectService } from './base'
import { spotifyAdapter } from './spotify'
import { deezerAdapter } from './deezer'
import { youtubeAdapter } from './youtube'

const adapters: Record<string, TransferAdapter> = {
  spotify: spotifyAdapter,
  deezer: deezerAdapter,
  youtube: youtubeAdapter,
}

export async function importPlaylist(url: string): Promise<{
  service: string | null
  playlist: TransferPlaylist | null
  error?: string
}> {
  const service = detectService(url)
  if (!service) {
    return { service: null, playlist: null, error: 'Unsupported service or invalid URL' }
  }

  const adapter = adapters[service]
  if (!adapter) {
    return { service, playlist: null, error: `Adapter not yet implemented for ${service}` }
  }

  const parsed = adapter.parseUrl(url)
  if (!parsed || parsed.type !== 'playlist' || !parsed.id) {
    return { service, playlist: null, error: 'Could not parse playlist URL' }
  }

  try {
    const playlist = await adapter.fetchPlaylist(parsed.id)
    return { service, playlist }
  } catch (err) {
    return {
      service,
      playlist: null,
      error: err instanceof Error ? err.message : 'Failed to fetch playlist',
    }
  }
}

export { detectService } from './base'
export type { TransferTrack, TransferPlaylist } from './base'

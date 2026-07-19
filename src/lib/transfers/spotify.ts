import type { TransferAdapter, TransferPlaylist, TransferTrack } from './base'
import { getSpotifyApi } from '@/lib/spotify'

export const spotifyAdapter: TransferAdapter = {
  name: 'spotify',

  parseUrl(url: string) {
    const match = url.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/)
    if (match) return { type: 'playlist', id: match[1] }
    return null
  },

  async fetchPlaylist(id: string): Promise<TransferPlaylist> {
    const spotifyApi = await getSpotifyApi()
    const response = await spotifyApi.getPlaylist(id)

    const playlist = response.body
    const tracks: TransferTrack[] = playlist.tracks.items
      .filter((item: any) => item.track)
      .map((item: any) => ({
        id: item.track.id,
        title: item.track.name,
        artist: item.track.artists?.map((a: any) => a.name).join(', ') || 'Unknown',
        album: item.track.album?.name,
        duration: item.track.duration_ms ? Math.round(item.track.duration_ms / 1000) : undefined,
        thumbnail: item.track.album?.images?.[0]?.url,
      }))

    return {
      name: playlist.name,
      description: playlist.description || undefined,
      tracks,
      source: 'spotify',
    }
  },
}

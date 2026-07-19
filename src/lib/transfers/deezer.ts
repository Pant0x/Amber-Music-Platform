import type { TransferAdapter, TransferPlaylist, TransferTrack } from './base'

const DEEZER_API = 'https://api.deezer.com'

export const deezerAdapter: TransferAdapter = {
  name: 'deezer',

  parseUrl(url: string) {
    const match = url.match(/deezer\.com\/(?:[a-z]+\/)?playlist\/(\d+)/)
    if (match) return { type: 'playlist', id: match[1] }
    return null
  },

  async fetchPlaylist(id: string): Promise<TransferPlaylist> {
    const [playlistRes, tracksRes] = await Promise.all([
      fetch(`${DEEZER_API}/playlist/${id}`),
      fetch(`${DEEZER_API}/playlist/${id}/tracks?limit=100`),
    ])

    const playlist = await playlistRes.json()
    const tracksData = await tracksRes.json()

    const tracks: TransferTrack[] = (tracksData.data || []).map((item: any) => ({
      id: String(item.id),
      title: item.title,
      artist: item.artist?.name || 'Unknown',
      album: item.album?.title,
      duration: item.duration,
      thumbnail: item.album?.cover_medium,
    }))

    return {
      name: playlist.title || 'Imported Playlist',
      description: playlist.description,
      tracks,
      source: 'deezer',
    }
  },
}

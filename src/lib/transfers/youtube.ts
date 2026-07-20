import type { TransferAdapter, TransferPlaylist, TransferTrack } from './base'
import { ytMusicBrowse, parseTrackSubtitle, cleanArtistName, upgradeThumbnailUrl } from '@/lib/youtubei'

export const youtubeAdapter: TransferAdapter = {
  name: 'youtube',

  parseUrl(url: string) {
    const match = url.match(/[?&]list=([^#\&\?]+)/)
    if (match) return { type: 'playlist', id: match[1] }
    return null
  },

  async fetchPlaylist(id: string): Promise<TransferPlaylist> {
    const data = await ytMusicBrowse(id)

    const mf = data.microformat?.microformatDataRenderer
    const playlistName = mf?.title ? cleanArtistName(mf.title) : 'YouTube Playlist'
    const playlistDescription = mf?.description || undefined

    const tracks: TransferTrack[] = []
    const seenIds = new Set<string>()

    const extractThumbnail = (item: any) => {
      const thumbs = item?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || item?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails
      if (!thumbs) return undefined
      return upgradeThumbnailUrl(thumbs[thumbs.length - 1]?.url || thumbs[0]?.url || '')
    }

    const traverse = (obj: any, depth = 0) => {
      if (depth > 20) return
      if (!obj || typeof obj !== 'object') return

      if (obj.musicResponsiveListItemRenderer) {
        const item = obj.musicResponsiveListItemRenderer
        const flexColumns = item.flexColumns || []
        const titleRun = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]
        const subtitleRuns = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || []

        const title = titleRun?.text
        const videoId = item.playlistItemData?.videoId || titleRun?.navigationEndpoint?.watchEndpoint?.videoId

        if (title && videoId && !seenIds.has(videoId)) {
          seenIds.add(videoId)

          let durationSeconds = 180
          const fixedColumns = item.fixedColumns || []
          const durationText = fixedColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text
          
          let durationStr = ''
          if (durationText && durationText.includes(':')) {
            durationStr = durationText
          } else {
            const lastRun = subtitleRuns[subtitleRuns.length - 1]?.text
            if (lastRun && lastRun.includes(':')) {
              durationStr = lastRun
            }
          }

          if (durationStr) {
            const parts = durationStr.split(':')
            if (parts.length === 2) {
              const mins = parseInt(parts[0], 10)
              const secs = parseInt(parts[1], 10)
              if (!isNaN(mins) && !isNaN(secs)) {
                durationSeconds = mins * 60 + secs
              }
            }
          }

          const { artistName } = parseTrackSubtitle(subtitleRuns)

          tracks.push({
            id: videoId,
            title: cleanArtistName(title),
            artist: artistName && artistName !== 'Unknown Artist' ? cleanArtistName(artistName) : 'Various Artists',
            duration: durationSeconds,
            thumbnail: extractThumbnail(item),
          })
        }
      }

      for (const key of Object.keys(obj)) {
        traverse(obj[key], depth + 1)
      }
    }

    traverse(data)

    return {
      name: playlistName,
      description: playlistDescription,
      tracks,
      source: 'youtube',
    }
  },
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { usePlayerStore } from '@/store/usePlayerStore'
import { Link2, Loader2, ArrowRightLeft, Music, CheckCircle2, AlertCircle, Play, Plus, ListMusic } from 'lucide-react'
import { genId } from '@/utils/text'

interface PreviewTrack {
  title: string
  artist: string
  album?: string
  youtubeId?: string
  thumbnailUrl?: string
  duration?: string
}

interface ImportResult {
  name: string
  tracks: PreviewTrack[]
  source: string
}

export default function PlaylistTransferPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isSignedIn = !!user
  const playlists = usePlayerStore(state => state.playlists)
  const fetchDatabaseData = usePlayerStore(state => state.fetchDatabaseData)

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [previewData, setPreviewData] = useState<ImportResult | null>(null)
  const [saving, setSaving] = useState(false)

  const handleImportPreview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError('')
    setSuccess(false)
    setPreviewData(null)

    try {
      const res = await fetch('/api/transfer/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import playlist.')
      }

      setPreviewData(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred during import preview.')
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlaylist = async () => {
    if (!previewData) return

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/transfer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: previewData.name,
          tracks: previewData.tracks.map(t => ({
            id: t.youtubeId || genId('yt'),
            title: t.title,
            channelTitle: t.artist,
            thumbnailUrl: t.thumbnailUrl || '',
            youtubeId: t.youtubeId || '',
            type: 'music',
            duration: t.duration || '0:00',
            publishedAt: new Date().toISOString(),
          })),
          source: previewData.source,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to save playlist.')
      }

      setSuccess(true)
      setPreviewData(null)
      setUrl('')
      
      // Force local store sync update
      await fetchDatabaseData()
      
      setTimeout(() => {
        router.push('/library')
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to save playlist to your library.')
    } finally {
      setSaving(false)
    }
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <ArrowRightLeft className="w-16 h-16 text-zinc-600 animate-pulse" />
        <h2 className="text-2xl font-bold text-white">Sign in to Transfer Playlists</h2>
        <p className="text-zinc-400 max-w-sm">Import your playlists from Spotify, YouTube, or Deezer into Sonora in one click.</p>
        <button onClick={() => router.push('/sign-in')} className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all">
          Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-8 select-none selection:bg-white/20">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-3xl bg-zinc-950/40 border border-white/5 relative overflow-hidden backdrop-blur shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-purple-600/5 pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-purple-600 flex items-center justify-center border border-white/10 shadow-lg">
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Playlist Transfer</h1>
            <p className="text-xs text-zinc-400 mt-1">Convert Spotify, YouTube, or Deezer playlists directly into Sonora.</p>
          </div>
        </div>
      </div>

      {/* URL Import Form */}
      <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur shadow-xl">
        <form onSubmit={handleImportPreview} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Playlist Link URL</label>
            <div className="relative flex items-center">
              <Link2 className="absolute left-4 w-4 h-4 text-zinc-500" />
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                required
                placeholder="https://open.spotify.com/playlist/... or https://youtube.com/playlist?list=..."
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full py-3.5 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-zinc-200 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {loading ? 'Analyzing Playlist Tracks...' : 'Load Playlist Preview'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 rounded-2xl bg-green-950/20 border border-green-900/30 text-green-400 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Playlist successfully imported to library! Redirecting...</span>
          </div>
        )}
      </div>

      {/* Playlist Preview Area */}
      {previewData && (
        <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur shadow-xl space-y-6">
          
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <ListMusic className="w-6 h-6 text-zinc-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{previewData.name}</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-wider">
                  Source: {previewData.source} &bull; {previewData.tracks.length} tracks found
                </p>
              </div>
            </div>

            <button
              onClick={handleSavePlaylist}
              disabled={saving}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-full active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/10"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Import to Library'}</span>
            </button>
          </div>

          {/* Tracks List */}
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {previewData.tracks.map((track, i) => (
              <div
                key={`${track.title}-${i}`}
                className="flex items-center justify-between p-2.5 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-xl transition-all gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-900 border border-white/5 flex-shrink-0 flex items-center justify-center">
                    {track.thumbnailUrl ? (
                      <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-4 h-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-xs truncate">{track.title}</h4>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{track.artist}</p>
                  </div>
                </div>

                <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0">{track.duration || '--:--'}</span>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  )
}

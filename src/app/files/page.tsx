'use client'

import { useRouter } from 'next/navigation'
import { Music, ExternalLink, Cloud } from 'lucide-react'
import { usePlayerStore } from '@/store/usePlayerStore'

export default function FilesPage() {
  const router = useRouter()
  const { playlists, createPlaylist } = usePlayerStore()
  
  return (
    <div className="max-w-3xl mx-auto p-6 pb-24 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Your Cloud Library</h1>
          <p className="text-xs text-zinc-400 mt-1">Stream music from YouTube Music and Spotify</p>
        </div>
      </div>

      {/* Cloud Music Platform Notice */}
      <div className="bg-gradient-to-br from-purple-900/20 via-indigo-900/20 to-pink-900/20 border border-pink-500/30 rounded-3xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-500/20 mb-4">
          <Cloud className="w-8 h-8 text-pink-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Welcome to Cloud Music</h2>
        <p className="text-zinc-300 mb-6 max-w-lg mx-auto">
          This platform is now a pure cloud music streaming service. 
          Local file uploads have been deprecated to focus on seamless YouTube Music and Spotify integration.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-xs">
          <div className="bg-zinc-900/30 rounded-xl p-4">
            <h3 className="text-pink-400 font-bold mb-1">YouTube Music</h3>
            <p className="text-zinc-400">Search and stream millions of songs</p>
          </div>
          <div className="bg-zinc-900/30 rounded-xl p-4">
            <h3 className="text-pink-400 font-bold mb-1">Spotify Sync</h3>
            <p className="text-zinc-400">Import your playlists</p>
          </div>
          <div className="bg-zinc-900/30 rounded-xl p-4">
            <h3 className="text-pink-400 font-bold mb-1">Artist Uploads</h3>
            <p className="text-zinc-400">Independent artists can upload tracks</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Browse Music</span>
          </button>
          
          <button
            onClick={() => {
              const name = prompt('Enter playlist name:')
              if (name) createPlaylist(name)
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-all cursor-pointer"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Create Playlist</span>
          </button>
        </div>
      </div>

      {/* Your Playlists */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Your Playlists</h2>
        {playlists.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950/20 border border-white/5 rounded-3xl">
            <p className="text-zinc-400">You haven't created any playlists yet</p>
            <button
              onClick={() => {
                const name = prompt('Enter playlist name:')
                if (name) createPlaylist(name)
              }}
              className="mt-4 px-5 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Create Your First Playlist
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                className="bg-zinc-950/20 border border-white/5 rounded-2xl p-4 hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold truncate">{playlist.name}</h3>
                  <span className="text-xs text-zinc-400">{playlist.tracks.length}</span>
                </div>
                <p className="text-xs text-zinc-500">YouTube Music tracks</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
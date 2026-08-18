'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Music, Upload, Trash2, Loader2, Disc, FileAudio } from 'lucide-react'

interface Track {
  id: string
  title: string
  artist_name: string
  genre: string
  is_public: boolean
  plays_count: number
  audio_url: string
  cover_url: string | null
  created_at: string
}

export default function ArtistDashboard() {
  const router = useRouter()
  const { user, isLoaded } = useAuth()
  const isSignedIn = !!user

  // Catalog state
  const [tracks, setTracks] = useState<Track[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)

  // Upload Form states
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('Pop')
  const [artistName, setArtistName] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [uploadError, setUploadError] = useState('')

  // Check login
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  // Fetch Tracks Catalog
  const fetchCatalog = async () => {
    setLoadingTracks(true)
    try {
      const res = await fetch('/api/artist/tracks')
      if (res.ok) {
        const data = await res.json()
        setTracks(data.tracks || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTracks(false)
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      fetchCatalog()
      if (user) {
        setArtistName(user?.name || user?.email || 'Artist')
      }
    }
  }, [isSignedIn, user])

  // Handle Track Upload Submit
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !audioFile) {
      setUploadError('Title and Audio file are required.')
      return
    }

    setUploading(true)
    setUploadError('')
    try {
      // 1. Upload audio file
      setUploadProgress('Uploading audio track...')
      const audioData = new FormData()
      audioData.append('file', audioFile)
      audioData.append('bucket', 'artist_uploads')
      const audioRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: audioData,
      })
      if (!audioRes.ok) throw new Error('Audio upload failed.')
      const { url: audioUrl, size: audioSize } = await audioRes.json()

      // 2. Upload cover art file (optional)
      let coverUrl = null
      if (coverFile) {
        setUploadProgress('Uploading cover artwork...')
        const coverData = new FormData()
        coverData.append('file', coverFile)
        coverData.append('bucket', 'artist_uploads')
        const coverRes = await fetch('/api/storage/upload', {
          method: 'POST',
          body: coverData,
        })
        if (coverRes.ok) {
          const coverJson = await coverRes.json()
          coverUrl = coverJson.url
        }
      }

      // 3. Register track metadata
      setUploadProgress('Registering track info...')
      const trackRes = await fetch('/api/artist/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          artist_name: artistName || user?.name || user?.email || 'Artist',
          genre,
          audio_url: audioUrl,
          cover_url: coverUrl,
          duration_seconds: 180, // Default duration placeholder
        }),
      })

      if (trackRes.ok) {
        setTitle('')
        setAudioFile(null)
        setCoverFile(null)
        const fileInput = document.getElementById('audio-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        const coverInput = document.getElementById('cover-input') as HTMLInputElement
        if (coverInput) coverInput.value = ''
        fetchCatalog()
      } else {
        const err = await trackRes.json()
        setUploadError(err.error || 'Failed to register track.')
      }
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload.')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  // Handle Delete Track
  const handleDeleteTrack = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return
    try {
      const res = await fetch(`/api/artist/tracks?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setTracks(prev => prev.filter(t => t.id !== id))
      } else {
        alert('Failed to delete track')
      }
    } catch {
      alert('Connection error')
    }
  }

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
        <p className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Loading Studio...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto selection:bg-white/20">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-3xl bg-zinc-950/40 border border-white/5 relative overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg border border-white/10">
            <Disc className="w-7 h-7 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Artist Creator Studio
            </h1>
            <p className="text-xs text-zinc-400 mt-1">Manage and publish your music tracks in the public catalog.</p>
          </div>
        </div>
        
        <button
          onClick={() => router.push('/profile')}
          className="px-5 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer relative z-10"
        >
          View Public Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Form Panel */}
        <div className="lg:col-span-1 bg-zinc-950/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur shadow-xl h-fit">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-purple-400" />
            Upload New Track
          </h2>

          {uploadError && (
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-semibold mb-4">
              {uploadError}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Track Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={60}
                required
                placeholder="Name of your song"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Artist Name</label>
              <input
                type="text"
                value={artistName}
                onChange={e => setArtistName(e.target.value)}
                maxLength={40}
                required
                placeholder="Artist name"
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Genre</label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white/20 transition-all cursor-pointer"
              >
                {['Pop', 'Hip-Hop', 'Rap', 'Rock', 'Electronic', 'Lo-Fi', 'R&B', 'Jazz', 'Acoustic'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Audio File (MP3/WAV)</label>
              <div className="relative group">
                <input
                  id="audio-input"
                  type="file"
                  accept="audio/*"
                  onChange={e => setAudioFile(e.target.files?.[0] || null)}
                  required
                  className="hidden"
                />
                <label
                  htmlFor="audio-input"
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 hover:bg-zinc-900/60 border border-dashed border-white/10 hover:border-white/20 rounded-xl cursor-pointer transition-all text-center gap-1.5"
                >
                  <FileAudio className="w-5 h-5 text-zinc-500" />
                  <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-300">
                    {audioFile ? audioFile.name : 'Select Audio Track'}
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Cover Artwork (Optional)</label>
              <div className="relative group">
                <input
                  id="cover-input"
                  type="file"
                  accept="image/*"
                  onChange={e => setCoverFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="cover-input"
                  className="flex flex-col items-center justify-center p-4 bg-zinc-900 hover:bg-zinc-900/60 border border-dashed border-white/10 hover:border-white/20 rounded-xl cursor-pointer transition-all text-center gap-1.5"
                >
                  {coverFile ? (
                    <img src={URL.createObjectURL(coverFile)} alt="" className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                  ) : (
                    <Upload className="w-5 h-5 text-zinc-500" />
                  )}
                  <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-zinc-300">
                    {coverFile ? coverFile.name : 'Choose Cover Image'}
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-zinc-200 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {uploading ? uploadProgress || 'Uploading...' : 'Publish Track'}
            </button>
          </form>
        </div>

        {/* Catalog Table Panel */}
        <div className="lg:col-span-2 bg-zinc-950/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-4 flex items-center justify-between">
            <span>Your Released Tracks ({tracks.length})</span>
            <button 
              onClick={fetchCatalog}
              className="text-[10px] text-zinc-400 hover:text-white uppercase tracking-wider font-bold transition-colors cursor-pointer"
            >
              Refresh
            </button>
          </h2>

          <div className="overflow-y-auto max-h-[500px] custom-scrollbar pr-1">
            {loadingTracks ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
                <span className="text-xs">Loading Catalog...</span>
              </div>
            ) : tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-2.5">
                <Music className="w-8 h-8 text-zinc-700" />
                <p className="text-xs font-semibold">No tracks published yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tracks.map((track) => (
                  <div key={track.id} className="flex items-center justify-between p-3 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-xl transition-all gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-white/5 flex-shrink-0 flex items-center justify-center">
                        {track.cover_url ? (
                          <img src={track.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Music className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs truncate">{track.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">{track.genre}</span>
                          <span className="text-[10px] text-zinc-500">{track.plays_count} plays</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDeleteTrack(track.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all cursor-pointer"
                        title="Delete Track"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

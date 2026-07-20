'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { usePlayerStore } from '@/store/usePlayerStore'
import { Track } from '@/types/music-player'
import {
  Music, Upload, Play, Pause, Trash2, Share2, Clock, User, Globe, Lock, Eye,
  FileAudio, Loader2, X, Check, LogIn, Copy, FolderPlus, CheckSquare, Square
} from 'lucide-react'

interface LocalFile {
  id: string
  title: string
  artist: string | null
  album: string | null
  file_url: string
  file_size: number | null
  duration_seconds: number | null
  bpm: number | null
  musical_key: string | null
  privacy_tier: string
  share_token: string | null
  mime_type: string | null
  created_at: string
}

const formatBytes = (bytes: number | null) => {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

const formatDuration = (secs: number | null) => {
  if (!secs) return '--:--'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function FilesPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const { playTrack, isPlaying, currentTrack, setPlaying, playlists } = usePlayerStore()
  const [files, setFiles] = useState<LocalFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<LocalFile | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Selection states for playlist creation
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files')
      const data = await res.json()
      setFiles(data.files || [])
    } catch (err) {
      console.error('Failed to fetch files:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSignedIn) fetchFiles()
    else setLoading(false)
  }, [isSignedIn, fetchFiles])

  // Batch Uploading
  const handleUploadBatch = async (fileList: File[]) => {
    setUploading(true)
    let index = 1
    for (const file of fileList) {
      setUploadProgress(`Uploading ${index}/${fileList.length}: ${file.name.slice(0, 20)}...`)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'artist_uploads')

        const uploadRes = await fetch('/api/storage/upload', { method: 'POST', body: formData })
        if (!uploadRes.ok) throw new Error('Upload failed')
        const { url, size } = await uploadRes.json()

        const audio = new Audio(url)
        const dur = await new Promise<number>((resolve) => {
          audio.onloadedmetadata = () => { resolve(audio.duration); audio.remove() }
          audio.onerror = () => resolve(0)
        })

        const createRes = await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: user?.fullName || user?.username || 'Unknown Artist',
            file_url: url,
            file_size: size || file.size,
            duration_seconds: Math.round(dur),
            mime_type: file.type || 'audio/mpeg',
          }),
        })
        if (!createRes.ok) throw new Error('Failed to save file metadata')
      } catch (err) {
        console.error('Upload error:', err)
      }
      index++
    }
    setUploading(false)
    setUploadProgress('')
    fetchFiles()
  }

  const handleDelete = async (file: LocalFile) => {
    if (!confirm(`Are you sure you want to delete "${file.title}"?`)) return
    try {
      await fetch(`/api/files`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id }) })
      setFiles(files.filter(f => f.id !== file.id))
      // Remove from selection if deleted
      const updated = new Set(selectedIds)
      updated.delete(file.id)
      setSelectedIds(updated)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const handlePlay = (file: LocalFile) => {
    const track: Track = {
      id: `local-${file.id}`,
      title: file.title,
      channelTitle: file.artist || 'Local File',
      thumbnailUrl: '',
      youtubeId: '',
      type: 'music',
      publishedAt: new Date().toISOString(),
      isLocal: true,
      audioUrl: file.file_url,
      duration: formatDuration(file.duration_seconds),
    }
    playTrack(track, [track])
    setPlaying(true)
  }

  const handleShare = (file: LocalFile) => {
    setSelectedFile(file)
    setCopied(false)
    setShowShareModal(true)
  }

  const copyShareLink = () => {
    if (!selectedFile?.share_token) return
    navigator.clipboard.writeText(`${window.location.origin}/api/files/share?token=${selectedFile.share_token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    const audioFiles = droppedFiles.filter(f => f.type.startsWith('audio/'))
    if (audioFiles.length > 0) {
      handleUploadBatch(audioFiles)
    }
  }

  // Toggle selection
  const toggleSelect = (id: string) => {
    const updated = new Set(selectedIds)
    if (updated.has(id)) {
      updated.delete(id)
    } else {
      updated.add(id)
    }
    setSelectedIds(updated)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(files.map(f => f.id)))
    }
  }

  // Create playlist folder from selection
  const handleCreatePlaylistFromSelected = () => {
    if (selectedIds.size === 0) return
    const playlistName = prompt('Enter playlist folder name:')
    if (!playlistName || !playlistName.trim()) return

    const selectedFiles = files.filter(f => selectedIds.has(f.id))
    const playlistTracks: Track[] = selectedFiles.map(f => ({
      id: `local-${f.id}`,
      title: f.title,
      channelTitle: f.artist || 'Local File',
      thumbnailUrl: '',
      youtubeId: '',
      type: 'music' as const,
      publishedAt: new Date().toISOString(),
      isLocal: true,
      audioUrl: f.file_url,
      duration: formatDuration(f.duration_seconds),
    }))

    const newPlaylist = {
      id: `pl_${Math.random().toString(36).substring(2, 9)}`,
      name: playlistName.trim(),
      tracks: playlistTracks,
      createdAt: new Date().toISOString()
    }

    // Update Zustang store state directly
    usePlayerStore.setState({
      playlists: [...playlists, newPlaylist]
    })

    setSelectedIds(new Set())
    alert(`Created folder playlist "${playlistName}" containing ${playlistTracks.length} tracks!`)
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <Music className="w-16 h-16 text-zinc-600" />
        <h2 className="text-2xl font-bold text-white">Sign in to manage your files</h2>
        <p className="text-zinc-400 max-w-md">Upload and listen to your local music files.</p>
        <button onClick={() => router.push('/sign-in')} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all hover:scale-105 cursor-pointer">
          <LogIn className="w-5 h-5" /> Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24 space-y-8 select-none selection:bg-white/20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Local Cloud Files</h1>
          <p className="text-xs text-zinc-400 mt-1">Make your own playlist folder, upload and share local tracks</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={handleCreatePlaylistFromSelected}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-lg"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Playlist Folder ({selectedIds.size})</span>
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-zinc-200 disabled:opacity-50 transition-all cursor-pointer shadow-md"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{uploading ? uploadProgress || 'Uploading...' : 'Upload Tracks'}</span>
          </button>
        </div>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="audio/*" 
          multiple
          onChange={(e) => { 
            const f = Array.from(e.target.files || []); 
            if (f.length > 0) handleUploadBatch(f); 
            e.target.value = '' 
          }} 
          className="hidden" 
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border border-dashed rounded-3xl p-10 text-center transition-all bg-zinc-950/20 backdrop-blur ${dragOver ? 'border-purple-500 bg-purple-500/5' : 'border-white/5 hover:border-white/10'}`}
      >
        <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
        <p className="text-xs text-zinc-300 font-bold">Drag & drop multiple audio tracks here to upload</p>
        <p className="text-[10px] text-zinc-500 mt-1">MP3, FLAC, WAV, AAC &mdash; Batch processing is supported</p>
      </div>

      {/* Files list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950/20 border border-white/5 rounded-3xl">
          <FileAudio className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p className="font-bold text-sm text-zinc-400">No tracks uploaded yet</p>
          <p className="text-xs text-zinc-500 mt-1">Drag files here to build your private music cloud</p>
        </div>
      ) : (
        <div className="space-y-1.5 bg-zinc-950/10 border border-white/5 p-4 rounded-3xl backdrop-blur">
          
          <div className="grid grid-cols-[30px_30px_1fr_120px_80px_60px_100px] gap-4 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 items-center">
            <button onClick={toggleSelectAll} className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-left">
              {selectedIds.size === files.length ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
            </button>
            <span className="w-8"></span>
            <span>Title</span>
            <span className="text-right">Duration</span>
            <span className="text-right">Size</span>
            <span className="text-center">Privacy</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="space-y-1">
            {files.map((file) => {
              const isActive = currentTrack?.id === `local-${file.id}`
              const isSelected = selectedIds.has(file.id)
              return (
                <div
                  key={file.id}
                  className={`grid grid-cols-[30px_30px_1fr_120px_80px_60px_100px] gap-4 items-center px-4 py-3 rounded-2xl transition-all border border-transparent ${isActive ? 'bg-white/10 border-white/5' : isSelected ? 'bg-purple-600/10 border-purple-500/10 hover:bg-purple-600/15' : 'hover:bg-white/[0.02]'}`}
                >
                  <button onClick={() => toggleSelect(file.id)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-left">
                    {isSelected ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
                  </button>

                  <button onClick={() => isActive ? setPlaying(!isPlaying) : handlePlay(file)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/15 transition-all flex-shrink-0 cursor-pointer">
                    {isActive && isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
                  </button>

                  <div className="min-w-0" onDoubleClick={() => handlePlay(file)}>
                    <p className={`text-xs font-bold truncate ${isActive ? 'text-purple-400' : 'text-white'}`}>{file.title}</p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{file.artist || 'Unknown Artist'}{file.album ? ` • ${file.album}` : ''}</p>
                  </div>

                  <span className="text-xs text-zinc-500 font-mono text-right">{formatDuration(file.duration_seconds)}</span>
                  <span className="text-xs text-zinc-500 text-right">{formatBytes(file.file_size)}</span>

                  <div className="flex justify-center">
                    {file.privacy_tier === 'public' ? <span title="Public"><Globe className="w-3.5 h-3.5 text-green-400" /></span>
                      : file.privacy_tier === 'unlisted' ? <span title="Unlisted"><Eye className="w-3.5 h-3.5 text-yellow-400" /></span>
                      : <span title="Private"><Lock className="w-3.5 h-3.5 text-zinc-500" /></span>}
                  </div>

                  <div className="flex items-center gap-1 justify-end">
                    {file.share_token && (
                      <button onClick={() => handleShare(file)} className="p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer" title="Share">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(file)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}

      {/* Share modal */}
      {showShareModal && selectedFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full space-y-4 border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Share Track</h3>
              <button onClick={() => setShowShareModal(false)} className="text-zinc-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-zinc-300 font-bold">{selectedFile.title}</p>
            {selectedFile.share_token ? (
              <div className="flex items-center gap-2">
                <input readOnly value={`${window.location.origin}/api/files/share?token=${selectedFile.share_token}`} className="flex-1 bg-zinc-850 border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none" />
                <button onClick={copyShareLink} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Make this file &quot;Unlisted&quot; to get a share link.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

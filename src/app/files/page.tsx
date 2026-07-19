'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { usePlayerStore } from '@/store/usePlayerStore'
import { Track } from '@/types/music-player'
import {
  Music, Upload, Play, Pause, Trash2, Share2, Clock, User, Globe, Lock, Eye,
  Music2, FileAudio, Loader2, X, Download, Check, LogIn, Copy
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
  const { playTrack, isPlaying, currentTrack, setPlaying, addToQueue, toggleLikeTrack, likedTracks } = usePlayerStore()
  const [files, setFiles] = useState<LocalFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<LocalFile | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', file)

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
          artist: user?.fullName || user?.username || 'Unknown',
          file_url: url,
          file_size: size || file.size,
          duration_seconds: Math.round(dur),
          mime_type: file.type || 'audio/mpeg',
        }),
      })
      if (!createRes.ok) throw new Error('Failed to save file metadata')

      setUploadProgress(100)
      fetchFiles()
    } catch (err: any) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (file: LocalFile) => {
    try {
      await fetch(`/api/files`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: file.id }) })
      setFiles(files.filter(f => f.id !== file.id))
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
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('audio/')) handleUpload(file)
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <Music className="w-16 h-16 text-zinc-600" />
        <h2 className="text-2xl font-bold text-white">Sign in to manage your files</h2>
        <p className="text-zinc-400 max-w-md">Upload and listen to your local music files.</p>
        <button onClick={() => router.push('/sign-in')} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all hover:scale-105">
          <LogIn className="w-5 h-5" /> Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 pb-24 space-y-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Files</h1>
          <p className="text-sm text-zinc-400 mt-1">Upload and manage your local music collection</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-sm hover:bg-zinc-200 disabled:opacity-50 transition-all"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? `Uploading ${uploadProgress}%` : 'Upload'}
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }} className="hidden" />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragOver ? 'border-white border-solid bg-white/5' : 'border-white/10 hover:border-white/20'}`}
      >
        <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
        <p className="text-sm text-zinc-400 font-medium">Drag & drop audio files here, or click Upload</p>
        <p className="text-xs text-zinc-600 mt-1">MP3, FLAC, WAV, AAC, OGG &mdash; max 50MB</p>
      </div>

      {/* Files list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <FileAudio className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No files yet</p>
          <p className="text-sm mt-1">Upload your first track to get started</p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5">
            <span className="w-8"></span>
            <span>Title</span>
            <span className="w-20 text-right">Duration</span>
            <span className="w-20 text-right">Size</span>
            <span className="w-16 text-center">Privacy</span>
            <span className="w-24 text-right">Actions</span>
          </div>
          {files.map((file) => {
            const isActive = currentTrack?.id === `local-${file.id}`
            return (
              <div
                key={file.id}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <button onClick={() => isActive ? setPlaying(!isPlaying) : handlePlay(file)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all flex-shrink-0">
                  {isActive && isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
                </button>

                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{file.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{file.artist || 'Unknown Artist'}{file.album ? ` • ${file.album}` : ''}</p>
                </div>

                <span className="text-xs text-zinc-500 font-mono w-20 text-right">{formatDuration(file.duration_seconds)}</span>
                <span className="text-xs text-zinc-500 w-20 text-right">{formatBytes(file.file_size)}</span>

                <div className="w-16 flex justify-center">
                  {file.privacy_tier === 'public' ? <Globe className="w-3.5 h-3.5 text-green-400" />
                    : file.privacy_tier === 'unlisted' ? <Eye className="w-3.5 h-3.5 text-yellow-400" />
                    : <Lock className="w-3.5 h-3.5 text-zinc-500" />}
                </div>

                <div className="flex items-center gap-1 w-24 justify-end">
                  {file.share_token && (
                    <button onClick={() => handleShare(file)} className="p-2 text-zinc-400 hover:text-white transition-colors" title="Share">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(file)} className="p-2 text-zinc-400 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Share modal */}
      {showShareModal && selectedFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Share Track</h3>
              <button onClick={() => setShowShareModal(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-zinc-300 font-medium">{selectedFile.title}</p>
            {selectedFile.share_token ? (
              <div className="flex items-center gap-2">
                <input readOnly value={`${window.location.origin}/api/files/share?token=${selectedFile.share_token}`} className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300" />
                <button onClick={copyShareLink} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all">
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

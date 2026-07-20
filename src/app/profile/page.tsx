'use client';

import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Track } from '@/types/music-player';
import { 
  Play, 
  Pause, 
  Heart, 
  Music, 
  Clock, 
  User, 
  Plus, 
  Radio, 
  Trash2, 
  Check, 
  Edit2, 
  ExternalLink, 
  LogIn, 
  Upload, 
  Camera, 
  X 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, SignInButton } from '@clerk/nextjs';
import { PlayingEqualizer, ExplicitBadge } from '@/components/pages/shared';

export default function ProfilePage() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const {
    playlists,
    likedTracks,
    subscribedChannels,
    history,
    displayName,
    avatarUrl,
    setDisplayName,
    setAvatarUrl,
    playTrack,
    isPlaying,
    currentTrack,
    setPlaying,
    addToQueue,
    toggleLikeTrack
  } = usePlayerStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [resolvedChannels, setResolvedChannels] = useState<any[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);

  // Sync edits when loaded
  useEffect(() => {
    setTempName(displayName);
  }, [displayName]);

  useEffect(() => {
    setTempAvatar(avatarUrl);
  }, [avatarUrl]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');
      formData.append('folder', user?.id || '');

      const uploadRes = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      
      const { url } = await uploadRes.json();
      setTempAvatar(url);
      
      // Also update Clerk avatar
      await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url }),
      });
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  // Fetch Subscribed Channels detail (avatar/title)
  useEffect(() => {
    const fetchSubscribedDetails = async () => {
      setChannelsLoading(true);
      try {
        const details = await Promise.all(
          subscribedChannels.map(async (id) => {
            try {
              const res = await fetch(`/api/youtube/channel/${encodeURIComponent(id)}`);
              if (res.ok) {
                const data = await res.json();
                return {
                  id: id,
                  title: data.profile?.title || 'Unknown Artist',
                  thumbnailUrl: data.profile?.avatarUrl || '',
                  subscribers: data.profile?.subscribers || ''
                };
              }
            } catch (err) {
              console.error(`Failed to fetch channel details for ${id}:`, err);
            }
            return { id, title: 'Artist', thumbnailUrl: '', subscribers: '' };
          })
        );
        setResolvedChannels(details.filter(Boolean));
      } catch (err) {
        console.error('Subscribed channels fetch error:', err);
      } finally {
        setChannelsLoading(false);
      }
    };

    if (subscribedChannels.length > 0) {
      fetchSubscribedDetails();
    } else {
      setResolvedChannels([]);
    }
  }, [subscribedChannels]);

  // Sync Clerk data to store
  useEffect(() => {
    if (isSignedIn && user) {
      const name = user.fullName || user.username || user.primaryEmailAddress?.emailAddress || '';
      if (name) setDisplayName(name);
      if (user.imageUrl) setAvatarUrl(user.imageUrl);
    }
  }, [isSignedIn, user, setDisplayName, setAvatarUrl]);

  // Playback handlers
  const handlePlaySong = (track: Track, contextList: Track[]) => {
    playTrack(track, contextList);
    setPlaying(true);
  };

  const handlePlayAllLiked = () => {
    if (likedTracks.length > 0) {
      handlePlaySong(likedTracks[0], likedTracks);
    }
  };

  const handlePlayAllHistory = () => {
    if (history.length > 0) {
      handlePlaySong(history[0], history);
    }
  };

  const handleSaveProfile = () => {
    if (tempName.trim()) {
      setDisplayName(tempName.trim());
      setIsEditingName(false);
    }
    setAvatarUrl(tempAvatar);
    setShowAvatarEditor(false);
  };

  const isCurrentActive = (track: Track) => {
    return currentTrack?.id === track.id;
  };

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <User className="w-16 h-16 text-zinc-600" />
        <h2 className="text-2xl font-bold text-white">Sign in to view your profile</h2>
        <p className="text-zinc-400 max-w-md">Connect your account to see your playlists, liked tracks, and listening history.</p>
        <SignInButton mode="modal">
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all hover:scale-105">
            <LogIn className="w-5 h-5" />
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto animate-fade-in select-none">
      
      {/* 1. Header Profile Banner */}
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff0000]/5 to-[#0055ff]/5 pointer-events-none z-0" />
        
          {/* User Picture */}
          <div className="relative z-10 flex-shrink-0 group">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold uppercase shadow-2xl border-2 border-white/10 relative overflow-hidden bg-[#0055ff]">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/')) ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{displayName ? displayName.charAt(0).toUpperCase() : '?'}</span>
              )}
            </div>
            <button 
              onClick={() => setShowAvatarEditor(!showAvatarEditor)}
              className="absolute bottom-1 right-1 p-2 rounded-full bg-zinc-900 border border-white/10 text-white hover:bg-zinc-800 transition-colors shadow-lg cursor-pointer"
              title="Change Avatar"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

        {/* User Details */}
        <div className="relative z-10 text-center md:text-left flex-1 space-y-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            Listener Profile
          </span>
          
          {isEditingName ? (
            <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                maxLength={25}
                className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-lg font-bold text-white focus:outline-none focus:border-white/20"
              />
              <button onClick={handleSaveProfile} className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"><Check className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center justify-center md:justify-start gap-3 pt-2 group/title">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{displayName}</h1>
              <button 
                onClick={() => setIsEditingName(true)}
                className="opacity-0 group-hover/title:opacity-100 p-1 text-zinc-400 hover:text-white transition-opacity cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <p className="text-xs text-zinc-500 font-medium">Synced instantly across the database via secure Clerk authentication.</p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
            <button
              onClick={() => router.push('/artist/dashboard')}
              className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold tracking-wide transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Artist Studio
            </button>
            <button
              onClick={() => router.push('/admin/login')}
              className="px-4 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold tracking-wide transition-all shadow-md active:scale-95 cursor-pointer border border-white/5"
            >
              Admin Panel
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Presets & Custom Image Editor */}
      {showAvatarEditor && (
        <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-4 animate-scale-up">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Customize Profile Picture</h3>
          <div className="space-y-4">
            <div>
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Upload Image</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors group">
                  <Upload className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
                <span className="text-xs text-zinc-400">JPG/PNG up to 2MB</span>
              </div>
              {avatarUploading && <div className="mt-2 text-xs text-yellow-400">Uploading...</div>}
            </div>
            <div>
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Preset Colors</span>
              <div className="flex items-center gap-3">
                {[
                  'bg-gradient-to-tr from-blue-600 to-indigo-900',
                  'bg-gradient-to-tr from-orange-500 to-red-600',
                  'bg-gradient-to-tr from-purple-600 to-pink-600',
                  'bg-gradient-to-tr from-green-500 to-teal-700',
                  'bg-gradient-to-tr from-amber-500 to-yellow-600'
                ].map((grad) => (
                  <button
                    key={grad}
                    onClick={() => setTempAvatar(grad)}
                    className={`w-9 h-9 rounded-full transition-transform active:scale-95 border-2 ${grad} ${
                      tempAvatar === grad ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <span className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Or Custom Image URL</span>
              <input
                type="text"
                value={tempAvatar.startsWith('bg-') ? '' : tempAvatar}
                onChange={(e) => setTempAvatar(e.target.value)}
                placeholder="https://images.unsplash.com/photo-example..."
                className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button 
                onClick={handleSaveProfile} 
                className="px-4 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-full transition-all"
              >
                Apply Avatar
              </button>
              <button 
                onClick={() => { setShowAvatarEditor(false); setTempAvatar(avatarUrl); }} 
                className="px-4 py-1.5 bg-white/5 text-zinc-300 hover:text-white text-xs font-semibold rounded-full transition-all border border-white/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Liked Music & History Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LIKED TRACKS */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#ff0000] fill-current" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Liked Music ({likedTracks.length})</h2>
            </div>
            {likedTracks.length > 0 && (
              <button
                onClick={handlePlayAllLiked}
                className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play All
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[360px] custom-scrollbar space-y-1.5 pr-2">
            {likedTracks.map((track, i) => {
              const active = isCurrentActive(track);
              return (
                <div
                  key={`liked-${track.id}`}
                  onDoubleClick={() => handlePlaySong(track, likedTracks)}
                  className={`group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors ${
                    active ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="w-8 flex items-center justify-center flex-shrink-0 relative">
                    {active ? (
                      <>
                        <div className="group-hover:hidden flex items-center justify-center">
                          <PlayingEqualizer isPlaying={isPlaying} />
                        </div>
                        <button
                          onClick={() => handlePlaySong(track, likedTracks)}
                          className="hidden group-hover:flex items-center justify-center text-white"
                        >
                          {isPlaying ? <Pause className="w-4 h-4 fill-current text-[#ff0000]" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-zinc-500 font-semibold group-hover:hidden">{i + 1}</span>
                        <button
                          onClick={() => handlePlaySong(track, likedTracks)}
                          className="hidden group-hover:flex items-center justify-center text-white"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      </>
                    )}
                  </div>
                  <img src={track.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-9 h-9 rounded object-cover flex-shrink-0 border border-white/5" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${active ? 'text-[#ff0000]' : 'text-white'}`}>
                      {track.title}
                      {track.isExplicit && <ExplicitBadge />}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{track.channelTitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleLikeTrack(track)}
                      className="p-1.5 text-[#ff0000] hover:text-zinc-400 transition-colors flex-shrink-0"
                      title="Unlike"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button 
                      onClick={() => usePlayerStore.getState().playNext(track)}
                      className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex-shrink-0"
                    >
                      + Next
                    </button>
                    <button 
                      onClick={() => addToQueue(track)}
                      className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex-shrink-0"
                    >
                      + Queue
                    </button>
                  </div>
                </div>
              );
            })}
            {likedTracks.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-16">
                <Heart className="w-8 h-8 text-zinc-600 mb-2" />
                <p className="text-xs font-medium">No liked songs yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* PLAY HISTORY */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Play History ({history.length})</h2>
            </div>
            {history.length > 0 && (
              <button
                onClick={handlePlayAllHistory}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px] custom-scrollbar space-y-1.5 pr-2">
            {history.map((track, i) => {
              const active = isCurrentActive(track);
              return (
                <div
                  key={`hist-${track.id}-${i}`}
                  onDoubleClick={() => handlePlaySong(track, history)}
                  className={`group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors ${
                    active ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="w-8 flex items-center justify-center flex-shrink-0 relative">
                    {active ? (
                      <>
                        <div className="group-hover:hidden flex items-center justify-center">
                          <PlayingEqualizer isPlaying={isPlaying} />
                        </div>
                        <button
                          onClick={() => handlePlaySong(track, history)}
                          className="hidden group-hover:flex items-center justify-center text-white"
                        >
                          {isPlaying ? <Pause className="w-4 h-4 fill-current text-[#ff0000]" /> : <Play className="w-4 h-4 fill-current" />}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-zinc-500 font-semibold group-hover:hidden">{i + 1}</span>
                        <button
                          onClick={() => handlePlaySong(track, history)}
                          className="hidden group-hover:flex items-center justify-center text-white"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      </>
                    )}
                  </div>
                  <img src={track.thumbnailUrl || undefined} referrerPolicy="no-referrer" alt="" className="w-9 h-9 rounded object-cover flex-shrink-0 border border-white/5" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold truncate ${active ? 'text-[#ff0000]' : 'text-white'}`}>
                      {track.title}
                      {track.isExplicit && <ExplicitBadge />}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{track.channelTitle}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button 
                      onClick={() => usePlayerStore.getState().playNext(track)}
                      className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex-shrink-0"
                    >
                      + Next
                    </button>
                    <button 
                      onClick={() => addToQueue(track)}
                      className="text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex-shrink-0"
                    >
                      + Queue
                    </button>
                  </div>
                </div>
              );
            })}
            {history.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-16">
                <Clock className="w-8 h-8 text-zinc-600 mb-2" />
                <p className="text-xs font-medium">No listening history yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Playlists and Subscriptions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* MY PLAYLISTS */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-zinc-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">My Playlists ({playlists.length})</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                onClick={() => router.push(`/playlist/${playlist.id}`)}
                className="group p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-all flex flex-col gap-2 relative"
              >
                <div className="w-full aspect-square rounded-lg bg-zinc-900 flex items-center justify-center border border-white/5 shadow relative overflow-hidden">
                  {playlist.tracks[0]?.thumbnailUrl ? (
                    <img src={playlist.tracks[0].thumbnailUrl} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-8 h-8 text-zinc-600" />
                  )}
                  {playlist.tracks.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySong(playlist.tracks[0], playlist.tracks);
                      }}
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white text-black hover:scale-105 transition-transform flex items-center justify-center shadow-lg cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{playlist.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">{playlist.tracks.length} songs</p>
                </div>
              </div>
            ))}
            {playlists.length === 0 && (
              <div className="col-span-2 py-16 flex flex-col items-center justify-center text-zinc-500">
                <Music className="w-8 h-8 text-zinc-600 mb-2" />
                <p className="text-xs font-medium">No playlists created.</p>
              </div>
            )}
          </div>
        </div>

        {/* SUBSCRIBED ARTISTS */}
        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-zinc-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Subscribed Artists ({subscribedChannels.length})</h2>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-4 py-2 pr-2 custom-scrollbar">
            {channelsLoading ? (
              <div className="flex gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={`channel-skel-${i}`} className="flex-shrink-0 w-24 flex flex-col items-center space-y-1.5 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-white/5" />
                    <div className="h-2 w-12 bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : resolvedChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => router.push(`/artist/${encodeURIComponent(channel.title || channel.id)}`)}
                className="group flex-shrink-0 w-24 flex flex-col items-center text-center cursor-pointer space-y-1.5"
              >
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 shadow-md overflow-hidden relative group-hover:scale-105 transition-transform duration-200">
                  {channel.thumbnailUrl ? (
                    <img src={channel.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-zinc-600" />
                  )}
                </div>
                <h4 className="text-[11px] font-bold text-white truncate w-full group-hover:underline">{channel.title}</h4>
              </div>
            ))}
            {!channelsLoading && subscribedChannels.length === 0 && (
              <div className="w-full py-16 flex flex-col items-center justify-center text-zinc-500">
                <User className="w-8 h-8 text-zinc-600 mb-2" />
                <p className="text-xs font-medium">No subscribed artists yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Compass, Heart, Music, Clock, Plus, Play, Shuffle, Dices } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaybackStore, useUIStore, useNavigationStore } from "@/store/usePlayerStore";
import { searchApi, recommendationsApi } from "@/lib/api/client";
import { formatDuration } from "@/lib/utils";
import type { Track, Playlist } from "@/store/types";

export function HomePage() {
  const { currentTrack, isPlaying, togglePlay, setQueue, addToQueue } = usePlaybackStore();
  const { activeTab, setActiveTab, navigateWithParams } = useNavigationStore();
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    try {
      setLoading(true);
      const [recs, recent] = await Promise.all([
        recommendationsApi.get(),
        // TODO: get recently played from API
        Promise.resolve([] as Track[]),
      ]);
      setRecommendations(recs || []);
      setRecentlyPlayed(recent || []);
    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setLoading(false);
    }
  }

  function playTrack(track: Track) {
    setQueue([track]);
  }

  function playAll(tracks: Track[]) {
    if (tracks.length > 0) setQueue(tracks);
  }

  function shufflePlay(tracks: Track[]) {
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-amber-600/10 p-8 border border-border-primary"
      >
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Your Music, <span className="text-amber-500">Elevated</span>
          </h1>
          <p className="text-xl text-text-muted mb-6">
            Discover, play, and organize music with synced lyrics, offline downloads, and seamless sync.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigateWithParams("explore")}
              className="btn-primary px-6 py-3"
            >
              <Compass className="mr-2 h-5 w-5" />
              Explore
            </button>
            <button
              onClick={() => navigateWithParams("library")}
              className="btn-secondary px-6 py-3"
            >
              <Music className="mr-2 h-5 w-5" />
              Library
            </button>
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl" />
        </div>
      </motion.section>

      {/* Quick Actions */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Dices, label: "Surprise Me", action: () => shufflePlay(recommendations) },
          { icon: Clock, label: "Recently Played", action: () => navigateWithParams("history") },
          { icon: Heart, label: "Liked Songs", action: () => navigateWithParams("liked") },
          { icon: Plus, label: "Create Playlist", action: () => navigateWithParams("playlists") },
        ].map((item) => (
          <motion.button
            key={item.label}
            onClick={item.action}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card-hover flex flex-col items-center gap-3 p-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/20">
              <item.icon className="h-7 w-7 text-amber-500" />
            </div>
            <span className="font-medium text-text-primary">{item.label}</span>
          </motion.button>
        ))}
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary">Recommended for You</h2>
            <button className="btn-ghost text-sm">View All</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {recommendations.slice(0, 10).map((track) => (
              <TrackCard key={track.id} track={track} onPlay={playTrack} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary">Recently Played</h2>
            <button className="btn-ghost text-sm">View All</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {recentlyPlayed.slice(0, 10).map((track) => (
              <TrackCard key={track.id} track={track} onPlay={playTrack} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && recentlyPlayed.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-64 text-center"
        >
          <Music className="h-16 w-16 text-text-muted/50 mb-4" />
          <h3 className="text-xl font-medium text-text-primary mb-2">No recommendations yet</h3>
          <p className="text-text-muted mb-4">Start listening to get personalized recommendations</p>
          <button onClick={() => navigateWithParams("explore")} className="btn-primary">
            <Compass className="mr-2 h-4 w-4" />
            Explore Music
          </button>
        </motion.div>
      )}
    </div>
  );
}

function TrackCard({ track, onPlay }: { track: Track; onPlay: (track: Track) => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group flex flex-col gap-2"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-bg-tertiary">
        <img
          src={track.thumbnailUrl}
          alt={track.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(track);
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Play className="h-10 w-10 text-white" />
        </button>
        {track.duration && (
          <span className="absolute bottom-2 right-2 text-xs px-1.5 py-0.5 bg-black/80 text-white rounded">
            {formatDuration(track.duration)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-text-primary truncate">{track.title}</p>
        <p className="text-sm text-text-muted truncate">{track.channelTitle}</p>
      </div>
    </motion.div>
  );
}
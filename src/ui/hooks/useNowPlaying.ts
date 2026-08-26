// Now Playing Hook
import { usePlaybackStore } from "@/store/usePlayerStore";

export function useNowPlaying() {
  const { currentTrack, isPlaying, progress, duration } = usePlaybackStore();

  return {
    currentTrack,
    isPlaying,
    progress,
    duration,
    progressPercent: duration > 0 ? (progress / duration) * 100 : 0,
  };
}
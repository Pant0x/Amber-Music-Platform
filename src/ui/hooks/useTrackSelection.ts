// Track Selection Hook
import { useCollectionStore } from "@/store/usePlayerStore";

export function useTrackSelection() {
  const { toggleLikeTrack, isTrackLiked, toggleDownload, isTrackDownloaded } = useCollectionStore();

  return {
    toggleLikeTrack,
    isTrackLiked,
    toggleDownload,
    isTrackDownloaded,
  };
}
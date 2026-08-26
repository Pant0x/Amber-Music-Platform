// Artwork Cache
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ArtworkCacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
}

interface ArtworkCacheState {
  cache: Map<string, ArtworkCacheEntry>;
  maxSize: number;
  get: (url: string) => Blob | null;
  set: (url: string, blob: Blob) => void;
  clear: () => void;
  hydrate: () => void;
}

export const useArtworkCache = create<ArtworkCacheState>()(
  persist(
    (set, get) => ({
      cache: new Map(),
      maxSize: 100 * 1024 * 1024, // 100MB
      get: (url) => {
        const entry = get().cache.get(url);
        if (entry && Date.now() - entry.timestamp < 7 * 24 * 60 * 60 * 1000) {
          return entry.blob;
        }
        return null;
      },
      set: (url, blob) =>
        set((state) => {
          const newCache = new Map(state.cache);
          newCache.set(url, { url, blob, timestamp: Date.now() });
          // Evict old entries if over size
          let totalSize = 0;
          for (const [, entry] of newCache) {
            totalSize += entry.blob.size;
          }
          while (totalSize > state.maxSize && newCache.size > 0) {
            const firstKey = newCache.keys().next().value;
            if (firstKey) {
              const entry = newCache.get(firstKey);
              if (entry) totalSize -= entry.blob.size;
              newCache.delete(firstKey);
            }
          }
          return { cache: newCache };
        }),
      clear: () => set({ cache: new Map() }),
      hydrate: () => {
        // Called on app startup
      },
    }),
    {
      name: "amber-artwork-cache",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ maxSize: state.maxSize }),
    }
  )
);

export function hydrateArtworkCache() {
  // Called on app startup
}
// Cache Management
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

interface CacheState {
  cache: Map<string, CacheEntry<any>>;
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttl?: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  clearExpired: () => void;
}

export const useCache = create<CacheState>()(
  persist(
    (set, get) => ({
      cache: new Map(),
      get: <T>(key: string) => {
        const entry = get().cache.get(key);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          get().cache.delete(key);
          return null;
        }
        return entry.data as T;
      },
      set: <T>(key: string, data: T, ttl?: number) =>
        set((state) => {
          const newCache = new Map(state.cache);
          newCache.set(key, {
            data,
            timestamp: Date.now(),
            expiresAt: ttl ? Date.now() + ttl : undefined,
          });
          return { cache: newCache };
        }),
      remove: (key) =>
        set((state) => {
          const newCache = new Map(state.cache);
          newCache.delete(key);
          return { cache: newCache };
        }),
      clear: () => set({ cache: new Map() }),
      clearExpired: () =>
        set((state) => {
          const newCache = new Map(state.cache);
          const now = Date.now();
          for (const [key, entry] of newCache) {
            if (entry.expiresAt && now > entry.expiresAt) {
              newCache.delete(key);
            }
          }
          return { cache: newCache };
        }),
    }),
    {
      name: "amber-cache",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({}),
    }
  )
);

export function clearCache() {
  useCache.getState().clear();
}
import { invoke, isTauri } from "@tauri-apps/api/core";
import { clearArtworkCache } from "./artworkCache";
import { logInternalWarn } from "./logging";

export const DEFAULT_CACHE_SIZE_GB = 4;

export interface CacheStats {
  maxBytes: number;
  usedBytes: number;
  entryCount: number;
}

interface CacheWriteResult {
  changed: boolean;
}

const webMemoryCache = new Map<string, string>();

export async function getCachedJson<T>(key: string): Promise<T | null> {
  if (!isTauri()) {
    const val = webMemoryCache.get(key);
    return val !== undefined ? (JSON.parse(val) as T) : null;
  }
  try {
    const value = await invoke<string | null>("cache_get", { key });
    return value === null ? null : (JSON.parse(value) as T);
  } catch (error) {
    logInternalWarn("cache.get failed", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function setCachedJson<T>(key: string, value: T): Promise<boolean> {
  if (!isTauri()) {
    const str = JSON.stringify(value);
    const existing = webMemoryCache.get(key);
    webMemoryCache.set(key, str);
    return existing !== str;
  }
  try {
    const result = await invoke<CacheWriteResult>("cache_set", {
      key,
      value: JSON.stringify(value),
    });
    return result.changed;
  } catch (error) {
    logInternalWarn("cache.set failed", {
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export function getCacheStats(): Promise<CacheStats> {
  if (!isTauri()) {
    return Promise.resolve({
      maxBytes: 1024 * 1024 * 50,
      usedBytes: webMemoryCache.size * 1024,
      entryCount: webMemoryCache.size,
    });
  }
  return invoke<CacheStats>("cache_stats");
}

export function setCacheMaxBytes(maxBytes: number): Promise<CacheStats> {
  if (!isTauri()) {
    return Promise.resolve({
      maxBytes,
      usedBytes: webMemoryCache.size * 1024,
      entryCount: webMemoryCache.size,
    });
  }
  return invoke<CacheStats>("cache_set_max_bytes", { maxBytes });
}

export function clearCache(): Promise<CacheStats> {
  clearArtworkCache();
  if (!isTauri()) {
    webMemoryCache.clear();
    return Promise.resolve({
      maxBytes: 1024 * 1024 * 50,
      usedBytes: 0,
      entryCount: 0,
    });
  }
  return invoke<CacheStats>("cache_clear");
}

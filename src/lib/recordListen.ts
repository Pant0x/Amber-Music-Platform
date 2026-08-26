// Record Listen History
import { listenHistoryApi } from "@/lib/api/client";

export async function recordListen(
  trackId: string,
  source: string,
  progress: number,
  metadata?: { title: string; artist: string; duration: number }
) {
  try {
    await listenHistoryApi.record({ trackId, source, progress });
  } catch (error) {
    console.error("Failed to record listen:", error);
  }
}

export async function recordPlayStart(trackId: string, source: string, metadata?: any) {
  return recordListen(trackId, source, 0, metadata);
}

export async function recordPlayProgress(trackId: string, source: string, progress: number) {
  return recordListen(trackId, source, progress);
}

export async function recordPlayComplete(trackId: string, source: string) {
  return recordListen(trackId, source, 100);
}
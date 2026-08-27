// YouTube Music Adapter
// Server-side adapter for YouTube Music API

import YTMusic from "ytmusic-api";

let ytMusicClient: YTMusic | null = null;
let initPromise: Promise<any> | null = null;

async function getYTMusic(): Promise<YTMusic> {
  if (!ytMusicClient) {
    ytMusicClient = new YTMusic();
    initPromise = ytMusicClient.initialize().catch((err) => {
      ytMusicClient = null;
      initPromise = null;
      throw err;
    });
  }
  if (initPromise) {
    await initPromise;
    initPromise = null;
  }
  return ytMusicClient;
}

export async function ytMusicSearch(query: string) {
  try {
    const yt = await getYTMusic();
    const [songs, artists, albums] = await Promise.all([
      yt.searchSongs(query).catch(() => []),
      yt.searchArtists(query).catch(() => []),
      yt.searchAlbums(query).catch(() => []),
    ]);
    return { songs, artists, albums };
  } catch (error) {
    console.error("ytMusicSearch error:", error);
    return { songs: [], artists: [], albums: [] };
  }
}

export function cleanTopicGlobally(data: any): any {
  if (Array.isArray(data)) {
    return data.map(cleanTopicGlobally);
  }
  if (data && typeof data === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === "topic" || key === "topicId") continue;
      cleaned[key] = cleanTopicGlobally(value);
    }
    return cleaned;
  }
  return data;
}

export async function getVideoById(videoId: string) {
  try {
    const yt = await getYTMusic();
    return await yt.getVideo(videoId).catch(() => null);
  } catch (error) {
    console.error("getVideoById error:", error);
    return null;
  }
}
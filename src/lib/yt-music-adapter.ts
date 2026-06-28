// Server-side adapter wrapper for optional `node-youtube-music` integration.
// Dynamically imports the package so client bundles do not include it.

type SearchResult = any;

async function getYtMusicClient() {
  try {
    // dynamic import so bundlers don't include this in client builds
    const mod = await import('node-youtube-music');
    // module may export default or named functions
    return (mod && (mod.default || mod));
  } catch (err) {
    console.warn('node-youtube-music not available:', err);
    return null;
  }
}

export async function searchYTMusic(query: string): Promise<SearchResult | null> {
  const client = await getYtMusicClient();
  if (!client) return null;
  try {
    if (typeof client.search === 'function') {
      return await client.search(query);
    }
    // some variants export `searchMusic`
    if (typeof client.searchMusic === 'function') {
      return await client.searchMusic(query);
    }
    return null;
  } catch (e) {
    console.error('YT Music adapter search error', e);
    return null;
  }
}

export async function getVideoById(videoId: string): Promise<any | null> {
  const client = await getYtMusicClient();
  if (!client) return null;
  try {
    if (typeof client.getVideo === 'function') {
      return await client.getVideo(videoId);
    }
    if (typeof client.video === 'function') {
      return await client.video(videoId);
    }
    return null;
  } catch (e) {
    console.error('YT Music adapter getVideo error', e);
    return null;
  }
}

export async function getArtist(artistIdOrName: string): Promise<any | null> {
  const client = await getYtMusicClient();
  if (!client) return null;
  try {
    if (typeof client.getArtist === 'function') {
      return await client.getArtist(artistIdOrName);
    }
    if (typeof client.artist === 'function') {
      return await client.artist(artistIdOrName);
    }
    return null;
  } catch (e) {
    console.error('YT Music adapter getArtist error', e);
    return null;
  }
}

export default {
  searchYTMusic,
  getVideoById,
  getArtist
};

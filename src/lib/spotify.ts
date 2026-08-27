// Spotify API
import SpotifyWebApi from "spotify-web-api-node";

let spotifyApi: SpotifyWebApi | null = null;

export async function getSpotifyApi(): Promise<SpotifyWebApi> {
  if (!spotifyApi) {
    spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    // Get client credentials token
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);

    // Refresh token periodically
    setInterval(async () => {
      try {
        const data = await spotifyApi!.clientCredentialsGrant();
        spotifyApi!.setAccessToken(data.body.access_token);
      } catch (error) {
        console.error("Spotify token refresh failed:", error);
      }
    }, 55 * 60 * 1000); // 55 minutes
  }
  return spotifyApi;
}

export async function searchSpotify(query: string, types: Array<"track" | "artist" | "album" | "playlist"> = ["track", "artist", "album", "playlist"], limit = 20) {
  const api = await getSpotifyApi();
  return api.search(query, types, { limit });
}

export async function getSpotifyTrack(trackId: string) {
  const api = await getSpotifyApi();
  return api.getTrack(trackId);
}

export async function getSpotifyArtist(artistId: string) {
  const api = await getSpotifyApi();
  return api.getArtist(artistId);
}

export async function getSpotifyAlbum(albumId: string) {
  const api = await getSpotifyApi();
  return api.getAlbum(albumId);
}

export async function getSpotifyPlaylist(playlistId: string) {
  const api = await getSpotifyApi();
  return api.getPlaylist(playlistId);
}
import SpotifyWebApi from 'spotify-web-api-node';

let spotifyApiInstance: SpotifyWebApi | null = null;
let tokenExpirationTime = 0;

export async function getSpotifyApi(): Promise<SpotifyWebApi> {
  if (!spotifyApiInstance) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment variables.");
    }
    
    spotifyApiInstance = new SpotifyWebApi({
      clientId,
      clientSecret
    });
  }

  const now = Date.now();
  if (now >= tokenExpirationTime) {
    try {
      console.debug('[Spotify Helper] Fetching new client credentials token...');
      const data = await spotifyApiInstance.clientCredentialsGrant();
      const accessToken = data.body['access_token'];
      const expiresIn = data.body['expires_in']; // usually 3600 seconds
      
      spotifyApiInstance.setAccessToken(accessToken);
      tokenExpirationTime = now + (expiresIn - 60) * 1000; // Refresh 1 minute early
      console.debug('[Spotify Helper] Access token successfully set and scheduled for renewal.');
    } catch (err) {
      console.error('[Spotify Helper] Failed to authenticate with Spotify API:', err);
      throw err;
    }
  }

  return spotifyApiInstance;
}

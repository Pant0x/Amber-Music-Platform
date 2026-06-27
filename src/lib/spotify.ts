import SpotifyWebApi from 'spotify-web-api-node';

let spotifyApiInstance: SpotifyWebApi | null = null;
let tokenExpirationTime = 0;

export async function getSpotifyApi(): Promise<SpotifyWebApi> {
  if (!spotifyApiInstance) {
    spotifyApiInstance = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID || '13d23838b1d34500ad6567a12b176b87',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '294076627db14a59b64ad82b49e1b302'
    });
  }

  const now = Date.now();
  if (now >= tokenExpirationTime) {
    try {
      console.log('[Spotify Helper] Fetching new client credentials token...');
      const data = await spotifyApiInstance.clientCredentialsGrant();
      const accessToken = data.body['access_token'];
      const expiresIn = data.body['expires_in']; // usually 3600 seconds
      
      spotifyApiInstance.setAccessToken(accessToken);
      tokenExpirationTime = now + (expiresIn - 60) * 1000; // Refresh 1 minute early
      console.log('[Spotify Helper] Access token successfully set and scheduled for renewal.');
    } catch (err) {
      console.error('[Spotify Helper] Failed to authenticate with Spotify API:', err);
      throw err;
    }
  }

  return spotifyApiInstance;
}

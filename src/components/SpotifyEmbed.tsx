'use client'

import React, { useEffect, useRef } from 'react';

interface SpotifyEmbedProps {
  trackId: string;
  title?: string;
  artist?: string;
  className?: string;
}

export const SpotifyEmbed: React.FC<SpotifyEmbedProps> = ({
  trackId,
  title = 'Spotify Track',
  artist = '',
  className = '',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Spotify doesn't support direct embedding via Web Playback SDK for iframes
  // The best approach is to use their official embed URL
  const embedUrl = trackId.startsWith('spotify:')
    ? trackId
    : `spotify:track:${trackId}`;

  const formattedUrl = `https://open.spotify.com/embed/track/${trackId}`;

  return (
    <div 
      className={`w-full rounded-xl overflow-hidden shadow-lg ${className}`}
      onClick={() => {
        // Open Spotify in new tab when clicked
        window.open(`https://open.spotify.com/track/${trackId}`, '_blank');
      }}
    >
      <iframe
        ref={iframeRef}
        src={formattedUrl}
        width="100%"
        height="80"
        frameBorder="none"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
};

interface SpotifyPlayerProps {
  trackId: string;
  token?: string;
  className?: string;
}

// Spotify Web Playback SDK player (more interactive)
export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({
  trackId,
  token,
  className = '',
}) => {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  useEffect(() => {
    if (!token) return;

    // Load Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as any).SpotifyWebPlaybackSDK.SpotifyPlayer({
        name: 'Sonora Web Player',
        getOAuthToken: (cb: (token: string) => void) => cb(token),
        volume: 0.5,
      });

      // Connect to Spotify
      player.connect();
      player.addListener('ready', () => {
        setIsReady(true);
      });

      player.addListener('player_state_changed', (state: any) => {
        if (state) {
          setIsPlaying(!state.paused);
        }
      });

      // Play specific track
      player.resume();
      player.queue([trackId]);

      playerRef.current = player;
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [token, trackId]);

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.togglePlay();
      }
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SpotifyEmbed trackId={trackId} />
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-all"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  );
};
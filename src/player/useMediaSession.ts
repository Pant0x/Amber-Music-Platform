// Media Session API
export function useMediaSession() {
  const setMediaSession = (metadata: any) => {
    if ("mediaSession" in navigator) {
      (navigator as any).mediaSession.metadata = new MediaMetadata(metadata);
    }
  };

  const setActionHandler = (action: string, handler: () => void) => {
    if ("mediaSession" in navigator) {
      (navigator as any).mediaSession.setActionHandler(action, handler);
    }
  };

  return { setMediaSession, setActionHandler };
}
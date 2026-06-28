export async function recordListen(payload: { track_id?: string | null; youtube_id?: string | null; played_seconds?: number; duration_seconds?: number; metadata?: any }, accessToken?: string | null) {
  try {
    await fetch('/api/listen_history', {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    // Best-effort background write — fail silently
    console.warn('recordListen failed', e);
  }
}

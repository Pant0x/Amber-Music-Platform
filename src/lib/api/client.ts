const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  cache?: "force-cache" | "no-store" | "default";
  next?: { revalidate?: number; tags?: string[] };
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, cache = "no-store", next, headers, ...fetchOptions } = options;

  const url = new URL(`${API_BASE}/api${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    cache,
    next,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

const baseApi = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

export const api = Object.assign(baseApi, {
  search: null as any,
  youtube: null as any,
  lyrics: null as any,
  radio: null as any,
  recommendations: null as any,
  transfer: null as any,
  artist: null as any,
  storage: null as any,
  devices: null as any,
  files: null as any,
  subscription: null as any,
  admin: null as any,
  shazam: null as any,
  spotify: null as any,
  listenHistory: null as any,
});

export const searchApi = {
  search: (query: string, options?: RequestOptions) =>
    api.get<{
      topResult: any;
      songs: any[];
      artists: any[];
      albums: any[];
      communityPlaylists: any[];
    }>("/search", { params: { q: query }, ...options }),

  suggestions: (query: string, options?: RequestOptions) =>
    api.get<string[]>("/search/suggestions", { params: { q: query }, ...options }),

  trending: (options?: RequestOptions) =>
    api.get<any[]>("/search/trending", options),
};

export const youtubeApi = {
  resolve: (title: string, artist: string, options?: RequestOptions) =>
    api.get<{ videoId: string; track: any }>("/youtube/resolve", {
      params: { title, artist, mode: "song" },
      ...options,
    }),

  next: (videoId: string, options?: RequestOptions) =>
    api.get<any>("/youtube/next", { params: { videoId }, ...options }),

  playlist: (playlistId: string, options?: RequestOptions) =>
    api.get<any>("/youtube/playlist", { params: { id: playlistId }, ...options }),

  channel: (channelId: string, options?: RequestOptions) =>
    api.get<any>("/youtube/channel", { params: { id: channelId }, ...options }),

  explore: (options?: RequestOptions) =>
    api.get<any>("/youtube/explore", options),
};

export const lyricsApi = {
  get: (title: string, artist: string, options?: RequestOptions) =>
    api.get<{ lyrics: string; synced: boolean; source: string }>("/lyrics", {
      params: { title, artist },
      ...options,
    }),
};

export const radioApi = {
  start: (seedTrack: any, options?: RequestOptions) =>
    api.post<{ tracks: any[] }>("/radio/start", { seedTrack }, options),

  more: (cursor: string, options?: RequestOptions) =>
    api.get<{ tracks: any[]; cursor: string }>("/radio/more", { params: { cursor }, ...options }),
};

export const recommendationsApi = {
  get: (options?: RequestOptions) =>
    api.get<any[]>("/recommendations", options),
};

export const transferApi = {
  import: (provider: string, data: any, options?: RequestOptions) =>
    api.post<any>("/transfer/import", { provider, data }, options),

  save: (playlist: any, options?: RequestOptions) =>
    api.post<any>("/transfer/save", playlist, options),
};

export const artistApi = {
  upload: (formData: FormData, options?: RequestOptions) =>
    api.post<any>("/artist/upload", formData, {
      ...options,
      headers: { ...options?.headers, "Content-Type": "multipart/form-data" },
    }),

  tracks: (options?: RequestOptions) =>
    api.get<any[]>("/artist/tracks", options),
};

export const storageApi = {
  upload: (formData: FormData, options?: RequestOptions) =>
    api.post<{ url: string; path: string }>("/storage/upload", formData, {
      ...options,
      headers: { ...options?.headers, "Content-Type": "multipart/form-data" },
    }),

  delete: (path: string, options?: RequestOptions) =>
    api.delete<void>("/storage/delete", { params: { path }, ...options }),
};

export const devicesApi = {
  register: (device: any, options?: RequestOptions) =>
    api.post<any>("/devices", device, options),

  list: (options?: RequestOptions) =>
    api.get<any[]>("/devices", options),

  update: (deviceId: string, data: any, options?: RequestOptions) =>
    api.patch<any>(`/devices/${deviceId}`, data, options),

  transfer: (fromDevice: string, toDevice: string, options?: RequestOptions) =>
    api.post<void>("/devices/transfer", { fromDevice, toDevice }, options),
};

export const filesApi = {
  list: (options?: RequestOptions) =>
    api.get<any[]>("/files", options),

  upload: (formData: FormData, options?: RequestOptions) =>
    api.post<any>("/files", formData, {
      ...options,
      headers: { ...options?.headers, "Content-Type": "multipart/form-data" },
    }),

  delete: (fileId: string, options?: RequestOptions) =>
    api.delete<void>(`/files/${fileId}`, options),

  share: (fileId: string, options?: RequestOptions) =>
    api.post<{ token: string; url: string }>(`/files/${fileId}/share`, {}, options),

  getShared: (token: string, options?: RequestOptions) =>
    api.get<any>("/files/share", { params: { token }, ...options }),
};

export const subscriptionApi = {
  setPlan: (tier: "free" | "plus", options?: RequestOptions) =>
    api.post<void>("/subscription", { tier }, options),
};

export const adminApi = {
  login: (credentials: { username: string; password: string }, options?: RequestOptions) =>
    api.post<{ token: string }>("/admin/login", credentials, options),

  dashboard: (options?: RequestOptions) =>
    api.get<any>("/admin/dashboard", options),

  logout: (options?: RequestOptions) =>
    api.post<void>("/admin/logout", {}, options),
};

export const shazamApi = {
  identify: (audioData: Blob, options?: RequestOptions) =>
    api.post<{ track: any }>("/shazam", audioData, {
      ...options,
      headers: { ...options?.headers, "Content-Type": "audio/webm" },
    }),
};

export const spotifyApi = {
  resolve: (url: string, options?: RequestOptions) =>
    api.get<any>("/spotify/resolve", { params: { url }, ...options }),
};

export const listenHistoryApi = {
  record: (data: { trackId: string; source: string; progress: number }, options?: RequestOptions) =>
    api.post<void>("/listen_history", data, options),
};

api.search = searchApi;
api.youtube = youtubeApi;
api.lyrics = lyricsApi;
api.radio = radioApi;
api.recommendations = recommendationsApi;
api.transfer = transferApi;
api.artist = artistApi;
api.storage = storageApi;
api.devices = devicesApi;
api.files = filesApi;
api.subscription = subscriptionApi;
api.admin = adminApi;
api.shazam = shazamApi;
api.spotify = spotifyApi;
api.listenHistory = listenHistoryApi;

export default api;
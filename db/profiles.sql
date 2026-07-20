-- Drop existing tables to clear old UUID column constraints
DROP TABLE IF EXISTS public.artist_follows CASCADE;
DROP TABLE IF EXISTS public.artist_tracks CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.user_files CASCADE;
DROP TABLE IF EXISTS public.user_sync_data CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Profiles table for user data synced from Clerk
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  is_artist BOOLEAN DEFAULT false,
  artist_status TEXT DEFAULT 'none', -- 'none', 'pending', 'approved'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow users to read any profile (public profiles)
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ((auth.jwt() ->> 'sub') = user_id);

-- Allow service role full access (webhooks)
CREATE POLICY "profiles_service_role_all" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Artist tracks table
CREATE TABLE IF NOT EXISTS public.artist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id TEXT REFERENCES public.profiles(user_id) NOT NULL,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  genre TEXT,
  tags TEXT[],
  is_explicit BOOLEAN DEFAULT false,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration_seconds INT,
  bpm REAL,
  musical_key TEXT,
  lyrics_json JSONB,
  lyrics_status TEXT DEFAULT 'pending',
  plays_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow public read for public tracks
CREATE POLICY "artist_tracks_select_public" ON public.artist_tracks
  FOR SELECT USING (is_public = true OR (auth.jwt() ->> 'sub') = artist_id);

-- Allow artists to CRUD their own tracks
CREATE POLICY "artist_tracks_manage_own" ON public.artist_tracks
  FOR ALL USING ((auth.jwt() ->> 'sub') = artist_id);

-- Artist follows
CREATE TABLE IF NOT EXISTS public.artist_follows (
  follower_id TEXT REFERENCES public.profiles(user_id),
  artist_id TEXT REFERENCES public.profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, artist_id)
);

CREATE POLICY "artist_follows_select_own" ON public.artist_follows
  FOR SELECT USING ((auth.jwt() ->> 'sub') = follower_id OR (auth.jwt() ->> 'sub') = artist_id);

CREATE POLICY "artist_follows_insert_own" ON public.artist_follows
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = follower_id);

CREATE POLICY "artist_follows_delete_own" ON public.artist_follows
  FOR DELETE USING ((auth.jwt() ->> 'sub') = follower_id);

-- Devices table for sync
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  device_type TEXT DEFAULT 'browser',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false,
  current_track_id TEXT,
  current_position REAL DEFAULT 0,
  is_playing BOOLEAN DEFAULT false
);

CREATE POLICY "devices_manage_own" ON public.devices
  FOR ALL USING ((auth.jwt() ->> 'sub') = user_id);

-- User uploaded files
CREATE TABLE IF NOT EXISTS public.user_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration_seconds INT,
  bpm REAL,
  musical_key TEXT,
  privacy_tier TEXT DEFAULT 'private',
  share_token TEXT UNIQUE,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "user_files_manage_own" ON public.user_files
  FOR ALL USING ((auth.jwt() ->> 'sub') = user_id);

-- Allow anyone with share_token to read unlisted files
CREATE POLICY "user_files_select_unlisted" ON public.user_files
  FOR SELECT USING (
    privacy_tier = 'unlisted' AND share_token IS NOT NULL
    OR (auth.jwt() ->> 'sub') = user_id
  );

-- User sync data table (replaces user_ip_data)
CREATE TABLE IF NOT EXISTS public.user_sync_data (
  user_id TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  liked_tracks JSONB DEFAULT '[]'::jsonb,
  subscribed_channels JSONB DEFAULT '[]'::jsonb,
  playlists JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_sync_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sync_data_manage_own" ON public.user_sync_data
  FOR ALL USING ((auth.jwt() ->> 'sub') = user_id);

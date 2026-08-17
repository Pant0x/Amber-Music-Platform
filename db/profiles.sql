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
  is_admin BOOLEAN DEFAULT false, -- check if user is an admin
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
  onboarding_completed BOOLEAN DEFAULT false,
  liked_tracks JSONB DEFAULT '[]'::jsonb,
  subscribed_channels JSONB DEFAULT '[]'::jsonb,
  playlists JSONB DEFAULT '[]'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_sync_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sync_data_manage_own" ON public.user_sync_data
  FOR ALL USING ((auth.jwt() ->> 'sub') = user_id);

-- Enable Row Level Security on all tables (policies above become active)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sync_data ENABLE ROW LEVEL SECURITY;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_artist_tracks_artist_id ON public.artist_tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_tracks_created_at ON public.artist_tracks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artist_tracks_genre ON public.artist_tracks(genre);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON public.devices(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON public.user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_share_token ON public.user_files(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artist_follows_follower ON public.artist_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_artist_follows_artist ON public.artist_follows(artist_id);

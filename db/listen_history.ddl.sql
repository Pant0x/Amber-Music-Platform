-- listen_history table and RLS policy for Supabase

CREATE TABLE IF NOT EXISTS public.listen_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  track_id text NOT NULL,
  youtube_id text,
  played_at timestamptz NOT NULL DEFAULT now(),
  duration_seconds int,
  played_seconds int,
  source text,
  metadata jsonb
);

-- Enable row level security and restrict access so users can only insert/select their own rows
ALTER TABLE public.listen_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert/select their own history
CREATE POLICY "listen_history_user_policy" ON public.listen_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for quick recent queries
CREATE INDEX IF NOT EXISTS idx_listen_history_user_played_at ON public.listen_history (user_id, played_at DESC);

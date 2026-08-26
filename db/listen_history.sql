-- DDL for listen_history table and RLS policy for Supabase
-- Run this in your Supabase SQL editor or include in migrations

-- Create table
create table if not exists public.listen_history (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- Clerk user ID (text, not uuid)
  track_id text,
  youtube_id text,
  played_seconds integer,
  duration_seconds integer,
  metadata jsonb,
  created_at timestamptz default timezone('utc', now())
);

create index if not exists idx_listen_history_user_id on public.listen_history(user_id);
create index if not exists idx_listen_history_created_at on public.listen_history(created_at desc);

-- Enable row level security
alter table public.listen_history enable row level security;

-- Allow authenticated users to insert only with their own user_id
create policy "allow_authenticated_insert_own_user" on public.listen_history
  for insert using (auth.role() = 'authenticated')
  with check (auth.uid()::text = user_id);

-- Allow service role to bypass policies (server inserts should use service role key)
-- Note: When performing inserts from the client, prefer calling a server-side API that verifies the user token.

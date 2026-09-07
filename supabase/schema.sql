-- ========================================================
-- SUPABASE SCHEMA & STORAGE POLICIES FOR TOURNAMENT BRACKET GENERATOR
-- ========================================================

-- 1. Create Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  logo_url TEXT,
  bracket_type TEXT DEFAULT 'single_elimination',
  best_of INTEGER DEFAULT 3,
  status_badge TEXT DEFAULT 'LIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Participants Table
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tag TEXT,
  seed INTEGER NOT NULL,
  logo_url TEXT,
  avatar_color TEXT,
  avatar_icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  round_index INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  participant1_id TEXT,
  participant2_id TEXT,
  score1 INTEGER,
  score2 INTEGER,
  winner_id TEXT,
  next_match_id TEXT,
  next_match_slot TEXT,
  status TEXT DEFAULT 'scheduled',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Allow public read & write policies for anonymous demo usage
CREATE POLICY "Allow public read access to tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access to tournaments" ON tournaments FOR ALL USING (true);

CREATE POLICY "Allow public read access to participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access to participants" ON participants FOR ALL USING (true);

CREATE POLICY "Allow public read access to matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access to matches" ON matches FOR ALL USING (true);

-- 4. Enable Storage Bucket 'logo' & Storage RLS Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('logo', 'logo', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'logo' bucket
DROP POLICY IF EXISTS "Allow public SELECT on logo bucket" ON storage.objects;
CREATE POLICY "Allow public SELECT on logo bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'logo');

DROP POLICY IF EXISTS "Allow public INSERT on logo bucket" ON storage.objects;
CREATE POLICY "Allow public INSERT on logo bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logo');

DROP POLICY IF EXISTS "Allow public UPDATE on logo bucket" ON storage.objects;
CREATE POLICY "Allow public UPDATE on logo bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logo');

-- Enable Supabase Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

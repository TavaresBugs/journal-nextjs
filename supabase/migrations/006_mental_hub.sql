-- Mental Hub: Profiles & Entries Tables
-- For Mental Hand History / Performance Analytics

-- Mental Profiles (Autocomplete Lookups)
CREATE TABLE IF NOT EXISTS mental_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = system default
    category TEXT NOT NULL CHECK (category IN ('fear', 'greed', 'tilt', 'fomo', 'hesitation', 'overconfidence', 'discipline')),
    severity INT CHECK (severity BETWEEN 1 AND 10),
    description TEXT NOT NULL,
    zone TEXT NOT NULL CHECK (zone IN ('A-Game', 'B-Game', 'C-Game')),
    is_system BOOLEAN DEFAULT FALSE,  -- True for seed/default profiles
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mental Entries (Daily Journal/Grid)
CREATE TABLE IF NOT EXISTS mental_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    trigger_event TEXT,           -- What triggered the emotion
    emotion TEXT,                 -- Fear, Greed, FOMO, etc.
    behavior TEXT,                -- What action was taken
    mistake TEXT,                 -- What went wrong
    correction TEXT,              -- The logical correction
    zone_detected TEXT CHECK (zone_detected IN ('A-Game', 'B-Game', 'C-Game')),
    source TEXT DEFAULT 'grid' CHECK (source IN ('grid', 'wizard'))  -- Track origin
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mental_profiles_user_id ON mental_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mental_profiles_category ON mental_profiles(category);
CREATE INDEX IF NOT EXISTS idx_mental_entries_user_id ON mental_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mental_entries_created_at ON mental_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mental_entries_zone ON mental_entries(zone_detected);

-- Row Level Security
ALTER TABLE mental_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mental_entries ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see system profiles + their own
CREATE POLICY "Users can view system and own profiles"
    ON mental_profiles FOR SELECT
    USING (is_system = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles"
    ON mental_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id AND is_system = FALSE);

CREATE POLICY "Users can delete own profiles"
    ON mental_profiles FOR DELETE
    USING (auth.uid() = user_id AND is_system = FALSE);

-- Entries: Users can only manage their own
CREATE POLICY "Users can view own entries"
    ON mental_entries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries"
    ON mental_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries"
    ON mental_entries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
    ON mental_entries FOR DELETE
    USING (auth.uid() = user_id);

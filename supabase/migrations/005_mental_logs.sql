-- Mental Hand History (Mindset Debugger) Table
-- Based on Jared Tendler's 5-step method from "The Mental Game of Trading"

CREATE TABLE IF NOT EXISTS mental_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mood_tag TEXT CHECK (mood_tag IN ('fear', 'greed', 'fomo', 'tilt', 'revenge', 'hesitation', 'overconfidence', 'other')),
    step_1_problem TEXT NOT NULL,       -- "O que você está sentindo?"
    step_2_validation TEXT,              -- "Por que isso faz sentido?"
    step_3_flaw TEXT,                    -- "Onde está o erro nessa lógica?"
    step_4_correction TEXT,              -- "Qual a verdade?"
    step_5_logic TEXT,                   -- "Por que a correção está certa?"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mental_logs_user_id ON mental_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mental_logs_created_at ON mental_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mental_logs_mood_tag ON mental_logs(mood_tag);

-- Row Level Security
ALTER TABLE mental_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own logs
CREATE POLICY "Users can view own mental logs"
    ON mental_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert own mental logs"
    ON mental_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own logs
CREATE POLICY "Users can delete own mental logs"
    ON mental_logs FOR DELETE
    USING (auth.uid() = user_id);

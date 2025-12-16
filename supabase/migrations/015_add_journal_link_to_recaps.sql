-- ============================================
-- Migration: Add Journal Link Support to Recaps
-- ============================================
-- Allows linking recaps to journal entries (market observation days)
-- in addition to trades. Uses generic linked_id + linked_type pattern.
-- ============================================

-- 1. Add new columns for generic linking
ALTER TABLE laboratory_recaps 
ADD COLUMN IF NOT EXISTS linked_type TEXT CHECK (linked_type IN ('trade', 'journal')),
ADD COLUMN IF NOT EXISTS linked_id UUID;

-- 2. Migrate existing trade_id data to new structure
-- (trade_id is kept for backward compatibility but deprecated)
UPDATE laboratory_recaps 
SET linked_type = 'trade', linked_id = trade_id
WHERE trade_id IS NOT NULL AND linked_type IS NULL;

-- 3. Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_recaps_linked_type 
    ON laboratory_recaps(linked_type);
CREATE INDEX IF NOT EXISTS idx_recaps_linked_id 
    ON laboratory_recaps(linked_id);

-- 4. Add comment marking trade_id as deprecated
COMMENT ON COLUMN laboratory_recaps.trade_id IS 
    '@deprecated Use linked_type + linked_id instead. Kept for backward compatibility.';

-- 5. Grant necessary permissions (already granted, but ensuring consistency)
GRANT ALL ON laboratory_recaps TO authenticated;

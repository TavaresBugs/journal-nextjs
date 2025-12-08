-- ============================================
-- FIX: Change TIME fields to TEXT to avoid timezone conversion
-- ============================================
-- 
-- Problem: PostgreSQL TIME type was causing automatic timezone conversion
-- when inserting/reading data through Supabase client.
--
-- Solution: Change to TEXT type for simple string storage without conversion.
--
-- Run this migration in Supabase SQL Editor:

-- 1. Change entry_time from TIME to TEXT
ALTER TABLE trades ALTER COLUMN entry_time TYPE TEXT USING entry_time::TEXT;

-- 2. Change exit_time from TIME to TEXT  
ALTER TABLE trades ALTER COLUMN exit_time TYPE TEXT USING exit_time::TEXT;

-- Note: Existing data will be converted to text format (e.g., "13:45:00")
-- The application already handles both HH:mm and HH:mm:ss formats.

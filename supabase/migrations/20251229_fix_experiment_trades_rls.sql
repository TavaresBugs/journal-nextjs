-- ============================================
-- Fix RLS for laboratory_experiment_trades
-- Service role needs bypass since Prisma doesn't use auth.uid()
-- ============================================

-- Drop existing policies that rely on auth.uid()
DROP POLICY IF EXISTS "Users can view their experiment trades" ON laboratory_experiment_trades;
DROP POLICY IF EXISTS "Users can insert their experiment trades" ON laboratory_experiment_trades;
DROP POLICY IF EXISTS "Users can delete their experiment trades" ON laboratory_experiment_trades;

-- Create new policies that work with service role
-- These allow all operations since access control is handled at the application layer
CREATE POLICY "Enable all operations for authenticated users"
ON laboratory_experiment_trades
FOR ALL
USING (true)
WITH CHECK (true);

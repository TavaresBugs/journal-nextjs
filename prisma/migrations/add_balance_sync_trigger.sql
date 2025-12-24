-- Balance Auto-Sync Trigger
-- Issue: https://github.com/TavaresBugs/journal-nextjs/issues/85
-- Created: 2024-12-24
--
-- This trigger automatically updates account balance when trades are modified.
-- This eliminates the need for manual balance sync calls after each trade operation,
-- saving ~50-100ms per trade operation.
--
-- HOW TO APPLY:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Paste this script
-- 3. Click "Run"

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trades_balance_update_trigger ON trades;
DROP FUNCTION IF EXISTS update_account_balance_on_trade_change();

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_account_balance_on_trade_change()
RETURNS TRIGGER AS $$
DECLARE
  v_initial_balance DECIMAL(20,2);
  v_new_balance DECIMAL(20,2);
BEGIN
  -- Handle different operation types
  IF TG_OP = 'INSERT' THEN
    -- Add PnL to current balance
    UPDATE accounts 
    SET current_balance = current_balance + COALESCE(NEW.pnl, 0),
        updated_at = NOW()
    WHERE id = NEW.account_id;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Subtract PnL from current balance
    UPDATE accounts 
    SET current_balance = current_balance - COALESCE(OLD.pnl, 0),
        updated_at = NOW()
    WHERE id = OLD.account_id;
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- If PnL changed, adjust the difference
    IF OLD.pnl IS DISTINCT FROM NEW.pnl THEN
      UPDATE accounts 
      SET current_balance = current_balance - COALESCE(OLD.pnl, 0) + COALESCE(NEW.pnl, 0),
          updated_at = NOW()
      WHERE id = NEW.account_id;
    END IF;
    
    -- If account changed (trade moved to different account), update both
    IF OLD.account_id IS DISTINCT FROM NEW.account_id THEN
      -- Remove from old account
      UPDATE accounts 
      SET current_balance = current_balance - COALESCE(OLD.pnl, 0),
          updated_at = NOW()
      WHERE id = OLD.account_id;
      
      -- Add to new account
      UPDATE accounts 
      SET current_balance = current_balance + COALESCE(NEW.pnl, 0),
          updated_at = NOW()
      WHERE id = NEW.account_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trades_balance_update_trigger
AFTER INSERT OR UPDATE OR DELETE ON trades
FOR EACH ROW
EXECUTE FUNCTION update_account_balance_on_trade_change();

-- Add a comment for documentation
COMMENT ON FUNCTION update_account_balance_on_trade_change() IS 
'Automatically updates account current_balance when trades are inserted, updated, or deleted. Eliminates need for manual syncAccountBalance calls.';

-- Verify the trigger was created
SELECT tgname, tgrelid::regclass, tgtype, tgfoid::regprocedure 
FROM pg_trigger 
WHERE tgname = 'trades_balance_update_trigger';

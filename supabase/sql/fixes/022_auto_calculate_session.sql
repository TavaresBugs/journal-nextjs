-- =============================================
-- Migration: Auto Calculate Market Session
-- Description: Creates a trigger to automatically populate the 'session' field 
-- based on 'entry_time' (assuming NY Time).
-- =============================================

CREATE OR REPLACE FUNCTION public.calculate_market_session()
RETURNS TRIGGER AS $$
DECLARE
    trade_time TIME;
BEGIN
    -- If session is already manually set (and not empty/N/A), preserve it.
    -- But for bulk update purposes, if we pass NULL, we want it calculated.
    IF NEW.session IS NOT NULL AND NEW.session != '' AND NEW.session != 'N/A' THEN
        RETURN NEW;
    END IF;

    -- Ensure entry_time exists
    IF NEW.entry_time IS NULL OR NEW.entry_time = '' THEN
        RETURN NEW;
    END IF;

    -- Parse entry_time (text) to TIME
    BEGIN
        trade_time := NEW.entry_time::TIME;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEW; -- return as is if time is invalid
    END;

    -- Determine Session (Times in New York)
    -- Asia: 17:00 - 03:00 (Next day) -> Range: > 17:00 OR < 03:00
    -- London: 03:00 - 08:00
    -- Overlap: 08:00 - 12:00
    -- NY: 12:00 - 17:00
    
    IF (trade_time >= '17:00:00' OR trade_time < '03:00:00') THEN
        NEW.session := 'Asian';
    ELSIF (trade_time >= '03:00:00' AND trade_time < '08:00:00') THEN
        NEW.session := 'London';
    ELSIF (trade_time >= '08:00:00' AND trade_time < '12:00:00') THEN
        NEW.session := 'Overlap';
    ELSIF (trade_time >= '12:00:00' AND trade_time < '17:00:00') THEN
        NEW.session := 'New-York';
    ELSE
        NEW.session := 'Asian'; -- Fallback
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_calculate_session ON trades;
CREATE TRIGGER trigger_calculate_session
    BEFORE INSERT OR UPDATE
    ON trades
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_market_session();

-- Apply to existing trades that are missing session or have 'N/A'
-- We force an update by setting session to NULL (which triggers the logic)
UPDATE trades 
SET session = NULL 
WHERE session IS NULL OR session = '' OR session = 'N/A';

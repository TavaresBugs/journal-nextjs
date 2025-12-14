-- supabase/migrations/20251214_get_shared_entry_bridge.sql
-- BRIDGE V3: Secure function to fetch trade data for shared links
-- Purpose: Bypass browser/network instability (HTTP/3, RLS quirks) in Firefox/Safari
-- Logic: Server-side validation of token -> Fetch Trade Data -> Return JSON

CREATE OR REPLACE FUNCTION get_shared_entry_bridge(token_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with server privileges (Bypasses RLS)
SET search_path = public
AS $$
DECLARE
  v_journal_id uuid;
  v_trade_id uuid;
  v_trade_record json;
  v_result json;
BEGIN
  -- 1. Validate token & get journal ID
  SELECT journal_entry_id INTO v_journal_id
  FROM shared_journals
  WHERE share_token = token_input
    AND (expires_at IS NULL OR expires_at > now());

  -- If token invalid/expired, return explicit error
  IF v_journal_id IS NULL THEN
    RETURN json_build_object(
      'data', null,
      'error', json_build_object(
        'message', 'Link inválido ou expirado',
        'code', 'INVALID_TOKEN'
      )
    );
  END IF;

  -- 2. Get Trade ID from Journal Entry
  -- The relationship is: Journal Entry -> has one -> Trade (via trade_id column)
  -- The 'trades' table does NOT have 'journal_entry_id'.
  SELECT trade_id INTO v_trade_id
  FROM journal_entries
  WHERE id = v_journal_id;

  IF v_trade_id IS NULL THEN
     -- Valid journal entry, but no linked trade. Return null data (not an error).
     RETURN json_build_object(
       'data', null,
       'error', null
     );
  END IF;

  -- 3. Fetch Trade Data
  SELECT row_to_json(t) INTO v_trade_record
  FROM (
    SELECT 
      id,
      market_condition_v2, 
      strategy, 
      strategy_icon, 
      tf_analise, 
      tf_entrada, 
      setup, 
      htf_aligned, 
      tags, 
      entry_quality, 
      pd_array
    FROM trades
    WHERE id = v_trade_id
    LIMIT 1
  ) t;

  -- 4. Return Result
  v_result := json_build_object(
    'data', COALESCE(v_trade_record, null),
    'error', null 
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Catch any unexpected server errors
  RETURN json_build_object(
    'data', null,
    'error', json_build_object(
      'message', SQLERRM,
      'code', 'INTERNAL_ERROR'
    )
  );
END;
$$;

-- Grant execute permission to public (since shared links are public)
GRANT EXECUTE ON FUNCTION get_shared_entry_bridge(uuid) TO anon, authenticated;

COMMENT ON FUNCTION get_shared_entry_bridge(uuid) IS 
'Bridge function for Share Page: Fetches trade context securely by token, ensuring consistent delivery across browsers.';

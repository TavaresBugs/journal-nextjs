/**
 * Query fragments for optimized data fetching.
 *
 * Schema uses N:N relationship via journal_entry_trades junction table.
 * DEPRECATED: journal_entries.trade_id (do not use).
 * Keep this in sync with actual database schema.
 *
 * @see src/lib/supabase/SCHEMA_NOTES.md for full schema documentation
 */

// ============================================
// TRADE FRAGMENTS
// ============================================

export const TRADE_FRAGMENTS = {
  /**
   * Minimal fields for list views and cards.
   * Use when: Displaying trade lists, dashboard cards, quick selections.
   * Columns: 5
   */
  basic: `
    id,
    strategy,
    entry_quality,
    outcome,
    created_at
  `.replace(/\s+/g, ""),

  /**
   * ALL 34 columns for full trade detail view/edit.
   * Use when: Trade detail modal, edit forms, full data export.
   * Columns: 34
   */
  detailed: `
    id,
    user_id,
    account_id,
    symbol,
    type,
    entry_price,
    stop_loss,
    take_profit,
    exit_price,
    lot,
    commission,
    swap,
    tf_analise,
    tf_entrada,
    tags,
    strategy,
    strategy_icon,
    setup,
    notes,
    entry_date,
    entry_time,
    exit_date,
    exit_time,
    pnl,
    outcome,
    session,
    htf_aligned,
    r_multiple,
    market_condition,
    plan_adherence,
    plan_adherence_rating,
    entry_quality,
    market_condition_v2,
    pd_array,
    created_at,
    updated_at
  `.replace(/\s+/g, ""),

  /**
   * Public-safe columns for anonymous share links.
   * Use when: /share/[token] pages, public embeds.
   * Excludes: user_id, account_id, notes (sensitive data).
   * Columns: 10
   */
  shared: `
    id,
    symbol,
    type,
    entry_date,
    entry_time,
    pnl,
    outcome,
    strategy,
    entry_quality,
    market_condition_v2
  `.replace(/\s+/g, ""),

  /**
   * Lightweight fragment for charts and analytics.
   * Use when: Building charts, calculating metrics, performance reports.
   * Columns: 15
   */
  analytics: `
    id,
    account_id,
    symbol,
    type,
    entry_date,
    entry_time,
    exit_date,
    pnl,
    outcome,
    strategy,
    session,
    entry_quality,
    market_condition_v2,
    r_multiple,
    htf_aligned
  `.replace(/\s+/g, ""),
} as const;

// ============================================
// JOURNAL FRAGMENTS
// ============================================

export const JOURNAL_FRAGMENTS = {
  /**
   * Minimal fields for journal list views.
   * Use when: Journal sidebar, calendar day previews, quick lists.
   * Columns: 4
   */
  basic: `
    id,
    title,
    date,
    created_at
  `.replace(/\s+/g, ""),

  /**
   * ALL 18 columns for full journal entry view/edit.
   * Use when: Journal detail modal, edit forms, full data export.
   * Columns: 18
   */
  detailed: `
    id,
    user_id,
    account_id,
    date,
    title,
    asset,
    trade_id,
    image_tfm,
    image_tfw,
    image_tfd,
    image_tfh4,
    image_tfh1,
    image_tfm15,
    image_tfm5,
    image_tfm3,
    emotion,
    analysis,
    notes,
    review_type,
    week_start_date,
    week_end_date,
    created_at,
    updated_at
  `.replace(/\s+/g, ""),

  /**
   * Journal with associated trades via N:N junction table.
   * Use when: Fetching journal entries with their linked trades.
   * Uses: journal_entry_trades junction table (NOT deprecated trade_id).
   */
  withTrades: `
    id,
    title,
    date,
    created_at,
    journal_entry_trades(
      trade_id,
      trades(
        id,
        symbol,
        type,
        entry_date,
        pnl,
        outcome,
        strategy
      )
    )
  `
    .replace(/\s+/g, "")
    .replace(/\(\s*/g, "(")
    .replace(/\s*\)/g, ")"),

  /**
   * Journal with images for display.
   * Use when: Showing journal entries with their attached images.
   */
  withImages: `
    id,
    title,
    date,
    emotion,
    analysis,
    notes,
    created_at,
    journal_images(
      id,
      url,
      path,
      timeframe,
      display_order
    )
  `
    .replace(/\s+/g, "")
    .replace(/\(\s*/g, "(")
    .replace(/\s*\)/g, ")"),
} as const;

// ============================================
// TYPE HELPERS
// ============================================

export type TradeFragment = keyof typeof TRADE_FRAGMENTS;
export type JournalFragment = keyof typeof JOURNAL_FRAGMENTS;

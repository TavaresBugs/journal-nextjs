export const TRADE_FRAGMENTS = {
  // Essential fields for list views
  basic: [
    'id', 'user_id', 'account_id', 'symbol', 'type', 'pnl', 'outcome',
    'entry_date', 'entry_time', 'strategy', 'entry_quality', 'created_at'
  ].join(','),

  // Full details for trade view/edit
  detailed: [
    'id', 'user_id', 'account_id', 'symbol', 'type', 'entry_price',
    'stop_loss', 'take_profit', 'exit_price', 'lot', 'commission', 'swap',
    'tf_analise', 'tf_entrada', 'tags', 'strategy', 'setup', 'notes',
    'entry_date', 'entry_time', 'exit_date', 'exit_time', 'pnl', 'outcome',
    'session', 'htf_aligned', 'r_multiple', 'market_condition',
    'plan_adherence', 'plan_adherence_rating', 'entry_quality',
    'market_condition_v2', 'created_at', 'updated_at'
  ].join(','),

  // Lightweight for charts
  lite: [
    'id', 'entry_date', 'entry_time', 'exit_date', 'exit_time', 'pnl',
    'outcome', 'account_id', 'symbol', 'type', 'entry_price', 'exit_price',
    'stop_loss', 'take_profit', 'lot', 'tags', 'strategy', 'setup',
    'tf_analise', 'tf_entrada', 'market_condition', 'entry_quality',
    'market_condition_v2', 'session', 'commission', 'swap'
  ].join(',')
} as const;

export const JOURNAL_FRAGMENTS = {
  basic: [
    'id', 'title', 'date', 'asset', 'user_id', 'created_at'
  ].join(','),

  detailed: [
    'id', 'user_id', 'account_id', 'date', 'title', 'asset',
    'emotion', 'analysis', 'notes', 'created_at', 'updated_at'
  ].join(',')
} as const;

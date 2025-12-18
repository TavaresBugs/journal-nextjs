export interface DBAccount {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  initial_balance: number | string;
  current_balance: number | string;
  leverage: string;
  max_drawdown: number | string;
  created_at: string;
  updated_at: string;
}

export interface DBTrade {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  type: "Long" | "Short";
  entry_price: number | string;
  stop_loss: number | string;
  take_profit: number | string;
  exit_price?: number | string | null;
  lot: number | string;
  // Costs
  commission?: number | string | null;
  swap?: number | string | null;
  // Analysis
  tf_analise?: string;
  tf_entrada?: string;
  tags?: string | null;
  strategy?: string;
  strategy_icon?: string;
  setup?: string;
  notes?: string;
  entry_date: string;
  entry_time: string;
  exit_date?: string;
  exit_time?: string;
  pnl?: number | string | null;
  outcome?: "win" | "loss" | "breakeven" | "pending";
  // Telemetry fields
  session?: string;
  htf_aligned?: boolean;
  r_multiple?: number | string | null;
  market_condition?: string;
  plan_adherence?: string;
  plan_adherence_rating?: number;
  // Entry Telemetry v2
  entry_quality?: string;
  market_condition_v2?: string;
  pd_array?: string;
  created_at: string;
  updated_at: string;
}

export interface DBJournalImage {
  id: string;
  user_id: string;
  journal_entry_id: string;
  url: string;
  path: string;
  timeframe: string;
  display_order: number;
  created_at: string;
}

// Junction table for N:N relationship between journal entries and trades
export interface DBJournalEntryTrade {
  id: string;
  journal_entry_id: string;
  trade_id: string;
  created_at: string;
}

export interface DBJournalEntry {
  id: string;
  user_id: string;
  account_id: string;
  date: string;
  title?: string;
  asset?: string;
  trade_id?: string; // DEPRECATED - kept for backward compatibility
  journal_entry_trades?: DBJournalEntryTrade[]; // New N:N relationship
  journal_images?: DBJournalImage[];
  emotion?: string;
  analysis?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DBDailyRoutine {
  id: string;
  user_id: string;
  account_id: string;
  date: string;
  aerobic: boolean;
  diet: boolean;
  reading: boolean;
  meditation: boolean;
  pre_market: boolean;
  prayer: boolean;
  created_at: string;
  updated_at: string;
}

export interface DBSettings {
  id: string;
  user_id: string;
  account_id?: string;
  currencies: string[];
  leverages: string[];
  assets: Record<string, number>; // Changed to Record to match App type
  strategies: string[];
  setups: string[];
  created_at: string;
  updated_at: string;
}

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
  type: 'Long' | 'Short';
  entry_price: number | string;
  stop_loss: number | string;
  take_profit: number | string;
  exit_price?: number | string | null;
  lot: number | string;
  tf_analise?: string;
  tf_entrada?: string;
  tags?: string; // Changed to string to match App type
  strategy?: string;
  setup?: string;
  notes?: string;
  entry_date: string;
  entry_time: string;
  exit_date?: string;
  exit_time?: string;
  pnl?: number | string | null;
  outcome?: 'win' | 'loss' | 'breakeven' | 'pending'; // Changed to match App type
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

export interface DBJournalEntry {
  id: string;
  user_id: string;
  account_id: string;
  date: string;
  title?: string;
  asset?: string;
  trade_id?: string;
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

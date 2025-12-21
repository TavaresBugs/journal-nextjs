-- =============================================
-- Schema: public
-- Description: Tabelas principais da aplicação
-- =============================================
-- Cole aqui o esquema do schema public do Supabase
-- Inclui: accounts, trades, playbooks, journal_entries, user_settings, users_extended, etc.

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  initial_balance numeric NOT NULL,
  current_balance numeric NOT NULL,
  leverage text NOT NULL DEFAULT '1:100'::text,
  max_drawdown numeric NOT NULL DEFAULT 10.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.daily_routines (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL,
  date date NOT NULL,
  aerobic boolean DEFAULT false,
  diet boolean DEFAULT false,
  reading boolean DEFAULT false,
  meditation boolean DEFAULT false,
  pre_market boolean DEFAULT false,
  prayer boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT daily_routines_pkey PRIMARY KEY (id),
  CONSTRAINT daily_routines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  CONSTRAINT daily_routines_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.economic_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time text NOT NULL,
  currency text NOT NULL,
  impact text NOT NULL,
  event_name text NOT NULL,
  actual text,
  forecast text,
  previous text,
  source text DEFAULT 'forex_factory'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT economic_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.journal_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL,
  date date NOT NULL,
  title text NOT NULL,
  asset text,
  trade_id uuid,
  image_tfm text,
  image_tfw text,
  image_tfd text,
  image_tfh4 text,
  image_tfh1 text,
  image_tfm15 text,
  image_tfm5 text,
  image_tfm3 text,
  emotion text,
  analysis text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entries_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  CONSTRAINT journal_entries_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id),
  CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.journal_entry_trades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL,
  trade_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT journal_entry_trades_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entry_trades_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT journal_entry_trades_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id)
);
CREATE TABLE public.journal_images (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  journal_entry_id uuid NOT NULL,
  timeframe text NOT NULL,
  url text NOT NULL,
  path text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT journal_images_pkey PRIMARY KEY (id),
  CONSTRAINT journal_images_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT journal_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.laboratory_experiments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'em_aberto'::text CHECK (status = ANY (ARRAY['em_aberto'::text, 'testando'::text, 'validado'::text, 'descartado'::text])),
  category text,
  expected_win_rate numeric,
  expected_risk_reward numeric,
  promoted_to_playbook boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT laboratory_experiments_pkey PRIMARY KEY (id),
  CONSTRAINT laboratory_experiments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.laboratory_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL,
  image_url text NOT NULL,
  description text,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT laboratory_images_pkey PRIMARY KEY (id),
  CONSTRAINT laboratory_images_experiment_id_fkey FOREIGN KEY (experiment_id) REFERENCES public.laboratory_experiments(id)
);
CREATE TABLE public.laboratory_recap_trades (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  recap_id uuid,
  trade_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT laboratory_recap_trades_pkey PRIMARY KEY (id),
  CONSTRAINT laboratory_recap_trades_recap_id_fkey FOREIGN KEY (recap_id) REFERENCES public.laboratory_recaps(id),
  CONSTRAINT laboratory_recap_trades_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id)
);
CREATE TABLE public.laboratory_recaps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trade_id uuid,
  title text NOT NULL,
  what_worked text,
  what_failed text,
  emotional_state text CHECK (emotional_state IS NULL OR (emotional_state = ANY (ARRAY['confiante'::text, 'ansioso'::text, 'fomo'::text, 'disciplinado'::text, 'frustrado'::text, 'euforico'::text, 'neutro'::text]))),
  lessons_learned text,
  images ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  review_type character varying DEFAULT 'daily'::character varying CHECK (review_type::text = ANY (ARRAY['daily'::character varying, 'weekly'::character varying]::text[])),
  week_start_date date,
  week_end_date date,
  linked_type text CHECK (linked_type = ANY (ARRAY['trade'::text, 'journal'::text])),
  linked_id uuid,
  CONSTRAINT laboratory_recaps_pkey PRIMARY KEY (id),
  CONSTRAINT laboratory_recaps_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT laboratory_recaps_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id)
);
CREATE TABLE public.leaderboard_opt_in (
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  show_win_rate boolean DEFAULT true,
  show_profit_factor boolean DEFAULT true,
  show_total_trades boolean DEFAULT true,
  show_pnl boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leaderboard_opt_in_pkey PRIMARY KEY (user_id),
  CONSTRAINT leaderboard_opt_in_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.mental_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  trigger_event text,
  emotion text,
  behavior text,
  mistake text,
  correction text,
  zone_detected text CHECK (zone_detected = ANY (ARRAY['A-Game'::text, 'B-Game'::text, 'C-Game'::text])),
  source text DEFAULT 'grid'::text CHECK (source = ANY (ARRAY['grid'::text, 'wizard'::text])),
  CONSTRAINT mental_entries_pkey PRIMARY KEY (id),
  CONSTRAINT mental_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.mental_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mood_tag text CHECK (mood_tag = ANY (ARRAY['fear'::text, 'greed'::text, 'fomo'::text, 'tilt'::text, 'revenge'::text, 'hesitation'::text, 'overconfidence'::text, 'other'::text])),
  step_1_problem text NOT NULL,
  step_2_validation text,
  step_3_flaw text,
  step_4_correction text,
  step_5_logic text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mental_logs_pkey PRIMARY KEY (id),
  CONSTRAINT mental_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.mental_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  category text NOT NULL CHECK (category = ANY (ARRAY['fear'::text, 'greed'::text, 'tilt'::text, 'fomo'::text, 'hesitation'::text, 'overconfidence'::text, 'discipline'::text])),
  severity integer CHECK (severity >= 1 AND severity <= 10),
  description text NOT NULL,
  zone text NOT NULL CHECK (zone = ANY (ARRAY['A-Game'::text, 'B-Game'::text, 'C-Game'::text])),
  is_system boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mental_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT mental_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.mentor_account_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL,
  account_id uuid NOT NULL,
  can_view_trades boolean DEFAULT true,
  can_view_journal boolean DEFAULT true,
  can_view_routines boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentor_account_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT mentor_account_permissions_invite_id_fkey FOREIGN KEY (invite_id) REFERENCES public.mentor_invites(id),
  CONSTRAINT mentor_account_permissions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);
CREATE TABLE public.mentor_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mentee_id uuid,
  mentor_email text NOT NULL,
  mentor_id uuid,
  permission text DEFAULT 'view'::text CHECK (permission = ANY (ARRAY['view'::text, 'comment'::text])),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'revoked'::text])),
  invite_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  accepted_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  mentee_email text,
  CONSTRAINT mentor_invites_pkey PRIMARY KEY (id),
  CONSTRAINT mentor_invites_mentee_id_fkey FOREIGN KEY (mentee_id) REFERENCES auth.users(id),
  CONSTRAINT mentor_invites_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES auth.users(id)
);
CREATE TABLE public.mentor_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL,
  mentee_id uuid NOT NULL,
  trade_id uuid,
  journal_entry_id uuid,
  review_type text NOT NULL CHECK (review_type = ANY (ARRAY['correction'::text, 'comment'::text, 'suggestion'::text])),
  content text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentor_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT mentor_reviews_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES auth.users(id),
  CONSTRAINT mentor_reviews_mentee_id_fkey FOREIGN KEY (mentee_id) REFERENCES auth.users(id),
  CONSTRAINT mentor_reviews_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id),
  CONSTRAINT mentor_reviews_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id)
);
CREATE TABLE public.playbook_stars (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  shared_playbook_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT playbook_stars_pkey PRIMARY KEY (id),
  CONSTRAINT playbook_stars_shared_playbook_id_fkey FOREIGN KEY (shared_playbook_id) REFERENCES public.shared_playbooks(id),
  CONSTRAINT playbook_stars_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.playbooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid,
  name text NOT NULL,
  description text,
  icon text DEFAULT '📈'::text,
  color text DEFAULT '#3B82F6'::text,
  rule_groups jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT playbooks_pkey PRIMARY KEY (id),
  CONSTRAINT playbooks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT playbooks_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  account_id uuid UNIQUE,
  currencies jsonb DEFAULT '["USD", "BRL", "EUR", "GBP"]'::jsonb,
  leverages jsonb DEFAULT '["1:30", "1:50", "1:100", "1:200", "1:500"]'::jsonb,
  assets jsonb DEFAULT '{"NQ": 1, "US30": 1, "EURUSD": 100000, "GBPUSD": 100000, "USDJPY": 100000, "XAUUSD": 100}'::jsonb,
  strategies jsonb DEFAULT '["Pullback", "Breakout", "Reversal", "Trend Following"]'::jsonb,
  setups jsonb DEFAULT '["Pivô de Alta", "Pivô de Baixa", "FVG", "Order Block", "Breaker"]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL UNIQUE,
  CONSTRAINT settings_pkey PRIMARY KEY (id),
  CONSTRAINT settings_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  CONSTRAINT settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.shared_journals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL,
  user_id uuid NOT NULL,
  share_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  view_count integer DEFAULT 0,
  CONSTRAINT shared_journals_pkey PRIMARY KEY (id),
  CONSTRAINT shared_journals_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT shared_journals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.shared_playbooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  playbook_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  is_public boolean DEFAULT false,
  description text,
  stars integer DEFAULT 0,
  downloads integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shared_playbooks_pkey PRIMARY KEY (id),
  CONSTRAINT shared_playbooks_playbook_id_fkey FOREIGN KEY (playbook_id) REFERENCES public.playbooks(id),
  CONSTRAINT shared_playbooks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.trade_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trade_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT trade_comments_pkey PRIMARY KEY (id),
  CONSTRAINT trade_comments_trade_id_fkey FOREIGN KEY (trade_id) REFERENCES public.trades(id),
  CONSTRAINT trade_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.trades (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL,
  symbol text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['Long'::text, 'Short'::text])),
  entry_price numeric NOT NULL,
  stop_loss numeric,
  take_profit numeric,
  exit_price numeric,
  lot numeric NOT NULL DEFAULT 1.0,
  tf_analise text,
  tf_entrada text,
  tags text,
  strategy text,
  setup text,
  notes text,
  entry_date date NOT NULL,
  entry_time text,
  exit_date date,
  exit_time text,
  pnl numeric,
  outcome text CHECK (outcome = ANY (ARRAY['win'::text, 'loss'::text, 'breakeven'::text, 'pending'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  commission numeric DEFAULT NULL::numeric,
  swap numeric DEFAULT NULL::numeric,
  session character varying,
  htf_aligned boolean DEFAULT false,
  r_multiple numeric,
  market_condition character varying,
  plan_adherence character varying,
  plan_adherence_rating integer CHECK (plan_adherence_rating >= 1 AND plan_adherence_rating <= 5),
  entry_quality text CHECK (entry_quality = ANY (ARRAY['picture-perfect'::text, 'nice'::text, 'normal'::text, 'ugly'::text])),
  market_condition_v2 text CHECK (market_condition_v2 = ANY (ARRAY['bull-trend'::text, 'bear-trend'::text, 'ranging'::text, 'breakout'::text])),
  strategy_icon text,
  pd_array text,
  CONSTRAINT trades_pkey PRIMARY KEY (id),
  CONSTRAINT trades_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id),
  CONSTRAINT trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  currencies ARRAY DEFAULT '{USD,BRL,EUR,GBP}'::text[],
  leverages ARRAY DEFAULT '{1:30,1:50,1:100,1:200,1:500}'::text[],
  assets jsonb DEFAULT '[]'::jsonb,
  strategies ARRAY DEFAULT ARRAY[]::text[],
  setups ARRAY DEFAULT ARRAY[]::text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users_extended (
  id uuid NOT NULL,
  email text,
  name text,
  avatar_url text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'suspended'::text, 'banned'::text])),
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['admin'::text, 'user'::text, 'guest'::text, 'mentor'::text])),
  approved_at timestamp with time zone,
  approved_by uuid,
  notes text,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_extended_pkey PRIMARY KEY (id),
  CONSTRAINT users_extended_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_extended_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);
// ============================================
// LEADERBOARD SERVICE
// Serviço para features de leaderboard e stats da comunidade
// ============================================

import { supabase } from "@/lib/supabase";
import { LeaderboardEntry, LeaderboardOptIn } from "@/types";

// ============================================
// DB TYPES (snake_case)
// ============================================

interface DBLeaderboardOptIn {
  user_id: string;
  display_name: string;
  show_win_rate: boolean;
  show_profit_factor: boolean;
  show_total_trades: boolean;
  show_pnl: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapLeaderboardOptInFromDB(db: DBLeaderboardOptIn): LeaderboardOptIn {
  return {
    userId: db.user_id,
    displayName: db.display_name,
    showWinRate: db.show_win_rate,
    showProfitFactor: db.show_profit_factor,
    showTotalTrades: db.show_total_trades,
    showPnl: db.show_pnl,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ============================================
// LEADERBOARD FUNCTIONS
// ============================================

/**
 * Busca o nome de exibição atual do usuário (para auto-preenchimento).
 * @returns {Promise<string | null>} O nome de exibição ou null.
 * @example
 * const name = await getCurrentUserDisplayName();
 */
export async function getCurrentUserDisplayName(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Tentar leaderboard_opt_in (se já entrou antes)
  const { data: leader } = await supabase
    .from("leaderboard_opt_in")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (leader?.display_name) return leader.display_name;

  // 2. Tentar raw_user_metadata
  if (user.user_metadata?.first_name) return user.user_metadata.first_name;
  if (user.user_metadata?.full_name) return user.user_metadata.full_name;
  if (user.user_metadata?.name) return user.user_metadata.name;

  return null;
}

/**
 * Inscreve o usuário no leaderboard com as preferências selecionadas.
 * @param {string} displayName - Nome de exibição público.
 * @param {object} [options] - Opções de privacidade.
 * @param {boolean} [options.showWinRate] - Mostrar Win Rate.
 * @param {boolean} [options.showProfitFactor] - Mostrar Fator de Lucro.
 * @param {boolean} [options.showTotalTrades] - Mostrar Total de Trades.
 * @param {boolean} [options.showPnl] - Mostrar PnL (Lucro/Prejuízo).
 * @returns {Promise<LeaderboardOptIn | null>} Dados da inscrição ou null.
 * @example
 * const entry = await joinLeaderboard('TraderPRO', { showWinRate: true });
 */
export async function joinLeaderboard(
  displayName: string,
  options: {
    showWinRate?: boolean;
    showProfitFactor?: boolean;
    showTotalTrades?: boolean;
    showPnl?: boolean;
  } = {}
): Promise<LeaderboardOptIn | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("leaderboard_opt_in")
    .upsert({
      user_id: user.id,
      display_name: displayName,
      show_win_rate: options.showWinRate ?? true,
      show_profit_factor: options.showProfitFactor ?? true,
      show_total_trades: options.showTotalTrades ?? true,
      show_pnl: options.showPnl ?? false,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao entrar no leaderboard:", error);
    return null;
  }

  return mapLeaderboardOptInFromDB(data);
}

/**
 * Remove o usuário do leaderboard (Opt-out).
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await leaveLeaderboard();
 */
export async function leaveLeaderboard(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("leaderboard_opt_in").delete().eq("user_id", user.id);

  if (error) {
    console.error("Erro ao sair do leaderboard:", error);
    return false;
  }

  return true;
}

/**
 * Verifica se o usuário já está no leaderboard e retorna seus dados.
 * @returns {Promise<LeaderboardOptIn | null>} Dados da inscrição ou null se não inscrito.
 * @example
 * const status = await getMyLeaderboardStatus();
 */
export async function getMyLeaderboardStatus(): Promise<LeaderboardOptIn | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("leaderboard_opt_in")
    .select()
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return mapLeaderboardOptInFromDB(data);
}

/**
 * Busca a lista completa do leaderboard ordenada por rank.
 * @returns {Promise<LeaderboardEntry[]>} Lista de entradas do leaderboard.
 * @example
 * const leaderboard = await getLeaderboard();
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  // Usar a view que já calcula as estatísticas
  const { data, error } = await supabase.from("leaderboard_view").select("*").limit(100);

  if (error) {
    console.error("Erro ao buscar leaderboard:", error);
    return [];
  }

  return (data || []).map((item, index) => ({
    userId: item.user_id,
    displayName: item.display_name,
    showWinRate: item.show_win_rate,
    showProfitFactor: item.show_profit_factor,
    showTotalTrades: item.show_total_trades,
    showPnl: item.show_pnl,
    totalTrades: item.total_trades,
    winRate: item.win_rate,
    totalPnl: item.total_pnl,
    avgRR: item.avg_rr, // Avg RR from view
    streak: item.streak, // Streak from view
    rank: index + 1,
  }));
}

/**
 * Atualiza as preferências de exibição do usuário no leaderboard.
 * @param {object} options - As opções a serem atualizadas.
 * @param {string} [options.displayName] - Nome de exibição.
 * @param {boolean} [options.showWinRate] - Mostrar Win Rate.
 * @param {boolean} [options.showProfitFactor] - Mostrar Fator de Lucro.
 * @param {boolean} [options.showTotalTrades] - Mostrar Total de Trades.
 * @param {boolean} [options.showPnl] - Mostrar PnL.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await updateLeaderboardPreferences({ showPnl: true });
 */
export async function updateLeaderboardPreferences(
  options: Partial<{
    displayName: string;
    showWinRate: boolean;
    showProfitFactor: boolean;
    showTotalTrades: boolean;
    showPnl: boolean;
  }>
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (options.displayName !== undefined) updateData.display_name = options.displayName;
  if (options.showWinRate !== undefined) updateData.show_win_rate = options.showWinRate;
  if (options.showProfitFactor !== undefined)
    updateData.show_profit_factor = options.showProfitFactor;
  if (options.showTotalTrades !== undefined) updateData.show_total_trades = options.showTotalTrades;
  if (options.showPnl !== undefined) updateData.show_pnl = options.showPnl;

  const { error } = await supabase
    .from("leaderboard_opt_in")
    .update(updateData)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erro ao atualizar preferências:", error);
    return false;
  }

  return true;
}

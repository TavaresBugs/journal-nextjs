import { supabase } from '@/lib/supabase';
import { handleServiceError } from '@/lib/errorHandler';
import { Trade, TradeLite } from '@/types';
import { getCurrentUserId } from '@/services/core/account';
import { TradeRepository } from '@/lib/repositories/TradeRepository';
import { mapTradeFromDB, mapTradeToDB } from '@/services/trades/mappers';

// Re-export mappers for backward compatibility
export { mapTradeFromDB, mapTradeToDB };

// ============================================
// TRADES
// ============================================

const tradeRepo = new TradeRepository(supabase);

/**
 * Obtém os trades de uma conta específica.
 * @param {string} accountId - O ID da conta.
 * @returns {Promise<Trade[]>} Lista de trades.
 * @example
 * const trades = await getTrades('account-id');
 */
export async function getTrades(accountId: string): Promise<Trade[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        handleServiceError(new Error('User not authenticated'), 'tradeService.getTrades', { severity: 'silent' });
        return [];
    }

    const result = await tradeRepo.getByAccountId(accountId, { detailed: true });

    if (result.error) {
         handleServiceError(result.error, 'tradeService.getTrades');
         return [];
    }

    // Additional filtering for user_id to ensure safety, although Repo/RLS should handle it
    return result.data!.filter(t => t.userId === userId);
}

/**
 * Obtém um trade específico pelo ID.
 * @param {string} id - O ID do trade.
 * @returns {Promise<Trade | null>} O trade completo ou null se não encontrado.
 */
export async function getTradeById(id: string): Promise<Trade | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await tradeRepo.getByIdDomain(id);

    if (result.error) {
        // If not found, it might return an error or just null depending on how we handle it.
        // BaseRepository returns error for single() failure usually.
        // But for consistency with previous implementation we return null on error if it's just not found.
        if (result.error.code === 'DB_NOT_FOUND') return null;

        handleServiceError(result.error, 'tradeService.getTradeById');
        return null;
    }

    if (result.data?.userId !== userId) return null;

    return result.data;
}

/**
 * Obtém múltiplos trades pelos seus IDs.
 * @param {string[]} ids - Lista de IDs dos trades.
 * @returns {Promise<Trade[]>} Lista de trades encontrados.
 */
export async function getTradesByIds(ids: string[]): Promise<Trade[]> {
    if (!ids || ids.length === 0) return [];
    
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Not yet in Repository, using direct Supabase for now or adding to Repo
    // For now, let's keep it as is but wrap error handling if we wanted,
    // or add `getByIds` to BaseRepository.

    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .in('id', ids)
        .eq('user_id', userId);

    if (error) {
        handleServiceError(error, 'tradeService.getTradesByIds');
        return [];
    }

    return data ? data.map(mapTradeFromDB) : [];
}

/**
 * Obtém os trades de uma conta com paginação simples.
 * @param {string} accountId - O ID da conta.
 * @param {number} page - Página atual (1-based).
 * @param {number} pageSize - Itens por página.
 * @returns {Promise<{ data: Trade[], count: number }>} Lista de trades e total.
 */
export async function getTradesPaginated(accountId: string, page: number = 1, pageSize: number = 20): Promise<{ data: Trade[], count: number }> {
    const userId = await getCurrentUserId();
    if (!userId) return { data: [], count: 0 };

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // TODO: Add pagination support to BaseRepository or TradeRepository
    const { data, error, count } = await supabase
        .from('trades')
        .select('*', { count: 'exact' })
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('entry_time', { ascending: false })
        .range(from, to);

    if (error) {
        handleServiceError(error, 'tradeService.getTradesPaginated');
        return { data: [], count: 0 };
    }

    return {
        data: data ? data.map(mapTradeFromDB) : [],
        count: count || 0
    };
}

/**
 * Mapeia um trade parcial do banco para TradeLite.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapTradeLiteFromDB = (db: any): TradeLite => ({
    id: db.id,
    entryDate: db.entry_date,
    entryTime: db.entry_time,
    exitDate: db.exit_date,
    exitTime: db.exit_time,
    pnl: db.pnl ? Number(db.pnl) : undefined,
    outcome: db.outcome,
    accountId: db.account_id,
    symbol: db.symbol,
    type: db.type,
    entryPrice: Number(db.entry_price),
    exitPrice: db.exit_price ? Number(db.exit_price) : undefined,
    stopLoss: Number(db.stop_loss),
    takeProfit: Number(db.take_profit),
    lot: Number(db.lot),
    tags: db.tags,
    strategy: db.strategy,
    setup: db.setup,
    tfAnalise: db.tf_analise,
    tfEntrada: db.tf_entrada,
    // Market condition (legacy)
    marketCondition: db.market_condition,
    // Entry Telemetry v2
    entry_quality: db.entry_quality,
    market_condition_v2: db.market_condition_v2,
    pdArray: db.pd_array,
    session: db.session,
    commission: db.commission ? Number(db.commission) : undefined,
    swap: db.swap ? Number(db.swap) : undefined,
});

/**
 * Obtém histórico leve (apenas dados críticos) para gráficos.
 * @param {string} accountId
 * @returns {Promise<TradeLite[]>}
 */
export async function getTradeHistoryLite(accountId: string): Promise<TradeLite[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Using repository for cleaner query
    // We can add a specialized method to TradeRepository later,
    // for now we can use the fragments if we want, but BaseRepository.query gives us flexibility.

    // Let's stick to the existing query pattern but using repository query wrapper could be beneficial
    // But since it selects specific fields that might not match DBTrade exactly (partial),
    // we keep it direct or create a specialized method.

    const { data, error } = await supabase
        .from('trades')
        .select('id, entry_date, entry_time, exit_date, exit_time, pnl, outcome, account_id, symbol, type, entry_price, exit_price, stop_loss, take_profit, lot, tags, strategy, setup, tf_analise, tf_entrada, market_condition, entry_quality, market_condition_v2, pd_array, session, user_id, commission, swap')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('entry_time', { ascending: false });

    if (error) {
        handleServiceError(error, 'tradeService.getTradeHistoryLite');
        return [];
    }

    return data ? data.map(mapTradeLiteFromDB) : [];
}

/**
 * Salva ou atualiza um trade.
 * @param {Trade} trade - O objeto de trade a ser salvo.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await saveTrade(myTrade);
 */
export async function saveTrade(trade: Trade): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        handleServiceError(new Error('User not authenticated'), 'tradeService.saveTrade', { severity: 'silent' });
        return false;
    }

    const tradeWithUser = {
        ...trade,
        userId
    };

    const result = await tradeRepo.createDomain(tradeWithUser);

    if (result.error) {
        handleServiceError(result.error, 'tradeService.saveTrade', { showToast: true });
        return false;
    }

    return true;
}

/**
 * Exclui um trade pelo ID.
 * @param {string} id - O ID do trade.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 * @example
 * const success = await deleteTrade('trade-id');
 */
export async function deleteTrade(id: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) {
        handleServiceError(new Error('User not authenticated'), 'tradeService.deleteTrade', { severity: 'silent' });
        return false;
    }

    const result = await tradeRepo.deleteDomain(id, userId);

    if (result.error) {
        handleServiceError(result.error, 'tradeService.deleteTrade', { showToast: true });
        return false;
    }

    return true;
}

/**
 * Exclui todos os trades de uma conta específica.
 * @param {string} accountId - O ID da conta.
 * @returns {Promise<boolean>} True se sucesso, False caso contrário.
 */
export async function deleteTradesByAccount(accountId: string): Promise<boolean> {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
        .from('trades')
        .delete()
        .eq('account_id', accountId)
        .eq('user_id', userId);

    if (error) {
        handleServiceError(error, 'tradeService.deleteTradesByAccount', { showToast: true });
        return false;
    }
    return true;
}

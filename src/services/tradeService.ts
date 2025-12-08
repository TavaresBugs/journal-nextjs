import { supabase } from '@/lib/supabase';
import { Trade, TradeLite } from '@/types';
import { DBTrade } from '@/types/database';
import { getCurrentUserId } from './accountService';

// ============================================
// MAPPERS
// ============================================

/**
 * Mapeia um trade do banco de dados para o tipo da aplicação.
 * @param {DBTrade} db - Objeto de trade do banco de dados.
 * @returns {Trade} Objeto de trade da aplicação.
 * @example
 * const trade = mapTradeFromDB(dbTrade);
 */
export const mapTradeFromDB = (db: DBTrade): Trade => ({
    id: db.id,
    userId: db.user_id,
    accountId: db.account_id,
    symbol: db.symbol,
    type: db.type,
    entryPrice: Number(db.entry_price),
    stopLoss: Number(db.stop_loss),
    takeProfit: Number(db.take_profit),
    exitPrice: db.exit_price ? Number(db.exit_price) : undefined,
    lot: Number(db.lot),
    commission: db.commission ? Number(db.commission) : undefined,
    swap: db.swap ? Number(db.swap) : undefined,
    tfAnalise: db.tf_analise,
    tfEntrada: db.tf_entrada,
    tags: db.tags,
    strategy: db.strategy,
    setup: db.setup,
    notes: db.notes,
    entryDate: db.entry_date,
    entryTime: db.entry_time,
    exitDate: db.exit_date,
    exitTime: db.exit_time,
    pnl: db.pnl ? Number(db.pnl) : undefined,
    outcome: db.outcome,
    // Telemetry
    session: db.session,
    htfAligned: db.htf_aligned,
    rMultiple: db.r_multiple ? Number(db.r_multiple) : undefined,
    marketCondition: db.market_condition as Trade['marketCondition'],
    planAdherence: db.plan_adherence as Trade['planAdherence'],
    planAdherenceRating: db.plan_adherence_rating,
    // Entry Telemetry v2
    entry_quality: db.entry_quality as Trade['entry_quality'],
    market_condition_v2: db.market_condition_v2 as Trade['market_condition_v2'],
    createdAt: db.created_at,
    updatedAt: db.updated_at,
});

/**
 * Mapeia um trade da aplicação para o tipo do banco de dados.
 * @param {Trade} app - Objeto de trade da aplicação.
 * @returns {DBTrade} Objeto de trade do banco de dados.
 * @example
 * const dbTrade = mapTradeToDB(trade);
 */
export const mapTradeToDB = (app: Trade): DBTrade => ({
    id: app.id,
    user_id: app.userId,
    account_id: app.accountId,
    symbol: app.symbol,
    type: app.type,
    entry_price: app.entryPrice,
    stop_loss: app.stopLoss,
    take_profit: app.takeProfit,
    exit_price: app.exitPrice,
    lot: app.lot,
    commission: app.commission,
    swap: app.swap,
    tf_analise: app.tfAnalise,
    tf_entrada: app.tfEntrada,
    tags: app.tags,
    strategy: app.strategy,
    setup: app.setup,
    notes: app.notes,
    entry_date: app.entryDate,
    entry_time: app.entryTime || '',
    exit_date: app.exitDate,
    exit_time: app.exitTime,
    pnl: app.pnl,
    outcome: app.outcome,
    // Telemetry
    session: app.session,
    htf_aligned: app.htfAligned,
    r_multiple: app.rMultiple,
    market_condition: app.marketCondition,
    plan_adherence: app.planAdherence,
    plan_adherence_rating: app.planAdherenceRating,
    // Entry Telemetry v2
    entry_quality: app.entry_quality,
    market_condition_v2: app.market_condition_v2,
    created_at: app.createdAt,
    updated_at: new Date().toISOString(),
});

// ============================================
// TRADES
// ============================================

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
        console.error('User not authenticated');
        return [];
    }

    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .order('entry_date', { ascending: false });

    if (error) {
        console.error('Error fetching trades:', error);
        return [];
    }

    return data ? data.map(mapTradeFromDB) : [];
}

/**
 * Obtém um trade específico pelo ID.
 * @param {string} id - O ID do trade.
 * @returns {Promise<Trade | null>} O trade completo ou null se não encontrado.
 */
export async function getTradeById(id: string): Promise<Trade | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching trade by id:', error);
        return null;
    }

    return data ? mapTradeFromDB(data) : null;
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

    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .in('id', ids)
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching trades by ids:', error);
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

    // Get Data
    const { data, error, count } = await supabase
        .from('trades')
        .select('*', { count: 'exact' })
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching paginated trades:', error);
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
    session: db.session,
});

/**
 * Obtém histórico leve (apenas dados críticos) para gráficos.
 * @param {string} accountId
 * @returns {Promise<TradeLite[]>}
 */
export async function getTradeHistoryLite(accountId: string): Promise<TradeLite[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    // Select only necessary columns to reduce payload
    const { data, error } = await supabase
        .from('trades')
        .select('id, entry_date, entry_time, exit_date, exit_time, pnl, outcome, account_id, symbol, type, entry_price, exit_price, stop_loss, take_profit, lot, tags, strategy, setup, tf_analise, tf_entrada, market_condition, entry_quality, market_condition_v2, session, user_id')
        .eq('account_id', accountId)
        .eq('user_id', userId)
        .order('entry_date', { ascending: false });

    if (error) {
        console.error('Error fetching history lite:', error);
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
        console.error('User not authenticated');
        return false;
    }

    const tradeWithUser = {
        ...trade,
        userId
    };

    const { error } = await supabase
        .from('trades')
        .upsert(mapTradeToDB(tradeWithUser));

    if (error) {
        console.error('Error saving trade:', error);
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
        console.error('User not authenticated');
        return false;
    }

    // 3. Delete the trade
    const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting trade:', error);
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
        console.error('Error deleting trades by account:', error);
        return false;
    }
    return true;
}

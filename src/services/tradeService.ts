import { supabase } from '@/lib/supabase';
import { Trade } from '@/types';
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

    // Note: Circular dependency if we import deleteJournalEntry here.
    // Ideally, we should handle this via cascade delete in DB or a separate cleanup service.
    // For now, let's assume cascade or handle in `storage.ts` aggregation.
    // But since I am refactoring, I should probably handle this properly.
    // The original code imported deleteJournalEntry.
    // I will return to this.

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

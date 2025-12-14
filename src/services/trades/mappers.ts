import { DBTrade } from '@/types/database';
import { Trade } from '@/types';

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
    strategyIcon: db.strategy_icon,
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
    pdArray: db.pd_array as Trade['pdArray'],
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
    strategy_icon: app.strategyIcon,
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
    pd_array: app.pdArray,
    created_at: app.createdAt,
    updated_at: new Date().toISOString(),
});

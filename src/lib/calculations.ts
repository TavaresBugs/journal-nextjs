// ============================================
// CALCULATIONS - Funções de Cálculo
// ============================================

import type { Trade, TradeMetrics, TradeFilters } from '@/types';

/**
 * Calcular P&L de um trade
 */
export function calculateTradePnL(trade: Trade, assetMultiplier: number = 1): number {
    if (!trade.exitPrice) return 0;

    const { type, entryPrice, exitPrice, lot } = trade;

    let pips: number;
    if (type === 'Long') {
        pips = exitPrice - entryPrice;
    } else {
        pips = entryPrice - exitPrice;
    }

    return pips * lot * assetMultiplier;
}

/**
 * Determinar outcome de um trade
 */
export function determineTradeOutcome(trade: Trade): Trade['outcome'] {
    if (!trade.exitPrice) return 'pending';

    const pnl = trade.pnl || 0;

    if (pnl > 0) return 'win';
    if (pnl < 0) return 'loss';
    return 'breakeven';
}

/**
 * Filtrar trades
 */
export function filterTrades(trades: Trade[], filters: TradeFilters): Trade[] {
    return trades.filter(trade => {
        if (filters.accountId && trade.accountId !== filters.accountId) return false;
        if (filters.symbol && trade.symbol !== filters.symbol) return false;
        if (filters.type && trade.type !== filters.type) return false;
        if (filters.outcome && trade.outcome !== filters.outcome) return false;
        if (filters.dateFrom && trade.entryDate < filters.dateFrom) return false;
        if (filters.dateTo && trade.entryDate > filters.dateTo) return false;
        return true;
    });
}

/**
 * Calcular métricas de trading
 */
export function calculateTradeMetrics(trades: Trade[]): TradeMetrics {
    const totalTrades = trades.length;

    const wins = trades.filter(t => t.outcome === 'win').length;
    const losses = trades.filter(t => t.outcome === 'loss').length;
    const breakeven = trades.filter(t => t.outcome === 'breakeven').length;
    const pending = trades.filter(t => t.outcome === 'pending').length;

    const winRate = totalTrades > 0 ? (wins / (wins + losses)) * 100 : 0;

    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const winningTrades = trades.filter(t => t.outcome === 'win');
    const losingTrades = trades.filter(t => t.outcome === 'loss');

    const avgWin = winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
        : 0;

    const avgLoss = losingTrades.length > 0
        ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
        : 0;

    const profitFactor = avgLoss > 0 ? (avgWin * wins) / (avgLoss * losses) : 0;

    // Calcular max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;

    for (const trade of trades) {
        runningPnL += trade.pnl || 0;
        if (runningPnL > peak) {
            peak = runningPnL;
        }
        const drawdown = peak - runningPnL;
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }

    return {
        totalTrades,
        wins,
        losses,
        breakeven,
        pending,
        winRate,
        totalPnL,
        avgWin,
        avgLoss,
        profitFactor,
        maxDrawdown,
    };
}

/**
 * Agrupar trades por dia
 */
export function groupTradesByDay(trades: Trade[]): Record<string, Trade[]> {
    return trades.reduce((acc, trade) => {
        const date = trade.entryDate.split('T')[0]; // YYYY-MM-DD
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(trade);
        return acc;
    }, {} as Record<string, Trade[]>);
}

/**
 * Calcular duração de um trade em minutos
 */
export function calculateTradeDuration(trade: Trade): number {
    if (!trade.exitDate || !trade.exitTime) return 0;

    const entryDateTime = new Date(`${trade.entryDate}T${trade.entryTime || '00:00'}`);
    const exitDateTime = new Date(`${trade.exitDate}T${trade.exitTime}`);

    const diffMs = exitDateTime.getTime() - entryDateTime.getTime();
    return Math.floor(diffMs / 1000 / 60); // minutos
}

/**
 * Formatar duração em formato legível
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours < 24) return `${hours}h ${mins}m`;

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return `${days}d ${remainingHours}h`;
}

/**
 * Formatar valor monetário
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
    }).format(value);
}

/**
 * Formatar porcentagem
 */
export function formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
}

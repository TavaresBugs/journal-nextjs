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

// ============================================
// ADVANCED METRICS - Métricas Avançadas
// ============================================

/**
 * Calculate Sharpe Ratio - measures risk-adjusted returns
 * @param trades - Array of trades
 * @param riskFreeRate - Annual risk-free rate (default 0.02 = 2%)
 * @returns Sharpe Ratio (>2.0 is very good, >3.0 is exceptional)
 */
export function calculateSharpeRatio(trades: Trade[], riskFreeRate: number = 0.02): number {
    if (trades.length < 2) return 0;
    
    // Calculate daily returns
    const returns: number[] = [];
    let equity = 0;
    
    const sortedTrades = [...trades].sort((a, b) =>
        new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );
    
    sortedTrades.forEach((trade, index) => {
        const prevEquity = equity;
        equity += trade.pnl || 0;
        
        if (index > 0 && prevEquity !== 0) {
            const dailyReturn = (equity - prevEquity) / Math.abs(prevEquity);
            returns.push(dailyReturn);
        }
    });
    
    if (returns.length === 0) return 0;
    
    // Average return
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    
    // Standard deviation
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    // Annualize (assuming 252 trading days)
    const dailyRiskFreeRate = riskFreeRate / 252;
    const sharpeRatio = (avgReturn - dailyRiskFreeRate) / stdDev * Math.sqrt(252);
    
    return sharpeRatio;
}

/**
 * Calculate Calmar Ratio - return vs maximum drawdown
 * @param trades - Array of trades
 * @param initialBalance - Starting balance
 * @param periodDays - Number of trading days (default 365)
 * @returns Calmar Ratio (>3.0 is good)
 */
export function calculateCalmarRatio(
    trades: Trade[], 
    initialBalance: number, 
    periodDays: number = 365
): number {
    if (trades.length === 0 || initialBalance === 0) return 0;
    
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const finalBalance = initialBalance + totalPnL;
    
    // Annualized return
    const totalReturn = (finalBalance - initialBalance) / initialBalance;
    const annualizedReturn = totalReturn * (365 / periodDays);
    
    // Maximum drawdown (as decimal, not %)
    const maxDrawdown = calculateMaxDrawdownDecimal(trades, initialBalance);
    
    if (maxDrawdown === 0) return 0;
    
    return annualizedReturn / maxDrawdown;
}

/**
 * Helper: Calculate max drawdown as decimal
 */
function calculateMaxDrawdownDecimal(trades: Trade[], initialBalance: number): number {
    let peak = initialBalance;
    let maxDD = 0;
    let equity = initialBalance;
    
    const sortedTrades = [...trades].sort((a, b) =>
        new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );
    
    sortedTrades.forEach(trade => {
        equity += trade.pnl || 0;
        if (equity > peak) peak = equity;
        const dd = peak > 0 ? (peak - equity) / peak : 0;
        if (dd > maxDD) maxDD = dd;
    });
    
    return maxDD;
}

/**
 * Calculate Average Hold Time for winners vs losers
 * @param trades - Array of trades
 * @returns Object with average hold times in minutes
 */
export function calculateAverageHoldTime(trades: Trade[]): {
    avgWinnerTime: number; // in minutes
    avgLoserTime: number;
    avgAllTrades: number;
    winnerCount: number;
    loserCount: number;
} {
    const winners = trades.filter(t => t.outcome === 'win' && t.exitDate && t.exitTime);
    const losers = trades.filter(t => t.outcome === 'loss' && t.exitDate && t.exitTime);
    
    const calcDuration = (trade: Trade): number => {
        if (!trade.exitDate || !trade.exitTime) return 0;
        
        const entry = new Date(`${trade.entryDate}T${trade.entryTime || '00:00'}`);
        const exit = new Date(`${trade.exitDate}T${trade.exitTime}`);
        
        return (exit.getTime() - entry.getTime()) / (1000 * 60); // minutes
    };
    
    const avgWinnerTime = winners.length > 0
        ? winners.reduce((sum, t) => sum + calcDuration(t), 0) / winners.length
        : 0;
    
    const avgLoserTime = losers.length > 0
        ? losers.reduce((sum, t) => sum + calcDuration(t), 0) / losers.length
        : 0;
    
    const allWithTime = trades.filter(t => t.exitDate && t.exitTime);
    const avgAllTrades = allWithTime.length > 0
        ? allWithTime.reduce((sum, t) => sum + calcDuration(t), 0) / allWithTime.length
        : 0;
    
    return { 
        avgWinnerTime, 
        avgLoserTime, 
        avgAllTrades,
        winnerCount: winners.length,
        loserCount: losers.length
    };
}

/**
 * Calculate Consecutive Win/Loss Streaks
 * @param trades - Array of trades
 * @returns Object with max streaks and current streak
 */
export function calculateConsecutiveStreaks(trades: Trade[]): {
    maxWinStreak: number;
    maxLossStreak: number;
    currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
} {
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    const sortedTrades = [...trades].sort((a, b) =>
        new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );
    
    sortedTrades.forEach(trade => {
        if (trade.outcome === 'win') {
            currentWinStreak++;
            currentLossStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
        } else if (trade.outcome === 'loss') {
            currentLossStreak++;
            currentWinStreak = 0;
            maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
        }
    });
    
    let currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
    if (currentWinStreak > 0) {
        currentStreak = { type: 'win', count: currentWinStreak };
    } else if (currentLossStreak > 0) {
        currentStreak = { type: 'loss', count: currentLossStreak };
    } else {
        currentStreak = { type: 'none', count: 0 };
    }
    
    return { maxWinStreak, maxLossStreak, currentStreak };
}

/**
 * Format time in minutes to readable string
 * @param minutes - Time in minutes
 * @returns Formatted string (e.g., "1h 30m" or "45m")
 */
export function formatTimeMinutes(minutes: number): string {
    if (minutes < 60) {
        return `${Math.round(minutes)}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (mins === 0) {
        return `${hours}h`;
    }
    
    return `${hours}h ${mins}m`;
}

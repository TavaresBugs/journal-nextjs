import type { Trade } from '@/types';

// ============================================
// INTERFACES
// ============================================

export interface TagMetrics {
    tag: string;
    totalTrades: number;
    wins: number;
    losses: number;
    breakeven: number;
    winRate: number;
    netPnL: number;
    avgPnL: number;
    profitFactor: number;
}

// ============================================
// PARSING FUNCTIONS
// ============================================

/**
 * Parse tags string into array of trimmed, unique tags
 */
export function parseTagsFromString(tagsString?: string | null): string[] {
    if (!tagsString) return [];
    return tagsString
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
}

/**
 * Get all unique tags from a list of trades
 */
export function getAllUniqueTags(trades: Trade[]): string[] {
    const tagSet = new Set<string>();
    trades.forEach(trade => {
        parseTagsFromString(trade.tags).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
}

// ============================================
// METRICS CALCULATION
// ============================================

/**
 * Calculate performance metrics for each tag
 */
export function calculateTagMetrics(trades: Trade[]): TagMetrics[] {
    const tagMap = new Map<string, {
        trades: Trade[];
        wins: number;
        losses: number;
        breakeven: number;
        totalPnL: number;
    }>();

    // Group trades by tag
    trades.forEach(trade => {
        const tags = parseTagsFromString(trade.tags);
        
        tags.forEach(tag => {
            if (!tagMap.has(tag)) {
                tagMap.set(tag, { trades: [], wins: 0, losses: 0, breakeven: 0, totalPnL: 0 });
            }
            
            const data = tagMap.get(tag)!;
            data.trades.push(trade);
            data.totalPnL += trade.pnl || 0;
            
            if (trade.outcome === 'win') data.wins++;
            else if (trade.outcome === 'loss') data.losses++;
            else if (trade.outcome === 'breakeven') data.breakeven++;
        });
    });

    // Calculate metrics for each tag
    const metrics: TagMetrics[] = [];
    
    tagMap.forEach((data, tag) => {
        const totalTrades = data.trades.length;
        const winRate = totalTrades > 0 ? (data.wins / totalTrades) * 100 : 0;
        const avgPnL = totalTrades > 0 ? data.totalPnL / totalTrades : 0;

        // Profit Factor calculation
        const totalWins = data.trades
            .filter(t => t.outcome === 'win')
            .reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalLosses = Math.abs(
            data.trades
                .filter(t => t.outcome === 'loss')
                .reduce((sum, t) => sum + (t.pnl || 0), 0)
        );
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? 999 : 0);

        metrics.push({
            tag,
            totalTrades,
            wins: data.wins,
            losses: data.losses,
            breakeven: data.breakeven,
            winRate,
            netPnL: data.totalPnL,
            avgPnL,
            profitFactor
        });
    });

    // Sort by total trades (most used tags first)
    return metrics.sort((a, b) => b.totalTrades - a.totalTrades);
}

/**
 * Filter trades by strategy and calculate tag metrics
 */
export function getTagMetricsForStrategy(trades: Trade[], strategy: string): TagMetrics[] {
    const filteredTrades = trades.filter(t => t.strategy === strategy);
    return calculateTagMetrics(filteredTrades);
}

// ============================================
// TIMEFRAME ANALYSIS
// ============================================

export interface TimeframeMetrics {
    timeframe: string;
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    netPnL: number;
    profitFactor: number;
}

/**
 * Calculate metrics by analysis timeframe (tfAnalise)
 */
export function calculateTimeframeAnaliseMetrics(trades: Trade[]): TimeframeMetrics[] {
    const tfMap = new Map<string, {
        trades: Trade[];
        wins: number;
        losses: number;
        totalPnL: number;
    }>();

    trades.forEach(trade => {
        const tf = trade.tfAnalise || 'Não definido';
        
        if (!tfMap.has(tf)) {
            tfMap.set(tf, { trades: [], wins: 0, losses: 0, totalPnL: 0 });
        }
        
        const data = tfMap.get(tf)!;
        data.trades.push(trade);
        data.totalPnL += trade.pnl || 0;
        
        if (trade.outcome === 'win') data.wins++;
        else if (trade.outcome === 'loss') data.losses++;
    });

    return buildMetricsFromMap(tfMap);
}

/**
 * Calculate metrics by entry timeframe (tfEntrada)
 */
export function calculateTimeframeEntradaMetrics(trades: Trade[]): TimeframeMetrics[] {
    const tfMap = new Map<string, {
        trades: Trade[];
        wins: number;
        losses: number;
        totalPnL: number;
    }>();

    trades.forEach(trade => {
        const tf = trade.tfEntrada || 'Não definido';
        
        if (!tfMap.has(tf)) {
            tfMap.set(tf, { trades: [], wins: 0, losses: 0, totalPnL: 0 });
        }
        
        const data = tfMap.get(tf)!;
        data.trades.push(trade);
        data.totalPnL += trade.pnl || 0;
        
        if (trade.outcome === 'win') data.wins++;
        else if (trade.outcome === 'loss') data.losses++;
    });

    return buildMetricsFromMap(tfMap);
}

// Helper function to build metrics from map
function buildMetricsFromMap(
    tfMap: Map<string, { trades: Trade[]; wins: number; losses: number; totalPnL: number }>
): TimeframeMetrics[] {
    const metrics: TimeframeMetrics[] = [];

    tfMap.forEach((data, timeframe) => {
        const totalTrades = data.trades.length;
        const winRate = totalTrades > 0 ? (data.wins / totalTrades) * 100 : 0;

        const totalWins = data.trades
            .filter(t => t.outcome === 'win')
            .reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalLosses = Math.abs(
            data.trades
                .filter(t => t.outcome === 'loss')
                .reduce((sum, t) => sum + (t.pnl || 0), 0)
        );
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? 999 : 0);

        metrics.push({
            timeframe,
            totalTrades,
            wins: data.wins,
            losses: data.losses,
            winRate,
            netPnL: data.totalPnL,
            profitFactor
        });
    });

    return metrics.sort((a, b) => b.totalTrades - a.totalTrades);
}

import type { Trade } from '@/types';

export interface DayStats {
  totalPnL: number;
  tradeCount: number;
  wins: number;
  losses: number;
  breakeven: number;
  bgClass: string;
  textClass: string;
  statusText: string;
  statusColor: string;
}

/**
 * Utility function to calculate day statistics and visual styling for trades.
 * Note: This is a pure function, not a hook, despite the "use" prefix kept for consistency.
 * 
 * @param trades - Array of trades for the day
 * @returns Calculated statistics and CSS classes for styling
 */
export function useDayStats(trades: Trade[]): DayStats {
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const wins = trades.filter(t => t.outcome === 'win').length;
  const losses = trades.filter(t => t.outcome === 'loss').length;
  const breakeven = trades.filter(t => t.outcome === 'breakeven').length;
  const tradeCount = trades.length;

  // Determine styling based on overall PnL
  let bgClass = 'bg-gray-900/30 border-gray-800';
  let textClass = 'text-gray-500';
  let statusText = '';
  let statusColor = '';

  if (tradeCount > 0) {
    if (totalPnL > 0) {
      bgClass = 'bg-green-900/20 border-green-500/30 hover:border-green-500/50';
      textClass = 'text-green-400';
      statusText = 'Win';
      statusColor = 'text-green-400';
    } else if (totalPnL < 0) {
      bgClass = 'bg-red-900/20 border-red-500/30 hover:border-red-500/50';
      textClass = 'text-red-400';
      statusText = 'Loss';
      statusColor = 'text-red-400';
    } else {
      bgClass = 'bg-gray-800/50 border-gray-600/30 hover:border-gray-500/50';
      textClass = 'text-gray-300';
      statusText = 'BE';
      statusColor = 'text-gray-400';
    }
  }

  return {
    totalPnL,
    tradeCount,
    wins,
    losses,
    breakeven,
    bgClass,
    textClass,
    statusText,
    statusColor
  };
}

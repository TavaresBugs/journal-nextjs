// ============================================
// WOLF SCORE (Based on Zella Score Logic)
// ============================================

import type { Trade, TradeMetrics } from "@/types";

/**
 * Wolf Score Metrics - Each normalized to 0-100 scale
 */
export interface WolfScoreMetrics {
  winRate: number; // 15% Weight
  profitFactor: number; // 25% Weight
  avgWinLossRatio: number; // 20% Weight
  recoveryFactor: number; // 10% Weight
  maxDrawdownScore: number; // 20% Weight
  consistency: number; // 10% Weight
}

/**
 * Full Wolf Score result
 */
export interface WolfScoreResult {
  score: number; // Final Wolf Score (0-100)
  metrics: WolfScoreMetrics;
  grade: "S" | "A" | "B" | "C" | "D" | "F";
  gradeColor: string;
  description: string;
}

/**
 * Weights for each metric in final score calculation (Zella Config)
 */
const METRIC_WEIGHTS = {
  winRate: 0.15,
  profitFactor: 0.25,
  avgWinLossRatio: 0.2,
  recoveryFactor: 0.1,
  maxDrawdownScore: 0.2,
  consistency: 0.1,
};

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Helper for linear interpolation between ranges
 */
function interpolate(val: number, x0: number, x1: number, y0: number, y1: number): number {
  if (val <= x0) return y0;
  if (val >= x1) return y1;
  return y0 + ((val - x0) * (y1 - y0)) / (x1 - x0);
}

/**
 * 1. Average Win/Loss Ratio Score
 * Ranges:
 * >= 2.6: 100
 * 2.4 - 2.59: 90-99
 * 2.2 - 2.39: 80-89
 * 2.0 - 2.19: 70-79
 * 1.9 - 1.99: 60-69
 * 1.8 - 1.89: 50-59
 * < 1.8: 20
 */
function calculateAvgWinLossScore(avgWin: number, avgLoss: number): number {
  if (avgLoss === 0) return avgWin > 0 ? 100 : 50;
  const ratio = avgWin / avgLoss;

  if (ratio >= 2.6) return 100;
  if (ratio >= 2.4) return interpolate(ratio, 2.4, 2.59, 90, 99);
  if (ratio >= 2.2) return interpolate(ratio, 2.2, 2.39, 80, 89);
  if (ratio >= 2.0) return interpolate(ratio, 2.0, 2.19, 70, 79);
  if (ratio >= 1.9) return interpolate(ratio, 1.9, 1.99, 60, 69);
  if (ratio >= 1.8) return interpolate(ratio, 1.8, 1.89, 50, 59);
  return 20;
}

/**
 * 2. Trade Win Percentage Score
 * Formula: (Win% / 60) * 100
 * Capped at 100 (if Win% > 60)
 */
function calculateWinRateScore(winRate: number): number {
  const score = (winRate / 60) * 100;
  return clamp(score, 0, 100);
}

/**
 * 3. Max Drawdown Score
 * Formula: 100 - MaxDD%
 */
function calculateMaxDrawdownScore(maxDrawdown: number, initialBalance: number): number {
  if (initialBalance <= 0) return 50; // Fallback
  // MaxDD% = (MaxDD / InitialBalance) * 100
  // Note: Using InitialBalance as proxy for "Max Cumulative P&L Before Drop"
  const ddPercent = (maxDrawdown / initialBalance) * 100;

  const score = 100 - ddPercent;
  return clamp(score, 0, 100);
}

/**
 * 4. Profit Factor Score
 * Ranges (Same as Avg Win/Loss):
 * >= 2.6: 100
 * 2.4 - 2.59: 90-99
 * ...
 * < 1.8: 20
 */
function calculateProfitFactorScore(pf: number): number {
  if (pf >= 2.6) return 100;
  if (pf >= 2.4) return interpolate(pf, 2.4, 2.59, 90, 99);
  if (pf >= 2.2) return interpolate(pf, 2.2, 2.39, 80, 89);
  if (pf >= 2.0) return interpolate(pf, 2.0, 2.19, 70, 79);
  if (pf >= 1.9) return interpolate(pf, 1.9, 1.99, 60, 69);
  if (pf >= 1.8) return interpolate(pf, 1.8, 1.89, 50, 59);
  return 20;
}

/**
 * 5. Recovery Factor Score
 * Ranges:
 * >= 3.5: 100
 * 3.0 - 3.49: 70-89
 * 2.5 - 2.99: 60-69
 * 2.0 - 2.49: 50-59
 * 1.5 - 1.99: 30-49
 * 1.0 - 1.49: 1-29
 * < 1.0: 0
 */
function calculateRecoveryFactorScore(totalPnL: number, maxDrawdown: number): number {
  // RF = Net Profit / Max Drawdown
  // If DD is 0, logic handles implied infinite recovery
  if (maxDrawdown === 0) return totalPnL > 0 ? 100 : 50;

  // Calculate RF strictly as PnL / DD (financial value / financial value)
  // Or PnL% / DD% (results are identical ratio)
  const recoveryFactor = totalPnL / maxDrawdown;

  if (recoveryFactor >= 3.5) return 100;
  if (recoveryFactor >= 3.0) return interpolate(recoveryFactor, 3.0, 3.49, 70, 89);
  if (recoveryFactor >= 2.5) return interpolate(recoveryFactor, 2.5, 2.99, 60, 69);
  if (recoveryFactor >= 2.0) return interpolate(recoveryFactor, 2.0, 2.49, 50, 59);
  if (recoveryFactor >= 1.5) return interpolate(recoveryFactor, 1.5, 1.99, 30, 49);
  if (recoveryFactor >= 1.0) return interpolate(recoveryFactor, 1.0, 1.49, 1, 29);
  return 0;
}

/**
 * 6. Consistency Score
 * Formula: If avg profit < 0 => 0.
 * Else: 100 - (StdDev / TotalMetrics * ??) -> Likely (StdDev / AvgProfit) which is CV.
 * Zella text: "Formula: If average profit < 0, then 0. Otherwise: Standard deviation of profits / Total profit. Score Ranges: 100 - Formula Result"
 * "Total profit" denominator sounds punitive for high trade volume. Assuming it implies "Average Profit" for CV calculation or "Total PnL".
 * "Standard deviation / Total Profit" usually results in a tiny number if N is large.
 * Let's assume standard CV: StdDev / Mean.
 * And Score = 100 - (CV * 100)? Or just raw CV subtraction?
 * Given "100 - Formula Result", the result must be 0-100.
 * If I use StdDev / Avg, CV is often > 1 (100%).
 * Let's interpret strictly: StdDev (daily) / Total Profit.
 * If Total Profit is 1000, StdDev is 100. Result = 0.1. Score = 100 - 0.1 = 99.9.
 * This encourages making LOTS of profit relative to variance.
 */
function calculateConsistencyScore(trades: Trade[]): number {
  if (trades.length < 2) return 50;

  // 1. Group by Day
  const dailyPnL: Record<string, number> = {};
  trades.forEach((t) => {
    const date = t.exitDate?.split("T")[0] || t.entryDate.split("T")[0];
    dailyPnL[date] = (dailyPnL[date] || 0) + (t.pnl || 0);
  });

  const dailyReturns = Object.values(dailyPnL);
  if (dailyReturns.length === 0) return 50;

  const totalProfit = dailyReturns.reduce((sum, val) => sum + val, 0);

  if (totalProfit <= 0) return 0; // "If average profit < 0, then 0" (implies total also <= 0)

  // Calculate StdDev of Daily PnL
  const mean = totalProfit / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance);

  // Zella Formula: StdDev / Total Profit
  // If StdDev = 500, TotalProfit = 5000 => 0.1
  // Score = 100 - 0.1 ?? That's 99.9.
  // Maybe it means 100 - (Result * 100) ? Or Result is %?
  // Let's assume the result is expected to be a percentage value like 20, 30.
  // If result is 0.1, maybe score is 100 - 10?
  // Let's implement literally first: 100 - (ratio * 100) seems fitting for a score scale.
  // Example: High variance (bad). StdDev 1000, Profit 1000. Ratio 1. Score 0.
  // Low variance (good). StdDev 100, Profit 10000. Ratio 0.01. Score 99.

  const ratio = stdDev / totalProfit;
  const score = 100 - ratio * 100;

  return clamp(score, 0, 100);
}

/**
 * Get grade based on score (Using Standard Scale)
 */
function getGrade(score: number): {
  grade: WolfScoreResult["grade"];
  color: string;
  description: string;
} {
  if (score >= 90) return { grade: "S", color: "#a855f7", description: "Zella Elite" };
  if (score >= 80) return { grade: "A", color: "#22c55e", description: "Excellent" };
  if (score >= 70) return { grade: "B", color: "#84cc16", description: "Good" };
  if (score >= 60) return { grade: "C", color: "#eab308", description: "Average" };
  if (score >= 50) return { grade: "D", color: "#f97316", description: "Below Average" };
  return { grade: "F", color: "#ef4444", description: "Needs Improvement" };
}

export function calculateWolfScore(
  trades: Trade[],
  metrics: TradeMetrics,
  initialBalance: number
): WolfScoreResult {
  // Calculate component scores
  const winRateScore = calculateWinRateScore(metrics.winRate);
  const profitFactorScore = calculateProfitFactorScore(metrics.profitFactor);
  const avgWinLossScore = calculateAvgWinLossScore(metrics.avgWin, metrics.avgLoss);
  const recoveryScore = calculateRecoveryFactorScore(metrics.totalPnL, metrics.maxDrawdown);
  const ddScore = calculateMaxDrawdownScore(metrics.maxDrawdown, initialBalance);
  const consistencyScore = calculateConsistencyScore(trades);

  const wolfMetrics: WolfScoreMetrics = {
    winRate: clamp(winRateScore, 0, 100),
    profitFactor: clamp(profitFactorScore, 0, 100),
    avgWinLossRatio: clamp(avgWinLossScore, 0, 100),
    recoveryFactor: clamp(recoveryScore, 0, 100),
    maxDrawdownScore: clamp(ddScore, 0, 100),
    consistency: clamp(consistencyScore, 0, 100),
  };

  // Weighted Sum
  let rawScore =
    wolfMetrics.winRate * METRIC_WEIGHTS.winRate +
    wolfMetrics.profitFactor * METRIC_WEIGHTS.profitFactor +
    wolfMetrics.avgWinLossRatio * METRIC_WEIGHTS.avgWinLossRatio +
    wolfMetrics.recoveryFactor * METRIC_WEIGHTS.recoveryFactor +
    wolfMetrics.maxDrawdownScore * METRIC_WEIGHTS.maxDrawdownScore +
    wolfMetrics.consistency * METRIC_WEIGHTS.consistency;

  // Cap at 100 just in case
  rawScore = clamp(rawScore, 0, 100);

  // Round to 1 decimal
  const finalScore = Math.round(rawScore * 10) / 10;

  const { grade, color, description } = getGrade(finalScore);

  return {
    score: finalScore,
    metrics: wolfMetrics,
    grade,
    gradeColor: color,
    description,
  };
}

export function getWolfScoreRadarData(metrics: WolfScoreMetrics) {
  return [
    { metric: "Win %", value: metrics.winRate, fullMark: 100 },
    { metric: "Profit Factor", value: metrics.profitFactor, fullMark: 100 },
    { metric: "Avg W/L", value: metrics.avgWinLossRatio, fullMark: 100 },
    { metric: "Recovery", value: metrics.recoveryFactor, fullMark: 100 },
    { metric: "Max DD", value: metrics.maxDrawdownScore, fullMark: 100 },
    { metric: "Consistency", value: metrics.consistency, fullMark: 100 },
  ];
}

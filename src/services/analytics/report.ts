/**
 * Excel Report Generator
 *
 * NOTE: Excel export functionality is currently DISABLED because ExcelJS
 * was removed to reduce bundle size (~800KB savings).
 *
 * To re-enable:
 * 1. Run: npm install exceljs
 * 2. Restore the original implementation from git history
 *
 * The helper functions are preserved and can be used for other report formats.
 */

import { Trade } from "@/types";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

interface ReportMetrics {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  bestTrade: number;
  worstTrade: number;
}

interface MonthlyMetrics {
  month: string;
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
  winRate: number;
}

/**
 * Generates an Excel report for a given period and account.
 *
 * @deprecated Excel export is currently disabled. ExcelJS was removed to reduce bundle size.
 * @throws Error - Always throws, indicating the feature is disabled.
 */
export async function generateReport(
  _accountId: string,
  _startDate: Date,
  _endDate: Date
): Promise<Blob> {
  // Suppress unused vars warning until feature is re-enabled
  void _accountId;
  void _startDate;
  void _endDate;

  throw new Error(
    "Excel export is currently disabled. To enable, install exceljs: npm install exceljs"
  );
}

/**
 * Triggers a download of the Excel file in the browser.
 * @param blob - The Blob containing the Excel file.
 * @param filename - The name of the file to be downloaded.
 */
export function downloadExcel(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ---------------------------------------------------------
// HELPER FUNCTIONS (preserved for potential future use)
// ---------------------------------------------------------

export function calculateReportMetrics(trades: Trade[]): ReportMetrics {
  const wins = trades.filter((t) => t.outcome === "win").length;
  const losses = trades.filter((t) => t.outcome === "loss").length;
  const totalTrades = trades.length;

  const validTradesCount = wins + losses;
  const winRate = validTradesCount > 0 ? (wins / validTradesCount) * 100 : 0;

  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  const winningTrades = trades.filter((t) => t.outcome === "win");
  const losingTrades = trades.filter((t) => t.outcome === "loss");

  const avgWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
      : 0;

  const avgLoss =
    losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
      : 0;

  const profitFactor = avgLoss > 0 ? (avgWin * wins) / (avgLoss * losses) : 0;

  const sortedByPnL = [...trades].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
  const bestTrade = sortedByPnL.length > 0 ? sortedByPnL[0].pnl || 0 : 0;
  const worstTrade = sortedByPnL.length > 0 ? sortedByPnL[sortedByPnL.length - 1].pnl || 0 : 0;

  return {
    totalTrades,
    winRate,
    profitFactor,
    totalPnL,
    bestTrade,
    worstTrade,
  };
}

export function calculateMonthlyMetrics(trades: Trade[]): MonthlyMetrics[] {
  const groups: Record<string, Trade[]> = {};

  trades.forEach((t) => {
    if (!t.entryDate) return;
    const date = dayjs(t.entryDate);
    const key = date.format("YYYY-MM");
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const metrics: MonthlyMetrics[] = Object.keys(groups)
    .sort()
    .map((key) => {
      const monthlyTrades = groups[key];
      const date = dayjs(key, "YYYY-MM");
      const monthName = date.format("MMMM YYYY");

      const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

      const wins = monthlyTrades.filter((t) => t.outcome === "win").length;
      const losses = monthlyTrades.filter((t) => t.outcome === "loss").length;
      const validTradesCount = wins + losses;
      const winRate = validTradesCount > 0 ? (wins / validTradesCount) * 100 : 0;
      const pnl = monthlyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

      return {
        month: formattedMonth,
        trades: monthlyTrades.length,
        wins,
        losses,
        pnl,
        winRate,
      };
    });

  return metrics;
}

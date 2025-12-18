import { useMemo } from "react";
import { Trade, Playbook } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { CircularProgress, GlassCard, IconActionButton } from "@/components/ui";

interface PlaybookGridProps {
  trades: Trade[];
  playbooks: Playbook[];
  currency: string;
  onEdit?: (playbook: Playbook) => void;
  onDelete?: (playbookId: string) => void;
  onView?: (playbook: Playbook) => void;
  onShare?: (playbook: Playbook) => void;
}

interface StrategyMetrics {
  name: string;
  playbook?: Playbook;
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  netPnL: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
}

export function PlaybookGrid({
  trades,
  playbooks,
  currency,
  onEdit,
  onDelete,
  onView,
  onShare,
}: PlaybookGridProps) {
  const strategies = useMemo(() => {
    const stats = new Map<string, StrategyMetrics>();

    // Initialize with Playbooks
    playbooks.forEach((pb) => {
      stats.set(pb.name, {
        name: pb.name,
        playbook: pb,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        breakeven: 0,
        netPnL: 0,
        winRate: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        expectancy: 0,
      });
    });

    // Process Trades
    trades.forEach((trade) => {
      const strategyName = trade.strategy || "Sem Estratégia";

      if (!stats.has(strategyName)) {
        stats.set(strategyName, {
          name: strategyName,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          netPnL: 0,
          winRate: 0,
          profitFactor: 0,
          avgWin: 0,
          avgLoss: 0,
          expectancy: 0,
        });
      }

      const metric = stats.get(strategyName)!;
      metric.totalTrades++;
      metric.netPnL += trade.pnl || 0;

      if (trade.outcome === "win") {
        metric.wins++;
      } else if (trade.outcome === "loss") {
        metric.losses++;
      } else if (trade.outcome === "breakeven") {
        metric.breakeven++;
      }
    });

    // Calculate derived metrics
    return Array.from(stats.values())
      .map((metric) => {
        // Win Rate
        metric.winRate = metric.totalTrades > 0 ? (metric.wins / metric.totalTrades) * 100 : 0;

        // Calculate average win/loss
        const winningTrades = trades.filter(
          (t) => (t.strategy || "Sem Estratégia") === metric.name && t.outcome === "win"
        );
        const losingTrades = trades.filter(
          (t) => (t.strategy || "Sem Estratégia") === metric.name && t.outcome === "loss"
        );

        metric.avgWin =
          winningTrades.length > 0
            ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
            : 0;

        metric.avgLoss =
          losingTrades.length > 0
            ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
            : 0;

        // Profit Factor
        const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
        metric.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;

        // Expectancy
        metric.expectancy =
          metric.totalTrades > 0
            ? (metric.winRate / 100) * metric.avgWin -
              ((100 - metric.winRate) / 100) * metric.avgLoss
            : 0;

        return metric;
      })
      .sort((a, b) => {
        if (a.name === "Sem Estratégia") return 1;
        if (b.name === "Sem Estratégia") return -1;
        return b.netPnL - a.netPnL;
      });
  }, [trades, playbooks]);

  if (strategies.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400">
        <div className="mb-4 text-4xl">📘</div>
        <p>Nenhum playbook ou estratégia registrada.</p>
        <p className="mt-2 text-sm">Crie um Playbook ou adicione trades para começar.</p>
      </div>
    );
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return "#10b981"; // green
    if (winRate >= 50) return "#3b82f6"; // blue
    if (winRate >= 30) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {strategies.map((strategy) => {
        const icon = strategy.playbook?.icon || "📊";
        const color = strategy.playbook?.color || "#9ca3af";

        return (
          <GlassCard
            key={strategy.name}
            className="bg-zorin-bg/30 overflow-hidden border-white/5 p-0 transition-all duration-300 hover:border-white/10"
          >
            {/* Header */}
            <div className="border-b border-white/5 p-5">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div className="rounded-lg bg-gray-900/50 p-2 text-3xl" style={{ color }}>
                    {icon}
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-bold text-gray-100 ${
                        strategy.playbook ? "cursor-pointer hover:text-cyan-400" : ""
                      }`}
                      onClick={() => strategy.playbook && onView?.(strategy.playbook)}
                    >
                      {strategy.name}
                    </h3>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {strategy.totalTrades} trade{strategy.totalTrades !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {strategy.playbook && (
                  <div className="flex items-center gap-1">
                    <IconActionButton
                      variant="edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(strategy.playbook!);
                      }}
                    />
                    <IconActionButton
                      variant="share"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare?.(strategy.playbook!);
                      }}
                    />
                    <IconActionButton
                      variant="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Tem certeza que deseja excluir este playbook?")) {
                          onDelete?.(strategy.playbook!.id);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {strategy.playbook?.description && (
                <p className="line-clamp-2 text-sm text-gray-400">
                  {strategy.playbook.description}
                </p>
              )}
            </div>

            {/* Main Metrics */}
            <div className="p-5">
              <div className="mb-5 flex items-center justify-between gap-6">
                {/* Win Rate Circle */}
                <div className="flex flex-col items-center">
                  <CircularProgress
                    percentage={strategy.winRate}
                    size={90}
                    strokeWidth={10}
                    color={getWinRateColor(strategy.winRate)}
                    backgroundColor="#374151"
                  />
                  <div className="mt-2 text-xs text-gray-500">Win rate</div>
                </div>

                {/* Net P&L */}
                <div className="flex-1">
                  <div className="mb-1 text-xs text-gray-500">Net P&L</div>
                  <div
                    className={`text-2xl font-bold ${
                      strategy.netPnL >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(strategy.netPnL, currency)}
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="border-t border-gray-700/50 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Profit factor</div>
                    <div className="text-lg font-bold text-gray-200">
                      {strategy.profitFactor > 99 ? "∞" : strategy.profitFactor.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Expectancy</div>
                    <div className="text-lg font-bold text-gray-200">
                      {formatCurrency(strategy.expectancy, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Average winner</div>
                    <div className="text-lg font-bold text-green-400">
                      {formatCurrency(strategy.avgWin, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Average loser</div>
                    <div className="text-lg font-bold text-red-400">
                      {formatCurrency(strategy.avgLoss, currency)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

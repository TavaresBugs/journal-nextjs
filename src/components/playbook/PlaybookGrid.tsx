import { useMemo } from "react";
import { Playbook, PlaybookStats } from "@/types";
import { formatCurrency } from "@/lib/utils/trading";
import { CircularProgress, GlassCard, IconActionButton } from "@/components/ui";

interface PlaybookGridProps {
  stats: PlaybookStats[];
  playbooks: Playbook[];
  currency: string;
  onEdit?: (playbook: Playbook) => void;
  onDelete?: (playbookId: string) => void;
  onView?: (playbook: Playbook) => void;
  onShare?: (playbook: Playbook) => void;
}

export function PlaybookGrid({
  stats,
  playbooks,
  currency,
  onEdit,
  onDelete,
  onView,
  onShare,
}: PlaybookGridProps) {
  const strategies = useMemo(() => {
    // Merge stats with playbook details (icon, color, etc)
    return stats.map((stat) => {
      // Try to find matching playbook by ID first (if available), then Name
      const playbook = playbooks.find((p) => (stat.id && p.id === stat.id) || p.name === stat.name);

      return {
        ...stat,
        playbook,
        // Fallbacks for display if no playbook found (e.g. manual strategy)
        icon: playbook?.icon || "📊",
        color: playbook?.color || "#9ca3af",
      };
    });
  }, [stats, playbooks]);

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
    if (winRate >= 70) return "#00c853"; // green
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
                      strategy.netPnL >= 0 ? "text-[#04df73]" : "text-[#ff6467]"
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
                    <div className="text-lg font-bold text-[#04df73]">
                      {formatCurrency(strategy.avgWin, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Average loser</div>
                    <div className="text-lg font-bold text-[#ff6467]">
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

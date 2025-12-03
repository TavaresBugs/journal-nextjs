import { useMemo } from 'react';
import { Trade, Playbook } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { Button } from '@/components/ui';

interface PlaybookGridProps {
    trades: Trade[];
    playbooks: Playbook[];
    currency: string;
    onEdit?: (playbook: Playbook) => void;
    onDelete?: (playbookId: string) => void;
    onView?: (playbook: Playbook) => void;
}

interface StrategyMetrics {
    name: string;
    playbook?: Playbook; // Link to playbook if exists
    totalTrades: number;
    wins: number;
    losses: number;
    breakeven: number;
    netPnL: number;
    winRate: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
}

export function PlaybookGrid({ trades, playbooks, currency, onEdit, onDelete, onView }: PlaybookGridProps) {
    const strategies = useMemo(() => {
        const stats = new Map<string, StrategyMetrics>();

        // 1. Initialize with Playbooks (even if no trades)
        playbooks.forEach(pb => {
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
                avgLoss: 0
            });
        });

        // 2. Process Trades
        trades.forEach(trade => {
            const strategyName = trade.strategy || 'Sem Estratégia';
            
            if (!stats.has(strategyName)) {
                // Strategy without a Playbook
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
                    avgLoss: 0
                });
            }

            const metric = stats.get(strategyName)!;
            metric.totalTrades++;
            metric.netPnL += trade.pnl || 0;

            if (trade.outcome === 'win') metric.wins++;
            else if (trade.outcome === 'loss') metric.losses++;
            else if (trade.outcome === 'breakeven') metric.breakeven++;
        });

        // 3. Calculate derived metrics and sort
        return Array.from(stats.values()).map(metric => {
            metric.winRate = metric.totalTrades > 0 ? (metric.wins / metric.totalTrades) * 100 : 0;
            return metric;
        }).sort((a, b) => {
            // Sort priority: 
            // 1. Has Playbook (optional, maybe keep them top?) -> No, let's sort by PnL for now as requested before
            // But user might want to see their defined playbooks. 
            // Let's stick to PnL for now, but maybe put "Sem Estratégia" last?
            if (a.name === 'Sem Estratégia') return 1;
            if (b.name === 'Sem Estratégia') return -1;
            return b.netPnL - a.netPnL;
        });
    }, [trades, playbooks]);

    if (strategies.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-4">📘</div>
                <p>Nenhum playbook ou estratégia registrada.</p>
                <p className="text-sm mt-2">Crie um Playbook ou adicione trades para começar.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy) => {
                // Use Playbook color/icon if available, otherwise defaults
                const icon = strategy.playbook?.icon || '📊';
                const color = strategy.playbook?.color || '#9ca3af'; // gray-400 default
                const glowClass = strategy.playbook ? 'shadow-lg' : '';

                return (
                    <div 
                        key={strategy.name}
                        className={`bg-gray-800/30 rounded-xl border border-gray-700 p-5 transition-all duration-200 group relative overflow-hidden ${glowClass}`}
                        style={strategy.playbook ? { 
                            borderLeftWidth: '4px', 
                            borderLeftColor: color 
                        } : {}}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-3 flex-1">
                                <div className="text-2xl bg-gray-900/50 p-2 rounded-lg">
                                    {icon}
                                </div>
                                <div className="flex-1">
                                    <h3 
                                        className={`font-bold text-lg text-gray-100 transition-colors ${
                                            strategy.playbook ? 'cursor-pointer hover:text-cyan-400' : ''
                                        }`}
                                        onClick={() => strategy.playbook && onView?.(strategy.playbook)}
                                    >
                                        {strategy.name}
                                    </h3>
                                    <div className="text-xs text-gray-400 font-medium mt-1">
                                        {strategy.totalTrades} trade{strategy.totalTrades !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions - Always visible, using Button components */}
                            {strategy.playbook && (
                                <div className="flex gap-1">
                                    <Button 
                                        variant="gold"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit?.(strategy.playbook!);
                                        }}
                                        className="w-8 h-8"
                                        title="Editar"
                                    >
                                        ✏️
                                    </Button>
                                    <Button 
                                        variant="danger"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Tem certeza que deseja excluir este playbook?')) {
                                                onDelete?.(strategy.playbook!.id);
                                            }
                                        }}
                                        className="w-8 h-8"
                                        title="Excluir"
                                    >
                                        🗑️
                                    </Button>
                                </div>
                            )}
                        </div>

                        {strategy.playbook?.description && (
                            <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                                {strategy.playbook.description}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-2 border-t border-gray-800">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Win Rate</div>
                                <div className="text-xl font-bold text-gray-200">
                                    {strategy.winRate.toFixed(1)}%
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-gray-500 mb-1">Net P&L</div>
                                <div className={`text-xl font-bold ${strategy.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(strategy.netPnL, currency)}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

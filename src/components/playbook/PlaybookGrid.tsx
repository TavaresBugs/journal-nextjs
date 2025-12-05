import { useMemo } from 'react';
import { Trade, Playbook } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { CircularProgress, Button } from '@/components/ui';

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

export function PlaybookGrid({ trades, playbooks, currency, onEdit, onDelete, onView, onShare }: PlaybookGridProps) {
    const strategies = useMemo(() => {
        const stats = new Map<string, StrategyMetrics>();

        // Initialize with Playbooks
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
                avgLoss: 0,
                expectancy: 0
            });
        });

        // Process Trades
        trades.forEach(trade => {
            const strategyName = trade.strategy || 'Sem Estratégia';
            
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
                    expectancy: 0
                });
            }

            const metric = stats.get(strategyName)!;
            metric.totalTrades++;
            metric.netPnL += trade.pnl || 0;

            if (trade.outcome === 'win') {
                metric.wins++;
            } else if (trade.outcome === 'loss') {
                metric.losses++;
            } else if (trade.outcome === 'breakeven') {
                metric.breakeven++;
            }
        });

        // Calculate derived metrics
        return Array.from(stats.values()).map(metric => {
            // Win Rate
            metric.winRate = metric.totalTrades > 0 ? (metric.wins / metric.totalTrades) * 100 : 0;
            
            // Calculate average win/loss
            const winningTrades = trades.filter(t => (t.strategy || 'Sem Estratégia') === metric.name && t.outcome === 'win');
            const losingTrades = trades.filter(t => (t.strategy || 'Sem Estratégia') === metric.name && t.outcome === 'loss');
            
            metric.avgWin = winningTrades.length > 0 
                ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length 
                : 0;
            
            metric.avgLoss = losingTrades.length > 0 
                ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length)
                : 0;
            
            // Profit Factor
            const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
            metric.profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
            
            // Expectancy
            metric.expectancy = metric.totalTrades > 0 
                ? (metric.winRate / 100 * metric.avgWin) - ((100 - metric.winRate) / 100 * metric.avgLoss)
                : 0;
            
            return metric;
        }).sort((a, b) => {
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

    const getWinRateColor = (winRate: number) => {
        if (winRate >= 70) return '#10b981'; // green
        if (winRate >= 50) return '#3b82f6'; // blue
        if (winRate >= 30) return '#f59e0b'; // amber
        return '#ef4444'; // red
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy) => {
                const icon = strategy.playbook?.icon || '📊';
                const color = strategy.playbook?.color || '#9ca3af';

                return (
                    <div 
                        key={strategy.name}
                        className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:border-gray-600"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-gray-700/50">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3 flex-1">
                                    <div 
                                        className="text-3xl p-2 rounded-lg bg-gray-900/50"
                                        style={{ color }}
                                    >
                                        {icon}
                                    </div>
                                    <div>
                                        <h3 
                                            className={`font-bold text-lg text-gray-100 ${
                                                strategy.playbook ? 'cursor-pointer hover:text-cyan-400' : ''
                                            }`}
                                            onClick={() => strategy.playbook && onView?.(strategy.playbook)}
                                        >
                                            {strategy.name}
                                        </h3>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {strategy.totalTrades} trade{strategy.totalTrades !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
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
                                            variant="info"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onShare?.(strategy.playbook!);
                                            }}
                                            className="w-8 h-8"
                                            title="Compartilhar"
                                        >
                                            🌐
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
                                <p className="text-sm text-gray-400 line-clamp-2">
                                    {strategy.playbook.description}
                                </p>
                            )}
                        </div>

                        {/* Main Metrics */}
                        <div className="p-5">
                            <div className="flex items-center justify-between gap-6 mb-5">
                                {/* Win Rate Circle */}
                                <div className="flex flex-col items-center">
                                    <CircularProgress
                                        percentage={strategy.winRate}
                                        size={90}
                                        strokeWidth={10}
                                        color={getWinRateColor(strategy.winRate)}
                                        backgroundColor="#374151"
                                    />
                                    <div className="text-xs text-gray-500 mt-2">Win rate</div>
                                </div>

                                {/* Net P&L */}
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-1">Net P&L</div>
                                    <div className={`text-2xl font-bold ${
                                        strategy.netPnL >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {formatCurrency(strategy.netPnL, currency)}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Metrics */}
                            <div className="pt-4 border-t border-gray-700/50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Profit factor</div>
                                        <div className="text-lg font-bold text-gray-200">
                                            {strategy.profitFactor > 99 ? '∞' : strategy.profitFactor.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Expectancy</div>
                                        <div className="text-lg font-bold text-gray-200">
                                            {formatCurrency(strategy.expectancy, currency)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Average winner</div>
                                        <div className="text-lg font-bold text-green-400">
                                            {formatCurrency(strategy.avgWin, currency)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Average loser</div>
                                        <div className="text-lg font-bold text-red-400">
                                            {formatCurrency(strategy.avgLoss, currency)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

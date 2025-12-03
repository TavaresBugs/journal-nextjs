import { useMemo } from 'react';
import { Trade } from '@/types';
import { formatCurrency } from '@/lib/calculations';

interface PlaybookGridProps {
    trades: Trade[];
    currency: string;
}

interface StrategyMetrics {
    name: string;
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

export function PlaybookGrid({ trades, currency }: PlaybookGridProps) {
    const strategies = useMemo(() => {
        const stats = new Map<string, StrategyMetrics>();

        // Agrupar trades por estratégia
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

        // Calcular métricas derivadas
        return Array.from(stats.values()).map(metric => {
            metric.winRate = metric.totalTrades > 0 ? (metric.wins / metric.totalTrades) * 100 : 0;
            return metric;
        }).sort((a, b) => b.netPnL - a.netPnL); // Ordenar por maior lucro
    }, [trades]);

    if (strategies.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-4">📘</div>
                <p>Nenhuma estratégia registrada nos trades ainda.</p>
                <p className="text-sm mt-2">Adicione uma estratégia aos seus trades para vê-las aqui.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy) => (
                <div 
                    key={strategy.name}
                    className="bg-gray-800/30 rounded-xl border border-gray-700 p-5 hover:border-cyan-500/30 transition-all duration-200 group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-gray-100 group-hover:text-cyan-400 transition-colors">
                                {strategy.name}
                            </h3>
                            <div className="text-xs text-cyan-500 font-medium mt-1">
                                {strategy.totalTrades} trade{strategy.totalTrades !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div className="text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="1"></circle>
                                <circle cx="19" cy="12" r="1"></circle>
                                <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
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

                        <div>
                            <div className="text-xs text-gray-500 mb-1">Profit Factor</div>
                            <div className="text-sm font-medium text-gray-300">
                                N/A
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 mb-1">Missed trades</div>
                            <div className="text-sm font-medium text-gray-300">
                                0
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-500 mb-1">Average loser</div>
                            <div className="text-sm font-medium text-gray-300">
                                $0.00
                            </div>
                        </div>
                        
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Average winner</div>
                            <div className="text-sm font-medium text-gray-300">
                                $0.00
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Trade } from '@/types';

interface WinLossDistributionChartProps {
    trades: Trade[];
}

export function WinLossDistributionChart({ trades }: WinLossDistributionChartProps) {
    const data = useMemo(() => {
        const distribution = trades.reduce((acc, trade) => {
            const strategy = trade.strategy || 'Sem Estratégia';
            if (!acc[strategy]) {
                acc[strategy] = { strategy, wins: 0, losses: 0, pnl: 0 };
            }
            
            if ((trade.pnl || 0) >= 0) {
                acc[strategy].wins += 1;
            } else {
                acc[strategy].losses += 1;
            }
            acc[strategy].pnl += trade.pnl || 0;
            
            return acc;
        }, {} as Record<string, { strategy: string; wins: number; losses: number; pnl: number }>);

        return Object.values(distribution)
            .sort((a, b) => b.pnl - a.pnl) // Sort by PnL
            .slice(0, 10); // Top 10 strategies
    }, [trades]);

    if (trades.length === 0) return null;

    return (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
            <h3 className="text-base font-medium text-gray-400 mb-8">Distribuição Win/Loss</h3>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={true} vertical={true} />
                    <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis 
                        dataKey="strategy" 
                        type="category" 
                        stroke="#9ca3af" 
                        tick={{ fill: '#9ca3af', fontSize: 12 }} 
                        width={100}
                    />
                    <Tooltip
                        cursor={{ fill: '#374151', opacity: 0.2 }}
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
                        formatter={(value: number, name: string) => [value, name === 'wins' ? 'Wins' : 'Losses']}
                    />
                    <Bar dataKey="wins" name="Wins" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="losses" name="Losses" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

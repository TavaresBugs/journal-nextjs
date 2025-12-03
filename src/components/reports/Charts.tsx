'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import type { Trade } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import dayjs from 'dayjs';

interface ChartsProps {
    trades: Trade[];
    currency: string;
    initialBalance: number;
    accountCreatedAt: string;
}

export function Charts({ trades, currency, initialBalance, accountCreatedAt }: ChartsProps) {
    // --- Prepare Data for Recharts ---
    const sortedTrades = [...trades].sort((a, b) =>
        new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    let currentEquity = initialBalance;
    
    // Create data points
    const data = [
        {
            date: accountCreatedAt,
            equity: initialBalance,
            pnl: 0,
            formattedDate: dayjs(accountCreatedAt).format('DD/MM'),
            tradeId: 'Início'
        }
    ];

    sortedTrades.forEach(trade => {
        currentEquity += trade.pnl || 0;
        data.push({
            date: trade.entryDate,
            equity: currentEquity,
            pnl: trade.pnl || 0,
            formattedDate: dayjs(trade.entryDate).format('DD/MM'),
            tradeId: trade.id.slice(0, 4)
        });
    });

    // Determine colors based on performance
    const isProfit = currentEquity >= initialBalance;
    const strokeColor = isProfit ? '#22c55e' : '#ef4444'; // Green or Red
    const gradientId = isProfit ? 'colorProfit' : 'colorLoss';

    // --- Prepare Data for Strategy Pie Chart ---
    const strategyStats = trades.reduce((acc, trade) => {
        const strategy = trade.strategy || 'Sem Estratégia';
        if (!acc[strategy]) {
            acc[strategy] = { name: strategy, total: 0, wins: 0, losses: 0 };
        }
        acc[strategy].total += 1;
        if ((trade.pnl || 0) >= 0) {
            acc[strategy].wins += 1;
        } else {
            acc[strategy].losses += 1;
        }
        return acc;
    }, {} as Record<string, { name: string; total: number; wins: number; losses: number }>);

    const innerPieData = Object.values(strategyStats).sort((a, b) => b.total - a.total);

    const outerPieData = innerPieData.flatMap(stat => [
        { name: 'Win', value: stat.wins, color: '#22c55e', strategy: stat.name },
        { name: 'Loss', value: stat.losses, color: '#ef4444', strategy: stat.name }
    ]).filter(item => item.value > 0);

    const STRATEGY_COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#6366f1'];

    return (
        <div className="space-y-6">
            {/* Equity Curve Chart */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-cyan-400">Curva de Capital (Equity Curve)</h3>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 bg-gray-500 border-t border-dashed border-gray-500"></div>
                            <span className="text-gray-400">Capital Inicial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: strokeColor }}></div>
                            <span className="text-gray-400">Equity</span>
                        </div>
                    </div>
                </div>
                
                <div style={{ width: '100%', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={450}>
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                            
                            <XAxis 
                                dataKey="formattedDate" 
                                stroke="#9ca3af" 
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            
                            <YAxis 
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => formatCurrency(value, currency).replace('R$', '').replace('$', '')}
                                domain={['auto', 'auto']}
                                width={80}
                            />
                            
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#111827', 
                                    borderColor: '#374151', 
                                    borderRadius: '0.5rem',
                                    color: '#f3f4f6'
                                }}
                                itemStyle={{ color: '#f3f4f6' }}
                                formatter={(value: number) => [formatCurrency(value, currency), 'Equity']}
                                labelFormatter={(label) => `Data: ${label}`}
                            />
                            
                            <ReferenceLine 
                                y={initialBalance} 
                                stroke="#6b7280" 
                                strokeDasharray="3 3" 
                            />
                            
                            <Area
                                type="monotone"
                                dataKey="equity"
                                stroke={strokeColor}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#${gradientId})`}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Strategy Performance Chart */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-cyan-400 mb-6">Desempenho por Estratégia</h3>
                <div style={{ width: '100%', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={innerPieData}
                                dataKey="total"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                stroke="none"
                            >
                                {innerPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STRATEGY_COLORS[index % STRATEGY_COLORS.length]} />
                                ))}
                            </Pie>
                            <Pie
                                data={outerPieData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={110}
                                outerRadius={140}
                                fill="#82ca9d"
                                stroke="none"
                                label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                            >
                                {outerPieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#111827', 
                                    borderColor: '#374151', 
                                    borderRadius: '0.5rem',
                                    color: '#f3f4f6'
                                }}
                                itemStyle={{ color: '#f3f4f6' }}
                                formatter={(value: number, name: string, props: { payload?: { strategy?: string } }) => {
                                    if (props.payload?.strategy) {
                                        return [`${value} trades`, `${props.payload.strategy} - ${name}`];
                                    }
                                    return [`${value} trades`, name];
                                }}
                            />
                            <Legend 
                                layout="vertical" 
                                verticalAlign="middle" 
                                align="right"
                                wrapperStyle={{ paddingLeft: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

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
    Legend,
    BarChart,
    Bar
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

    const STRATEGY_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1'];

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
                                stroke="#1f2937"
                                strokeWidth={2}
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
                                stroke="#1f2937"
                                strokeWidth={2}
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

            {/* Win/Loss Distribution by Strategy */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-cyan-400 mb-6">Distribuição Win/Loss por Estratégia</h3>
                <div style={{ width: '100%', minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={innerPieData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} horizontal={false} />
                            <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis 
                                type="category" 
                                dataKey="name" 
                                stroke="#9ca3af" 
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                width={90}
                            />
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: '#111827', 
                                    borderColor: '#374151', 
                                    borderRadius: '0.5rem',
                                    color: '#f3f4f6'
                                }}
                                itemStyle={{ color: '#f3f4f6' }}
                            />
                            <Legend />
                            <Bar dataKey="wins" fill="#22c55e" name="Wins" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="losses" fill="#ef4444" name="Losses" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Asset Performance */}
            {(() => {
                const assetStats = trades.reduce((acc, trade) => {
                    const symbol = trade.symbol || 'N/A';
                    if (!acc[symbol]) {
                        acc[symbol] = { symbol, pnl: 0, trades: 0 };
                    }
                    acc[symbol].pnl += trade.pnl || 0;
                    acc[symbol].trades += 1;
                    return acc;
                }, {} as Record<string, { symbol: string; pnl: number; trades: number }>);

                const assetData = Object.values(assetStats)
                    .sort((a, b) => b.pnl - a.pnl)
                    .slice(0, 10); // Top 10 assets

                return (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-cyan-400 mb-6">Performance por Ativo (Top 10)</h3>
                        <div style={{ width: '100%', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={assetData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                                    <XAxis 
                                        dataKey="symbol" 
                                        stroke="#9ca3af" 
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    />
                                    <YAxis 
                                        stroke="#9ca3af" 
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        tickFormatter={(value) => formatCurrency(value, currency).replace('R$', '').replace('$', '')}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: '#111827', 
                                            borderColor: '#374151', 
                                            borderRadius: '0.5rem',
                                            color: '#f3f4f6'
                                        }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                        formatter={(value: number) => [formatCurrency(value as number, currency), 'P&L']}
                                    />
                                    <Bar 
                                        dataKey="pnl" 
                                        fill="#06b6d4" 
                                        radius={[4, 4, 0, 0]}
                                    >
                                        {assetData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            })()}

            {/* Performance Timeline - Daily P&L */}
            {(() => {
                // Group trades by day and calculate daily P&L
                const dailyPnL = trades.reduce((acc, trade) => {
                    const date = trade.entryDate;
                    if (!acc[date]) {
                        acc[date] = { date, pnl: 0, trades: 0, formattedDate: dayjs(date).format('DD/MM') };
                    }
                    acc[date].pnl += trade.pnl || 0;
                    acc[date].trades += 1;
                    return acc;
                }, {} as Record<string, { date: string; pnl: number; trades: number; formattedDate: string }>);

                const timelineData = Object.values(dailyPnL)
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(-30); // Last 30 days

                return (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-cyan-400 mb-6">Performance Timeline (Últimos 30 Dias)</h3>
                        <div style={{ width: '100%', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={timelineData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                                    <XAxis 
                                        dataKey="formattedDate" 
                                        stroke="#9ca3af" 
                                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis 
                                        stroke="#9ca3af" 
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        tickFormatter={(value) => formatCurrency(value, currency).replace('R$', '').replace('$', '')}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: '#111827', 
                                            borderColor: '#374151', 
                                            borderRadius: '0.5rem',
                                            color: '#f3f4f6'
                                        }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                        formatter={(value: number) => [formatCurrency(value as number, currency), 'P&L']}
                                        labelFormatter={(label) => `Data: ${label}`}
                                    />
                                    <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                                    <Bar 
                                        dataKey="pnl" 
                                        fill="#06b6d4" 
                                        radius={[4, 4, 0, 0]}
                                    >
                                        {timelineData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            })()}

            {/* Drawdown Chart */}
            {(() => {
                let peak = initialBalance;
                let currentEquity = initialBalance;
                
                const drawdownData = [
                    {
                        date: accountCreatedAt,
                        drawdown: 0,
                        formattedDate: dayjs(accountCreatedAt).format('DD/MM'),
                        equity: initialBalance
                    }
                ];

                sortedTrades.forEach(trade => {
                    currentEquity += trade.pnl || 0;
                    
                    // Update peak if we reached a new high
                    if (currentEquity > peak) {
                        peak = currentEquity;
                    }
                    
                    // Calculate drawdown as percentage from peak
                    const drawdown = peak > 0 ? ((currentEquity - peak) / peak) * 100 : 0;
                    
                    drawdownData.push({
                        date: trade.entryDate,
                        drawdown,
                        formattedDate: dayjs(trade.entryDate).format('DD/MM'),
                        equity: currentEquity
                    });
                });

                return (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-cyan-400 mb-6">Drawdown (Queda desde o Pico)</h3>
                        <div style={{ width: '100%', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart
                                    data={drawdownData}
                                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
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
                                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                                        domain={['auto', 0]}
                                    />
                                    
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#111827', 
                                            borderColor: '#374151', 
                                            borderRadius: '0.5rem',
                                            color: '#f3f4f6'
                                        }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                                        labelFormatter={(label) => `Data: ${label}`}
                                    />
                                    
                                    <ReferenceLine 
                                        y={0} 
                                        stroke="#6b7280" 
                                        strokeDasharray="3 3" 
                                    />
                                    
                                    <Area
                                        type="monotone"
                                        dataKey="drawdown"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorDrawdown)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            })()}

            {/* Monthly Performance Grid */}
            {(() => {
                const monthlyData = trades.reduce((acc, trade) => {
                    const monthKey = dayjs(trade.entryDate).format('YYYY-MM');
                    if (!acc[monthKey]) {
                        acc[monthKey] = { 
                            month: monthKey, 
                            pnl: 0, 
                            trades: 0,
                            displayMonth: dayjs(trade.entryDate).format('MMM/YY')
                        };
                    }
                    acc[monthKey].pnl += trade.pnl || 0;
                    acc[monthKey].trades += 1;
                    return acc;
                }, {} as Record<string, { month: string; pnl: number; trades: number; displayMonth: string }>);

                const monthlyArray = Object.values(monthlyData)
                    .sort((a, b) => a.month.localeCompare(b.month))
                    .slice(-12); // Last 12 months

                return (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-cyan-400 mb-6">Performance Mensal (Últimos 12 Meses)</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {monthlyArray.map((month) => {
                                const returnPct = initialBalance > 0 ? (month.pnl / initialBalance) * 100 : 0;
                                let bgColor = 'bg-gray-800';
                                let textColor = 'text-gray-400';
                                
                                if (returnPct > 5) {
                                    bgColor = 'bg-green-500/20 border-green-500/50';
                                    textColor = 'text-green-400';
                                } else if (returnPct > 0) {
                                    bgColor = 'bg-green-500/10 border-green-500/30';
                                    textColor = 'text-green-300';
                                } else if (returnPct < -5) {
                                    bgColor = 'bg-red-500/20 border-red-500/50';
                                    textColor = 'text-red-400';
                                } else if (returnPct < 0) {
                                    bgColor = 'bg-red-500/10 border-red-500/30';
                                    textColor = 'text-red-300';
                                }

                                return (
                                    <div 
                                        key={month.month}
                                        className={`${bgColor} border rounded-lg p-3 text-center transition-all hover:scale-105`}
                                    >
                                        <div className="text-xs text-gray-400 mb-1">{month.displayMonth}</div>
                                        <div className={`text-lg font-bold ${textColor}`}>
                                            {returnPct > 0 ? '+' : ''}{returnPct.toFixed(1)}%
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            {month.trades} trade{month.trades !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* Win Rate by Weekday */}
            {(() => {
                const weekdayStats = trades.reduce((acc, trade) => {
                    const weekday = dayjs(trade.entryDate).format('dddd'); // Full day name
                    const weekdayNum = dayjs(trade.entryDate).day(); // 0-6
                    
                    if (!acc[weekdayNum]) {
                        acc[weekdayNum] = { 
                            day: weekday, 
                            dayNum: weekdayNum,
                            wins: 0, 
                            losses: 0, 
                            total: 0,
                            winRate: 0
                        };
                    }
                    
                    acc[weekdayNum].total += 1;
                    if (trade.outcome === 'win') {
                        acc[weekdayNum].wins += 1;
                    } else if (trade.outcome === 'loss') {
                        acc[weekdayNum].losses += 1;
                    }
                    
                    return acc;
                }, {} as Record<number, { day: string; dayNum: number; wins: number; losses: number; total: number; winRate: number }>);

                const weekdayArray = Object.values(weekdayStats).map(stat => {
                    stat.winRate = stat.total > 0 ? (stat.wins / stat.total) * 100 : 0;
                    return stat;
                }).sort((a, b) => a.dayNum - b.dayNum);

                // Portuguese day names
                const dayNames: Record<string, string> = {
                    'Sunday': 'Dom',
                    'Monday': 'Seg',
                    'Tuesday': 'Ter',
                    'Wednesday': 'Qua',
                    'Thursday': 'Qui',
                    'Friday': 'Sex',
                    'Saturday': 'Sáb'
                };

                return (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-cyan-400 mb-6">Taxa de Acerto por Dia da Semana</h3>
                        <div style={{ width: '100%', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={weekdayArray}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                                    <XAxis 
                                        dataKey="day" 
                                        stroke="#9ca3af" 
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        tickFormatter={(value) => dayNames[value] || value}
                                    />
                                    <YAxis 
                                        stroke="#9ca3af" 
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        tickFormatter={(value) => `${value}%`}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: '#111827', 
                                            borderColor: '#374151', 
                                            borderRadius: '0.5rem',
                                            color: '#f3f4f6'
                                        }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                                    />
                                    <Bar 
                                        dataKey="winRate" 
                                        fill="#06b6d4" 
                                        radius={[4, 4, 0, 0]}
                                    >
                                        {weekdayArray.map((entry, index) => {
                                            let color = '#6b7280'; // gray for no data
                                            if (entry.winRate >= 70) color = '#22c55e'; // green
                                            else if (entry.winRate >= 50) color = '#06b6d4'; // cyan
                                            else if (entry.winRate >= 30) color = '#f59e0b'; // amber
                                            else if (entry.total > 0) color = '#ef4444'; // red
                                            
                                            return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            })()}

            {/* R-Multiple Distribution */}
            {(() => {
                // Calculate R-multiple for each trade
                const rMultiples = trades
                    .filter(t => t.pnl !== undefined && t.stopLoss && t.entryPrice)
                    .map(trade => {
                        const risk = Math.abs(trade.entryPrice! - trade.stopLoss!);
                        if (risk === 0) return 0;
                        
                        const rMultiple = trade.pnl! / (risk * (trade.lot || 1));
                        return rMultiple;
                    })
                    .filter(r => !isNaN(r) && isFinite(r));

                // Create histogram bins
                const bins: Record<string, number> = {
                    '-3R+': 0,
                    '-2R a -3R': 0,
                    '-1R a -2R': 0,
                    '0R a -1R': 0,
                    '0R a 1R': 0,
                    '1R a 2R': 0,
                    '2R a 3R': 0,
                    '3R+': 0
                };

                rMultiples.forEach(r => {
                    if (r <= -3) bins['-3R+']++;
                    else if (r <= -2) bins['-2R a -3R']++;
                    else if (r <= -1) bins['-1R a -2R']++;
                    else if (r < 0) bins['0R a -1R']++;
                    else if (r <= 1) bins['0R a 1R']++;
                    else if (r <= 2) bins['1R a 2R']++;
                    else if (r <= 3) bins['2R a 3R']++;
                    else bins['3R+']++;
                });

                const rData = Object.entries(bins).map(([range, count]) => ({ range, count }));

                return (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-cyan-400 mb-6">Distribuição R-Múltiplo</h3>
                        <div style={{ width: '100%', minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={rData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                                    <XAxis 
                                        dataKey="range" 
                                        stroke="#9ca3af" 
                                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis 
                                        stroke="#9ca3af" 
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        label={{ value: 'Trades', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: '#111827', 
                                            borderColor: '#374151', 
                                            borderRadius: '0.5rem',
                                            color: '#f3f4f6'
                                        }}
                                        itemStyle={{ color: '#f3f4f6' }}
                                        formatter={(value: number) => [value, 'Trades']}
                                    />
                                    <Bar 
                                        dataKey="count" 
                                        fill="#06b6d4" 
                                        radius={[4, 4, 0, 0]}
                                    >
                                        {rData.map((entry, index) => {
                                            const isNegative = entry.range.includes('-');
                                            return (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={isNegative ? '#ef4444' : '#22c55e'} 
                                                />
                                            );
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-xs text-gray-400 bg-gray-800/50rounded-lg p-3">
                            <p><strong>R-Múltiplo</strong> mostra quantos &ldquo;R&rdquo; (risco) você ganhou/perdeu por trade.</p>
                            <p className="mt-1">Exemplo: Se você arriscou $100 e ganhou $200, isso é <span className="text-green-400">+2R</span>.</p>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

'use client';

import { useMemo, useCallback } from 'react';
import { LightweightChartWrapper } from '../LightweightChartWrapper';
import type { Trade } from '@/types';
import dayjs from 'dayjs';
import { AreaSeries, LineSeries, LineStyle } from 'lightweight-charts';
import { formatCurrency } from '@/lib/calculations';

interface EquityCurveLightweightProps {
    trades: Trade[];
    initialBalance: number;
    currency: string;
    accountCreatedAt: string;
}

export function EquityCurveLightweight({ 
    trades, 
    initialBalance, 
    currency,
    accountCreatedAt 
}: EquityCurveLightweightProps) {
    const chartData = useMemo(() => {
        // 1. Aggregate PnL by day
        const dailyPnL = trades.reduce((acc, trade) => {
            const date = dayjs(trade.entryDate).format('YYYY-MM-DD');
            acc[date] = (acc[date] || 0) + (trade.pnl || 0);
            return acc;
        }, {} as Record<string, number>);

        // 2. Get all trade dates and sort
        const tradeDates = Object.entries(dailyPnL)
            .map(([date, pnl]) => ({ date, pnl }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // 3. Determine starting point
        const accountDate = dayjs(accountCreatedAt).format('YYYY-MM-DD');
        const firstTradeDate = tradeDates[0]?.date;
        
        // Start date is the earlier of account creation or first trade
        const startDate = firstTradeDate && new Date(firstTradeDate) < new Date(accountDate)
            ? firstTradeDate
            : accountDate;

        // 4. Build equity curve starting from initialBalance
        const finalData: { time: string; value: number }[] = [];
        let currentEquity = initialBalance;

        // ALWAYS add the starting point at initial balance
        // If the start date has a trade, we'll add it separately after this point
        const startDateHasTrade = tradeDates.some(t => t.date === startDate);
        
        if (!startDateHasTrade) {
            // No trade on start date, so add a point at initial balance
            finalData.push({
                time: startDate,
                value: initialBalance
            });
        } else {
            // Start date has a trade, so we need a point BEFORE it
            // Add a point 1 day before with initial balance
            const dayBefore = dayjs(startDate).subtract(1, 'day').format('YYYY-MM-DD');
            finalData.push({
                time: dayBefore,
                value: initialBalance
            });
        }

        // 5. Add all trade dates with cumulative equity
        tradeDates.forEach(({ date, pnl }) => {
            currentEquity += pnl;
            finalData.push({
                time: date,
                value: currentEquity
            });
        });

        return finalData.map(item => ({
            time: item.time as any,
            value: item.value
        }));
    }, [trades, initialBalance, accountCreatedAt]);
    
    const isProfit = chartData[chartData.length - 1]?.value >= initialBalance;
    
    const setupChart = useCallback((chart: any) => {
        // v5 API: Pass series class as first param
        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: '#ef4444', // Red-500
            topColor: 'rgba(239, 68, 68, 0.4)', // Red with opacity
            bottomColor: 'rgba(239, 68, 68, 0.0)', // Transparent bottom
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        });
        
        areaSeries.setData(chartData);
        
        // Add baseline at initial balance
        const lineSeries = chart.addSeries(LineSeries, {
            color: '#6b7280',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        
        lineSeries.setData([
            { time: chartData[0]?.time, value: initialBalance },
            { time: chartData[chartData.length - 1]?.time, value: initialBalance },
        ]);
    }, [chartData, initialBalance, isProfit]);
    
    if (trades.length === 0) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-cyan-400 mb-6">
                    Curva de Capital (Equity Curve)
                </h3>
                <div className="h-[450px] flex items-center justify-center text-gray-500">
                    Nenhum trade registrado ainda
                </div>
            </div>
        );
    }
    
    const currentEquity = chartData[chartData.length - 1]?.value || initialBalance;
    const pnl = currentEquity - initialBalance;
    const pnlPercent = ((pnl / initialBalance) * 100).toFixed(2);
    
    return (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-base font-medium text-gray-400">
                    Curva de Capital
                </h3>
                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Capital Inicial</span>
                        <span className="text-gray-300 font-medium">{formatCurrency(initialBalance, currency)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isProfit ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        <span className={`font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                            {isProfit ? '+' : ''}{pnlPercent}%
                        </span>
                    </div>
                </div>
            </div>
            
            <LightweightChartWrapper height={450}>
                {setupChart}
            </LightweightChartWrapper>
        </div>
    );
}

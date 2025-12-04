'use client';

import { useMemo, useCallback } from 'react';
import { LightweightChartWrapper } from '../LightweightChartWrapper';
import type { Trade } from '@/types';
import dayjs from 'dayjs';
import { AreaSeries } from 'lightweight-charts';

interface DrawdownChartLightweightProps {
    trades: Trade[];
    initialBalance: number;
    accountCreatedAt: string; // Added this prop as it's used in the new chartData logic
}

export function DrawdownChartLightweight({ trades, initialBalance, accountCreatedAt }: DrawdownChartLightweightProps) {
    const chartData = useMemo(() => {
        // 1. Aggregate PnL by day to calculate daily equity
        const dailyPnL = trades.reduce((acc, trade) => {
            const date = dayjs(trade.entryDate).format('YYYY-MM-DD');
            acc[date] = (acc[date] || 0) + (trade.pnl || 0);
            return acc;
        }, {} as Record<string, number>);

        // 2. Create data points including initial balance
        const dataPoints = Object.entries(dailyPnL).map(([date, pnl]) => ({
            time: date,
            pnl
        }));

        // 3. Add initial balance point if not present
        const initialDate = dayjs(accountCreatedAt).format('YYYY-MM-DD');
        if (!dailyPnL[initialDate]) {
            dataPoints.push({ time: initialDate, pnl: 0 });
        }

        // 4. Sort by date
        dataPoints.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        // 5. Calculate drawdown
        let currentEquity = initialBalance;
        let peakEquity = initialBalance;
        const finalData: { time: string; value: number }[] = [];

        dataPoints.forEach(point => {
            currentEquity += point.pnl;
            
            if (currentEquity > peakEquity) {
                peakEquity = currentEquity;
            }
            
            // Drawdown is percentage from peak
            const drawdown = peakEquity > 0 
                ? ((currentEquity - peakEquity) / peakEquity) * 100 
                : 0;
                
            finalData.push({
                time: point.time,
                value: drawdown
            });
        });

        return finalData.map(item => ({
            time: item.time as any,
            value: item.value
        }));
    }, [trades, initialBalance, accountCreatedAt]);
    
    const maxDrawdown = useMemo(() => {
        return Math.min(...chartData.map(d => d.value));
    }, [chartData]);
    
    const setupChart = useCallback((chart: any) => {
        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: '#ef4444',
            topColor: 'rgba(239, 68, 68, 0.0)',
            bottomColor: 'rgba(239, 68, 68, 0.3)',
            lineWidth: 2,
            priceFormat: {
                type: 'custom',
                formatter: (price: number) => `${Math.abs(price).toFixed(2)}%`,
            },
        });
        
        areaSeries.setData(chartData);
    }, [chartData]);
    
    if (trades.length === 0) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-cyan-400 mb-6">
                    Drawdown Chart (Queda desde o Pico)
                </h3>
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                    Nenhum trade registrado ainda
                </div>
            </div>
        );
    }
    
    const drawdownColor = 
        maxDrawdown >= -5 ? 'text-green-400' :
        maxDrawdown >= -10 ? 'text-amber-400' :
        maxDrawdown >= -20 ? 'text-orange-400' :
        'text-red-400';
    
    return (
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-base font-medium text-gray-400">
                    Drawdown
                </h3>
                <span className="text-sm text-red-400 font-medium">
                    Máx: {maxDrawdown.toFixed(2)}%
                </span>
            </div>
            
            <LightweightChartWrapper height={400}>
                {setupChart}
            </LightweightChartWrapper>
            
            <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-center">
                <div className="bg-green-500/10 border border-green-500/30 rounded py-1">
                    <div className="text-green-400 font-semibold">{'<5%'}</div>
                    <div className="text-gray-500">Ótimo</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded py-1">
                    <div className="text-amber-400 font-semibold">5-10%</div>
                    <div className="text-gray-500">Bom</div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded py-1">
                    <div className="text-orange-400 font-semibold">10-20%</div>
                    <div className="text-gray-500">Atenção</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded py-1">
                    <div className="text-red-400 font-semibold">{'>20%'}</div>
                    <div className="text-gray-500">Perigo</div>
                </div>
            </div>
        </div>
    );
}

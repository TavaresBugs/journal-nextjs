'use client';

import { useMemo, useEffect, useRef } from 'react';
import { LightweightChartWrapper } from '../LightweightChartWrapper';
import { GlassCard } from '@/components/ui';
import type { Trade } from '@/types';
import dayjs from 'dayjs';
import { HistogramSeries, IChartApi, ISeriesApi } from 'lightweight-charts';

interface PerformanceTimelineLightweightProps {
    trades: Trade[];
    currency: string;
}

export function PerformanceTimelineLightweight({ trades }: PerformanceTimelineLightweightProps) {
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

    const chartData = useMemo(() => {
        // 1. Aggregate PnL by day
        const dailyPnL = trades.reduce((acc, trade) => {
            const date = dayjs(trade.entryDate).format('YYYY-MM-DD');
            acc[date] = (acc[date] || 0) + (trade.pnl || 0);
            return acc;
        }, {} as Record<string, number>);

        // 2. Convert to array and sort
        const sortedData = Object.entries(dailyPnL)
            .map(([date, pnl]) => ({
                time: date,
                value: pnl,
                color: pnl >= 0 ? '#00c853' : '#ef4444',
            }))
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            
        // 3. Return formatted data
        return sortedData.map(item => ({
            time: item.time,
            value: item.value,
            color: item.color
        }));
    }, [trades]);
    
    const onChartReady = (chart: IChartApi) => {
        chartRef.current = chart;
        const histogramSeries = chart.addSeries(HistogramSeries, {
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
            },
        });
        seriesRef.current = histogramSeries;
    };

    useEffect(() => {
        if (!seriesRef.current) return;
        seriesRef.current.setData(chartData);
        
        if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
        }
    }, [chartData]);
    
    if (trades.length === 0) {
        return (
            <GlassCard className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <h3 className="text-lg font-bold text-zorin-accent mb-6">
                    Performance Timeline (Últimos 30 Dias)
                </h3>
                <div className="text-gray-500">
                    Nenhum trade nos últimos 30 dias
                </div>
            </GlassCard>
        );
    }
    
    return (
        <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-base font-medium text-gray-400">
                    Timeline de Performance
                </h3>
                <span className="text-sm text-gray-500">
                    {chartData.length} dia{chartData.length !== 1 ? 's' : ''} com trades
                </span>
            </div>
            
            <LightweightChartWrapper
                height={400}
                onChartReady={onChartReady}
            />
        </GlassCard>
    );
}

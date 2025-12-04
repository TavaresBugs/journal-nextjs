'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ColorType, DeepPartial, ChartOptions } from 'lightweight-charts';

interface LightweightChartWrapperProps {
    onChartReady?: (chart: IChartApi) => void;
    height?: number;
    options?: DeepPartial<ChartOptions>;
}

export function LightweightChartWrapper({ 
    onChartReady,
    height = 400,
    options = {}
}: LightweightChartWrapperProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    
    // We only want to create the chart once
    useEffect(() => {
        if (!chartContainerRef.current) return;
        
        // Create chart with default dark theme
        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height,
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#9ca3af',
                fontFamily: "'Inter', sans-serif",
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { color: '#1f2937', style: 2 }, // Very subtle horizontal lines
            },
            timeScale: {
                borderColor: '#1f2937',
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: '#1f2937',
            },
            crosshair: {
                mode: 1,
                vertLine: {
                    color: '#6b7280',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#4b5563',
                },
                horzLine: {
                    color: '#6b7280',
                    width: 1,
                    style: 2,
                    labelBackgroundColor: '#4b5563',
                },
            },
            ...options,
        });
        
        chartRef.current = chart;
        
        // Notify parent that chart is ready
        if (onChartReady) {
            onChartReady(chart);
        }
        
        // Auto-fit content
        // We delay this slightly to ensure data might be loaded by the parent in the callback
        setTimeout(() => {
            chart.timeScale().fitContent();
        }, 0);
        
        // Responsive handling with ResizeObserver
        resizeObserverRef.current = new ResizeObserver(entries => {
            if (entries[0]?.contentRect) {
                const { width } = entries[0].contentRect;
                chart.applyOptions({ width });
            }
        });
        
        resizeObserverRef.current.observe(chartContainerRef.current);
        
        return () => {
            resizeObserverRef.current?.disconnect();
            chart.remove();
            chartRef.current = null;
        };
        // We exclude options from dependency to avoid destroying chart on options change.
        // Dynamic options should be applied via applyOptions in a separate effect if needed.
        // However, if height changes, we might want to resize.
        // For simplicity, we recreate if height changes, but ideally we should just resize.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [height]);

    // Handle options updates without destroying chart
    useEffect(() => {
        if (chartRef.current && options) {
            chartRef.current.applyOptions(options);
        }
    }, [options]);

    return <div ref={chartContainerRef} className="w-full" />;
}

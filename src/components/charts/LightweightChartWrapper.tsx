'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { createChart, IChartApi, ColorType, DeepPartial, ChartOptions } from 'lightweight-charts';

interface LightweightChartWrapperProps {
    children: (chart: IChartApi) => void;
    height?: number;
    options?: DeepPartial<ChartOptions>;
}

export function LightweightChartWrapper({ 
    children, 
    height = 400,
    options = {}
}: LightweightChartWrapperProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    
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
        
        // Call children to setup series
        children(chart);
        
        // Auto-fit content
        chart.timeScale().fitContent();
        
        // Responsive handling with ResizeObserver
        resizeObserverRef.current = new ResizeObserver(entries => {
            const { width } = entries[0].contentRect;
            chart.applyOptions({ width });
        });
        
        resizeObserverRef.current.observe(chartContainerRef.current);
        
        return () => {
            resizeObserverRef.current?.disconnect();
            chart.remove();
        };
    }, [children, height, options]);
    
    return <div ref={chartContainerRef} className="w-full" />;
}

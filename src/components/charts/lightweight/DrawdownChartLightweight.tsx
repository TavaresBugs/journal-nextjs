"use client";

import { useMemo, useEffect, useRef } from "react";
import { LightweightChartWrapper } from "../LightweightChartWrapper";
import { GlassCard } from "@/components/ui";
import type { Trade } from "@/types";
import dayjs from "dayjs";
import { AreaSeries, IChartApi, ISeriesApi } from "lightweight-charts";

interface DrawdownChartLightweightProps {
  trades: Trade[];
  initialBalance: number;
  accountCreatedAt: string;
}

export function DrawdownChartLightweight({
  trades,
  initialBalance,
  accountCreatedAt,
}: DrawdownChartLightweightProps) {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const chartData = useMemo(() => {
    // 1. Aggregate PnL by day to calculate daily equity
    const dailyPnL = trades.reduce(
      (acc, trade) => {
        const date = dayjs(trade.entryDate).format("YYYY-MM-DD");
        acc[date] = (acc[date] || 0) + (trade.pnl || 0);
        return acc;
      },
      {} as Record<string, number>
    );

    // 2. Create data points including initial balance
    const dataPoints = Object.entries(dailyPnL).map(([date, pnl]) => ({
      time: date,
      pnl,
    }));

    // 3. Add initial balance point if not present
    const initialDate = dayjs(accountCreatedAt).format("YYYY-MM-DD");
    if (!dailyPnL[initialDate]) {
      dataPoints.push({ time: initialDate, pnl: 0 });
    }

    // 4. Sort by date
    dataPoints.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // 5. Calculate drawdown
    let currentEquity = initialBalance;
    let peakEquity = initialBalance;
    const finalData: { time: string; value: number }[] = [];

    dataPoints.forEach((point) => {
      currentEquity += point.pnl;

      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }

      // Drawdown is percentage from peak
      const drawdown = peakEquity > 0 ? ((currentEquity - peakEquity) / peakEquity) * 100 : 0;

      finalData.push({
        time: point.time,
        value: drawdown,
      });
    });

    return finalData.map((item) => ({
      time: item.time,
      value: item.value,
    }));
  }, [trades, initialBalance, accountCreatedAt]);

  const maxDrawdown = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.min(...chartData.map((d) => d.value));
  }, [chartData]);

  const onChartReady = (chart: IChartApi) => {
    chartRef.current = chart;
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#ef4444",
      topColor: "rgba(239, 68, 68, 0.0)",
      bottomColor: "rgba(239, 68, 68, 0.3)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => `${Math.abs(price).toFixed(2)}%`,
      },
    });
    seriesRef.current = areaSeries;
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
      <GlassCard className="flex min-h-[400px] flex-col items-center justify-center p-8">
        <h3 className="text-zorin-accent mb-6 text-lg font-bold">
          Drawdown Chart (Queda desde o Pico)
        </h3>
        <div className="text-gray-500">Nenhum trade registrado ainda</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-400">Drawdown</h3>
        <span className="text-sm font-medium text-red-400">Máx: {maxDrawdown.toFixed(2)}%</span>
      </div>

      <LightweightChartWrapper height={350} onChartReady={onChartReady} />

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded border border-green-500/30 bg-green-500/10 py-1">
          <div className="font-semibold text-green-400">{"<5%"}</div>
          <div className="text-gray-500">Ótimo</div>
        </div>
        <div className="rounded border border-amber-500/30 bg-amber-500/10 py-1">
          <div className="font-semibold text-amber-400">5-10%</div>
          <div className="text-gray-500">Bom</div>
        </div>
        <div className="rounded border border-orange-500/30 bg-orange-500/10 py-1">
          <div className="font-semibold text-orange-400">10-20%</div>
          <div className="text-gray-500">Atenção</div>
        </div>
        <div className="rounded border border-red-500/30 bg-red-500/10 py-1">
          <div className="font-semibold text-red-400">{">20%"}</div>
          <div className="text-gray-500">Perigo</div>
        </div>
      </div>
    </GlassCard>
  );
}

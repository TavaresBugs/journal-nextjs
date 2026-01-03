"use client";

import { memo } from "react";
import { GlassCard, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/trading";
import type { Trade } from "@/types";
import dayjs from "dayjs";

interface TradeLinkerProps {
  trades: Trade[];
  onLinkTradeOpen: () => void;
  onRemoveTrade: (tradeId: string) => void;
}

const TradeLinkerComponent = ({ trades, onLinkTradeOpen, onRemoveTrade }: TradeLinkerProps) => {
  return (
    <GlassCard className="border-zorin-accent/50 border bg-[#1b292b]/60 p-4 shadow-[0_0_15px_rgba(0,200,83,0.15)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(0,200,83,0.2)]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-zorin-accent text-sm font-medium">
          Trades Vinculados{" "}
          {trades.length > 0 && <span className="text-cyan-300">({trades.length})</span>}
        </h3>
        <Button
          type="button"
          variant="gradient-success"
          onClick={onLinkTradeOpen}
          className="flex h-8 items-center justify-center gap-2 rounded-lg px-3 text-white shadow-lg shadow-green-500/30 transition-all hover:scale-105"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className="text-xs font-bold tracking-wide uppercase">Adicionar Trade</span>
        </Button>
      </div>

      {trades.length > 0 ? (
        <div className="max-h-[200px] space-y-2 overflow-y-auto">
          {trades.map((trade) => (
            <GlassCard
              key={trade.id}
              className="bg-zorin-bg/50 flex items-center justify-between gap-2 border-white/5 p-2"
            >
              <div className="flex flex-wrap items-center gap-1 text-sm">
                <span className="text-gray-400">
                  {dayjs(trade.entryDate).format("DD/MM")} {trade.entryTime?.substring(0, 5)}
                </span>
                <span className="font-medium text-gray-200">{trade.symbol}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                    trade.type === "Long"
                      ? "bg-zorin-accent/20 text-zorin-accent"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {trade.type}
                  {trade.type === "Long" ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                      <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                  ) : (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                      <polyline points="17 18 23 18 23 12"></polyline>
                    </svg>
                  )}
                </span>
                {trade.pnl !== undefined && (
                  <span
                    className={`text-xs font-bold ${
                      trade.pnl > 0 ? "text-zorin-accent" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(trade.pnl)}
                  </span>
                )}
              </div>
              <Button
                variant="zorin-ghost"
                size="icon"
                type="button"
                onClick={() => onRemoveTrade(trade.id)}
                className="h-6 w-6 border-0 bg-transparent text-gray-500 shadow-none transition-colors hover:text-red-400"
                title="Remover trade"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </GlassCard>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">Nenhum trade vinculado a esta entrada.</p>
      )}
    </GlassCard>
  );
};

export const TradeLinker = memo(TradeLinkerComponent);

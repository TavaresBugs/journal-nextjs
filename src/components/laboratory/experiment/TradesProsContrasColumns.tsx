"use client";

import { formatCurrency } from "@/lib/utils/trading";
import type { ExperimentLinkedTrade } from "@/lib/database/repositories";
import dayjs from "dayjs";

interface TradesProsContrasColumnsProps {
  trades: ExperimentLinkedTrade[];
  onRemoveTrade: (tradeId: string) => void;
}

/**
 * Two-column layout showing trades categorized as Prós and Contras.
 * Uses category field (user-selected) instead of trade outcome.
 */
export function TradesProsContrasColumns({ trades, onRemoveTrade }: TradesProsContrasColumnsProps) {
  // Filter by category (user-selected classification)
  const pros = trades.filter((t) => t.category === "pro");
  const contras = trades.filter((t) => t.category === "contra");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Prós Column - Wins */}
      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-green-400">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
            ✓
          </span>
          Prós ({pros.length})
        </h4>
        <div className="max-h-[180px] space-y-1.5 overflow-y-auto">
          {pros.length > 0 ? (
            pros.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                variant="pro"
                onRemove={() => onRemoveTrade(trade.tradeId)}
              />
            ))
          ) : (
            <p className="py-4 text-center text-xs text-gray-500 italic">Nenhum win vinculado</p>
          )}
        </div>
      </div>

      {/* Contras Column - Losses */}
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-red-400">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20">
            ✕
          </span>
          Contras ({contras.length})
        </h4>
        <div className="max-h-[180px] space-y-1.5 overflow-y-auto">
          {contras.length > 0 ? (
            contras.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                variant="contra"
                onRemove={() => onRemoveTrade(trade.tradeId)}
              />
            ))
          ) : (
            <p className="py-4 text-center text-xs text-gray-500 italic">Nenhum loss vinculado</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Trade card component
interface TradeCardProps {
  trade: ExperimentLinkedTrade;
  variant: "pro" | "contra" | "neutro";
  onRemove: () => void;
}

function TradeCard({ trade, variant, onRemove }: TradeCardProps) {
  const bgClass =
    variant === "pro"
      ? "bg-green-500/10 hover:bg-green-500/15"
      : variant === "contra"
        ? "bg-red-500/10 hover:bg-red-500/15"
        : "bg-yellow-500/10 hover:bg-yellow-500/15";

  const pnlClass = trade.pnl >= 0 ? "text-green-400" : "text-red-400";

  return (
    <div
      className={`group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors ${bgClass}`}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-gray-400">{dayjs(trade.entryDate).format("DD/MM")}</span>
        <span className="font-medium text-gray-200">{trade.symbol}</span>
        <span
          className={`rounded px-1 py-0.5 text-[10px] font-medium ${
            trade.type === "Long" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
          }`}
        >
          {trade.type}
        </span>
        <span className={`font-bold ${pnlClass}`}>{formatCurrency(trade.pnl)}</span>
      </div>

      <button
        onClick={onRemove}
        className="text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
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
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

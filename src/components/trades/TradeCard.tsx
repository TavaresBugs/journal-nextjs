/**
 * TradeCard - NOVO COMPONENTE para versão mobile
 *
 * Este componente substitui a linha da tabela (TradeRow) em mobile,
 * apresentando as informações do trade em formato de card empilhado.
 *
 * PRIORIZAÇÃO DE INFORMAÇÕES:
 * - Linha 1: Data + Ativo (principais identificadores)
 * - Linha 2: P/L grande + Status (resultado visual)
 * - Linha 3: Tipo (Long/Short) + R:R (análise rápida)
 * - Linha 4 (colapsável): Entrada, Saída, Lote, Tags
 * - Linha 5: Ações (Editar, Deletar, Diário)
 */

import React, { useState } from "react";
import type { Trade, JournalEntry } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { AssetIcon } from "@/components/shared/AssetIcon";
import { IconActionButton } from "@/components/ui";
import dayjs from "dayjs";

// Helper function to format price values (mesmo formato do TradeRow)
const formatPrice = (value: number): string => {
  return value.toFixed(2);
};

// Tag colors (mesmo do TradeRow original)
const TAG_COLORS = [
  { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
  { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30" },
  { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
  { bg: "bg-indigo-500/20", text: "text-indigo-300", border: "border-indigo-500/30" },
];

interface TradeCardProps {
  trade: Trade;
  currency: string;
  journalEntry?: JournalEntry;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (tradeId: string) => void;
  onJournalClick?: (trade: Trade, startEditing?: boolean) => void;
  onViewDay?: (date: string) => void;
}

// Ícone inline para detalhes colapsáveis
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export function TradeCard({
  trade,
  currency,
  journalEntry,
  onEditTrade,
  onDeleteTrade,
  onJournalClick,
  onViewDay,
}: TradeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isProfit = (trade.pnl ?? 0) >= 0;
  const formattedDate = dayjs(trade.entryDate).format("DD/MM/YY");
  const formattedTime = trade.entryTime ? ` ${trade.entryTime}` : "";
  const hasJournal = !!journalEntry;

  // Parse tags from string to array
  const tagsArray = trade.tags
    ? trade.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // Status badge
  const getStatusBadge = () => {
    if (trade.outcome === "pending") {
      return (
        <span className="rounded-full border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
          Aberto
        </span>
      );
    }
    return (
      <span
        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
          isProfit
            ? "border-green-500/30 bg-green-500/20 text-green-400"
            : "border-red-500/30 bg-red-500/20 text-red-400"
        }`}
      >
        {isProfit ? "Gain" : "Loss"}
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-700/50 bg-linear-to-br from-gray-800/60 to-gray-800/30">
      {/* Header: Data + Ativo + Status */}
      <div className="border-b border-gray-700/30 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {/* Data - clicável para ver dia */}
            <button
              onClick={() => onViewDay?.(trade.entryDate)}
              className="text-xs whitespace-nowrap text-gray-400 transition-colors hover:text-cyan-400"
            >
              {formattedDate}
              {formattedTime}
            </button>

            {/* Ícone do Ativo */}
            <AssetIcon symbol={trade.symbol} size="sm" />

            {/* Nome do Ativo */}
            <span className="truncate font-semibold text-gray-100">{trade.symbol}</span>
          </div>

          {/* Status + Tipo */}
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                trade.type === "Long"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {trade.type}
            </span>
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Main content: P/L grande + R:R */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* P/L - destaque principal */}
          <div>
            <div className="mb-0.5 text-xs text-gray-500">P&L</div>
            <div className={`text-xl font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
              {isProfit ? "+" : ""}
              {formatCurrency(trade.pnl ?? 0, currency)}
            </div>
          </div>

          {/* R:R */}
          <div className="text-right">
            <div className="mb-0.5 text-xs text-gray-500">R:R</div>
            <div className="text-lg font-semibold text-gray-200">
              {trade.rMultiple?.toFixed(2) || "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable details */}
      <div className="border-t border-gray-700/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between px-4 py-2 text-xs text-gray-400 transition-colors hover:text-gray-300"
        >
          <span>Detalhes</span>
          <ChevronDownIcon className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>

        {isExpanded && (
          <div className="grid grid-cols-3 gap-3 px-4 pb-3 text-center">
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Entrada</div>
              <div className="text-sm text-gray-300">{formatPrice(trade.entryPrice)}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Saída</div>
              <div className="text-sm text-gray-300">
                {trade.exitPrice ? formatPrice(trade.exitPrice) : "-"}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 uppercase">Lote</div>
              <div className="text-sm text-gray-300">{trade.lot}</div>
            </div>

            {/* Tags - full width */}
            {tagsArray.length > 0 && (
              <div className="col-span-3 mt-2">
                <div className="mb-1 text-[10px] text-gray-500 uppercase">Tags</div>
                <div className="flex flex-wrap justify-center gap-1">
                  {tagsArray.slice(0, 3).map((tag: string, i: number) => {
                    const color = TAG_COLORS[i % TAG_COLORS.length];
                    return (
                      <span
                        key={i}
                        className={`rounded border px-2 py-0.5 text-[10px] ${color.bg} ${color.text} ${color.border}`}
                      >
                        🏷️ {tag}
                      </span>
                    );
                  })}
                  {tagsArray.length > 3 && (
                    <span className="text-[10px] text-gray-500">+{tagsArray.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-between gap-2 border-t border-gray-700/30 bg-gray-900/30 px-3 py-2">
        {/* Left: Journal status - usa IconActionButton igual ao TradeRow */}
        <div className="flex items-center gap-2">
          <IconActionButton
            variant={hasJournal ? "journal" : "add"}
            size="lg"
            onClick={() => onJournalClick?.(trade, !hasJournal)}
            title={hasJournal ? "Ver Diário" : "Criar Diário"}
          />
          <span className={`text-xs font-medium ${hasJournal ? "text-cyan-400" : "text-gray-400"}`}>
            {hasJournal ? "Ver Diário" : "Adicionar"}
          </span>
        </div>

        {/* Right: Edit + Delete */}
        <div className="flex items-center gap-1">
          {onEditTrade && (
            <IconActionButton
              variant="edit"
              size="lg"
              onClick={() => onEditTrade(trade)}
              title="Editar trade"
            />
          )}
          {onDeleteTrade && (
            <IconActionButton
              variant="delete"
              size="lg"
              onClick={() => onDeleteTrade(trade.id)}
              title="Deletar trade"
            />
          )}
        </div>
      </div>
    </div>
  );
}

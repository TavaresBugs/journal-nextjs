import React from "react";
import { IconActionButton, AssetBadge } from "@/components/ui";
import type { Trade, JournalEntry } from "@/types";
import { formatCurrency } from "@/lib/calculations";

interface TradeRowProps {
  trade: Trade;
  currency: string;
  journalEntry: JournalEntry | undefined;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (tradeId: string) => void;
  onJournalClick?: (trade: Trade, startEditing?: boolean) => void;
  onViewDay?: (date: string) => void;
}

/**
 * Memoized trade row component to prevent unnecessary re-renders.
 * Each row only re-renders when its specific trade data changes.
 */
export const TradeRow = React.memo(function TradeRow({
  trade,
  currency,
  journalEntry,
  onEditTrade,
  onDeleteTrade,
  onJournalClick,
  onViewDay,
}: TradeRowProps) {
  const isProfit = (trade.pnl || 0) > 0;
  const isLoss = (trade.pnl || 0) < 0;
  const isPending = trade.outcome === "pending";

  // Calculate Risk:Reward
  const riskReward =
    trade.stopLoss && trade.entryPrice
      ? ((trade.exitPrice || trade.entryPrice) - trade.entryPrice) /
        (trade.entryPrice - trade.stopLoss)
      : 0;

  // Date formatting
  const [year, month, day] = trade.entryDate.split("-");
  const displayDate = `${day}/${month}/${year}`;
  const timeStr = trade.entryTime || "00:00:00";

  return (
    <tr
      key={trade.id}
      className="group border-b border-gray-700/50 transition-colors hover:bg-gray-700/20"
    >
      {/* DIÁRIO */}
      <td className="px-3 py-3 text-center">
        <IconActionButton
          variant={journalEntry ? "journal" : "add"}
          size="md"
          onClick={() =>
            onJournalClick ? onJournalClick(trade, !journalEntry) : onViewDay?.(trade.entryDate)
          }
          title={journalEntry ? "Ver Diário" : "Criar Diário"}
        />
      </td>

      {/* AÇÕES */}
      <td className="px-3 py-3">
        <div className="flex items-center justify-center gap-2">
          <IconActionButton
            variant="edit"
            size="md"
            onClick={() => onEditTrade?.(trade)}
            title="Editar"
          />
          <IconActionButton
            variant="delete"
            size="md"
            onClick={() => onDeleteTrade?.(trade.id)}
            title="Excluir"
          />
        </div>
      </td>

      {/* DATA */}
      <td className="px-3 py-3 text-center whitespace-nowrap">
        <div className="text-sm font-medium text-gray-300">{displayDate}</div>
        <div className="font-mono text-[10px] text-cyan-500/80">{timeStr} NY</div>
      </td>

      {/* ATIVO */}
      <td className="px-3 py-3 text-center">
        <div className="flex justify-center">
          <AssetBadge symbol={trade.symbol} size="sm" />
        </div>
      </td>

      {/* TIPO */}
      <td className="px-3 py-3 text-center">
        <div
          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold ${
            trade.type === "Long"
              ? "bg-zorin-accent/20 text-zorin-accent border-zorin-accent/30 border"
              : "border border-red-500/30 bg-red-500/20 text-red-400"
          }`}
        >
          <span>{trade.type}</span>
          {trade.type === "Long" ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          )}
        </div>
      </td>

      {/* P/L */}
      <td className="px-3 py-3 text-center font-mono font-medium">
        <span
          className={isProfit ? "text-zorin-accent" : isLoss ? "text-red-400" : "text-gray-400"}
        >
          {formatCurrency(trade.pnl || 0, currency)}
        </span>
      </td>

      {/* PREÇOS */}
      <td className="px-3 py-3 text-center text-xs text-gray-400">{trade.entryPrice.toFixed(2)}</td>
      <td className="px-3 py-3 text-center text-xs text-gray-400">
        {trade.exitPrice ? trade.exitPrice.toFixed(2) : "-"}
      </td>
      <td className="px-3 py-3 text-center text-xs text-gray-300">{trade.lot}</td>

      {/* R:R */}
      <td className="px-3 py-3 text-center font-mono text-xs text-gray-400">
        {riskReward !== 0 ? `${Math.abs(riskReward).toFixed(2)}R` : "-"}
      </td>

      {/* TAGS */}
      <td className="px-3 py-3 text-center">
        <div className="mx-auto flex max-w-[180px] flex-wrap justify-center gap-1">
          {trade.tags && <TagList tags={trade.tags} />}
          {!trade.tags && <span className="text-sm text-gray-500">—</span>}
        </div>
      </td>

      {/* STATUS */}
      <td className="px-3 py-3 text-center">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
            isPending
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              : "border-gray-600 bg-gray-700/50 text-gray-400"
          }`}
        >
          {isPending ? "ABERTO" : "FECHADO"}
        </span>
      </td>
    </tr>
  );
});

// Memoized tag list component
const TagList = React.memo(function TagList({ tags }: { tags: string }) {
  const colors = [
    { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
    { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
    { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
    { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30" },
    { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
    { bg: "bg-indigo-500/20", text: "text-indigo-300", border: "border-indigo-500/30" },
  ];

  return (
    <>
      {tags.split(",").map((tag, index) => {
        const color = colors[index % colors.length];
        return (
          <span
            key={index}
            className={`text-[10px] ${color.bg} ${color.text} rounded border px-1.5 py-0.5 ${color.border}`}
          >
            🏷️ {tag.trim()}
          </span>
        );
      })}
    </>
  );
});

export default TradeRow;

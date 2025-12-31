import React, { useState, useMemo, useEffect } from "react";
import { Button, GlassCard, Input } from "@/components/ui";
import type { Trade } from "@/types";
import { useJournalStore } from "@/store/useJournalStore";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { TradeRow } from "./TradeRow";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface TradeListProps {
  trades: Trade[];
  currency: string;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (tradeId: string) => void;
  onViewDay?: (date: string) => void;
  onJournalClick?: (trade: Trade, startEditing?: boolean) => void;
  // Server-side pagination props (optional)
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  // External filter control
  filterAsset?: string;
  hideHeader?: boolean;
  // External sort control
  sortDirection?: "asc" | "desc";
  onSortChange?: (direction: "asc" | "desc") => void;
  isLoading?: boolean;
}

export const TradeList = React.memo(TradeListContent);
TradeListContent.displayName = "TradeList";

function TradeListContent({
  trades,
  currency,
  onEditTrade,
  onDeleteTrade,
  onViewDay,
  onJournalClick,
  totalCount,
  currentPage: controlledPage,
  itemsPerPage = 10,
  onPageChange,
  filterAsset: externalFilterAsset,
  hideHeader = false,
  sortDirection: externalSortDirection,
  onSortChange,
  isLoading = false,
}: TradeListProps) {
  const [internalFilterAsset, setInternalFilterAsset] = useState<string>("TODOS OS ATIVOS");

  // Use external filter if provided, otherwise internal
  const filterAsset = externalFilterAsset !== undefined ? externalFilterAsset : internalFilterAsset;

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Local Pagination State (fallback)
  const [localPage, setLocalPage] = useState(1);

  // Reset local pagination when filter changes (if controlled externally)
  useEffect(() => {
    if (externalFilterAsset !== undefined && localPage !== 1) {
      // eslint-disable-next-line
      setLocalPage(1);
    }
  }, [externalFilterAsset, localPage]);

  // Determine mode
  const isServerSide = typeof totalCount === "number" && typeof onPageChange === "function";
  const currentPage = isServerSide ? controlledPage || 1 : localPage;

  // Journal Modal State (Legacy - keeping mostly for safe removal or if needed later, but button now triggers viewDay)
  const [selectedTradeForJournal, setSelectedTradeForJournal] = useState<Trade | null>(null);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const { entries } = useJournalStore();

  // Get unique assets for filter
  const uniqueAssets = useMemo(() => {
    return Array.from(new Set(trades.map((t) => t.symbol))).sort();
  }, [trades]);

  // ... filtering logic omitted for brevity as it's unchanged ...

  const filteredTrades = useMemo(() => {
    return filterAsset === "TODOS OS ATIVOS"
      ? trades
      : trades.filter((t) => t.symbol === filterAsset);
  }, [trades, filterAsset]);

  // Sort trades by date AND time
  const sortedTrades = useMemo(() => {
    // If server-side, explicit trades prop is already sorted by backend
    if (isServerSide) return trades;

    return [...filteredTrades].sort((a, b) => {
      const dateTimeA = new Date(`${a.entryDate}T${a.entryTime || "00:00:00"}`).getTime();
      const dateTimeB = new Date(`${b.entryDate}T${b.entryTime || "00:00:00"}`).getTime();
      return sortDirection === "desc" ? dateTimeB - dateTimeA : dateTimeA - dateTimeB;
    });
  }, [filteredTrades, sortDirection, isServerSide, trades]);

  const count = isServerSide ? totalCount || 0 : filteredTrades.length;
  const totalPages = Math.ceil(count / itemsPerPage);

  const currentTrades = useMemo(() => {
    if (isServerSide) return sortedTrades;

    const startIndex = (localPage - 1) * itemsPerPage;
    return sortedTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTrades, isServerSide, localPage, itemsPerPage]);

  // Generate pagination numbers
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    let l;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handlePageChange = (p: number) => {
    if (isServerSide && onPageChange) {
      onPageChange(p);
    } else {
      setLocalPage(p);
    }
  };

  if (trades.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4 text-6xl">📊</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-300">Nenhum trade registrado</h3>
        <p className="text-gray-500">Crie seu primeiro trade para começar</p>
      </div>
    );
  }

  const getJournalEntry = (tradeId: string) => {
    return entries.find((e) => e.tradeIds?.includes(tradeId));
  };

  return (
    <div className="space-y-4">
      {/* Filtro de Ativos com Datalist - Only show if header is NOT hidden */}
      {!hideHeader && (
        <div className="flex items-center gap-3">
          <Input
            list="assets-filter-list"
            label="Filtrar Ativo"
            value={internalFilterAsset}
            onChange={(e) => {
              setInternalFilterAsset(e.target.value);
              handlePageChange(1); // Reset pagination on filter change
            }}
            placeholder="TODOS OS ATIVOS"
            className="uppercase"
          />
          <datalist id="assets-filter-list">
            <option value="TODOS OS ATIVOS" />
            {uniqueAssets.map((asset) => (
              <option key={asset} value={asset} />
            ))}
          </datalist>
        </div>
      )}

      {/* Tabela */}
      <GlassCard
        className={`bg-zorin-bg/30 overflow-hidden border-white/5 p-0 ${isLoading ? "cursor-wait" : ""}`}
      >
        <div className={`overflow-x-auto ${isLoading ? "pointer-events-none opacity-50" : ""}`}>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-700">
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  DIÁRIO
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  AÇÕES
                </th>
                <th
                  className={`px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase transition-colors ${
                    isLoading ? "" : "cursor-pointer hover:text-cyan-400"
                  }`}
                  onClick={() => {
                    if (isLoading) return; // Prevent click while loading
                    const newDirection =
                      (externalSortDirection || sortDirection) === "asc" ? "desc" : "asc";
                    if (onSortChange) {
                      onSortChange(newDirection);
                    } else {
                      setSortDirection(newDirection);
                    }
                  }}
                >
                  DATA {(externalSortDirection || sortDirection) === "desc" ? "↓" : "↑"}
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  ATIVO
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  TIPO
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  P/L
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  ENTRADA
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  SAÍDA
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  LOTE
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  R:R
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  TAGS
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentTrades.map((trade) => (
                <TradeRow
                  key={trade.id}
                  trade={trade}
                  currency={currency}
                  journalEntry={getJournalEntry(trade.id)}
                  onEditTrade={onEditTrade}
                  onDeleteTrade={onDeleteTrade}
                  onJournalClick={onJournalClick}
                  onViewDay={onViewDay}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="bg-zorin-surface/30 flex items-center justify-between border-t border-white/5 px-4 py-3">
            <div className="text-sm text-gray-400">
              {isServerSide ? (
                // For server side, calculation is slightly different as we don't have all items
                <>
                  Página {currentPage} de {totalPages}
                </>
              ) : (
                <>
                  Mostrando {(localPage - 1) * itemsPerPage + 1} a{" "}
                  {Math.min(localPage * itemsPerPage, filteredTrades.length)} de{" "}
                  {filteredTrades.length} trades
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="zorin-ghost"
                size="sm"
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 font-semibold"
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  <Button
                    key={index}
                    variant={currentPage === page ? "zorin-primary" : "zorin-ghost"}
                    size="sm"
                    onClick={() => typeof page === "number" && handlePageChange(page)}
                    disabled={typeof page !== "number"}
                    className={`flex h-8 w-8 items-center justify-center p-0 font-bold ${
                      typeof page !== "number" ? "cursor-default opacity-50" : ""
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="zorin-ghost"
                size="sm"
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 font-semibold"
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Modals */}
      {selectedTradeForJournal && (
        <JournalEntryModal
          key={selectedTradeForJournal.id}
          isOpen={isJournalModalOpen}
          onClose={() => {
            setIsJournalModalOpen(false);
            setSelectedTradeForJournal(null);
          }}
          trade={selectedTradeForJournal}
          existingEntry={getJournalEntry(selectedTradeForJournal.id)}
        />
      )}
    </div>
  );
}

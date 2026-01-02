import React, { useState, useMemo, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import type { Trade } from "@/types";
import { useJournalStore } from "@/store/useJournalStore";
import { JournalEntryModal } from "@/components/journal/JournalEntryModal";
import { TradeCard } from "./TradeCard";
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
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  filterAsset?: string;
  hideHeader?: boolean;
  sortDirection?: "asc" | "desc";
  onSortChange?: (direction: "asc" | "desc") => void;
  isLoading?: boolean;
}

/**
 * TradeList - REFATORADO para Mobile-First
 *
 * MUDANÇAS PRINCIPAIS:
 * 1. Versão CARD para mobile (< md) - empilhamento vertical
 * 2. Versão básica para desktop (md+) - apenas cards em grid
 * 3. Cards mostram informações prioritárias: Data, Ativo, P/L, Status
 * 4. Informações secundárias (Entrada, Saída, Lote) em linha menor no card
 * 5. Paginação responsiva com botões maiores em mobile
 * 6. Filter input full-width em mobile
 */
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
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [localPage, setLocalPage] = useState(1);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [selectedTradeForJournal, setSelectedTradeForJournal] = useState<Trade | null>(null);

  const { entries } = useJournalStore();

  const filterAsset = externalFilterAsset ?? internalFilterAsset;
  const isServerSide = typeof controlledPage === "number" && typeof onPageChange === "function";
  const currentPage = isServerSide ? controlledPage : localPage;

  const uniqueAssets = useMemo(() => {
    const assets = new Set(trades.map((t) => t.symbol.toUpperCase()));
    return Array.from(assets).sort();
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (filterAsset === "TODOS OS ATIVOS" || !filterAsset) return trades;
    return trades.filter((t) => t.symbol.toUpperCase().includes(filterAsset.toUpperCase()));
  }, [trades, filterAsset]);

  const sortedTrades = useMemo(() => {
    const dir = externalSortDirection ?? sortDirection;
    return [...filteredTrades].sort((a, b) => {
      const dateA = new Date(a.entryDate).getTime();
      const dateB = new Date(b.entryDate).getTime();
      return dir === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [filteredTrades, sortDirection, externalSortDirection]);

  const totalItems = isServerSide ? (totalCount ?? trades.length) : filteredTrades.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const currentTrades = useMemo(() => {
    if (isServerSide) return sortedTrades;
    const start = (localPage - 1) * itemsPerPage;
    return sortedTrades.slice(start, start + itemsPerPage);
  }, [sortedTrades, localPage, itemsPerPage, isServerSide]);

  useEffect(() => {
    // Reset to page 1 when filter changes - intentional
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isServerSide) setLocalPage(1);
  }, [filterAsset, isServerSide]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePageChange = (p: number) => {
    if (onPageChange) {
      onPageChange(p);
    } else {
      setLocalPage(p);
    }
  };

  if (trades.length === 0) {
    return (
      <div className="px-4 py-12 text-center sm:py-16">
        <div className="mb-3 text-5xl sm:mb-4 sm:text-6xl">📊</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-300 sm:text-xl">
          Nenhum trade registrado
        </h3>
        <p className="text-sm text-gray-500 sm:text-base">Crie seu primeiro trade para começar</p>
      </div>
    );
  }

  const getJournalEntry = (tradeId: string) => {
    return entries.find((e) => e.tradeIds?.includes(tradeId));
  };

  const handleSortToggle = () => {
    if (isLoading) return;
    const newDirection = (externalSortDirection || sortDirection) === "asc" ? "desc" : "asc";
    if (onSortChange) {
      onSortChange(newDirection);
    } else {
      setSortDirection(newDirection);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filtro de Ativos - RESPONSIVO */}
      {!hideHeader && (
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Input
            list="assets-filter-list"
            label="Filtrar Ativo"
            value={internalFilterAsset}
            onChange={(e) => {
              setInternalFilterAsset(e.target.value);
              handlePageChange(1);
            }}
            placeholder="TODOS OS ATIVOS"
            className="w-full uppercase sm:w-auto sm:min-w-[200px]"
          />
          <datalist id="assets-filter-list">
            <option value="TODOS OS ATIVOS" />
            {uniqueAssets.map((asset) => (
              <option key={asset} value={asset} />
            ))}
          </datalist>

          {/* Sort button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSortToggle}
            disabled={isLoading}
            className="h-11 min-h-[44px] px-4"
          >
            Ordenar por Data {(externalSortDirection || sortDirection) === "desc" ? "↓" : "↑"}
          </Button>
        </div>
      )}

      {/* VERSÃO CARDS - Funciona em todas as telas */}
      <div
        className={`grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 ${isLoading ? "pointer-events-none opacity-50" : ""}`}
      >
        {currentTrades.map((trade) => (
          <TradeCard
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
      </div>

      {/* PAGINAÇÃO RESPONSIVA */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-white/5 bg-gray-900/30 px-3 py-3 sm:flex-row sm:px-4">
          {/* Info de páginas */}
          <div className="text-center text-xs text-gray-400 sm:text-left sm:text-sm">
            {isServerSide ? (
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

          {/* Controles de paginação */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1 || isLoading}
              className="h-10 min-h-[44px] px-3 text-xs font-semibold sm:px-4 sm:text-sm"
            >
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">←</span>
            </Button>

            {/* Números de página */}
            <div className="xs:flex hidden items-center gap-1">
              {getPageNumbers().map((page, index) => (
                <Button
                  key={index}
                  variant={currentPage === page ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => typeof page === "number" && handlePageChange(page)}
                  disabled={typeof page !== "number" || isLoading}
                  className={`h-9 min-h-[36px] w-9 min-w-[36px] p-0 text-xs font-bold sm:h-10 sm:w-10 sm:text-sm ${
                    typeof page !== "number" ? "cursor-default opacity-50" : ""
                  }`}
                >
                  {page}
                </Button>
              ))}
            </div>

            {/* Indicador simplificado para mobile */}
            <span className="xs:hidden px-2 text-sm text-gray-400">
              {currentPage}/{totalPages}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages || isLoading}
              className="h-10 min-h-[44px] px-3 text-xs font-semibold sm:px-4 sm:text-sm"
            >
              <span className="hidden sm:inline">Próxima</span>
              <span className="sm:hidden">→</span>
            </Button>
          </div>
        </div>
      )}

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

export const TradeList = React.memo(TradeListContent);
TradeListContent.displayName = "TradeList";

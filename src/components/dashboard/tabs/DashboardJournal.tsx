"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { AssetSelect } from "@/components/shared/AssetSelect";
import { TradeList } from "@/components/trades/TradeList";
import { Trade } from "@/types";
import { useToast } from "@/providers/ToastProvider";

interface DashboardJournalProps {
  trades: Trade[];
  currency: string;
  totalCount: number;
  currentPage: number;
  accountId: string;
  isLoading?: boolean;

  // Actions
  onLoadPage: (accountId: string, page: number) => Promise<void>;
  onImportClick: () => void;
  onDeleteAllTrades: () => Promise<void>;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => Promise<void>;
  onViewDay: (date: string) => void;
  onJournalClick?: (trade: Trade, startEditing?: boolean) => void;
  // Sort
  sortDirection: "asc" | "desc";
  onSortChange: (accountId: string, direction: "asc" | "desc") => Promise<void>;
  // Filter
  filterAsset: string;
  onFilterChange: (accountId: string, asset: string) => Promise<void>;
}

// Memoize to prevent re-renders when switching tabs if props didn't change
export const DashboardJournal = React.memo(DashboardJournalContent);
DashboardJournalContent.displayName = "DashboardJournal";

function DashboardJournalContent({
  trades,
  currency,
  totalCount,
  currentPage,
  accountId,
  isLoading,
  onLoadPage,
  onImportClick,
  onDeleteAllTrades,
  onEditTrade,
  onDeleteTrade,
  onViewDay,
  onJournalClick,
  sortDirection,
  onSortChange,
  filterAsset,
  onFilterChange,
}: DashboardJournalProps) {
  const { showToast } = useToast();

  const handleDeleteAll = async () => {
    const confirmText = prompt(
      "⚠️ ATENÇÃO: Esta ação irá DELETAR TODOS os trades desta conta!\n\n" +
        'Para confirmar, digite "DELETAR" (em maiúsculas):'
    );
    if (confirmText === "DELETAR") {
      await onDeleteAllTrades();
    } else if (confirmText !== null) {
      showToast("Texto incorreto. Nenhum trade foi deletado.", "warning");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-nowrap items-center gap-3 pt-2 pb-4">
        {/* Select de Ativos */}
        <AssetSelect
          value={filterAsset}
          onChange={(asset) => onFilterChange(accountId, asset)}
          placeholder="Filtrar..."
          showAllOption={true}
          className="w-[180px] shrink-0"
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Botões à direita */}
        <div className="flex shrink-0 items-center gap-2">
          <IconActionButton variant="import" onClick={onImportClick} title="Importar Trades" />
          <IconActionButton variant="delete" onClick={handleDeleteAll} title="Limpar Histórico" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <TradeList
          trades={trades}
          currency={currency}
          onEditTrade={onEditTrade}
          onDeleteTrade={onDeleteTrade}
          onViewDay={onViewDay}
          onJournalClick={onJournalClick}
          totalCount={totalCount}
          currentPage={currentPage}
          onPageChange={(p) => onLoadPage(accountId, p)}
          filterAsset={filterAsset}
          hideHeader={true}
          sortDirection={sortDirection}
          onSortChange={(dir) => onSortChange(accountId, dir)}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}

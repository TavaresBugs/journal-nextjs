import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { AssetCombobox } from "@/components/shared/AssetCombobox";
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

export function DashboardJournal({
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
      <CardHeader className="flex flex-col items-start justify-between gap-4 py-4 md:flex-row md:items-center">
        {/* Filtro à esquerda (onde estava o título) */}
        <div className="w-full md:w-64">
          <AssetCombobox
            value={filterAsset}
            onChange={(asset) => onFilterChange(accountId, asset)}
            placeholder="Filtrar por ativo..."
            showAllOption={true}
            className="h-10 border-gray-700 bg-gray-900/50 hover:bg-gray-800"
          />
        </div>

        {/* Ações à direita */}
        <div className="flex w-full justify-end gap-2 md:w-auto">
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
          // Props novas para controle externo
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

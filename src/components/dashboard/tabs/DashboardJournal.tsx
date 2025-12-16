import React from 'react';
import { Card, CardHeader, CardContent, Button } from '@/components/ui';
import { TradeList } from '@/components/trades/TradeList';
import { Trade } from '@/types';
import { useToast } from '@/providers/ToastProvider';

interface DashboardJournalProps {
    trades: Trade[];
    currency: string;
    totalCount: number;
    currentPage: number;
    accountId: string;

    // Actions
    onLoadPage: (accountId: string, page: number) => Promise<void>;
    onImportClick: () => void;
    onDeleteAllTrades: () => Promise<void>;
    onEditTrade: (trade: Trade) => void;
    onDeleteTrade: (tradeId: string) => Promise<void>;
    onViewDay: (date: string) => void;
}

export function DashboardJournal({
    trades,
    currency,
    totalCount,
    currentPage,
    accountId,
    onLoadPage,
    onImportClick,
    onDeleteAllTrades,
    onEditTrade,
    onDeleteTrade,
    onViewDay
}: DashboardJournalProps) {
    const { showToast } = useToast();

    const handleDeleteAll = async () => {
        const confirmText = prompt(
            '⚠️ ATENÇÃO: Esta ação irá DELETAR TODOS os trades desta conta!\n\n' +
            'Para confirmar, digite "DELETAR" (em maiúsculas):'
        );
        if (confirmText === 'DELETAR') {
            await onDeleteAllTrades();
        } else if (confirmText !== null) {
            showToast('Texto incorreto. Nenhum trade foi deletado.', 'warning');
        }
    };

    const [filterAsset, setFilterAsset] = React.useState<string>('TODOS OS ATIVOS');

    // Get unique assets for filter
    const uniqueAssets = React.useMemo(() => {
        return Array.from(new Set(trades.map(t => t.symbol))).sort();
    }, [trades]);

    return (
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
                {/* Filtro à esquerda (onde estava o título) */}
                <div className="w-full md:w-64">
                    <div className="relative">
                        <input
                            list="assets-filter-list-header"
                            value={filterAsset}
                            onChange={(e) => setFilterAsset(e.target.value)}
                            placeholder="Todos os Ativos"
                            className="w-full h-9 px-3 py-1 bg-gray-900/50 border border-gray-700 rounded text-sm placeholder:text-gray-500 text-gray-200 focus:outline-none focus:border-gray-500 uppercase transition-colors"
                        />
                         {/* Chevron icon para indicar dropdown */}
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                    </div>
                    <datalist id="assets-filter-list-header">
                        <option value="TODOS OS ATIVOS" />
                        {uniqueAssets.map(asset => (
                            <option key={asset} value={asset} />
                        ))}
                    </datalist>
                </div>

                {/* Ações à direita */}
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onImportClick}
                        className="flex-1 md:flex-none justify-center text-gray-400 hover:text-white"
                        leftIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        }
                    >
                        Importar
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteAll}
                        className="flex-1 md:flex-none justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        leftIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                        }
                    >
                        Limpar Histórico
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <TradeList
                    trades={trades}
                    currency={currency}
                    onEditTrade={onEditTrade}
                    onDeleteTrade={onDeleteTrade}
                    onViewDay={onViewDay}
                    totalCount={totalCount}
                    currentPage={currentPage}
                    onPageChange={(p) => onLoadPage(accountId, p)}
                    // Props novas para controle externo
                    filterAsset={filterAsset}
                    hideHeader={true}
                />
            </CardContent>
        </Card>
    );
}

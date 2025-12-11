import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { TradeList } from '@/components/trades/TradeList';
import { Trade } from '@/types';
import { useToast } from '@/contexts/ToastContext';

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

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Histórico de Trades</CardTitle>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onImportClick}
                        leftIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                        }
                    >
                        Importar
                    </Button>
                    <Button
                        variant="outline-danger"
                        onClick={handleDeleteAll}
                        leftIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                        }
                    >
                        Deletar Todos
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <TradeList
                    trades={trades}
                    currency={currency}
                    onEditTrade={onEditTrade}
                    onDeleteTrade={onDeleteTrade}
                    onViewDay={onViewDay}
                    totalCount={totalCount}
                    currentPage={currentPage}
                    onPageChange={(p) => onLoadPage(accountId, p)}
                />
            </CardContent>
        </Card>
    );
}

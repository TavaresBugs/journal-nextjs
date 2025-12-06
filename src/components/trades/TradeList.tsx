import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui';
import type { Trade } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { useJournalStore } from '@/store/useJournalStore';
import { JournalEntryModal } from '@/components/journal/JournalEntryModal';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface TradeListProps {
    trades: Trade[];
    currency: string;
    onEditTrade?: (trade: Trade) => void;
    onDeleteTrade?: (tradeId: string) => void;
}

export function TradeList({ trades, currency, onEditTrade, onDeleteTrade }: TradeListProps) {
    const [filterAsset, setFilterAsset] = useState<string>('TODOS OS ATIVOS');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Journal Modal State
    const [selectedTradeForJournal, setSelectedTradeForJournal] = useState<Trade | null>(null);
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const { entries, loadEntries } = useJournalStore();

    // Load entries on mount
    useEffect(() => {
        const accountId = trades[0]?.accountId;
        if (accountId) {
            loadEntries(accountId);
        }
    }, [trades, loadEntries]);

    // Get unique assets for filter
    const uniqueAssets = useMemo(() => {
        return Array.from(new Set(trades.map(t => t.symbol))).sort();
    }, [trades]);
    
    // Filter trades
    const filteredTrades = useMemo(() => {
        return filterAsset === 'TODOS OS ATIVOS' 
            ? trades 
            : trades.filter(t => t.symbol === filterAsset);
    }, [trades, filterAsset]);

    // Sort trades
    const sortedTrades = useMemo(() => {
        return [...filteredTrades].sort((a, b) => {
            const dateA = new Date(a.entryDate).getTime();
            const dateB = new Date(b.entryDate).getTime();
            return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [filteredTrades, sortDirection]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
    
    // Ensure currentPage is valid
    if (currentPage > totalPages && totalPages > 0) {
       // This is safe during render phase if it prevents an invalid state, 
       // but typically better to handle in event handlers. 
       // However, since we derived totalPages from memoized filteredTrades,
       // we can just cap the startIndex.
       // Ideally, we move the reset logic to where filterAsset changes.
    }
    
    // We'll handle page reset directly in the filter change handler (lines 142-143 of original file)
    // Checking bounds for render:
    const safePage = Math.min(currentPage, Math.max(1, totalPages));
    if (currentPage !== safePage && totalPages > 0) {
        // Schedule update after render to avoid sync effect warning, 
        // or just use safePage for calculation and let the effect fix it asynchronously if needed.
        // For now, let's use safePage for slicing.
    }

    const startIndex = (safePage - 1) * itemsPerPage;
    const currentTrades = useMemo(() => {
        return sortedTrades.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedTrades, startIndex, itemsPerPage]);

    // Generate pagination numbers (Smart Window)
    const getPageNumbers = () => {
        const delta = 2; // Number of pages to show around current page
        const range = [];
        const rangeWithDots = [];

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || 
                i === totalPages || 
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                range.push(i);
            }
        }

        let l;
        for (const i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    };

    if (trades.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum trade registrado</h3>
                <p className="text-gray-500">Crie seu primeiro trade para começar</p>
            </div>
        );
    }

    const handleJournalClick = (trade: Trade) => {
        setSelectedTradeForJournal(trade);
        setIsJournalModalOpen(true);
    };

    const getJournalEntry = (tradeId: string) => {
        return entries.find(e => e.tradeId === tradeId);
    };

    return (
        <div className="space-y-4">
            {/* Filtro de Ativos com Datalist */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400">Filtrar Ativo:</label>
                <input
                    list="assets-filter-list"
                    value={filterAsset}
                    onChange={(e) => {
                        setFilterAsset(e.target.value);
                        setCurrentPage(1); // Reset pagination on filter change
                    }}
                    placeholder="TODOS OS ATIVOS"
                    className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all uppercase"
                />
                <datalist id="assets-filter-list">
                    <option value="TODOS OS ATIVOS" />
                    {uniqueAssets.map(asset => (
                        <option key={asset} value={asset} />
                    ))}
                </datalist>
            </div>

            {/* Tabela */}
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-gray-700">
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">DIÁRIO</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">AÇÕES</th>
                                <th 
                                    className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors"
                                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                >
                                    DATA {sortDirection === 'desc' ? '↓' : '↑'}
                                </th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">ATIVO</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">TIPO</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">P/L</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">ENTRADA</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">SAÍDA</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">LOTE</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">R:R</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">TAGS</th>
                                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTrades.map((trade) => {
                                const isProfit = (trade.pnl || 0) > 0;
                                const isLoss = (trade.pnl || 0) < 0;
                                const isPending = trade.outcome === 'pending';
                                const journalEntry = getJournalEntry(trade.id);
                                
                                // Calculate Risk:Reward
                                const riskReward = trade.stopLoss && trade.entryPrice
                                    ? ((trade.exitPrice || trade.entryPrice) - trade.entryPrice) / (trade.entryPrice - trade.stopLoss)
                                    : 0;

                                return (
                                    <tr 
                                        key={trade.id} 
                                        className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors group"
                                    >
                                        {/* DIÁRIO */}
                                        <td className="px-3 py-3 text-center">
                                            <Button 
                                                variant="success"
                                                size="icon"
                                                onClick={() => handleJournalClick(trade)}
                                                className="w-8 h-8 mx-auto"
                                            >
                                                {journalEntry ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M5 12h14" />
                                                        <path d="M12 5v14" />
                                                    </svg>
                                                )}
                                            </Button>
                                        </td>

                                        {/* AÇÕES */}
                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button 
                                                    variant="gold"
                                                    size="icon"
                                                    onClick={() => onEditTrade?.(trade)}
                                                    className="w-8 h-8"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </Button>
                                                <Button 
                                                    variant="danger"
                                                    size="icon"
                                                    onClick={() => onDeleteTrade?.(trade.id)}
                                                    className="w-8 h-8"
                                                    title="Excluir"
                                                >
                                                    🗑️
                                                </Button>
                                            </div>
                                        </td>

                                        {/* DATA */}
                                        <td className="px-3 py-3 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-300 font-medium">
                                                {dayjs(trade.entryDate).add(12, 'hour').format('DD/MM/YYYY')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {trade.entryTime || '--:--'}
                                            </div>
                                        </td>

                                        {/* ATIVO */}
                                        <td className="px-3 py-3 text-center">
                                            <span className="font-bold text-gray-200 bg-gray-700/50 px-2 py-1 rounded">
                                                {trade.symbol}
                                            </span>
                                        </td>

                                        {/* TIPO */}
                                        <td className="px-3 py-3 text-center">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                trade.type === 'Long' 
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                                {trade.type.toUpperCase()}
                                            </span>
                                        </td>

                                        {/* P/L */}
                                        <td className="px-3 py-3 text-center font-mono font-medium">
                                            <span className={isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400'}>
                                                {formatCurrency(trade.pnl || 0, currency)}
                                            </span>
                                        </td>

                                        {/* PREÇOS */}
                                        <td className="px-3 py-3 text-center text-gray-400 text-xs">{trade.entryPrice.toFixed(2)}</td>
                                        <td className="px-3 py-3 text-center text-gray-400 text-xs">{trade.exitPrice ? trade.exitPrice.toFixed(2) : '-'}</td>
                                        <td className="px-3 py-3 text-center text-gray-300 text-xs">{trade.lot}</td>
                                        
                                        {/* R:R */}
                                        <td className="px-3 py-3 text-center text-xs font-mono text-gray-400">
                                            {riskReward !== 0 ? `${Math.abs(riskReward).toFixed(2)}R` : '-'}
                                        </td>

                                        {/* TAGS */}
                                        <td className="px-3 py-3 text-center">
                                            <div className="flex flex-wrap justify-center gap-1 max-w-[150px] mx-auto">
                                                {trade.strategy && (
                                                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                                                        {trade.strategy}
                                                    </span>
                                                )}
                                                {trade.setup && (
                                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                                                        {trade.setup}
                                                    </span>
                                                )}
                                                {trade.tags && trade.tags.split(',').map((tag, index) => (
                                                    <span key={index} className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                                        {tag.trim()}
                                                    </span>
                                                ))}
                                                {!trade.strategy && !trade.setup && !trade.tags && '-'}
                                            </div>
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-3 py-3 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                isPending 
                                                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
                                                    : 'bg-gray-700/50 text-gray-400 border-gray-600'
                                            }`}>
                                                {isPending ? 'ABERTO' : 'FECHADO'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700/50 bg-gray-800/50">
                        <div className="text-sm text-gray-400">
                            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredTrades.length)} de {filteredTrades.length} trades
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                            >
                                Anterior
                            </button>
                            <div className="flex items-center gap-1">
                                {getPageNumbers().map((page, index) => (
                                    <button
                                        key={index}
                                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                        disabled={typeof page !== 'number'}
                                        className={`w-8 h-8 flex items-center justify-center text-sm rounded transition-colors ${
                                            safePage === page
                                                ? 'bg-cyan-600 text-white font-medium'
                                                : typeof page === 'number' 
                                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                                    : 'text-gray-500 cursor-default'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}
            </div>

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

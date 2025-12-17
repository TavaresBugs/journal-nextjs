import { useState, useMemo, useEffect } from 'react';
import { Button, GlassCard, Input } from '@/components/ui';
import type { Trade } from '@/types';
import { formatCurrency } from '@/lib/calculations';
import { useJournalStore } from '@/store/useJournalStore';
import { JournalEntryModal } from '@/components/journal/JournalEntryModal';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
// Imports removed

dayjs.extend(utc);
dayjs.extend(timezone);

interface TradeListProps {
    trades: Trade[];
    currency: string;
    onEditTrade?: (trade: Trade) => void;
    onDeleteTrade?: (tradeId: string) => void;
    onViewDay?: (date: string) => void;
    // Server-side pagination props (optional)
    totalCount?: number;
    currentPage?: number;
    itemsPerPage?: number;
    onPageChange?: (page: number) => void;
    // External filter control
    filterAsset?: string;
    hideHeader?: boolean;
}

export function TradeList({ 
    trades, 
    currency, 
    onEditTrade, 
    onDeleteTrade,
    onViewDay,
    totalCount,
    currentPage: controlledPage,
    itemsPerPage = 10,
    onPageChange,
    filterAsset: externalFilterAsset,
    hideHeader = false
}: TradeListProps) {
    const [internalFilterAsset, setInternalFilterAsset] = useState<string>('TODOS OS ATIVOS');
    
    // Use external filter if provided, otherwise internal
    const filterAsset = externalFilterAsset !== undefined ? externalFilterAsset : internalFilterAsset;

    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    
    // Local Pagination State (fallback)
    const [localPage, setLocalPage] = useState(1);
    
    // Reset local pagination when filter changes (if controlled externally)
    useEffect(() => {
        if (externalFilterAsset !== undefined) {
            setLocalPage(1);
        }
    }, [externalFilterAsset]);
    
    // Determine mode
    const isServerSide = typeof totalCount === 'number' && typeof onPageChange === 'function';
    const currentPage = isServerSide ? (controlledPage || 1) : localPage;

    // Journal Modal State (Legacy - keeping mostly for safe removal or if needed later, but button now triggers viewDay)
    const [selectedTradeForJournal, setSelectedTradeForJournal] = useState<Trade | null>(null);
    const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
    const { entries } = useJournalStore(); 

    // Get unique assets for filter
    const uniqueAssets = useMemo(() => {
        return Array.from(new Set(trades.map(t => t.symbol))).sort();
    }, [trades]);
    
    // ... filtering logic omitted for brevity as it's unchanged ...
    
    const filteredTrades = useMemo(() => {
        return filterAsset === 'TODOS OS ATIVOS' 
            ? trades 
            : trades.filter(t => t.symbol === filterAsset);
    }, [trades, filterAsset]);

    // Sort trades by date AND time
    const sortedTrades = useMemo(() => {
        return [...filteredTrades].sort((a, b) => {
            const dateTimeA = new Date(`${a.entryDate}T${a.entryTime || '00:00:00'}`).getTime();
            const dateTimeB = new Date(`${b.entryDate}T${b.entryTime || '00:00:00'}`).getTime();
            return sortDirection === 'desc' ? dateTimeB - dateTimeA : dateTimeA - dateTimeB;
        });
    }, [filteredTrades, sortDirection]);

    const count = isServerSide ? (totalCount || 0) : filteredTrades.length;
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
    
    const handlePageChange = (p: number) => {
        if (isServerSide && onPageChange) {
            onPageChange(p);
        } else {
            setLocalPage(p);
        }
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

    const getJournalEntry = (tradeId: string) => {
        return entries.find(e => e.tradeIds?.includes(tradeId));
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
                        {uniqueAssets.map(asset => (
                            <option key={asset} value={asset} />
                        ))}
                    </datalist>
                </div>
            )}

            {/* Tabela */}
            <GlassCard className="p-0 overflow-hidden bg-zorin-bg/30 border-white/5">
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
                        <tbody className="divide-y divide-white/5">
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
                                                variant="zorin-success"
                                                size="icon"
                                                onClick={() => onViewDay?.(trade.entryDate)}
                                                className="w-8 h-8 mx-auto"
                                                title="Ver Detalhes do Dia"
                                            >
                                                {journalEntry ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 4.5v15m7.5-7.5h-15" />
                                                    </svg>
                                                )}
                                            </Button>
                                        </td>

                                        {/* AÇÕES */}
                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button 
                                                    variant="zorin-warning"
                                                    size="icon"
                                                    onClick={() => onEditTrade?.(trade)}
                                                    className="w-8 h-8"
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </Button>
                                                <Button 
                                                    variant="zorin-danger"
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
                                            {(() => {
                                                // Data já está armazenada como NY time
                                                // Não precisa de conversão - apenas formatar
                                                const dateStr = trade.entryDate;
                                                const timeStr = trade.entryTime || '00:00:00';
                                                
                                                // Parse date parts directly for display
                                                const [year, month, day] = dateStr.split('-');
                                                const displayDate = `${day}/${month}/${year}`;
                                                
                                                return (
                                                    <>
                                                        <div className="text-sm text-gray-300 font-medium">
                                                            {displayDate}
                                                        </div>
                                                        <div className="text-[10px] text-cyan-500/80 font-mono">
                                                            {timeStr} NY
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </td>

                                        {/* ATIVO */}
                                        <td className="px-3 py-3 text-center">
                                            <span className="font-bold text-gray-200 bg-zorin-surface px-2 py-1 rounded">
                                                {trade.symbol}
                                            </span>
                                        </td>

                                        {/* TIPO */}
                                        <td className="px-3 py-3 text-center">
                                            <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${
                                                trade.type === 'Long' 
                                                    ? 'bg-zorin-accent/20 text-zorin-accent border border-zorin-accent/30' 
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            }`}>
                                                <span>{trade.type}</span>
                                                {trade.type === 'Long' ? (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                                        <polyline points="17 6 23 6 23 12"></polyline>
                                                    </svg>
                                                ) : (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                                        <polyline points="17 18 23 18 23 12"></polyline>
                                                    </svg>
                                                )}
                                            </div>
                                        </td>

                                        {/* P/L */}
                                        <td className="px-3 py-3 text-center font-mono font-medium">
                                            <span className={isProfit ? 'text-zorin-accent' : isLoss ? 'text-red-400' : 'text-gray-400'}>
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
                                            <div className="flex flex-wrap justify-center gap-1 max-w-[180px] mx-auto">
                                                {trade.tags && trade.tags.split(',').map((tag, index) => {
                                                    const colors = [
                                                        { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
                                                        { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
                                                        { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
                                                        { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
                                                        { bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30' },
                                                        { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30' },
                                                    ];
                                                    const color = colors[index % colors.length];
                                                    return (
                                                        <span key={index} className={`text-[10px] ${color.bg} ${color.text} px-1.5 py-0.5 rounded border ${color.border}`}>
                                                            🏷️ {tag.trim()}
                                                        </span>
                                                    );
                                                })}
                                                {!trade.tags && (
                                                    <span className="text-gray-500 text-sm">—</span>
                                                )}
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
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-zorin-surface/30">
                        <div className="text-sm text-gray-400">
                            {isServerSide ? (
                                // For server side, calculation is slightly different as we don't have all items
                                <>Página {currentPage} de {totalPages}</>
                            ) : (
                                <>Mostrando {(localPage - 1) * itemsPerPage + 1} a {Math.min(localPage * itemsPerPage, filteredTrades.length)} de {filteredTrades.length} trades</>
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
                                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                                        disabled={typeof page !== 'number'}
                                        className={`w-8 h-8 p-0 flex items-center justify-center font-bold ${
                                            typeof page !== 'number' ? 'cursor-default opacity-50' : ''
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

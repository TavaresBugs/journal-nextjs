'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { Input, Button } from '@/components/ui';
import type { Trade } from '@/types';
import { DEFAULT_ASSETS } from '@/types';
import { calculateTradePnL, determineTradeOutcome } from '@/lib/calculations';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePlaybookStore } from '@/store/usePlaybookStore';
import { useToast } from '@/contexts/ToastContext';

interface TradeFormProps {
    accountId: string;
    onSubmit: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel?: () => void;
    initialData?: Partial<Trade>;
    mode?: 'create' | 'edit';
}

export function TradeForm({ accountId, onSubmit, onCancel, initialData, mode = 'create' }: TradeFormProps) {
    // Get settings from store
    const { assets, strategies, setups } = useSettingsStore();
    const { playbooks } = usePlaybookStore();
    const { showToast } = useToast();
    
    const [symbol, setSymbol] = useState(initialData?.symbol || '');
    const [type, setType] = useState<'Long' | 'Short' | ''>(initialData?.type || '');
    const [entryPrice, setEntryPrice] = useState(initialData?.entryPrice?.toString() || '');
    const [stopLoss, setStopLoss] = useState(initialData?.stopLoss?.toString() || '');
    const [takeProfit, setTakeProfit] = useState(initialData?.takeProfit?.toString() || '');
    const [exitPrice, setExitPrice] = useState(initialData?.exitPrice?.toString() || '');
    const [lot, setLot] = useState(initialData?.lot?.toString() || '');
    const [entryDate, setEntryDate] = useState(initialData?.entryDate || dayjs().format('YYYY-MM-DD'));
    const [entryTime, setEntryTime] = useState(initialData?.entryTime || '');
    const [exitDate, setExitDate] = useState(initialData?.exitDate || '');
    const [exitTime, setExitTime] = useState(initialData?.exitTime || '');
    const [tfAnalise, setTfAnalise] = useState(initialData?.tfAnalise || '');
    const [tfEntrada, setTfEntrada] = useState(initialData?.tfEntrada || '');
    // Tags state
    const [tagsList, setTagsList] = useState<string[]>(initialData?.tags ? initialData.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    const [tagInput, setTagInput] = useState('');
    
    const [strategy, setStrategy] = useState(initialData?.strategy || '');
    const [setup, setSetup] = useState(initialData?.setup || '');
    const [notes, setNotes] = useState(initialData?.notes || '');

    const isTradeOpen = !exitPrice || exitPrice === '';
    
    // Calculate estimates
    const calculateEstimates = () => {
        if (!entryPrice || !lot || !stopLoss || !takeProfit) {
            return { risk: 0, reward: 0 };
        }
        
        const entry = parseFloat(entryPrice);
        const sl = parseFloat(stopLoss);
        const tp = parseFloat(takeProfit);
        const lotSize = parseFloat(lot);
        
        // Find asset in store or default to 1
        const asset = assets.find(a => a.symbol === symbol.toUpperCase());
        const assetMultiplier = asset ? asset.multiplier : 1;
        
        const risk = Math.abs((entry - sl) * lotSize * assetMultiplier);
        const reward = Math.abs((tp - entry) * lotSize * assetMultiplier);
        
        return { risk, reward };
    };
    
    const estimates = calculateEstimates();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate type is not empty
        if (!type || (type !== 'Long' && type !== 'Short')) {
            showToast('Por favor, selecione a direção (Long ou Short)', 'error');
            return;
        }

        // Find asset in store or default to 1
        const asset = assets.find(a => a.symbol === symbol.toUpperCase());
        const assetMultiplier = asset ? asset.multiplier : 1;
        
        const tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> = {
            userId: '', // Will be set by storage
            accountId,
            symbol: symbol.toUpperCase(),
            type: type as 'Long' | 'Short',
            entryPrice: parseFloat(entryPrice),
            stopLoss: stopLoss ? parseFloat(stopLoss) : 0,
            takeProfit: takeProfit ? parseFloat(takeProfit) : 0,
            exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
            lot: parseFloat(lot),
            entryDate,
            entryTime: entryTime || undefined,
            exitDate: exitDate || undefined,
            exitTime: exitTime || undefined,
            tfAnalise: tfAnalise || undefined,
            tfEntrada: tfEntrada || undefined,
            tags: tagsList.length > 0 ? tagsList.join(', ') : undefined,
            strategy: strategy || undefined,
            setup: setup || undefined,
            notes: notes || undefined,
            pnl: undefined,
            outcome: 'pending',
        };

        // Calculate P&L if exit price is provided
        if (exitPrice) {
            const pnl = calculateTradePnL({ ...tradeData, exitPrice: parseFloat(exitPrice) } as Trade, assetMultiplier);
            tradeData.pnl = pnl;
            tradeData.outcome = determineTradeOutcome({ ...tradeData, pnl } as Trade);
        }

        onSubmit(tradeData);
        showToast('Seu trade foi adicionado com sucesso!', 'success');

        // Reset form
        setSymbol('');
        setType('');
        setEntryPrice('');
        setStopLoss('');
        setTakeProfit('');
        setExitPrice('');
        setLot('');
        setEntryDate(dayjs().format('YYYY-MM-DD'));
        setEntryTime('');
        setExitDate('');
        setExitTime('');
        setTfAnalise('');
        setTfEntrada('');
        setTagsList([]);
        setTagInput('');
        setStrategy('');
        setSetup('');
        setNotes('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Toggle: Em Aberto / Concluído - Only show in create mode */}
            {mode === 'create' && (
                <div className="flex gap-3 justify-center">
                    <button
                        type="button"
                        onClick={() => setExitPrice('')}
                        className={`
                            flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200
                            ${isTradeOpen
                                ? 'bg-linear-to-r from-yellow-600 to-yellow-500 text-white shadow-lg shadow-yellow-500/30'
                                : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
                            }
                        `}
                    >
                        🟡 Em Aberto
                    </button>
                    <button
                        type="button"
                        onClick={() => setExitPrice(entryPrice || '0')}
                        className={`
                            flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200
                            ${!isTradeOpen
                                ? 'bg-linear-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30'
                                : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
                            }
                        `}
                    >
                        🟢 Finalizado
                    </button>
                </div>
            )}

            {/* Grid: Layout único */}
            <div className="space-y-4">
                {/* Ativo, Lote e Direção - Primeira linha com 3 campos */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Ativo
                        </label>
                        <input
                            list="assets-list"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            placeholder="EX: EURUSD"
                            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 uppercase [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            required
                        />
                        <datalist id="assets-list">
                            {assets.map((asset) => (
                                <option key={asset.symbol} value={asset.symbol} />
                            ))}
                        </datalist>
                    </div>
                    
                    <Input
                        label="Lote"
                        type="number"
                        step="0.01"
                        value={lot}
                        onChange={(e) => setLot(e.target.value)}
                        placeholder="1.0"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Direção
                        </label>
                        <input
                            list="direction-list"
                            value={type}
                            onChange={(e) => setType(e.target.value as 'Long' | 'Short')}
                            placeholder="Long Ou Short"
                            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        />
                        <datalist id="direction-list">
                            <option value="Long" />
                            <option value="Short" />
                        </datalist>
                    </div>
                </div>

                {/* 3 campos: Preço Entrada, Stop Loss, Take Profit */}
                <div className="grid grid-cols-3 gap-4">
                    <Input
                        label="Preço Entrada"
                        type="number"
                        step="0.00001"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        required
                    />
                    <Input
                        label="Stop Loss"
                        type="number"
                        step="0.00001"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                    />
                    <Input
                        label="Take Profit"
                        type="number"
                        step="0.00001"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value)}
                    />
                </div>


                {/* Estimativas (full width on mobile, half on desktop) + Timeframes (stacked on mobile, side-by-side on desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Estimativas - Layout Horizontal (lado a lado) */}
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Estimativas</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-900/50 rounded-lg p-3 border border-red-900/30">
                                <div className="text-xs text-gray-500 mb-1">Risco Estimado</div>
                                <div className="text-lg font-bold text-red-400">
                                    $ {estimates.risk.toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 border border-green-900/30">
                                <div className="text-xs text-gray-500 mb-1">Retorno Estimado</div>
                                <div className="text-lg font-bold text-green-400">
                                    $ {estimates.reward.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeframes na direita (desktop) ou abaixo (mobile) */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Timeframe Análise (HTF)
                            </label>
                            <input
                                list="htf-list"
                                value={tfAnalise}
                                onChange={(e) => setTfAnalise(e.target.value)}
                                placeholder="EX: 4H"
                                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            />
                            <datalist id="htf-list">
                                <option value="Mensal" />
                                <option value="Semanal" />
                                <option value="Diário" />
                                <option value="H4" />
                                <option value="H1" />
                                <option value="M15" />
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Timeframe Entrada (LTF)
                            </label>
                            <input
                                list="ltf-list"
                                value={tfEntrada}
                                onChange={(e) => setTfEntrada(e.target.value)}
                                placeholder="EX: 5M"
                                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                            />
                            <datalist id="ltf-list">
                                <option value="H1" />
                                <option value="M15" />
                                <option value="M5" />
                                <option value="M3" />
                                <option value="M1" />
                            </datalist>
                        </div>
                    </div>
                </div>

                {/* Estratégia e Setup */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Estratégia
                        </label>
                        <div className="relative">
                            <input
                                list="strategies-list"
                                value={strategy}
                                onChange={(e) => setStrategy(e.target.value)}
                                placeholder="Selecione ou digite..."
                                className={`w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 ${
                                    playbooks.find(p => p.name === strategy) ? 'pl-10' : ''
                                }`}
                            />
                            {playbooks.find(p => p.name === strategy) && (
                                <div 
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-lg"
                                    style={{ color: playbooks.find(p => p.name === strategy)?.color }}
                                >
                                    {playbooks.find(p => p.name === strategy)?.icon}
                                </div>
                            )}
                        </div>
                        <datalist id="strategies-list">
                            {/* Combine Playbooks and Settings Strategies */}
                            {Array.from(new Set([
                                ...playbooks.map(p => p.name),
                                ...strategies
                            ])).sort().map((strat) => (
                                <option key={strat} value={strat} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tipo de Entrada (Setup)
                        </label>
                        <input
                            list="setups-list"
                            value={setup}
                            onChange={(e) => setSetup(e.target.value)}
                            placeholder="Selecione ou digite..."
                            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                        />
                        <datalist id="setups-list">
                            {setups.map((s) => (
                                <option key={s} value={s} />
                            ))}
                        </datalist>
                    </div>
                </div>

                {/* Tags - Custom Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tags (PDArrays, Contexto)
                    </label>
                    <div 
                        className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent transition-all duration-200 flex flex-wrap gap-2 items-center min-h-[46px]"
                        onClick={() => document.getElementById('tags-input')?.focus()}
                    >
                        {tagsList.map((tag, index) => (
                            <span 
                                key={index} 
                                className={`
                                    px-2 py-1 rounded text-xs font-medium border flex items-center gap-1
                                    ${index % 2 === 0 
                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                    }
                                `}
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTagsList(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    className="hover:text-white transition-colors"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                        <input
                            id="tags-input"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault();
                                    const newTag = tagInput.trim();
                                    if (newTag && !tagsList.includes(newTag)) {
                                        setTagsList(prev => [...prev, newTag]);
                                        setTagInput('');
                                    }
                                } else if (e.key === 'Backspace' && !tagInput && tagsList.length > 0) {
                                    setTagsList(prev => prev.slice(0, -1));
                                }
                            }}
                            placeholder={tagsList.length === 0 ? "#FVG #BPR #OB #Liquidez" : ""}
                            className="bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 flex-1 min-w-[120px] text-sm"
                        />
                    </div>
                </div>

                {/* Data e Hora Entrada - Responsive: stacks on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Data Entrada"
                        type="date"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        required
                    />
                    <Input
                        label="Hora Entrada"
                        type="time"
                        value={entryTime}
                        onChange={(e) => setEntryTime(e.target.value)}
                    />
                </div>

                {/* Resultado do Trade - Always show in edit mode, or when trade is closed in create mode */}
                {(mode === 'edit' || !isTradeOpen) && (
                    <>
                        <div className="border-t border-gray-700 my-4"></div>
                        <h3 className="text-sm font-medium text-gray-400 mb-3">
                            {isTradeOpen ? 'Finalizar Trade (Opcional)' : 'Resultado do Trade'}
                        </h3>
                        
                        <Input
                            label="Preço Saída"
                            type="number"
                            step="0.00001"
                            value={exitPrice}
                            onChange={(e) => setExitPrice(e.target.value)}
                            placeholder={isTradeOpen ? "Deixe vazio se ainda em aberto" : ""}
                        />

                        {/* Indicador de Resultado */}
                        {(() => {
                            if (!exitPrice || !entryPrice || !lot) {
                                // Sem dados suficientes
                                return (
                                    <div className="rounded-xl p-6 text-center font-bold text-2xl bg-gray-800/50 border-2 border-gray-600 text-gray-400">
                                        {isTradeOpen ? 'Trade em Aberto' : 'Resultado'}
                                    </div>
                                );
                            }

                            const entry = parseFloat(entryPrice);
                            const exit = parseFloat(exitPrice);
                            const lotSize = parseFloat(lot);
                            const assetMultiplier = DEFAULT_ASSETS[symbol.toUpperCase()] || 1;

                            // Calcular P&L real
                            let pnl = 0;
                            if (type === 'Long') {
                                pnl = (exit - entry) * lotSize * assetMultiplier;
                            } else {
                                pnl = (entry - exit) * lotSize * assetMultiplier;
                            }

                            // Determinar resultado
                            if (pnl > 0) {
                                // WIN
                                return (
                                    <div className="rounded-xl p-6 text-center font-bold text-2xl bg-green-900/30 border-2 border-green-500 text-green-400">
                                        WIN
                                    </div>
                                );
                            } else if (pnl < 0) {
                                // LOSS
                                return (
                                    <div className="rounded-xl p-6 text-center font-bold text-2xl bg-red-900/30 border-2 border-red-500 text-red-400">
                                        LOSS
                                    </div>
                                );
                            } else {
                                // Break Even
                                return (
                                    <div className="rounded-xl p-6 text-center font-bold text-2xl bg-yellow-900/30 border-2 border-yellow-500 text-yellow-400">
                                        BE
                                    </div>
                                );
                            }
                        })()}

                        {/* Data e Hora Saída - Responsive */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                                label="Data Saída"
                                type="date"
                                value={exitDate}
                                onChange={(e) => setExitDate(e.target.value)}
                                placeholder={isTradeOpen ? "Opcional" : ""}
                            />
                            <Input
                                label="Hora Saída"
                                type="time"
                                value={exitTime}
                                onChange={(e) => setExitTime(e.target.value)}
                                placeholder={isTradeOpen ? "Opcional" : ""}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
                {mode === 'edit' && onCancel && (
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="gradient-danger"
                        className="flex-1 font-extrabold"
                    >
                        Cancelar
                    </Button>
                )}
                
                <button
                    type="submit"
                    className={`
                        ${mode === 'edit' ? 'flex-1' : 'w-full'} 
                        py-3 px-4 
                        ${mode === 'edit' 
                            ? 'bg-green-600 hover:bg-green-500 text-white' 
                            : 'bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/30'
                        } 
                        font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                    `}
                >
                    {mode === 'edit' ? (
                        'Salvar Alterações'
                    ) : (
                        <>
                            <span>Registrar</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

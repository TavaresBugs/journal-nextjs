'use client';

import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Input, Button } from '@/components/ui';
import { DatePickerInput, TimePickerInput } from '@/components/ui/DateTimePicker';
import type { Trade } from '@/types';
import { DEFAULT_ASSETS } from '@/types';
import { calculateTradePnL, determineTradeOutcome } from '@/lib/calculations';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePlaybookStore } from '@/store/usePlaybookStore';
import { useToast } from '@/contexts/ToastContext';
import { 
    detectSession, 
    validateAlignment, 
    calculateRMultiple,
    getSessionEmoji,
    formatRMultiple,
    getRMultipleColor
} from '@/lib/timeframeUtils';

interface TradeFormProps {
    accountId: string;
    onSubmit: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onCancel?: () => void;
    initialData?: Partial<Trade>;
    mode?: 'create' | 'edit';
}

import { toZonedTime, fromZonedTime, format as formatTz } from 'date-fns-tz';

const getNYDateTime = (dateStr?: string, timeStr?: string) => {
    // Dados já estão armazenados como NY time, apenas retornar diretamente
    if (!dateStr) {
        // Para novos trades, usar horário NY atual
        const now = new Date();
        const nyNow = toZonedTime(now, 'America/New_York');
        return { 
            date: formatTz(nyNow, 'yyyy-MM-dd', { timeZone: 'America/New_York' }), 
            time: formatTz(nyNow, 'HH:mm', { timeZone: 'America/New_York' }) 
        };
    }
    // Para trades existentes, retornar valores armazenados (já são NY)
    return {
        date: dateStr,
        time: timeStr ? timeStr.substring(0, 5) : '' // Remove seconds if present
    };
};

const getUTCDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr) return { date: undefined, time: undefined };
    const dateTimeStr = `${dateStr} ${timeStr || '00:00'}`;
    const nyDate = fromZonedTime(dateTimeStr, 'America/New_York');
    return {
        date: nyDate.toISOString(),
        time: timeStr ? nyDate.toISOString().split('T')[1].substring(0, 5) : undefined
    };
};

const MARKET_CONDITIONS = [
    'Tendência Alta',
    'Tendência Baixa', 
    'Lateralidade',
    'Rompimento',
    'Consolidação',
    'Alta Volatilidade'
];

// Section Header Component
const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700/50">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{title}</h3>
    </div>
);

export function TradeForm({ accountId, onSubmit, onCancel, initialData, mode = 'create' }: TradeFormProps) {
    const { assets, strategies, setups } = useSettingsStore();
    const { playbooks } = usePlaybookStore();
    const { showToast } = useToast();
    
    const nyEntry = getNYDateTime(initialData?.entryDate, initialData?.entryTime);
    const nyExit = getNYDateTime(initialData?.exitDate, initialData?.exitTime);

    // Market Conditions
    const [marketCondition, setMarketCondition] = useState(initialData?.marketCondition || '');
    const [tfAnalise, setTfAnalise] = useState(initialData?.tfAnalise || '');
    const [tfEntrada, setTfEntrada] = useState(initialData?.tfEntrada || '');
    const [tagsList, setTagsList] = useState<string[]>(initialData?.tags ? initialData.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    const [tagInput, setTagInput] = useState('');
    const [strategy, setStrategy] = useState(initialData?.strategy || '');
    const [setup, setSetup] = useState(initialData?.setup || '');

    // Financial
    const [symbol, setSymbol] = useState(initialData?.symbol || '');
    const [type, setType] = useState<'Long' | 'Short' | ''>(initialData?.type || '');
    const [entryPrice, setEntryPrice] = useState(initialData?.entryPrice?.toString() || '');
    const [stopLoss, setStopLoss] = useState(initialData?.stopLoss?.toString() || '');
    const [takeProfit, setTakeProfit] = useState(initialData?.takeProfit?.toString() || '');
    const [exitPrice, setExitPrice] = useState(initialData?.exitPrice?.toString() || '');
    const [lot, setLot] = useState(initialData?.lot?.toString() || '');
    const [commission, setCommission] = useState(initialData?.commission ? Math.abs(initialData.commission).toString() : '');
    const [swap, setSwap] = useState(initialData?.swap?.toString() || '');
    
    // DateTime
    const [entryDate, setEntryDate] = useState(nyEntry.date);
    const [entryTime, setEntryTime] = useState(nyEntry.time);
    const [exitDate, setExitDate] = useState(nyExit.date);
    const [exitTime, setExitTime] = useState(nyExit.time);

    const isTradeOpen = !exitPrice || exitPrice === '';

    // Telemetry
    const detectedSession = useMemo(() => {
        if (entryDate && entryTime) {
            return detectSession(entryDate, entryTime, -3);
        }
        return 'Off-Hours' as const;
    }, [entryDate, entryTime]);

    const alignmentResult = useMemo(() => {
        return validateAlignment(tfAnalise, tfEntrada);
    }, [tfAnalise, tfEntrada]);

    const rMultiplePreview = useMemo(() => {
        if (!entryPrice || !exitPrice || !stopLoss || !type) return null;
        return calculateRMultiple(
            parseFloat(entryPrice),
            parseFloat(exitPrice),
            parseFloat(stopLoss),
            type as 'Long' | 'Short'
        );
    }, [entryPrice, exitPrice, stopLoss, type]);
    
    const calculateEstimates = () => {
        if (!entryPrice || !lot || !stopLoss || !takeProfit) {
            return { risk: 0, reward: 0 };
        }
        const entry = parseFloat(entryPrice);
        const sl = parseFloat(stopLoss);
        const tp = parseFloat(takeProfit);
        const lotSize = parseFloat(lot);
        const asset = assets.find(a => a.symbol === symbol.toUpperCase());
        const assetMultiplier = asset ? asset.multiplier : 1;
        const risk = Math.abs((entry - sl) * lotSize * assetMultiplier);
        const reward = Math.abs((tp - entry) * lotSize * assetMultiplier);
        return { risk, reward };
    };
    
    const estimates = calculateEstimates();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!type || (type !== 'Long' && type !== 'Short')) {
            showToast('Por favor, selecione a direção (Long ou Short)', 'error');
            return;
        }

        const asset = assets.find(a => a.symbol === symbol.toUpperCase());
        const assetMultiplier = asset ? asset.multiplier : 1;
        
        const utcEntry = getUTCDateTime(entryDate, entryTime);
        const utcExit = getUTCDateTime(exitDate, exitTime);

        const tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> = {
            userId: '',
            accountId,
            symbol: symbol.toUpperCase(),
            type: type as 'Long' | 'Short',
            entryPrice: parseFloat(entryPrice),
            stopLoss: stopLoss ? parseFloat(stopLoss) : 0,
            takeProfit: takeProfit ? parseFloat(takeProfit) : 0,
            exitPrice: exitPrice ? parseFloat(exitPrice) : undefined,
            lot: parseFloat(lot),
            commission: commission ? -Math.abs(parseFloat(commission)) : 0, 
            swap: swap ? parseFloat(swap) : 0,
            entryDate: utcEntry.date || entryDate,
            entryTime: utcEntry.time,
            exitDate: utcExit.date,
            exitTime: utcExit.time,
            tfAnalise: tfAnalise || undefined,
            tfEntrada: tfEntrada || undefined,
            tags: tagsList.length > 0 ? tagsList.join(', ') : undefined,
            strategy: strategy || undefined,
            setup: setup || undefined,
            marketCondition: marketCondition as Trade['marketCondition'] || undefined,
            session: entryTime ? detectedSession : undefined,
            htfAligned: (tfAnalise && tfEntrada) ? alignmentResult.valid : undefined,
            rMultiple: undefined,
            pnl: undefined,
            outcome: 'pending',
        };

        if (exitPrice) {
            const tempTrade = { ...tradeData, exitPrice: parseFloat(exitPrice) } as Trade;
            const pnl = calculateTradePnL(tempTrade, assetMultiplier);
            tradeData.pnl = pnl;
            tradeData.outcome = determineTradeOutcome({ ...tempTrade, pnl } as Trade);
            
            const rMult = calculateRMultiple(
                parseFloat(entryPrice),
                parseFloat(exitPrice),
                parseFloat(stopLoss),
                type as 'Long' | 'Short'
            );
            tradeData.rMultiple = rMult ?? undefined;
        }

        onSubmit(tradeData);
        showToast('Seu trade foi adicionado com sucesso!', 'success');

        // Reset form
        setMarketCondition('');
        setSymbol('');
        setType('');
        setEntryPrice('');
        setStopLoss('');
        setTakeProfit('');
        setExitPrice('');
        setLot('');
        setCommission('');
        setSwap('');
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
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Toggle: Em Aberto / Finalizado */}
            {mode === 'create' && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setExitPrice('')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                            isTradeOpen
                                ? 'bg-yellow-500/20 text-yellow-300 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                                : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
                        }`}
                    >
                        🟡 Em Aberto
                    </button>
                    <button
                        type="button"
                        onClick={() => setExitPrice(entryPrice || '0')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                            !isTradeOpen
                                ? 'bg-green-500/20 text-green-300 border-2 border-green-500/50 shadow-lg shadow-green-500/20'
                                : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
                        }`}
                    >
                        🟢 Finalizado
                    </button>
                </div>
            )}

            {/* ===== BLOCO 1: CONDIÇÕES DE MERCADO ===== */}
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                <SectionHeader icon="📊" title="Condições de Mercado" />
                
                <div className="space-y-3">
                    {/* Market Condition + Strategy */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Condição</label>
                            <input
                                list="market-conditions-list"
                                value={marketCondition}
                                onChange={(e) => setMarketCondition(e.target.value)}
                                placeholder="Tendência, Lateral..."
                                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            <datalist id="market-conditions-list">
                                {MARKET_CONDITIONS.map((cond) => (
                                    <option key={cond} value={cond} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Estratégia</label>
                            <div className="relative">
                                <input
                                    list="strategies-list"
                                    value={strategy}
                                    onChange={(e) => setStrategy(e.target.value)}
                                    placeholder="MMBM, AMD..."
                                    className={`w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                        playbooks.find(p => p.name === strategy) ? 'pl-8' : ''
                                    }`}
                                />
                                {playbooks.find(p => p.name === strategy) && (
                                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: playbooks.find(p => p.name === strategy)?.color }}>
                                        {playbooks.find(p => p.name === strategy)?.icon}
                                    </div>
                                )}
                            </div>
                            <datalist id="strategies-list">
                                {Array.from(new Set([...playbooks.map(p => p.name), ...strategies])).sort().map((strat) => (
                                    <option key={strat} value={strat} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    {/* Timeframes + Setup */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">TF Análise</label>
                            <input
                                list="htf-list"
                                value={tfAnalise}
                                onChange={(e) => setTfAnalise(e.target.value)}
                                placeholder="H4"
                                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <datalist id="htf-list">
                                <option value="Monthly" /><option value="Weekly" /><option value="Daily" /><option value="H4" /><option value="H1" />
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">TF Entrada</label>
                            <input
                                list="ltf-list"
                                value={tfEntrada}
                                onChange={(e) => setTfEntrada(e.target.value)}
                                placeholder="M5"
                                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <datalist id="ltf-list">
                                <option value="H1" /><option value="M15" /><option value="M5" /><option value="M3" /><option value="M1" />
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Setup</label>
                            <input
                                list="setups-list"
                                value={setup}
                                onChange={(e) => setSetup(e.target.value)}
                                placeholder="ST+RE"
                                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <datalist id="setups-list">
                                {setups.map((s) => (<option key={s} value={s} />))}
                            </datalist>
                        </div>
                    </div>

                    {/* Alignment Badge */}
                    {tfAnalise && tfEntrada && (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${
                            alignmentResult.valid
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                            {alignmentResult.valid ? '✓ HTF Aligned' : `⚠ Máx: ${alignmentResult.recommendedEntryTF}`}
                        </div>
                    )}

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Tags</label>
                        <div 
                            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-cyan-500 flex flex-wrap gap-1.5 items-center min-h-[38px]"
                            onClick={() => document.getElementById('tags-input')?.focus()}
                        >
                            {tagsList.map((tag, index) => (
                                <span key={index} className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                    {tag}
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setTagsList(prev => prev.filter((_, i) => i !== index)); }} className="hover:text-white">×</button>
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
                                placeholder={tagsList.length === 0 ? "#FVG #Breaker #OB" : ""}
                                className="bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 flex-1 min-w-[60px] text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== BLOCO 2: FINANCEIRO ===== */}
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                <SectionHeader icon="💰" title="Dados Financeiros" />
                
                <div className="space-y-3">
                    {/* Ativo, Lote, Direção */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Ativo</label>
                            <input
                                list="assets-list"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                placeholder="EURUSD"
                                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 text-sm uppercase placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                required
                            />
                            <datalist id="assets-list">
                                {assets.map((asset) => (<option key={asset.symbol} value={asset.symbol} />))}
                            </datalist>
                        </div>
                        <Input label="Lote" type="number" step="0.01" value={lot} onChange={(e) => setLot(e.target.value)} placeholder="1.0" required />
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">Direção</label>
                            <input
                                list="direction-list"
                                value={type}
                                onChange={(e) => setType(e.target.value as 'Long' | 'Short')}
                                placeholder="Long/Short"
                                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            <datalist id="direction-list">
                                <option value="Long" /><option value="Short" />
                            </datalist>
                        </div>
                    </div>

                    {/* Entry, SL, TP */}
                    <div className="grid grid-cols-3 gap-3">
                        <Input label="Preço Entrada" type="number" step="0.00001" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} required />
                        <Input label="Stop Loss" type="number" step="0.00001" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
                        <Input label="Take Profit" type="number" step="0.00001" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
                    </div>

                    {/* Exit Price (only if finalized) */}
                    {!isTradeOpen && (
                        <Input label="Preço Saída" type="number" step="0.00001" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
                    )}

                    {/* Costs (always visible) */}
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Corretagem ($)" type="number" step="0.01" min="0" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="0.00" />
                        <Input label="Swap ($)" type="number" step="0.01" value={swap} onChange={(e) => setSwap(e.target.value)} placeholder="-1.50" />
                    </div>

                    {/* Estimates */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="bg-gray-900/50 rounded-lg p-2.5 text-center border border-red-900/30">
                            <div className="text-xs text-gray-500">Risco</div>
                            <div className="text-base font-bold text-red-400">$ {estimates.risk.toFixed(2)}</div>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-2.5 text-center border border-green-900/30">
                            <div className="text-xs text-gray-500">Retorno</div>
                            <div className="text-base font-bold text-green-400">$ {estimates.reward.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Result (only if finalized) */}
                    {!isTradeOpen && exitPrice && entryPrice && (
                        <div className="pt-2">
                            {(() => {
                                const entry = parseFloat(entryPrice);
                                const exit = parseFloat(exitPrice);
                                const lotSize = parseFloat(lot) || 1;
                                const assetMultiplier = DEFAULT_ASSETS[symbol.toUpperCase()] || 1;
                                let pnl = type === 'Long' ? (exit - entry) * lotSize * assetMultiplier : (entry - exit) * lotSize * assetMultiplier;
                                pnl += (commission ? -Math.abs(parseFloat(commission)) : 0) + (swap ? parseFloat(swap) : 0);
                                
                                return (
                                    <div className="flex items-center justify-between">
                                        <div className={`flex-1 text-center py-2 rounded-lg font-bold text-lg ${
                                            pnl > 0 ? 'bg-green-900/30 text-green-400 border border-green-500/30' : 
                                            pnl < 0 ? 'bg-red-900/30 text-red-400 border border-red-500/30' : 
                                            'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
                                        }`}>
                                            {pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BE'}
                                        </div>
                                        {rMultiplePreview !== null && (
                                            <div className={`ml-3 px-3 py-2 rounded-lg font-bold ${getRMultipleColor(rMultiplePreview)} bg-gray-900/50 border border-gray-700`}>
                                                {formatRMultiple(rMultiplePreview)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>

            {/* ===== BLOCO 3: DATA E HORA ===== */}
            <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                <SectionHeader icon="📅" title="Data e Hora" />
                
                <div className="space-y-3">
                    {/* Entry DateTime */}
                    <div className="grid grid-cols-2 gap-3">
                        <DatePickerInput label="Data Entrada" value={entryDate} onChange={setEntryDate} required />
                        <TimePickerInput label="Hora Entrada" value={entryTime} onChange={setEntryTime} />
                    </div>

                    {/* Session Badge */}
                    {entryTime && (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${
                            detectedSession === 'London-NY Overlap' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : detectedSession === 'New York' || detectedSession === 'London' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                        }`}>
                            {getSessionEmoji(detectedSession)} {detectedSession}
                        </div>
                    )}

                    {/* Exit DateTime (only if finalized) */}
                    {!isTradeOpen && (
                        <div className="grid grid-cols-2 gap-3">
                            <DatePickerInput label="Data Saída" value={exitDate} onChange={setExitDate} />
                            <TimePickerInput label="Hora Saída" value={exitTime} onChange={setExitTime} />
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
                {mode === 'edit' && onCancel && (
                    <Button type="button" onClick={onCancel} variant="gradient-danger" className="flex-1">
                        Cancelar
                    </Button>
                )}
                <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-green-500/30"
                >
                    {mode === 'edit' ? 'Salvar' : 'Registrar Trade'}
                </button>
            </div>
        </form>
    );
}

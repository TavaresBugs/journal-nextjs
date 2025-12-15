'use client';

import { Input, Button, FormSection, FormRow, FormGroup } from '@/components/ui';
import { DatePickerInput, TimePickerInput } from '@/components/ui/DateTimePicker';
import type { Trade } from '@/types';
import { DEFAULT_ASSETS } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePlaybookStore } from '@/store/usePlaybookStore';
import { useToast } from '@/providers/ToastProvider';
import { 
    getSessionEmoji,
    formatRMultiple,
    getRMultipleColor
} from '@/lib/timeframeUtils';

// Import hooks
import { 
    useTradeForm,
    useTradeSubmit,
    useTradeValidation,
    type TradeValidationInput,
} from './hooks';

// Import domain selects
import {
    TimeframeSelect,
    DirectionSelect,
    AssetSelect,
    MarketConditionSelect,
    PdArraySelect,
    EntryQualitySelect,
} from './DomainSelects';

interface TradeFormProps {
    accountId: string;
    onSubmit: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
    onCancel?: () => void;
    initialData?: Partial<Trade>;
    mode?: 'create' | 'edit';
}

export function TradeForm({ accountId, onSubmit, onCancel, initialData, mode = 'create' }: TradeFormProps) {
    const { assets, strategies, setups } = useSettingsStore();
    const { playbooks } = usePlaybookStore();
    const { showToast } = useToast();
    
    // Use extracted hooks for state and logic
    const { state, setters, computed, resetForm } = useTradeForm(initialData);
    const { isSaving, handleSubmit: submitHandler } = useTradeSubmit({
        accountId,
        mode,
        playbooks,
        onSubmit,
        onCancel,
        onSuccess: resetForm,
    });

    const {
        tfAnalise, tfEntrada, tagsList, tagInput,
        strategy, setup, entryQuality, marketConditionV2, pdArray,
        symbol, type, entryPrice, stopLoss, takeProfit, exitPrice,
        lot, commission, swap, entryDate, entryTime, exitDate, exitTime
    } = state;

    const {
        setTfAnalise, setTfEntrada, setTagsList, setTagInput,
        setStrategy, setSetup, setEntryQuality, setMarketConditionV2, setPdArray,
        setSymbol, setType, setEntryPrice, setStopLoss, setTakeProfit, setExitPrice,
        setLot, setCommission, setSwap, setEntryDate, setEntryTime, setExitDate, setExitTime
    } = setters;

    const { isTradeOpen, detectedSession, alignmentResult, rMultiplePreview, estimates } = computed;

    // Validation hook
    const { validateForm, validateSingleField, getError, getWarning, clearAllErrors } = useTradeValidation();

    // Build validation input from form state
    const buildValidationInput = (): TradeValidationInput => ({
        type: state.type,
        entryPrice: state.entryPrice,
        exitPrice: state.exitPrice,
        stopLoss: state.stopLoss,
        takeProfit: state.takeProfit,
        lot: state.lot,
        entryDate: state.entryDate,
        entryTime: state.entryTime,
        exitDate: state.exitDate,
        exitTime: state.exitTime,
        symbol: state.symbol,
    });

    // Validate single field on blur
    const handleFieldBlur = (field: keyof TradeValidationInput) => {
        validateSingleField(field, state[field] as string, buildValidationInput());
    };

    // Wrap form submit with validation
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearAllErrors();
        const result = validateForm(buildValidationInput());
        if (!result.isValid) {
            const errorCount = result.errors.length;
            showToast(`Corrija ${errorCount} erro${errorCount !== 1 ? 's' : ''} antes de salvar`, 'error');
            return;
        }
        submitHandler(e, state, computed);
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
                                ? 'bg-amber-500/20 text-amber-300 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20'
                                : 'bg-[#232b32] text-gray-400 border border-gray-700 hover:bg-[#2a343c]'
                        }`}
                    >
                        🟡 Em Aberto
                    </button>
                    <button
                        type="button"
                        onClick={() => setExitPrice(entryPrice || '0')}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                            !isTradeOpen
                                ? 'bg-zorin-accent/20 text-zorin-accent border-2 border-zorin-accent/50 shadow-lg shadow-zorin-accent/20'
                                : 'bg-[#232b32] text-gray-400 border border-gray-700 hover:bg-[#2a343c]'
                        }`}
                    >
                        🟢 Finalizado
                    </button>
                </div>
            )}

            {/* ===== BLOCO 1: CONDIÇÕES DE MERCADO ===== */}
            <FormSection icon="📊" title="Condições de Mercado">
                {/* Market Condition + Strategy + PD Array */}
                <FormRow cols={3}>
                    <MarketConditionSelect
                        label="Condição"
                        value={marketConditionV2}
                        onChange={setMarketConditionV2}
                    />
                    <div className="relative">
                        <Input
                            label="Estratégia"
                            list="strategies-list"
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                            placeholder="MMBM, AMD..."
                            autoComplete="off"
                            className={playbooks.find(p => p.name === strategy) ? 'pl-8' : ''}
                        />
                        {playbooks.find(p => p.name === strategy) && (
                            <div className="absolute left-2.5 top-[38px] -translate-y-1/2 text-sm" style={{ color: playbooks.find(p => p.name === strategy)?.color }}>
                                {playbooks.find(p => p.name === strategy)?.icon}
                            </div>
                        )}
                        <datalist id="strategies-list">
                            {Array.from(new Set([...playbooks.map(p => p.name), ...strategies])).sort().map((strat) => {
                                const pb = playbooks.find(p => p.name === strat);
                                return <option key={strat} value={strat}>{pb ? `${pb.icon} ${strat}` : strat}</option>;
                            })}
                        </datalist>
                    </div>
                    <PdArraySelect
                        label="PD Array"
                        value={pdArray}
                        onChange={setPdArray}
                    />
                </FormRow>

                {/* Timeframes + Setup */}
                <FormRow cols={3}>
                    <TimeframeSelect
                        type="htf"
                        label="TF Análise"
                        value={tfAnalise}
                        onChange={setTfAnalise}
                        placeholder="H4"
                    />
                    <TimeframeSelect
                        type="ltf"
                        label="TF Entrada"
                        value={tfEntrada}
                        onChange={setTfEntrada}
                        placeholder="M15"
                    />
                    <div>
                        <Input
                            label="Setup"
                            list="setups-list"
                            value={setup}
                            onChange={(e) => setSetup(e.target.value)}
                            placeholder="ST+RE"
                            autoComplete="off"
                        />
                        <datalist id="setups-list">
                            {setups.map((s) => <option key={s} value={s} />)}
                        </datalist>
                    </div>
                </FormRow>

                {/* Alignment Badge */}
                {tfAnalise && tfEntrada && (() => {
                    const alignment = alignmentResult;
                    return (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${
                            alignment.isWarning
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                            {alignment.isWarning ? '⚠️ ' : '✓ '}{alignment.label}
                        </div>
                    );
                })()}

                {/* Confluências + Avaliação */}
                <FormRow cols={2}>
                    <FormGroup label="Confluências">
                        <div
                            className="w-full px-3 py-2 bg-[#232b32] border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent flex flex-wrap gap-1.5 items-center min-h-[38px] transition-all duration-200"
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
                                placeholder={tagsList.length === 0 ? "FVG Breaker OB" : ""}
                                className="bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 flex-1 min-w-[60px] text-sm"
                            />
                        </div>
                    </FormGroup>
                    <EntryQualitySelect
                        label="Avaliação"
                        value={entryQuality}
                        onChange={setEntryQuality}
                    />
                </FormRow>
            </FormSection>

            {/* ===== BLOCO 2: FINANCEIRO ===== */}
            <FormSection icon="💰" title="Dados Financeiros">
                {/* Ativo, Lote, Direção */}
                <FormRow cols={3}>
                    <AssetSelect
                        label="Ativo"
                        value={symbol}
                        onChange={setSymbol}
                        onBlur={() => handleFieldBlur('symbol')}
                        assets={assets}
                        required
                        error={getError('symbol')}
                    />
                    <Input 
                        label="Lote" 
                        type="number" 
                        step="0.01" 
                        value={lot} 
                        onChange={(e) => setLot(e.target.value)} 
                        onBlur={() => handleFieldBlur('lot')}
                        placeholder="1.0" 
                        required 
                        error={getError('lot')}
                        autoComplete="off"
                    />
                    <DirectionSelect
                        label="Direção"
                        value={type}
                        onChange={(v) => setType(v as 'Long' | 'Short')}
                        onBlur={() => handleFieldBlur('type')}
                        error={getError('type')}
                    />
                </FormRow>

                {/* Entry, SL, TP */}
                <FormRow cols={3}>
                    <Input 
                        label="Preço Entrada" 
                        type="number" 
                        step="0.00001" 
                        value={entryPrice} 
                        onChange={(e) => setEntryPrice(e.target.value)} 
                        onBlur={() => handleFieldBlur('entryPrice')}
                        required 
                        error={getError('entryPrice')}
                        autoComplete="off"
                    />
                    <Input 
                        label="Stop Loss" 
                        type="number" 
                        step="0.00001" 
                        value={stopLoss} 
                        onChange={(e) => setStopLoss(e.target.value)} 
                        onBlur={() => handleFieldBlur('stopLoss')}
                        error={getError('stopLoss')}
                        warning={getWarning('stopLoss')}
                        autoComplete="off"
                    />
                    <Input 
                        label="Take Profit" 
                        type="number" 
                        step="0.00001" 
                        value={takeProfit} 
                        onChange={(e) => setTakeProfit(e.target.value)} 
                        onBlur={() => handleFieldBlur('takeProfit')}
                        error={getError('takeProfit')}
                        warning={getWarning('takeProfit')}
                        autoComplete="off"
                    />
                </FormRow>

                {/* Exit Price */}
                {(mode === 'edit' || !isTradeOpen) && (
                    <Input 
                        label="Preço Saída" 
                        type="number" 
                        step="0.00001" 
                        value={exitPrice} 
                        onChange={(e) => setExitPrice(e.target.value)} 
                        onBlur={() => handleFieldBlur('exitPrice')}
                        error={getError('exitPrice')}
                        autoComplete="off"
                    />
                )}

                {/* Costs */}
                <FormRow cols={2}>
                    <Input label="Corretagem ($)" type="number" step="0.01" min="0" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="0.00" autoComplete="off" />
                    <Input label="Swap ($)" type="number" step="0.01" value={swap} onChange={(e) => setSwap(e.target.value)} placeholder="-1.50" autoComplete="off" />
                </FormRow>

                {/* Estimates - Risk/Return Cards */}
                <FormRow cols={2} className="pt-2">
                    <div className="relative overflow-hidden rounded-xl p-4 text-center bg-linear-to-b from-red-500/20 to-transparent border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08]">
                            <svg className="w-16 h-16 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 18l2-2-6-6-6 6 2 2 4-4 4 4zm0-8l2-2-6-6-6 6 2 2 4-4 4 4z" transform="rotate(180 12 12)" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <div className="text-xs font-medium uppercase tracking-wider text-red-400/80 mb-1">Risco</div>
                            <div className="text-2xl font-mono font-bold text-red-400 drop-shadow-md">$ {estimates.risk.toFixed(2)}</div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-xl p-4 text-center bg-linear-to-b from-zorin-accent/20 to-transparent border border-zorin-accent/40 shadow-[0_0_20px_rgba(0,200,83,0.15)]">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08]">
                            <svg className="w-16 h-16 text-zorin-accent" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 18l2-2-6-6-6 6 2 2 4-4 4 4zm0-8l2-2-6-6-6 6 2 2 4-4 4 4z" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <div className="text-xs font-medium uppercase tracking-wider text-zorin-accent/80 mb-1">Retorno</div>
                            <div className="text-2xl font-mono font-bold text-zorin-accent drop-shadow-md">$ {estimates.reward.toFixed(2)}</div>
                        </div>
                    </div>
                </FormRow>

                {/* Result */}
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
            </FormSection>

            {/* ===== BLOCO 3: DATA E HORA ===== */}
            <FormSection icon="📅" title="Data e Hora">
                <FormRow cols={2}>
                    <DatePickerInput 
                        label="Data Entrada" 
                        value={entryDate} 
                        onChange={setEntryDate} 
                        onBlur={() => handleFieldBlur('entryDate')}
                        error={getError('entryDate')}
                        required 
                    />
                    <TimePickerInput 
                        label="Hora Entrada" 
                        value={entryTime} 
                        onChange={setEntryTime} 
                        onBlur={() => handleFieldBlur('entryTime')}
                        error={getError('entryTime')}
                    />
                </FormRow>

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

                {/* Exit DateTime */}
                {(mode === 'edit' || !isTradeOpen) && (
                    <FormRow cols={2}>
                        <DatePickerInput 
                            label="Data Saída" 
                            value={exitDate} 
                            onChange={setExitDate} 
                            onBlur={() => handleFieldBlur('exitDate')}
                            error={getError('exitDate')}
                        />
                        <TimePickerInput 
                            label="Hora Saída" 
                            value={exitTime} 
                            onChange={setExitTime} 
                            onBlur={() => handleFieldBlur('exitTime')}
                            error={getError('exitTime')}
                        />
                    </FormRow>
                )}
            </FormSection>

            {/* Submit Button */}
            <div className="flex gap-3">
                {mode === 'edit' && onCancel && (
                    <Button type="button" onClick={onCancel} variant="gradient-danger" className="flex-1 font-extrabold">
                        Cancelar
                    </Button>
                )}
                <Button
                    type="submit"
                    variant="zorin-primary"
                    isLoading={isSaving}
                    disabled={isSaving}
                    className="flex-1"
                >
                    {mode === 'edit' ? 'Salvar' : 'Registrar Trade'}
                </Button>
            </div>
        </form>
    );
}

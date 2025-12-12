'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { useSettingsStore } from '@/store/useSettingsStore';
import { 
    detectSession, 
    validateAlignment, 
    calculateRMultiple 
} from '@/lib/timeframeUtils';
import type { Trade } from '@/types';

// ============================================
// Constants
// ============================================

export const MARKET_CONDITIONS_V2 = [
    '📈 Tendência de Alta',
    '📉 Tendência de Baixa', 
    '↔️ Lateralidade',
    '⚡ Rompimento'
];

export const ENTRY_QUALITY_OPTIONS = [
    '🌟 Picture Perfect',
    '✅ Nice ST',
    '➖ Normal ST',
    '⚠️ Ugly ST'
];

// ============================================
// Mappers
// ============================================

/**
 * Map entry quality display value to DB value
 */
export function mapEntryQualityToDb(value: string): 'picture-perfect' | 'nice' | 'normal' | 'ugly' | undefined {
    if (value.includes('Picture')) return 'picture-perfect';
    if (value.includes('Nice')) return 'nice';
    if (value.includes('Normal')) return 'normal';
    if (value.includes('Ugly')) return 'ugly';
    return undefined;
}

/**
 * Map entry quality DB value to display value
 */
export function mapEntryQualityFromDb(value?: string): string {
    switch (value) {
        case 'picture-perfect': return '🌟 Picture Perfect';
        case 'nice': return '✅ Nice ST';
        case 'normal': return '➖ Normal ST';
        case 'ugly': return '⚠️ Ugly ST';
        default: return '';
    }
}

/**
 * Map market condition display value to DB value
 */
export function mapMarketConditionToDb(value: string): 'bull-trend' | 'bear-trend' | 'ranging' | 'breakout' | undefined {
    if (value.includes('Alta')) return 'bull-trend';
    if (value.includes('Baixa')) return 'bear-trend';
    if (value.includes('Lateral')) return 'ranging';
    if (value.includes('Rompimento')) return 'breakout';
    return undefined;
}

/**
 * Map market condition DB value to display value
 */
export function mapMarketConditionFromDb(value?: string): string {
    switch (value) {
        case 'bull-trend': return '📈 Tendência de Alta';
        case 'bear-trend': return '📉 Tendência de Baixa';
        case 'ranging': return '↔️ Lateralidade';
        case 'breakout': return '⚡ Rompimento';
        default: return '';
    }
}

// ============================================
// Helpers
// ============================================

// NOTE: getNYDateTime was removed - it was causing incorrect timezone conversion
// when loading trades for edit. Dates are stored as naive strings (user's local time)
// and should be used directly without any timezone conversion.

// ============================================
// Types
// ============================================

export interface TradeFormState {
    // Market Conditions
    marketCondition: string;
    tfAnalise: string;
    tfEntrada: string;
    tagsList: string[];
    tagInput: string;
    strategy: string;
    setup: string;
    entryQuality: string;
    marketConditionV2: string;
    
    // Financial
    symbol: string;
    type: 'Long' | 'Short' | '';
    entryPrice: string;
    stopLoss: string;
    takeProfit: string;
    exitPrice: string;
    lot: string;
    commission: string;
    swap: string;
    
    // DateTime
    entryDate: string;
    entryTime: string;
    exitDate: string;
    exitTime: string;
}

export interface TradeFormSetters {
    setMarketCondition: (v: string) => void;
    setTfAnalise: (v: string) => void;
    setTfEntrada: (v: string) => void;
    setTagsList: React.Dispatch<React.SetStateAction<string[]>>;
    setTagInput: (v: string) => void;
    setStrategy: (v: string) => void;
    setSetup: (v: string) => void;
    setEntryQuality: (v: string) => void;
    setMarketConditionV2: (v: string) => void;
    setSymbol: (v: string) => void;
    setType: (v: 'Long' | 'Short' | '') => void;
    setEntryPrice: (v: string) => void;
    setStopLoss: (v: string) => void;
    setTakeProfit: (v: string) => void;
    setExitPrice: (v: string) => void;
    setLot: (v: string) => void;
    setCommission: (v: string) => void;
    setSwap: (v: string) => void;
    setEntryDate: (v: string) => void;
    setEntryTime: (v: string) => void;
    setExitDate: (v: string) => void;
    setExitTime: (v: string) => void;
}

export interface TradeFormComputedValues {
    isTradeOpen: boolean;
    detectedSession: ReturnType<typeof detectSession>;
    alignmentResult: ReturnType<typeof validateAlignment>;
    rMultiplePreview: number | null;
    estimates: { risk: number; reward: number };
}

// ============================================
// Hook
// ============================================

/**
 * Hook to manage TradeForm state, validation and computed values
 * Extracts all state management from TradeForm component
 * 
 * @param initialData - Initial trade data for editing
 * @returns State, setters, computed values, and reset function
 * 
 * @example
 * const { state, setters, computed, resetForm } = useTradeForm(initialData);
 */
export function useTradeForm(initialData?: Partial<Trade>) {
    const { assets } = useSettingsStore();

    // Market Conditions
    const [marketCondition, setMarketCondition] = useState(initialData?.marketCondition || '');
    const [tfAnalise, setTfAnalise] = useState(initialData?.tfAnalise || '');
    const [tfEntrada, setTfEntrada] = useState(initialData?.tfEntrada || '');
    const [tagsList, setTagsList] = useState<string[]>(
        initialData?.tags ? initialData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    );
    const [tagInput, setTagInput] = useState('');
    const [strategy, setStrategy] = useState(initialData?.strategy || '');
    const [setup, setSetup] = useState(initialData?.setup || '');
    const [entryQuality, setEntryQuality] = useState(mapEntryQualityFromDb(initialData?.entry_quality));
    const [marketConditionV2, setMarketConditionV2] = useState(mapMarketConditionFromDb(initialData?.market_condition_v2));

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
    
    // DateTime - use values directly, no timezone conversion needed
    // Dates are stored as naive strings representing user's local time
    const [entryDate, setEntryDate] = useState(initialData?.entryDate || dayjs().format('YYYY-MM-DD'));
    const [entryTime, setEntryTime] = useState(initialData?.entryTime || '');
    const [exitDate, setExitDate] = useState(initialData?.exitDate || '');
    const [exitTime, setExitTime] = useState(initialData?.exitTime || '');

    // Sync form when initialData changes (important for Edit Modal)
    useEffect(() => {
        if (initialData) {
            setMarketCondition(initialData.marketCondition || '');
            setTfAnalise(initialData.tfAnalise || '');
            setTfEntrada(initialData.tfEntrada || '');
            setTagsList(initialData.tags ? initialData.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
            setStrategy(initialData.strategy || '');
            setSetup(initialData.setup || '');
            setEntryQuality(mapEntryQualityFromDb(initialData.entry_quality));
            setMarketConditionV2(mapMarketConditionFromDb(initialData.market_condition_v2));
            setSymbol(initialData.symbol || '');
            setType(initialData.type || '');
            setEntryPrice(initialData.entryPrice?.toString() || '');
            setStopLoss(initialData.stopLoss?.toString() || '');
            setTakeProfit(initialData.takeProfit?.toString() || '');
            setExitPrice(initialData.exitPrice?.toString() || '');
            setLot(initialData.lot?.toString() || '');
            setCommission(initialData.commission ? Math.abs(initialData.commission).toString() : '');
            setSwap(initialData.swap?.toString() || '');
            // Use values directly - no timezone conversion
            setEntryDate(initialData.entryDate || dayjs().format('YYYY-MM-DD'));
            setEntryTime(initialData.entryTime || '');
            setExitDate(initialData.exitDate || '');
            setExitTime(initialData.exitTime || '');
        }
    }, [initialData]);

    // Computed values
    const isTradeOpen = !exitPrice || exitPrice === '';

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

    const calculateEstimates = useCallback(() => {
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
    }, [entryPrice, lot, stopLoss, takeProfit, symbol, assets]);

    const estimates = calculateEstimates();

    // Reset form to initial state
    const resetForm = useCallback(() => {
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
        setEntryQuality('');
        setMarketConditionV2('');
    }, []);

    return {
        // State object
        state: {
            marketCondition,
            tfAnalise,
            tfEntrada,
            tagsList,
            tagInput,
            strategy,
            setup,
            entryQuality,
            marketConditionV2,
            symbol,
            type,
            entryPrice,
            stopLoss,
            takeProfit,
            exitPrice,
            lot,
            commission,
            swap,
            entryDate,
            entryTime,
            exitDate,
            exitTime,
        } as TradeFormState,
        
        // Setters object
        setters: {
            setMarketCondition,
            setTfAnalise,
            setTfEntrada,
            setTagsList,
            setTagInput,
            setStrategy,
            setSetup,
            setEntryQuality,
            setMarketConditionV2,
            setSymbol,
            setType,
            setEntryPrice,
            setStopLoss,
            setTakeProfit,
            setExitPrice,
            setLot,
            setCommission,
            setSwap,
            setEntryDate,
            setEntryTime,
            setExitDate,
            setExitTime,
        } as TradeFormSetters,
        
        // Computed values
        computed: {
            isTradeOpen,
            detectedSession,
            alignmentResult,
            rMultiplePreview,
            estimates,
        } as TradeFormComputedValues,
        
        // Actions
        resetForm,
    };
}

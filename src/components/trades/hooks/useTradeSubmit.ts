'use client';

import { useState, useCallback } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useToast } from '@/contexts/ToastContext';
import { calculateTradePnL, determineTradeOutcome } from '@/lib/calculations';
import { calculateRMultiple } from '@/lib/timeframeUtils';
import { handleServiceError } from '@/lib/errorHandler';
import type { Trade } from '@/types';
import { 
    mapEntryQualityToDb, 
    mapMarketConditionToDb,
    type TradeFormState,
    type TradeFormComputedValues
} from './useTradeForm';

// ============================================
// Types
// ============================================

export interface UseTradeSubmitOptions {
    accountId: string;
    mode: 'create' | 'edit';
    onSubmit: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
    onCancel?: () => void;
    onSuccess?: () => void;
}

export interface UseTradeSubmitReturn {
    isSaving: boolean;
    handleSubmit: (
        e: React.FormEvent,
        state: TradeFormState,
        computed: TradeFormComputedValues
    ) => Promise<void>;
}

// ============================================
// Hook
// ============================================

/**
 * Hook to handle TradeForm submission logic
 * Extracts validation, data transformation, and API call from component
 * 
 * @param options - Configuration options for submission
 * @returns isSaving state and handleSubmit function
 * 
 * @example
 * const { isSaving, handleSubmit } = useTradeSubmit({
 *   accountId,
 *   mode: 'create',
 *   onSubmit: createTrade,
 *   onSuccess: resetForm
 * });
 */
export function useTradeSubmit(options: UseTradeSubmitOptions): UseTradeSubmitReturn {
    const { accountId, mode, onSubmit, onCancel, onSuccess } = options;
    const { assets } = useSettingsStore();
    const { showToast } = useToast();
    
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = useCallback(async (
        e: React.FormEvent,
        state: TradeFormState,
        computed: TradeFormComputedValues
    ) => {
        e.preventDefault();

        if (isSaving) return;

        // Validation
        if (!state.type || (state.type !== 'Long' && state.type !== 'Short')) {
            showToast('Por favor, selecione a direção (Long ou Short)', 'error');
            return;
        }

        setIsSaving(true);

        try {
            const asset = assets.find(a => a.symbol === state.symbol.toUpperCase());
            const assetMultiplier = asset ? asset.multiplier : 1;

            const tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> = {
                userId: '',
                accountId,
                symbol: state.symbol.toUpperCase(),
                type: state.type as 'Long' | 'Short',
                entryPrice: parseFloat(state.entryPrice),
                stopLoss: state.stopLoss ? parseFloat(state.stopLoss) : 0,
                takeProfit: state.takeProfit ? parseFloat(state.takeProfit) : 0,
                exitPrice: state.exitPrice ? parseFloat(state.exitPrice) : undefined,
                lot: parseFloat(state.lot),
                commission: state.commission ? -Math.abs(parseFloat(state.commission)) : 0, 
                swap: state.swap ? parseFloat(state.swap) : 0,
                entryDate: state.entryDate,
                entryTime: state.entryTime || undefined,
                exitDate: state.exitDate || undefined,
                exitTime: state.exitTime || undefined,
                tfAnalise: state.tfAnalise || undefined,
                tfEntrada: state.tfEntrada || undefined,
                tags: state.tagsList.length > 0 ? state.tagsList.join(', ') : '#SemConfluencias',
                strategy: state.strategy || undefined,
                setup: state.setup || undefined,
                marketCondition: state.marketCondition as Trade['marketCondition'] || undefined,
                session: state.entryTime ? computed.detectedSession : undefined,
                htfAligned: (state.tfAnalise && state.tfEntrada) ? computed.alignmentResult.valid : undefined,
                rMultiple: undefined,
                pnl: undefined,
                outcome: 'pending',
                entry_quality: mapEntryQualityToDb(state.entryQuality),
                market_condition_v2: mapMarketConditionToDb(state.marketConditionV2),
            };

            // Calculate PnL if trade is closed
            if (state.exitPrice) {
                const tempTrade = { ...tradeData, exitPrice: parseFloat(state.exitPrice) } as Trade;
                const pnl = calculateTradePnL(tempTrade, assetMultiplier);
                tradeData.pnl = pnl;
                tradeData.outcome = determineTradeOutcome({ ...tempTrade, pnl } as Trade);
                
                const rMult = calculateRMultiple(
                    parseFloat(state.entryPrice),
                    parseFloat(state.exitPrice),
                    parseFloat(state.stopLoss),
                    state.type as 'Long' | 'Short'
                );
                tradeData.rMultiple = rMult ?? undefined;
            }

            await onSubmit(tradeData);
            
            if (mode === 'edit') {
                onCancel?.();
                setTimeout(() => showToast('Trade atualizado com sucesso!', 'success'), 100);
            } else {
                showToast('Seu trade foi adicionado com sucesso!', 'success');
                onSuccess?.();
            }
        } catch (error) {
            handleServiceError(error, 'TradeForm.handleSubmit', {
                userMessage: 'Erro ao salvar trade. Tente novamente.'
            });
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, accountId, assets, mode, onSubmit, onCancel, onSuccess, showToast]);

    return {
        isSaving,
        handleSubmit,
    };
}

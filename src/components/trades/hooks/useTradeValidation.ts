'use client';

import { useState, useCallback } from 'react';
import {
    validateTrade,
    validateField,
    type ValidationResult,
    type TradeValidationInput,
    type ValidationConfig,
    type ValidationError,
    DEFAULT_CONFIG,
} from '@/lib/validation/tradeValidation';

// ============================================
// Types
// ============================================

export interface UseTradeValidationOptions {
    config?: ValidationConfig;
}

export interface UseTradeValidationReturn {
    // Estado de erros por campo (apenas a mensagem para exibição)
    fieldErrors: Record<string, string>;
    
    // Estado de warnings por campo
    fieldWarnings: Record<string, string>;
    
    // Último resultado de validação completa
    lastResult: ValidationResult | null;
    
    // Validar campo específico (para onBlur)
    validateSingleField: (
        field: keyof TradeValidationInput, 
        value: string,
        allValues: TradeValidationInput
    ) => ValidationError[];
    
    // Validar formulário completo (para submit)
    validateForm: (input: TradeValidationInput) => ValidationResult;
    
    // Verificar se campo tem erro
    hasError: (field: string) => boolean;
    
    // Verificar se campo tem warning
    hasWarning: (field: string) => boolean;
    
    // Obter mensagem de erro do campo
    getError: (field: string) => string | undefined;
    
    // Obter mensagem de warning do campo
    getWarning: (field: string) => string | undefined;
    
    // Limpar erro de campo específico
    clearFieldError: (field: string) => void;
    
    // Limpar todos os erros
    clearAllErrors: () => void;
    
    // Definir erro manualmente (útil para erros do servidor)
    setFieldError: (field: string, message: string) => void;
}

// ============================================
// Hook
// ============================================

/**
 * Hook para gerenciar validação de trades em formulários React
 * 
 * @example
 * const { 
 *   fieldErrors, 
 *   validateSingleField, 
 *   validateForm, 
 *   getError, 
 *   hasError 
 * } = useTradeValidation();
 * 
 * // No onBlur de um campo
 * onBlur={() => validateSingleField('entryPrice', entryPrice, formState)}
 * 
 * // No submit
 * const result = validateForm(formState);
 * if (!result.isValid) return;
 */
export function useTradeValidation(
    options: UseTradeValidationOptions = {}
): UseTradeValidationReturn {
    const { config = DEFAULT_CONFIG } = options;
    
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [fieldWarnings, setFieldWarnings] = useState<Record<string, string>>({});
    const [lastResult, setLastResult] = useState<ValidationResult | null>(null);
    
    /**
     * Validar um único campo (para validação em tempo real)
     */
    const validateSingleField = useCallback((
        field: keyof TradeValidationInput,
        value: string,
        allValues: TradeValidationInput
    ): ValidationError[] => {
        const errors = validateField(field, value, allValues, config);
        
        // Separar erros de warnings
        const fieldError = errors.find(e => !e.isWarning);
        const fieldWarning = errors.find(e => e.isWarning);
        
        setFieldErrors(prev => {
            if (fieldError) {
                return { ...prev, [field]: fieldError.message };
            }
            // Limpar erro se não houver
            return Object.fromEntries(
                Object.entries(prev).filter(([key]) => key !== field)
            );
        });
        
        setFieldWarnings(prev => {
            if (fieldWarning) {
                return { ...prev, [field]: fieldWarning.message };
            }
            // Limpar warning se não houver
            return Object.fromEntries(
                Object.entries(prev).filter(([key]) => key !== field)
            );
        });
        
        return errors;
    }, [config]);
    
    /**
     * Validar formulário completo (para submit)
     */
    const validateForm = useCallback((input: TradeValidationInput): ValidationResult => {
        const result = validateTrade(input, config);
        setLastResult(result);
        
        // Atualizar estado de erros por campo
        const newErrors: Record<string, string> = {};
        for (const error of result.errors) {
            if (!newErrors[error.field]) {
                newErrors[error.field] = error.message;
            }
        }
        setFieldErrors(newErrors);
        
        // Atualizar estado de warnings por campo
        const newWarnings: Record<string, string> = {};
        for (const warning of result.warnings) {
            if (!newWarnings[warning.field]) {
                newWarnings[warning.field] = warning.message;
            }
        }
        setFieldWarnings(newWarnings);
        
        return result;
    }, [config]);
    
    /**
     * Verificar se campo tem erro
     */
    const hasError = useCallback((field: string): boolean => {
        return field in fieldErrors;
    }, [fieldErrors]);
    
    /**
     * Verificar se campo tem warning
     */
    const hasWarning = useCallback((field: string): boolean => {
        return field in fieldWarnings;
    }, [fieldWarnings]);
    
    /**
     * Obter mensagem de erro do campo
     */
    const getError = useCallback((field: string): string | undefined => {
        return fieldErrors[field];
    }, [fieldErrors]);
    
    /**
     * Obter mensagem de warning do campo
     */
    const getWarning = useCallback((field: string): string | undefined => {
        return fieldWarnings[field];
    }, [fieldWarnings]);
    
    /**
     * Limpar erro de campo específico
     */
    const clearFieldError = useCallback((field: string): void => {
        setFieldErrors(prev => 
            Object.fromEntries(
                Object.entries(prev).filter(([key]) => key !== field)
            )
        );
        setFieldWarnings(prev => 
            Object.fromEntries(
                Object.entries(prev).filter(([key]) => key !== field)
            )
        );
    }, []);
    
    /**
     * Limpar todos os erros
     */
    const clearAllErrors = useCallback((): void => {
        setFieldErrors({});
        setFieldWarnings({});
        setLastResult(null);
    }, []);
    
    /**
     * Definir erro manualmente
     */
    const setFieldError = useCallback((field: string, message: string): void => {
        setFieldErrors(prev => ({ ...prev, [field]: message }));
    }, []);
    
    return {
        fieldErrors,
        fieldWarnings,
        lastResult,
        validateSingleField,
        validateForm,
        hasError,
        hasWarning,
        getError,
        getWarning,
        clearFieldError,
        clearAllErrors,
        setFieldError,
    };
}

// Re-export types for convenience
export type { TradeValidationInput, ValidationResult, ValidationError };

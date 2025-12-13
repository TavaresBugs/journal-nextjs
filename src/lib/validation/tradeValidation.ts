// ============================================
// TRADE VALIDATION FUNCTIONS
// Pure functions for validating trade data
// ============================================

import type {
    ValidationError,
    ValidationResult,
    ValidationConfig,
    TradeValidationInput,
} from './tradeValidation.types';

import {
    REQUIRED_FIELDS,
    ERROR_MESSAGES,
    FIELD_LABELS,
} from './tradeValidation.types';

// ============================================
// Default Configuration
// ============================================

export const DEFAULT_CONFIG: ValidationConfig = {
    minYear: 2000,
    maxYear: new Date().getFullYear() + 1,
    maxLotSize: 1000,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Parse a string to a number, returning null if invalid
 */
function parseNumber(value: string): number | null {
    if (!value || value.trim() === '') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
}

/**
 * Parse date and time strings to a Date object
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:mm format (optional)
 * @returns Date object or null if invalid
 */
function parseDateTime(dateStr: string, timeStr?: string): Date | null {
    if (!dateStr) return null;
    
    try {
        const dateTimeStr = timeStr 
            ? `${dateStr}T${timeStr}:00`
            : `${dateStr}T00:00:00`;
        const date = new Date(dateTimeStr);
        
        // Check if date is valid
        if (isNaN(date.getTime())) return null;
        
        return date;
    } catch {
        return null;
    }
}

/**
 * Check if a year is within the valid range
 */
function isYearInRange(year: number, config: ValidationConfig): boolean {
    return year >= config.minYear && year <= config.maxYear;
}

// ============================================
// Validation Functions
// ============================================

/**
 * Valida datas de entrada e saída do trade
 * 
 * Regras:
 * - Data de entrada é obrigatória
 * - Se exitDate preenchido: exitDateTime >= entryDateTime
 * - Anos dentro do range configurável
 */
export function validateDates(
    entryDate: string,
    entryTime: string,
    exitDate: string,
    exitTime: string,
    config: ValidationConfig = DEFAULT_CONFIG
): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Parse entry date
    const entryDateTime = parseDateTime(entryDate, entryTime);
    
    if (!entryDate) {
        errors.push({
            field: 'entryDate',
            message: ERROR_MESSAGES.REQUIRED(FIELD_LABELS.entryDate),
            code: 'REQUIRED',
        });
        return errors;
    }
    
    if (!entryDateTime) {
        errors.push({
            field: 'entryDate',
            message: ERROR_MESSAGES.INVALID_DATE(FIELD_LABELS.entryDate),
            code: 'INVALID_DATE',
        });
        return errors;
    }
    
    // Check entry year is in range
    const entryYear = entryDateTime.getFullYear();
    if (!isYearInRange(entryYear, config)) {
        errors.push({
            field: 'entryDate',
            message: ERROR_MESSAGES.OUT_OF_RANGE(FIELD_LABELS.entryDate, config.minYear, config.maxYear),
            code: 'OUT_OF_RANGE',
        });
    }
    
    // If exit date is provided, validate it
    if (exitDate) {
        const exitDateTime = parseDateTime(exitDate, exitTime);
        
        if (!exitDateTime) {
            errors.push({
                field: 'exitDate',
                message: ERROR_MESSAGES.INVALID_DATE(FIELD_LABELS.exitDate),
                code: 'INVALID_DATE',
            });
        } else {
            // Check exit year is in range
            const exitYear = exitDateTime.getFullYear();
            if (!isYearInRange(exitYear, config)) {
                errors.push({
                    field: 'exitDate',
                    message: ERROR_MESSAGES.OUT_OF_RANGE(FIELD_LABELS.exitDate, config.minYear, config.maxYear),
                    code: 'OUT_OF_RANGE',
                });
            }
            
            // Check exit is after or equal to entry
            if (exitDateTime < entryDateTime) {
                errors.push({
                    field: 'exitDate',
                    message: ERROR_MESSAGES.DATE_SEQUENCE,
                    code: 'DATE_SEQUENCE',
                });
                // If dates are the same, the issue is with the time
                // Add error to exitTime field for better UX
                if (exitDate === entryDate) {
                    errors.push({
                        field: 'exitTime',
                        message: ERROR_MESSAGES.DATE_SEQUENCE,
                        code: 'DATE_SEQUENCE',
                    });
                }
            }
        }
    }
    
    return errors;
}

/**
 * Valida preços do trade
 * 
 * Regras:
 * - Entry price é obrigatório e > 0
 * - Stop Loss > 0 (se preenchido)
 * - Take Profit > 0 (se preenchido)
 * - Exit Price > 0 (se preenchido)
 * - Para LONG: SL < Entry < TP (warning, não bloqueante)
 * - Para SHORT: TP < Entry < SL (warning, não bloqueante)
 */
export function validatePrices(
    entryPrice: string,
    exitPrice: string,
    stopLoss: string,
    takeProfit: string,
    type: 'Long' | 'Short' | ''
): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    
    const entry = parseNumber(entryPrice);
    const exit = parseNumber(exitPrice);
    const sl = parseNumber(stopLoss);
    const tp = parseNumber(takeProfit);
    
    // Validate entry price (required)
    if (entryPrice && entry === null) {
        errors.push({
            field: 'entryPrice',
            message: ERROR_MESSAGES.INVALID_FORMAT(FIELD_LABELS.entryPrice),
            code: 'INVALID_FORMAT',
        });
    } else if (entry !== null && entry <= 0) {
        errors.push({
            field: 'entryPrice',
            message: ERROR_MESSAGES.INVALID_PRICE(FIELD_LABELS.entryPrice),
            code: 'INVALID_PRICE',
        });
    }
    
    // Validate exit price (optional)
    if (exitPrice) {
        if (exit === null) {
            errors.push({
                field: 'exitPrice',
                message: ERROR_MESSAGES.INVALID_FORMAT(FIELD_LABELS.exitPrice),
                code: 'INVALID_FORMAT',
            });
        } else if (exit <= 0) {
            errors.push({
                field: 'exitPrice',
                message: ERROR_MESSAGES.INVALID_PRICE(FIELD_LABELS.exitPrice),
                code: 'INVALID_PRICE',
            });
        }
    }
    
    // Validate stop loss (optional)
    if (stopLoss) {
        if (sl === null) {
            errors.push({
                field: 'stopLoss',
                message: ERROR_MESSAGES.INVALID_FORMAT(FIELD_LABELS.stopLoss),
                code: 'INVALID_FORMAT',
            });
        } else if (sl <= 0) {
            errors.push({
                field: 'stopLoss',
                message: ERROR_MESSAGES.INVALID_PRICE(FIELD_LABELS.stopLoss),
                code: 'INVALID_PRICE',
            });
        }
    }
    
    // Validate take profit (optional)
    if (takeProfit) {
        if (tp === null) {
            errors.push({
                field: 'takeProfit',
                message: ERROR_MESSAGES.INVALID_FORMAT(FIELD_LABELS.takeProfit),
                code: 'INVALID_FORMAT',
            });
        } else if (tp <= 0) {
            errors.push({
                field: 'takeProfit',
                message: ERROR_MESSAGES.INVALID_PRICE(FIELD_LABELS.takeProfit),
                code: 'INVALID_PRICE',
            });
        }
    }
    
    // Position validation (warnings only) - only if we have valid numbers
    if (type && entry !== null && entry > 0) {
        if (type === 'Long') {
            // For LONG: SL should be below entry, TP should be above entry
            if (sl !== null && sl > 0 && sl >= entry) {
                warnings.push({
                    field: 'stopLoss',
                    message: ERROR_MESSAGES.SL_ABOVE_ENTRY_LONG,
                    code: 'WARNING',
                    isWarning: true,
                });
            }
            if (tp !== null && tp > 0 && tp <= entry) {
                warnings.push({
                    field: 'takeProfit',
                    message: ERROR_MESSAGES.TP_BELOW_ENTRY_LONG,
                    code: 'WARNING',
                    isWarning: true,
                });
            }
        } else if (type === 'Short') {
            // For SHORT: SL should be above entry, TP should be below entry
            if (sl !== null && sl > 0 && sl <= entry) {
                warnings.push({
                    field: 'stopLoss',
                    message: ERROR_MESSAGES.SL_BELOW_ENTRY_SHORT,
                    code: 'WARNING',
                    isWarning: true,
                });
            }
            if (tp !== null && tp > 0 && tp >= entry) {
                warnings.push({
                    field: 'takeProfit',
                    message: ERROR_MESSAGES.TP_ABOVE_ENTRY_SHORT,
                    code: 'WARNING',
                    isWarning: true,
                });
            }
        }
    }
    
    return { errors, warnings };
}

/**
 * Valida tamanho do lote
 * 
 * Regras:
 * - Lot > 0
 * - Lot <= maxLotSize (configurável)
 * - Deve ser número válido
 */
export function validateQuantity(
    lot: string,
    config: ValidationConfig = DEFAULT_CONFIG
): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!lot || lot.trim() === '') {
        errors.push({
            field: 'lot',
            message: ERROR_MESSAGES.REQUIRED(FIELD_LABELS.lot),
            code: 'REQUIRED',
        });
        return errors;
    }
    
    const lotNumber = parseNumber(lot);
    
    if (lotNumber === null) {
        errors.push({
            field: 'lot',
            message: ERROR_MESSAGES.INVALID_FORMAT(FIELD_LABELS.lot),
            code: 'INVALID_FORMAT',
        });
        return errors;
    }
    
    if (lotNumber <= 0) {
        errors.push({
            field: 'lot',
            message: ERROR_MESSAGES.INVALID_QUANTITY,
            code: 'INVALID_QUANTITY',
        });
    } else if (lotNumber > config.maxLotSize) {
        errors.push({
            field: 'lot',
            message: ERROR_MESSAGES.OUT_OF_RANGE(FIELD_LABELS.lot, 0, config.maxLotSize),
            code: 'OUT_OF_RANGE',
        });
    }
    
    return errors;
}

/**
 * Valida campos obrigatórios
 * 
 * Campos obrigatórios:
 * - symbol
 * - type
 * - entryPrice
 * - lot
 * - entryDate
 */
export function validateRequiredFields(
    input: TradeValidationInput
): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const field of REQUIRED_FIELDS) {
        const value = input[field];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push({
                field,
                message: ERROR_MESSAGES.REQUIRED(FIELD_LABELS[field]),
                code: 'REQUIRED',
            });
        }
    }
    
    return errors;
}

/**
 * Valida um campo específico (para validação em tempo real)
 */
export function validateField(
    field: keyof TradeValidationInput,
    value: string,
    allValues?: Partial<TradeValidationInput>,
    config: ValidationConfig = DEFAULT_CONFIG
): ValidationError[] {
    switch (field) {
        case 'entryDate':
        case 'entryTime':
        case 'exitDate':
        case 'exitTime':
            if (allValues) {
                return validateDates(
                    allValues.entryDate || '',
                    allValues.entryTime || '',
                    allValues.exitDate || '',
                    allValues.exitTime || '',
                    config
                ).filter(e => e.field === field);
            }
            return [];
            
        case 'entryPrice':
        case 'exitPrice':
        case 'stopLoss':
        case 'takeProfit':
            if (allValues) {
                const result = validatePrices(
                    allValues.entryPrice || '',
                    allValues.exitPrice || '',
                    allValues.stopLoss || '',
                    allValues.takeProfit || '',
                    allValues.type || ''
                );
                return [...result.errors, ...result.warnings].filter(e => e.field === field);
            }
            return [];
            
        case 'lot':
            return validateQuantity(value, config);
            
        case 'symbol':
        case 'type':
            if (!value || value.trim() === '') {
                return [{
                    field,
                    message: ERROR_MESSAGES.REQUIRED(FIELD_LABELS[field]),
                    code: 'REQUIRED',
                }];
            }
            return [];
            
        default:
            return [];
    }
}

/**
 * Valida um trade completo
 * 
 * Combina todas as validações e retorna resultado consolidado
 */
export function validateTrade(
    input: TradeValidationInput,
    config: ValidationConfig = DEFAULT_CONFIG
): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];
    
    // 1. Required fields
    allErrors.push(...validateRequiredFields(input));
    
    // 2. Date validation
    allErrors.push(...validateDates(
        input.entryDate,
        input.entryTime,
        input.exitDate,
        input.exitTime,
        config
    ));
    
    // 3. Price validation
    const priceResult = validatePrices(
        input.entryPrice,
        input.exitPrice,
        input.stopLoss,
        input.takeProfit,
        input.type
    );
    allErrors.push(...priceResult.errors);
    allWarnings.push(...priceResult.warnings);
    
    // 4. Quantity validation
    allErrors.push(...validateQuantity(input.lot, config));
    
    // Remove duplicate errors (same field + same code)
    const uniqueErrors = allErrors.filter((error, index, self) =>
        index === self.findIndex(e => e.field === error.field && e.code === error.code)
    );
    
    return {
        isValid: uniqueErrors.length === 0,
        errors: uniqueErrors,
        warnings: allWarnings,
    };
}

// Re-export types for convenience
export type {
    ValidationError,
    ValidationResult,
    ValidationConfig,
    TradeValidationInput,
} from './tradeValidation.types';

export {
    REQUIRED_FIELDS,
    ERROR_MESSAGES,
    FIELD_LABELS,
} from './tradeValidation.types';

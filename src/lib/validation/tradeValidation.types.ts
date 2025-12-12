// ============================================
// TRADE VALIDATION TYPES
// TypeScript interfaces for trade validation
// ============================================

/**
 * Códigos de erro categorizados para tratamento programático
 */
export type ValidationErrorCode = 
    | 'REQUIRED'           // Campo obrigatório não preenchido
    | 'INVALID_FORMAT'     // Formato inválido (NaN, string em número)
    | 'OUT_OF_RANGE'       // Valor fora do range permitido
    | 'INVALID_DATE'       // Data inválida
    | 'DATE_SEQUENCE'      // Saída antes da entrada
    | 'INVALID_PRICE'      // Preço <= 0 ou incoerente
    | 'INVALID_QUANTITY'   // Quantidade <= 0
    | 'WARNING';           // Aviso (não bloqueante)

/**
 * Representa um erro de validação para um campo específico
 */
export interface ValidationError {
    field: string;
    message: string;
    code: ValidationErrorCode;
    isWarning?: boolean;  // Se true, não bloqueia o submit
}

/**
 * Resultado da validação completa de um trade
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

/**
 * Input para validação (espelho do TradeFormState com campos tipados)
 */
export interface TradeValidationInput {
    // Direção
    type: 'Long' | 'Short' | '';
    
    // Preços
    entryPrice: string;
    exitPrice: string;
    stopLoss: string;
    takeProfit: string;
    
    // Quantidade
    lot: string;
    
    // Datas
    entryDate: string;  // YYYY-MM-DD
    entryTime: string;  // HH:mm
    exitDate: string;   // YYYY-MM-DD
    exitTime: string;   // HH:mm
    
    // Outros obrigatórios
    symbol: string;
}

/**
 * Configuração de validação (limites configuráveis)
 */
export interface ValidationConfig {
    minYear: number;      // Ano mínimo permitido (default: 2000)
    maxYear: number;      // Ano máximo permitido (default: current + 1)
    maxLotSize: number;   // Lote máximo permitido (default: 1000)
}

/**
 * Campos obrigatórios para validação
 */
export const REQUIRED_FIELDS: (keyof TradeValidationInput)[] = [
    'symbol',
    'type',
    'entryPrice',
    'lot',
    'entryDate',
];

/**
 * Mensagens de erro em português
 */
export const ERROR_MESSAGES = {
    REQUIRED: (field: string) => `${field} é obrigatório`,
    INVALID_FORMAT: (field: string) => `${field} deve ser um número válido`,
    OUT_OF_RANGE: (field: string, min?: number, max?: number) => {
        if (min !== undefined && max !== undefined) {
            return `${field} deve estar entre ${min} e ${max}`;
        }
        if (min !== undefined) return `${field} deve ser maior que ${min}`;
        if (max !== undefined) return `${field} deve ser menor que ${max}`;
        return `${field} está fora do intervalo permitido`;
    },
    INVALID_DATE: (field: string) => `${field} é uma data inválida`,
    DATE_SEQUENCE: 'Data/hora de saída deve ser igual ou posterior à entrada',
    INVALID_PRICE: (field: string) => `${field} deve ser maior que zero`,
    INVALID_QUANTITY: 'Lote deve ser maior que zero',
    SL_ABOVE_ENTRY_LONG: 'Stop Loss está acima do preço de entrada (Long)',
    SL_BELOW_ENTRY_SHORT: 'Stop Loss está abaixo do preço de entrada (Short)',
    TP_BELOW_ENTRY_LONG: 'Take Profit está abaixo do preço de entrada (Long)',
    TP_ABOVE_ENTRY_SHORT: 'Take Profit está acima do preço de entrada (Short)',
} as const;

/**
 * Labels de campos em português (para mensagens de erro)
 */
export const FIELD_LABELS: Record<keyof TradeValidationInput, string> = {
    type: 'Direção',
    entryPrice: 'Preço de entrada',
    exitPrice: 'Preço de saída',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    lot: 'Lote',
    entryDate: 'Data de entrada',
    entryTime: 'Hora de entrada',
    exitDate: 'Data de saída',
    exitTime: 'Hora de saída',
    symbol: 'Ativo',
};

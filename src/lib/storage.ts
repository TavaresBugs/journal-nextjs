// ============================================
// STORAGE - Camada de Abstração de Persistência
// ============================================

// Re-export functionality from modular services
export * from '@/services/core/account';
export { 
    saveTrade, 
    deleteTrade, 
    getTrades, 
    getTradesPaginated,
    getTradeHistoryLite,
    getTradeById
} from '@/services/trades/trade';
export * from '@/services/journal/journal';
export * from '@/services/journal/routine';
export * from '@/services/admin/migration';

// To ensure backward compatibility with how imports were done previously,
// we don't need to change anything else here if we export everything properly.

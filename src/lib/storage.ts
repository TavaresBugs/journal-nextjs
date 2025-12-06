// ============================================
// STORAGE - Camada de Abstração de Persistência
// ============================================

// Re-export functionality from modular services
export * from '@/services/accountService';
export { 
    saveTrade, 
    deleteTrade, 
    getTrades, 
    getTradesPaginated,
    getTradeHistoryLite,
    getTradeById
} from '@/services/tradeService';
export * from '@/services/journalService';
export * from '@/services/routineService';
export * from '@/services/migrationService';

// To ensure backward compatibility with how imports were done previously,
// we don't need to change anything else here if we export everything properly.

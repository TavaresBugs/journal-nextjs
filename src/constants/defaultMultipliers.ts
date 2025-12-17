// src/constants/defaultMultipliers.ts

export interface MultiplierConfig {
  value: number;
  locked: boolean; // If true, user cannot edit (fixed contract value)
}

// Default multipliers by asset symbol
export const DEFAULT_MULTIPLIERS: Record<string, MultiplierConfig> = {
  // ===== FOREX (editable - standard lot = 100k units) =====
  'EURUSD': { value: 100000, locked: false },
  'GBPUSD': { value: 100000, locked: false },
  'USDJPY': { value: 100000, locked: false },
  'AUDUSD': { value: 100000, locked: false },
  'USDCAD': { value: 100000, locked: false },
  'USDCHF': { value: 100000, locked: false },
  'NZDUSD': { value: 100000, locked: false },
  
  // ===== E-MINI FUTURES (locked - fixed contract value) =====
  'ES':  { value: 50, locked: true },   // E-mini S&P 500 ($50 per point)
  'NQ':  { value: 20, locked: true },   // E-mini NASDAQ ($20 per point)
  'YM':  { value: 5, locked: true },    // E-mini Dow Jones ($5 per point)
  'RTY': { value: 50, locked: true },   // E-mini Russell 2000
  
  // Micro Futures
  'MES': { value: 5, locked: true },    // Micro E-mini S&P ($5 per point)
  'MNQ': { value: 2, locked: true },    // Micro E-mini NASDAQ ($2 per point)
  
  // CFD Indices (editable)
  'US30':    { value: 1, locked: false },
  'US100':   { value: 1, locked: false },
  'NAS100':  { value: 1, locked: false },
  'DXY':     { value: 1000, locked: true }, // Dollar Index
  
  // ===== COMMODITIES (mostly locked) =====
  'XAUUSD': { value: 100, locked: true },    // Gold (1 troy ounce per 0.01 lot)
  'XAGUSD': { value: 5000, locked: true },   // Silver
  'HG':     { value: 25000, locked: true },  // Copper
  'CL':     { value: 1000, locked: true },   // Crude Oil
  'NG':     { value: 10000, locked: true },  // Natural Gas
  
  // ===== CRYPTO (editable - 1 unit) =====
  'BTCUSD': { value: 1, locked: false },
  'ETHUSD': { value: 1, locked: false },
  'SOLUSD': { value: 1, locked: false },
  'ADAUSD': { value: 1, locked: false },
  'XRPUSD': { value: 1, locked: false },
};

/**
 * Get default multiplier config for a symbol
 */
export function getDefaultMultiplier(symbol: string): MultiplierConfig {
  return DEFAULT_MULTIPLIERS[symbol] || { value: 1, locked: false };
}

/**
 * Calculate P&L based on entry, exit, lot size and multiplier
 * Formula: P&L = (Exit - Entry) × Lots × Multiplier
 */
export function calculatePnL(
  entryPrice: number,
  exitPrice: number,
  lots: number,
  multiplier: number
): number {
  return (exitPrice - entryPrice) * lots * multiplier;
}

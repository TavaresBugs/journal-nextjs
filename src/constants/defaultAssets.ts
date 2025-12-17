// ============================================
// DEFAULT ASSETS CONFIGURATION
// ============================================
// Pre-configured trading assets that are seeded for new accounts

import type { AssetType } from '@/types/assets';

export interface DefaultAsset {
  symbol: string;
  name: string;
  type: AssetType;
  multiplier: number;
  market: string;
  icon: string;
  color: string;
}

/**
 * List of default assets pre-configured for all users
 * These are seeded when a new account is created
 */
export const DEFAULT_ASSETS: DefaultAsset[] = [
  // ============================================
  // FOREX
  // ============================================
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    type: 'forex',
    multiplier: 100000,
    market: 'FX',
    icon: 'EURUSD',
    color: '#3B82F6',
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    type: 'forex',
    multiplier: 100000,
    market: 'FX',
    icon: 'GBPUSD',
    color: '#8B5CF6',
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    type: 'forex',
    multiplier: 100000,
    market: 'FX',
    icon: 'USDJPY',
    color: '#EF4444',
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    type: 'forex',
    multiplier: 100000,
    market: 'FX',
    icon: 'AUDUSD',
    color: '#10B981',
  },
  {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    type: 'forex',
    multiplier: 100000,
    market: 'FX',
    icon: 'USDCAD',
    color: '#EF4444',
  },
  {
    symbol: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    type: 'forex',
    multiplier: 100000,
    market: 'FX',
    icon: 'USDCHF',
    color: '#DC2626',
  },

  // ============================================
  // US FUTURES
  // ============================================
  {
    symbol: 'ES',
    name: 'E-mini S&P 500',
    type: 'futures',
    multiplier: 50,
    market: 'CME',
    icon: 'ES',
    color: '#10B981',
  },
  {
    symbol: 'MES',
    name: 'Micro E-mini S&P 500',
    type: 'futures',
    multiplier: 5,
    market: 'CME',
    icon: 'MES',
    color: '#10B981',
  },
  {
    symbol: 'NQ',
    name: 'E-mini NASDAQ-100',
    type: 'futures',
    multiplier: 20,
    market: 'CME',
    icon: 'NQ',
    color: '#3B82F6',
  },
  {
    symbol: 'MNQ',
    name: 'Micro E-mini NASDAQ-100',
    type: 'futures',
    multiplier: 2,
    market: 'CME',
    icon: 'MNQ',
    color: '#3B82F6',
  },
  {
    symbol: 'YM',
    name: 'E-mini Dow Jones',
    type: 'futures',
    multiplier: 5,
    market: 'CME',
    icon: 'YM',
    color: '#1D4ED8',
  },

  // ============================================
  // BRAZIL FUTURES (B3)
  // ============================================
  {
    symbol: 'WIN',
    name: 'Mini Índice Bovespa',
    type: 'futures',
    multiplier: 0.2,
    market: 'B3',
    icon: 'WIN',
    color: '#16A34A',
  },
  {
    symbol: 'WDO',
    name: 'Mini Dólar',
    type: 'futures',
    multiplier: 10,
    market: 'B3',
    icon: 'WDO',
    color: '#059669',
  },

  // ============================================
  // INDICES (CFD)
  // ============================================
  {
    symbol: 'US30',
    name: 'Dow Jones Industrial Average',
    type: 'indices',
    multiplier: 1,
    market: 'CFD',
    icon: 'US30',
    color: '#1D4ED8',
  },
  {
    symbol: 'SPX',
    name: 'S&P 500 Index',
    type: 'indices',
    multiplier: 1,
    market: 'CFD',
    icon: 'SPX',
    color: '#10B981',
  },

  // ============================================
  // COMMODITIES
  // ============================================
  {
    symbol: 'XAUUSD',
    name: 'Gold (Spot)',
    type: 'commodities',
    multiplier: 100,
    market: 'Commodities',
    icon: 'XAUUSD',
    color: '#EAB308',
  },
  {
    symbol: 'GC',
    name: 'Gold Futures',
    type: 'commodities',
    multiplier: 100,
    market: 'COMEX',
    icon: 'GC',
    color: '#EAB308',
  },
  {
    symbol: 'CL',
    name: 'Crude Oil Futures',
    type: 'commodities',
    multiplier: 1000,
    market: 'NYMEX',
    icon: 'CL',
    color: '#1F2937',
  },

  // ============================================
  // CRYPTO
  // ============================================
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    type: 'crypto',
    multiplier: 1,
    market: 'Crypto',
    icon: 'BTCUSD',
    color: '#F97316',
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    type: 'crypto',
    multiplier: 1,
    market: 'Crypto',
    icon: 'ETHUSD',
    color: '#6366F1',
  },
  {
    symbol: 'SOLUSD',
    name: 'Solana / US Dollar',
    type: 'crypto',
    multiplier: 1,
    market: 'Crypto',
    icon: 'SOLUSD',
    color: '#9945FF',
  },
];

/**
 * Get a default asset by symbol
 */
export function getDefaultAsset(symbol: string): DefaultAsset | undefined {
  return DEFAULT_ASSETS.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
}

/**
 * Check if a symbol is a default asset
 */
export function isDefaultAsset(symbol: string): boolean {
  return DEFAULT_ASSETS.some(a => a.symbol.toUpperCase() === symbol.toUpperCase());
}

/**
 * Get all default assets of a specific type
 */
export function getDefaultAssetsByType(type: AssetType): DefaultAsset[] {
  return DEFAULT_ASSETS.filter(a => a.type === type);
}

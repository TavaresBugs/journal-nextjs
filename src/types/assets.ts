// ============================================
// ASSET TYPES - Configuration for trading assets
// ============================================

/**
 * Types of trading assets supported by the application
 */
export type AssetType = 'forex' | 'futures' | 'stocks' | 'crypto' | 'indices' | 'commodities';

/**
 * Configuration for a trading asset
 */
export interface AssetConfig {
  id: string;
  symbol: string;        // "EURUSD", "ES", "BTCUSD"
  name: string;          // "Euro / US Dollar"
  type: AssetType;
  multiplier: number;    // Contract multiplier (100000 for forex, 50 for ES, etc.)
  market: string;        // "CME", "FX", "B3", "Crypto"
  icon: string;          // Path to icon or icon key
  color: string;         // Hex color for styling (#3B82F6)
  isDefault: boolean;    // Pre-configured vs custom user asset
  isActive: boolean;     // Enabled for use in trades
  userId: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data for creating a new asset (without generated fields)
 */
export type CreateAssetData = Omit<AssetConfig, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

/**
 * Data for updating an existing asset
 */
export type UpdateAssetData = Partial<Omit<AssetConfig, 'id' | 'userId' | 'accountId' | 'createdAt' | 'updatedAt'>>;

/**
 * Database representation of AssetConfig (snake_case)
 */
export interface DBAssetConfig {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  name: string;
  type: AssetType;
  multiplier: number;
  market: string;
  icon: string;
  color: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

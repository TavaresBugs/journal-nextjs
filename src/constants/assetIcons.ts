// ============================================
// ASSET ICON CONFIGURATION
// ============================================
// Maps asset symbols to their icon paths and styling
// NO EMOJIS - uses only SVG/JPG images

export interface AssetIconConfig {
  /** Array of icon paths - 1 for single assets, 2 for forex pairs */
  icons: string[];
  /** Hex color for styling */
  color: string;
  /** Background color of container */
  bgColor?: string;
}

const ICON_BASE = "/assets/icons";

export const ASSET_ICON_CONFIGS: Record<string, AssetIconConfig> = {
  // ===== FOREX PAIRS (2 bandeiras) =====

  EURUSD: {
    icons: [`${ICON_BASE}/flags/eur.svg`, `${ICON_BASE}/flags/usd.svg`],
    color: "#3B82F6",
    bgColor: "#F3F4F6",
  },
  GBPUSD: {
    icons: [`${ICON_BASE}/flags/gbp.svg`, `${ICON_BASE}/flags/usd.svg`],
    color: "#8B5CF6",
    bgColor: "#F3F4F6",
  },
  USDJPY: {
    icons: [`${ICON_BASE}/flags/usd.svg`, `${ICON_BASE}/flags/jpy.svg`],
    color: "#EC4899",
    bgColor: "#F3F4F6",
  },
  AUDUSD: {
    icons: [`${ICON_BASE}/flags/aud.svg`, `${ICON_BASE}/flags/usd.svg`],
    color: "#10B981",
    bgColor: "#F3F4F6",
  },
  USDCAD: {
    icons: [`${ICON_BASE}/flags/usd.svg`, `${ICON_BASE}/flags/cad.svg`],
    color: "#EF4444",
    bgColor: "#F3F4F6",
  },
  USDCHF: {
    icons: [`${ICON_BASE}/flags/usd.svg`, `${ICON_BASE}/flags/chf.svg`],
    color: "#DC2626",
    bgColor: "#F3F4F6",
  },
  NZDUSD: {
    icons: [`${ICON_BASE}/flags/nzd.svg`, `${ICON_BASE}/flags/usd.svg`],
    color: "#1E40AF",
    bgColor: "#F3F4F6",
  },
  EURGBP: {
    icons: [`${ICON_BASE}/flags/eur.svg`, `${ICON_BASE}/flags/gbp.svg`],
    color: "#6366F1",
    bgColor: "#F3F4F6",
  },
  EURJPY: {
    icons: [`${ICON_BASE}/flags/eur.svg`, `${ICON_BASE}/flags/jpy.svg`],
    color: "#3B82F6",
    bgColor: "#F3F4F6",
  },
  GBPJPY: {
    icons: [`${ICON_BASE}/flags/gbp.svg`, `${ICON_BASE}/flags/jpy.svg`],
    color: "#8B5CF6",
    bgColor: "#F3F4F6",
  },

  // ===== ÍNDICES AMERICANOS (ícone único) =====

  ES: {
    icons: [`${ICON_BASE}/indices/sp500.svg`],
    color: "#10B981",
    bgColor: "#FFFFFF",
  },
  MES: {
    icons: [`${ICON_BASE}/indices/sp500.svg`],
    color: "#10B981",
    bgColor: "#FFFFFF",
  },
  US500: {
    icons: [`${ICON_BASE}/indices/sp500.svg`],
    color: "#10B981",
    bgColor: "#FFFFFF",
  },
  SPX: {
    icons: [`${ICON_BASE}/indices/sp500.svg`],
    color: "#10B981",
    bgColor: "#FFFFFF",
  },

  NQ: {
    icons: [`${ICON_BASE}/indices/nasdaq-100.svg`],
    color: "#F59E0B",
    bgColor: "#FFFFFF",
  },
  MNQ: {
    icons: [`${ICON_BASE}/indices/nasdaq-100.svg`],
    color: "#F59E0B",
    bgColor: "#FFFFFF",
  },
  US100: {
    icons: [`${ICON_BASE}/indices/nasdaq-100.svg`],
    color: "#F59E0B",
    bgColor: "#FFFFFF",
  },
  NAS100: {
    icons: [`${ICON_BASE}/indices/nasdaq-100.svg`],
    color: "#F59E0B",
    bgColor: "#FFFFFF",
  },

  YM: {
    icons: [`${ICON_BASE}/indices/dow-jones.svg`],
    color: "#3B82F6",
    bgColor: "#FFFFFF",
  },
  MYM: {
    icons: [`${ICON_BASE}/indices/dow-jones.svg`],
    color: "#3B82F6",
    bgColor: "#FFFFFF",
  },
  US30: {
    icons: [`${ICON_BASE}/indices/dow-jones.svg`],
    color: "#3B82F6",
    bgColor: "#FFFFFF",
  },

  RTY: {
    icons: [`${ICON_BASE}/indices/russell-2000.svg`],
    color: "#8B5CF6",
    bgColor: "#FFFFFF",
  },
  M2K: {
    icons: [`${ICON_BASE}/indices/russell-2000.svg`],
    color: "#8B5CF6",
    bgColor: "#FFFFFF",
  },

  DXY: {
    icons: [`${ICON_BASE}/indices/us-dollar-index.svg`],
    color: "#059669",
    bgColor: "#FFFFFF",
  },
  USDX: {
    icons: [`${ICON_BASE}/indices/us-dollar-index.svg`],
    color: "#059669",
    bgColor: "#FFFFFF",
  },

  // ===== BRAZIL FUTURES (B3) =====

  WIN: {
    icons: [`${ICON_BASE}/indices/bovespa.svg`],
    color: "#16A34A",
    bgColor: "#FFFFFF",
  },
  WDO: {
    icons: [`${ICON_BASE}/flags/usd.svg`],
    color: "#059669",
    bgColor: "#FFFFFF",
  },
  IBOV: {
    icons: [`${ICON_BASE}/indices/bovespa.svg`],
    color: "#16A34A",
    bgColor: "#FFFFFF",
  },

  // ===== COMMODITIES - METALS =====

  XAUUSD: {
    icons: [`${ICON_BASE}/commodities/gold.svg`],
    color: "#EAB308",
    bgColor: "#FFFBEB",
  },
  GC: {
    icons: [`${ICON_BASE}/commodities/gold.svg`],
    color: "#EAB308",
    bgColor: "#FFFBEB",
  },
  GOLD: {
    icons: [`${ICON_BASE}/commodities/gold.svg`],
    color: "#EAB308",
    bgColor: "#FFFBEB",
  },

  XAGUSD: {
    icons: [`${ICON_BASE}/commodities/silver.svg`],
    color: "#9CA3AF",
    bgColor: "#F9FAFB",
  },
  SI: {
    icons: [`${ICON_BASE}/commodities/silver.svg`],
    color: "#9CA3AF",
    bgColor: "#F9FAFB",
  },
  SILVER: {
    icons: [`${ICON_BASE}/commodities/silver.svg`],
    color: "#9CA3AF",
    bgColor: "#F9FAFB",
  },

  HG: {
    icons: [`${ICON_BASE}/commodities/copper.svg`],
    color: "#B45309",
    bgColor: "#FEF3C7",
  },
  COPPER: {
    icons: [`${ICON_BASE}/commodities/copper.svg`],
    color: "#B45309",
    bgColor: "#FEF3C7",
  },

  // ===== COMMODITIES - ENERGY =====

  CL: {
    icons: [`${ICON_BASE}/commodities/crude-oil.svg`],
    color: "#1F2937",
    bgColor: "#F3F4F6",
  },
  USOIL: {
    icons: [`${ICON_BASE}/commodities/crude-oil.svg`],
    color: "#1F2937",
    bgColor: "#F3F4F6",
  },
  WTI: {
    icons: [`${ICON_BASE}/commodities/crude-oil.svg`],
    color: "#1F2937",
    bgColor: "#F3F4F6",
  },

  NG: {
    icons: [`${ICON_BASE}/commodities/natural-gas.svg`],
    color: "#3B82F6",
    bgColor: "#EFF6FF",
  },
  NATGAS: {
    icons: [`${ICON_BASE}/commodities/natural-gas.svg`],
    color: "#3B82F6",
    bgColor: "#EFF6FF",
  },

  // ===== CRIPTOMOEDAS =====

  BTCUSD: {
    icons: [`${ICON_BASE}/crypto/bitcoin.svg`],
    color: "#F97316",
    bgColor: "#FFF7ED",
  },
  BTCUSDT: {
    icons: [`${ICON_BASE}/crypto/bitcoin.svg`],
    color: "#F97316",
    bgColor: "#FFF7ED",
  },
  BTC: {
    icons: [`${ICON_BASE}/crypto/bitcoin.svg`],
    color: "#F97316",
    bgColor: "#FFF7ED",
  },

  ETHUSD: {
    icons: [`${ICON_BASE}/crypto/ethereum.svg`],
    color: "#6366F1",
    bgColor: "#EEF2FF",
  },
  ETHUSDT: {
    icons: [`${ICON_BASE}/crypto/ethereum.svg`],
    color: "#6366F1",
    bgColor: "#EEF2FF",
  },
  ETH: {
    icons: [`${ICON_BASE}/crypto/ethereum.svg`],
    color: "#6366F1",
    bgColor: "#EEF2FF",
  },

  SOLUSD: {
    icons: [`${ICON_BASE}/crypto/solana.svg`],
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
  },
  SOLUSDT: {
    icons: [`${ICON_BASE}/crypto/solana.svg`],
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
  },
  SOL: {
    icons: [`${ICON_BASE}/crypto/solana.svg`],
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
  },

  ADAUSD: {
    icons: [`${ICON_BASE}/crypto/cardano.svg`],
    color: "#3B82F6",
    bgColor: "#EFF6FF",
  },
  ADAUSDT: {
    icons: [`${ICON_BASE}/crypto/cardano.svg`],
    color: "#3B82F6",
    bgColor: "#EFF6FF",
  },
  ADA: {
    icons: [`${ICON_BASE}/crypto/cardano.svg`],
    color: "#3B82F6",
    bgColor: "#EFF6FF",
  },

  XRPUSD: {
    icons: [`${ICON_BASE}/crypto/ripple.svg`],
    color: "#6366F1",
    bgColor: "#EEF2FF",
  },
  XRPUSDT: {
    icons: [`${ICON_BASE}/crypto/ripple.svg`],
    color: "#6366F1",
    bgColor: "#EEF2FF",
  },
  XRP: {
    icons: [`${ICON_BASE}/crypto/ripple.svg`],
    color: "#6366F1",
    bgColor: "#EEF2FF",
  },

  USDT: {
    icons: [`${ICON_BASE}/crypto/tether.svg`],
    color: "#10B981",
    bgColor: "#ECFDF5",
  },
  USDTUSDT: {
    icons: [`${ICON_BASE}/crypto/tether.svg`],
    color: "#10B981",
    bgColor: "#ECFDF5",
  },
};

/**
 * Get icon configuration for a given asset symbol
 * Returns fallback config if symbol not found
 */
export function getAssetIconConfig(symbol: string): AssetIconConfig {
  const normalized = symbol.toUpperCase().trim();
  const config = ASSET_ICON_CONFIGS[normalized];

  if (!config) {
    // Fallback for unconfigured assets
    return {
      icons: [`${ICON_BASE}/fallback.svg`],
      color: "#9CA3AF",
      bgColor: "#F3F4F6",
    };
  }

  return config;
}

/**
 * Get all supported asset symbols
 */
export function getSupportedAssets(): string[] {
  return Object.keys(ASSET_ICON_CONFIGS);
}

/**
 * Check if an asset symbol has a configured icon
 */
export function hasAssetIcon(symbol: string): boolean {
  return !!ASSET_ICON_CONFIGS[symbol.toUpperCase().trim()];
}

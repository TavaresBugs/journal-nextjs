// src/constants/assetComboboxData.ts

export interface AssetOption {
  value: string; // "EURUSD", "ES", "BTCUSD"
  label: string; // Display name
  name: string; // Full name
  type: "Forex" | "Futures" | "Commodity" | "Crypto";
}

export const ASSET_OPTIONS: AssetOption[] = [
  // ===== FOREX =====
  {
    value: "EURUSD",
    label: "EURUSD",
    name: "Euro / US Dollar",
    type: "Forex",
  },
  {
    value: "GBPUSD",
    label: "GBPUSD",
    name: "Pound / US Dollar",
    type: "Forex",
  },
  {
    value: "USDJPY",
    label: "USDJPY",
    name: "USD / Japanese Yen",
    type: "Forex",
  },
  {
    value: "AUDUSD",
    label: "AUDUSD",
    name: "AUD / US Dollar",
    type: "Forex",
  },
  {
    value: "USDCAD",
    label: "USDCAD",
    name: "USD / Canadian Dollar",
    type: "Forex",
  },
  {
    value: "USDCHF",
    label: "USDCHF",
    name: "USD / Swiss Franc",
    type: "Forex",
  },
  {
    value: "NZDUSD",
    label: "NZDUSD",
    name: "NZD / US Dollar",
    type: "Forex",
  },

  // ===== FUTURES =====
  {
    value: "ES",
    label: "ES",
    name: "E-mini S&P 500",
    type: "Futures",
  },
  {
    value: "NQ",
    label: "NQ",
    name: "E-mini NASDAQ",
    type: "Futures",
  },
  {
    value: "YM",
    label: "YM",
    name: "E-mini Dow Jones",
    type: "Futures",
  },
  {
    value: "RTY",
    label: "RTY",
    name: "E-mini Russell 2000",
    type: "Futures",
  },
  {
    value: "MES",
    label: "MES",
    name: "Micro E-mini S&P 500",
    type: "Futures",
  },
  {
    value: "MNQ",
    label: "MNQ",
    name: "Micro E-mini NASDAQ",
    type: "Futures",
  },
  {
    value: "US30",
    label: "US30",
    name: "US Dow Jones 30",
    type: "Futures",
  },
  {
    value: "US100",
    label: "US100",
    name: "US Tech 100",
    type: "Futures",
  },
  {
    value: "NAS100",
    label: "NAS100",
    name: "NASDAQ 100",
    type: "Futures",
  },
  {
    value: "USTEC",
    label: "USTEC",
    name: "NASDAQ 100 (CFD)",
    type: "Futures",
  },
  {
    value: "DXY",
    label: "DXY",
    name: "US Dollar Index",
    type: "Futures",
  },

  // ===== COMMODITIES =====
  {
    value: "XAUUSD",
    label: "XAUUSD",
    name: "Gold",
    type: "Commodity",
  },
  {
    value: "XAGUSD",
    label: "XAGUSD",
    name: "Silver",
    type: "Commodity",
  },
  {
    value: "HG",
    label: "HG",
    name: "Copper",
    type: "Commodity",
  },
  {
    value: "CL",
    label: "CL",
    name: "Crude Oil",
    type: "Commodity",
  },
  {
    value: "NG",
    label: "NG",
    name: "Natural Gas",
    type: "Commodity",
  },

  // ===== CRYPTO =====
  {
    value: "BTCUSD",
    label: "BTCUSD",
    name: "Bitcoin",
    type: "Crypto",
  },
  {
    value: "ETHUSD",
    label: "ETHUSD",
    name: "Ethereum",
    type: "Crypto",
  },
  {
    value: "SOLUSD",
    label: "SOLUSD",
    name: "Solana",
    type: "Crypto",
  },
  {
    value: "ADAUSD",
    label: "ADAUSD",
    name: "Cardano",
    type: "Crypto",
  },
  {
    value: "XRPUSD",
    label: "XRPUSD",
    name: "Ripple",
    type: "Crypto",
  },
];

// Helper: Agrupar ativos por tipo
export function groupAssetsByType(assets: AssetOption[]) {
  return assets.reduce(
    (acc, asset) => {
      if (!acc[asset.type]) {
        acc[asset.type] = [];
      }
      acc[asset.type].push(asset);
      return acc;
    },
    {} as Record<string, AssetOption[]>
  );
}

// Helper: Buscar ativo por símbolo
export function findAssetBySymbol(symbol: string): AssetOption | undefined {
  return ASSET_OPTIONS.find((asset) => asset.value.toLowerCase() === symbol.toLowerCase());
}

import { AssetIcon } from "@/components/shared/AssetIcon";

export default function TestAssetsPage() {
  const testAssets = [
    // Forex
    { symbol: "EURUSD", name: "Euro / USD", type: "Forex" },
    { symbol: "GBPUSD", name: "Pound / USD", type: "Forex" },
    { symbol: "USDJPY", name: "USD / Yen", type: "Forex" },
    { symbol: "AUDUSD", name: "AUD / USD", type: "Forex" },
    { symbol: "USDCAD", name: "USD / CAD", type: "Forex" },
    { symbol: "USDCHF", name: "USD / CHF", type: "Forex" },

    // Índices
    { symbol: "ES", name: "S&P 500", type: "Futures" },
    { symbol: "NQ", name: "NASDAQ-100", type: "Futures" },
    { symbol: "YM", name: "Dow Jones", type: "Futures" },
    { symbol: "RTY", name: "Russell 2000", type: "Futures" },
    { symbol: "DXY", name: "Dollar Index", type: "Index" },

    // Commodities
    { symbol: "XAUUSD", name: "Gold (Spot)", type: "Commodity" },
    { symbol: "XAGUSD", name: "Silver", type: "Commodity" },
    { symbol: "CL", name: "Crude Oil", type: "Commodity" },
    { symbol: "NG", name: "Natural Gas", type: "Commodity" },
    { symbol: "HG", name: "Copper", type: "Commodity" },

    // Cripto
    { symbol: "BTCUSD", name: "Bitcoin", type: "Crypto" },
    { symbol: "ETHUSD", name: "Ethereum", type: "Crypto" },
    { symbol: "SOLUSD", name: "Solana", type: "Crypto" },
    { symbol: "XRPUSD", name: "Ripple", type: "Crypto" },

    // Fallback test
    { symbol: "UNKNOWN", name: "Unknown Asset", type: "Test" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold">Asset Icons Test</h1>
        <p className="mb-8 text-gray-400">Testing AssetIcon component with various assets</p>

        {/* Grid de testes */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {testAssets.map(({ symbol, name, type }) => (
            <div
              key={symbol}
              className="flex flex-col items-center gap-3 rounded-xl border border-gray-700 bg-gray-800 p-4 transition-colors hover:border-gray-600"
            >
              <AssetIcon symbol={symbol} size="xl" />
              <div className="text-center">
                <p className="text-lg font-semibold">{symbol}</p>
                <p className="text-sm text-gray-400">{name}</p>
                <span className="mt-1 inline-block rounded-full bg-gray-700 px-2 py-0.5 text-xs">
                  {type}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Teste de tamanhos */}
        <div className="mt-12 rounded-xl bg-gray-800 p-6">
          <h2 className="mb-6 text-xl font-bold">Size Variants</h2>
          <div className="flex flex-wrap items-end gap-8">
            {(["sm", "md", "lg", "xl"] as const).map((size) => (
              <div key={size} className="flex flex-col items-center gap-3">
                <AssetIcon symbol="BTCUSD" size={size} />
                <span className="text-xs text-gray-500">{size}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Teste Forex vs Single */}
        <div className="mt-8 rounded-xl bg-gray-800 p-6">
          <h2 className="mb-6 text-xl font-bold">Forex Pairs vs Single Icons</h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="mb-4 text-sm text-gray-400">Forex (2 flags)</h3>
              <div className="flex gap-4">
                <AssetIcon symbol="EURUSD" size="xl" />
                <AssetIcon symbol="GBPUSD" size="xl" />
                <AssetIcon symbol="USDJPY" size="xl" />
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-sm text-gray-400">Single (1 icon)</h3>
              <div className="flex gap-4">
                <AssetIcon symbol="ES" size="xl" />
                <AssetIcon symbol="BTCUSD" size="xl" />
                <AssetIcon symbol="XAUUSD" size="xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Border toggle test */}
        <div className="mt-8 rounded-xl bg-gray-800 p-6">
          <h2 className="mb-6 text-xl font-bold">Border Toggle</h2>
          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-2">
              <AssetIcon symbol="BTCUSD" size="xl" showBorder={true} />
              <span className="text-xs text-gray-500">with border</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AssetIcon symbol="BTCUSD" size="xl" showBorder={false} />
              <span className="text-xs text-gray-500">no border</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

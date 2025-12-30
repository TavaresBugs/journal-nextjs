"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { IconActionButton } from "@/components/ui";
import { ProbabilityChart } from "@/components/checklist/ProbabilityChart";
import { AssetIcon } from "@/components/shared/AssetIcon";
import {
  linkTradeToExperimentAction,
  unlinkTradeFromExperimentAction,
  getExperimentTradesAction,
} from "@/app/actions/laboratory";
import type { ExperimentLinkedTrade } from "@/lib/database/repositories";
import type { TradeLite } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import dayjs from "dayjs";

interface ExperimentTradesSectionProps {
  experimentId: string;
  availableTrades: TradeLite[];
  onRefreshNeeded?: () => void;
}

/**
 * Section component for managing trades linked to an experiment.
 * Design based on ArgumentsCalculator pattern.
 */
export function ExperimentTradesSection({
  experimentId,
  availableTrades,
  onRefreshNeeded,
}: ExperimentTradesSectionProps) {
  const [linkedTrades, setLinkedTrades] = useState<ExperimentLinkedTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load linked trades on mount
  useEffect(() => {
    const loadTrades = async () => {
      setIsLoading(true);
      try {
        const trades = await getExperimentTradesAction(experimentId);
        setLinkedTrades(trades);
      } catch (error) {
        console.error("Failed to load experiment trades:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrades();
  }, [experimentId]);

  // Filter already-linked trades
  const linkedTradeIds = useMemo(() => new Set(linkedTrades.map((t) => t.tradeId)), [linkedTrades]);

  const filterAvailableTrades = useCallback(
    (query: string) => {
      if (!query) return [];
      const lowerQuery = query.toLowerCase();

      return availableTrades.filter((trade) => {
        if (linkedTradeIds.has(trade.id)) return false;

        // Search by symbol
        if (trade.symbol.toLowerCase().includes(lowerQuery)) return true;

        // Search by various date formats
        const entryDate = dayjs(trade.entryDate);
        const dateFormats = [
          entryDate.format("DD/MM/YYYY"),
          entryDate.format("DD-MM-YYYY"),
          entryDate.format("YYYY-MM-DD"),
          entryDate.format("DD/MM"),
          entryDate.format("DD-MM"),
        ];

        if (dateFormats.some((fmt) => fmt.includes(lowerQuery))) return true;

        return false;
      });
    },
    [availableTrades, linkedTradeIds]
  );

  // Link trade handler
  const handleLinkTrade = useCallback(
    async (trade: TradeLite, category: "pro" | "contra") => {
      try {
        const result = await linkTradeToExperimentAction(experimentId, trade.id, category);
        if (result.success && result.trade) {
          setLinkedTrades((prev) => [...prev, result.trade!]);
          onRefreshNeeded?.();
        } else {
          console.error("Failed to link trade:", result.error);
        }
      } catch (error) {
        console.error("Error linking trade:", error);
      }
    },
    [experimentId, onRefreshNeeded]
  );

  // Unlink trade handler
  const handleUnlinkTrade = useCallback(
    async (tradeId: string) => {
      try {
        const result = await unlinkTradeFromExperimentAction(experimentId, tradeId);
        if (result.success) {
          setLinkedTrades((prev) => prev.filter((t) => t.tradeId !== tradeId));
          onRefreshNeeded?.();
        } else {
          console.error("Failed to unlink trade:", result.error);
        }
      } catch (error) {
        console.error("Error unlinking trade:", error);
      }
    },
    [experimentId, onRefreshNeeded]
  );

  // Calculate stats
  const bullishTrades = useMemo(
    () => linkedTrades.filter((t) => t.category === "pro"),
    [linkedTrades]
  );
  const bearishTrades = useMemo(
    () => linkedTrades.filter((t) => t.category === "contra"),
    [linkedTrades]
  );

  const bullishCount = bullishTrades.length;
  const bearishCount = bearishTrades.length;
  const totalPoints = bullishCount + bearishCount;

  const { proPct, contraPct, label } = useMemo(() => {
    if (totalPoints === 0) {
      return { proPct: 0, contraPct: 0, label: "Sem dados" };
    }

    const pPct = (bullishCount / totalPoints) * 100;
    const cPct = (bearishCount / totalPoints) * 100;

    let l = "Neutro";
    if (pPct >= 70) l = "Hipótese Validada ✅";
    else if (pPct >= 55) l = "Tendência Positiva 🟡";
    else if (cPct >= 70) l = "Hipótese Invalidada ❌";
    else if (cPct >= 55) l = "Tendência Negativa 🟠";
    else l = "Inconclusivo ⚪";

    return { proPct: pPct, contraPct: cPct, label: l };
  }, [bullishCount, bearishCount, totalPoints]);

  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Prós Column */}
        <div className="flex h-full flex-col rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4">
          <h3 className="mb-4 flex items-center justify-between font-bold text-emerald-400">
            <span>✅ Prós (Acertos)</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
              {bullishCount}
            </span>
          </h3>

          {/* List */}
          <div className="custom-scrollbar mb-4 max-h-60 flex-1 space-y-2 overflow-y-auto">
            {bullishTrades.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500 italic">
                Nenhum argumento adicionado.
              </p>
            )}
            {bullishTrades.map((trade) => (
              <div
                key={trade.id}
                className="group flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"
              >
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <span className="text-xs text-gray-500">
                    {dayjs(trade.entryDate).format("DD/MM")}
                  </span>
                  <AssetIcon symbol={trade.symbol} size="sm" />
                  <span className="font-medium">{trade.symbol}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      trade.type === "Long"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {trade.type}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(trade.pnl)}
                  </span>
                </div>
                <IconActionButton
                  variant="delete"
                  size="sm"
                  onClick={() => handleUnlinkTrade(trade.tradeId)}
                  title="Remover"
                />
              </div>
            ))}
          </div>

          {/* Search Input */}
          <TradeSearchInput
            variant="pro"
            onSelect={(trade) => handleLinkTrade(trade, "pro")}
            searchTrades={filterAvailableTrades}
          />
        </div>

        {/* Contras Column */}
        <div className="flex h-full flex-col rounded-xl border border-red-500/20 bg-red-900/10 p-4">
          <h3 className="mb-4 flex items-center justify-between font-bold text-red-400">
            <span>❌ Contras (Falhas)</span>
            <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
              {bearishCount}
            </span>
          </h3>

          {/* List */}
          <div className="custom-scrollbar mb-4 max-h-60 flex-1 space-y-2 overflow-y-auto">
            {bearishTrades.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500 italic">
                Nenhum argumento adicionado.
              </p>
            )}
            {bearishTrades.map((trade) => (
              <div
                key={trade.id}
                className="group flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3"
              >
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <span className="text-xs text-gray-500">
                    {dayjs(trade.entryDate).format("DD/MM")}
                  </span>
                  <AssetIcon symbol={trade.symbol} size="sm" />
                  <span className="font-medium">{trade.symbol}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      trade.type === "Long"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {trade.type}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(trade.pnl)}
                  </span>
                </div>
                <IconActionButton
                  variant="delete"
                  size="sm"
                  onClick={() => handleUnlinkTrade(trade.tradeId)}
                  title="Remover"
                />
              </div>
            ))}
          </div>

          {/* Search Input */}
          <TradeSearchInput
            variant="contra"
            onSelect={(trade) => handleLinkTrade(trade, "contra")}
            searchTrades={filterAvailableTrades}
          />
        </div>
      </div>

      {/* Results Section */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
        {/* Meta/Goal indicator */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Meta:</span>
            <span
              className={`font-mono font-bold ${totalPoints >= 50 ? "text-emerald-400" : "text-cyan-400"}`}
            >
              {totalPoints}/50
            </span>
            {totalPoints >= 50 && <span className="text-emerald-400">✓</span>}
          </div>
          {totalPoints < 50 && (
            <div className="text-xs text-gray-500">
              Faltam {50 - totalPoints} trades para validar
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
          {/* Chart Side */}
          <div className="shrink-0">
            <ProbabilityChart
              bullishPct={proPct}
              bearishPct={contraPct}
              positiveLabel="Prós"
              negativeLabel="Contras"
            />
          </div>

          {/* Stats Side */}
          <div className="w-full flex-1 space-y-4 text-center md:text-left">
            <div>
              <h4 className="mb-1 text-sm tracking-wider text-gray-400 uppercase">Resultado</h4>
              <div className="text-2xl font-bold text-white">{label}</div>
              {totalPoints === 0 && (
                <p className="mt-1 text-sm text-yellow-500">
                  ⚠️ Adicione pelo menos 1 trade para calcular.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                <div className="mb-1 text-xs text-emerald-400">Prós (Acertos)</div>
                <div className="font-mono text-xl text-white">
                  {bullishCount} <span className="text-xs text-gray-500">trades</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                <div className="mb-1 text-xs text-red-400">Contras (Falhas)</div>
                <div className="font-mono text-xl text-white">
                  {bearishCount} <span className="text-xs text-gray-500">trades</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for trade search input
interface TradeSearchInputProps {
  variant: "pro" | "contra";
  onSelect: (trade: TradeLite) => void;
  searchTrades: (query: string) => TradeLite[];
}

function TradeSearchInput({ variant, onSelect, searchTrades }: TradeSearchInputProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<TradeLite[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPro = variant === "pro";

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 0) {
      setResults(searchTrades(val));
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (trade: TradeLite) => {
    onSelect(trade);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={isPro ? "Adicionar pró..." : "Adicionar contra..."}
          className={`flex-1 rounded-lg border ${
            isPro
              ? "border-emerald-500/30 focus:border-emerald-500"
              : "border-red-500/30 focus:border-red-500"
          } bg-black/20 px-3 py-2 text-sm text-white transition-colors placeholder:text-gray-600 focus:outline-none`}
        />
        <Button
          variant={isPro ? "gradient-success" : "danger"}
          size="sm"
          disabled={results.length === 0}
          className={isPro ? "px-3" : "border-none bg-red-500 px-3 text-white hover:bg-red-600"}
          onClick={() => {
            if (results.length > 0) {
              handleSelect(results[0]);
            }
          }}
        >
          +
        </Button>
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-white/10 bg-gray-900 shadow-xl">
          {results.slice(0, 10).map((trade) => (
            <button
              key={trade.id}
              onClick={() => handleSelect(trade)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-800"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {dayjs(trade.entryDate).format("DD/MM")}
                </span>
                <AssetIcon symbol={trade.symbol} size="sm" />
                <span className="font-medium text-gray-300">{trade.symbol}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                    trade.type === "Long"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {trade.type}
                </span>
              </div>
              <span
                className={`text-xs font-bold ${
                  (trade.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatCurrency(trade.pnl || 0)}
              </span>
            </button>
          ))}
        </div>
      )}

      {results.length === 0 && isOpen && query.length > 0 && (
        <div className="absolute top-full right-0 left-0 z-20 mt-1 rounded-lg border border-white/10 bg-gray-900 p-2 text-center text-xs text-gray-500 shadow-xl">
          Nenhum trade encontrado.
        </div>
      )}
    </div>
  );
}

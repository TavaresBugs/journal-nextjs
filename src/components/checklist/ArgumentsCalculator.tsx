import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ProbabilityChart } from "./ProbabilityChart";

interface ArgumentsCalculatorProps {
  initialBullishArgs?: string[];
  initialBearishArgs?: string[];
  onComplete?: (result: {
    bullishCount: number;
    bearishCount: number;
    bullishPct: number;
    bearishPct: number;
    label: string;
  }) => void;
}

export function ArgumentsCalculator({
  initialBullishArgs = [],
  initialBearishArgs = [],
  onComplete,
}: ArgumentsCalculatorProps) {
  // State now holds the actual list of argument strings
  const [bullishArgs, setBullishArgs] = useState<string[]>(initialBullishArgs);
  const [bearishArgs, setBearishArgs] = useState<string[]>(initialBearishArgs);

  // Input states for new arguments
  const [newBullish, setNewBullish] = useState("");
  const [newBearish, setNewBearish] = useState("");

  // Calculations based on array length
  const bullishCount = bullishArgs.length;
  const bearishCount = bearishArgs.length;
  const totalPoints = bullishCount + bearishCount;

  const { bullishPct, bearishPct, label } = useMemo(() => {
    if (totalPoints === 0) {
      return { bullishPct: 0, bearishPct: 0, label: "Neutro" };
    }

    const bPct = (bullishCount / totalPoints) * 100;
    const bearPct = (bearishCount / totalPoints) * 100;

    let l = "Neutro";
    if (bPct >= 70) l = "High Probability Long 🟢";
    else if (bPct >= 55) l = "Medium Probability Long 🟡";
    else if (bearPct >= 70) l = "High Probability Short 🔴";
    else if (bearPct >= 55) l = "Medium Probability Short 🟠";
    else l = "Low Probability / Choppy ⚪";

    return { bullishPct: bPct, bearishPct: bearPct, label: l };
  }, [bullishCount, bearishCount, totalPoints]);

  // Notify parent
  useEffect(() => {
    if (onComplete) {
      onComplete({ bullishCount, bearishCount, bullishPct, bearishPct, label });
    }
  }, [bullishCount, bearishCount, bullishPct, bearishPct, label, onComplete]);

  // Handlers
  const addBullish = () => {
    if (!newBullish.trim()) return;
    setBullishArgs([...bullishArgs, newBullish.trim()]);
    setNewBullish("");
  };

  const removeBullish = (index: number) => {
    setBullishArgs(bullishArgs.filter((_, i) => i !== index));
  };

  const addBearish = () => {
    if (!newBearish.trim()) return;
    setBearishArgs([...bearishArgs, newBearish.trim()]);
    setNewBearish("");
  };

  const removeBearish = (index: number) => {
    setBearishArgs(bearishArgs.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: "bullish" | "bearish") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "bullish") addBullish();
      else addBearish();
    }
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Bullish Column */}
        <div className="flex h-full flex-col rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4">
          <h3 className="mb-4 flex items-center justify-between font-bold text-emerald-400">
            <span>🚀 Bullish Arguments</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
              {bullishCount}
            </span>
          </h3>

          {/* List */}
          <div className="custom-scrollbar mb-4 max-h-60 flex-1 space-y-2 overflow-y-auto">
            {bullishArgs.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500 italic">
                Nenhum argumento adicionado.
              </p>
            )}
            {bullishArgs.map((arg, idx) => (
              <div
                key={`bull-${idx}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"
              >
                <span className="text-sm break-words text-gray-200">{arg}</span>
                <button
                  onClick={() => removeBullish(idx)}
                  className="text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newBullish}
              onChange={(e) => setNewBullish(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "bullish")}
              placeholder="Adicionar pró..."
              className="flex-1 rounded-lg border border-emerald-500/30 bg-black/20 px-3 py-2 text-sm text-white transition-colors placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <Button
              variant="gradient-success"
              size="sm"
              onClick={addBullish}
              disabled={!newBullish.trim()}
              className="px-3"
            >
              +
            </Button>
          </div>
        </div>

        {/* Bearish Column */}
        <div className="flex h-full flex-col rounded-xl border border-red-500/20 bg-red-900/10 p-4">
          <h3 className="mb-4 flex items-center justify-between font-bold text-red-400">
            <span>📉 Bearish Arguments</span>
            <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
              {bearishCount}
            </span>
          </h3>

          {/* List */}
          <div className="custom-scrollbar mb-4 max-h-60 flex-1 space-y-2 overflow-y-auto">
            {bearishArgs.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500 italic">
                Nenhum argumento adicionado.
              </p>
            )}
            {bearishArgs.map((arg, idx) => (
              <div
                key={`bear-${idx}`}
                className="group flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3"
              >
                <span className="text-sm break-words text-gray-200">{arg}</span>
                <button
                  onClick={() => removeBearish(idx)}
                  className="text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newBearish}
              onChange={(e) => setNewBearish(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "bearish")}
              placeholder="Adicionar contra..."
              className="flex-1 rounded-lg border border-red-500/30 bg-black/20 px-3 py-2 text-sm text-white transition-colors placeholder:text-gray-600 focus:border-red-500 focus:outline-none"
            />
            <Button
              variant="danger"
              size="sm"
              onClick={addBearish}
              disabled={!newBearish.trim()}
              className="border-none bg-red-500 px-3 text-white hover:bg-red-600"
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
        <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
          {/* Chart Side */}
          <div className="flex-shrink-0">
            <ProbabilityChart bullishPct={bullishPct} bearishPct={bearishPct} />
          </div>

          {/* Stats Side */}
          <div className="w-full flex-1 space-y-4 text-center md:text-left">
            <div>
              <h4 className="mb-1 text-sm tracking-wider text-gray-400 uppercase">Resultado</h4>
              <div className="text-2xl font-bold text-white">{label}</div>
              {totalPoints === 0 && (
                <p className="mt-1 text-sm text-yellow-500">
                  ⚠️ Adicione pelo menos 1 argumento para calcular.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                <div className="mb-1 text-xs text-emerald-400">Prós (Bullish)</div>
                <div className="font-mono text-xl text-white">
                  {bullishCount} <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                <div className="mb-1 text-xs text-red-400">Contras (Bearish)</div>
                <div className="font-mono text-xl text-white">
                  {bearishCount} <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

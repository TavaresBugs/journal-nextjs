import React from "react";
import { ProbabilityChart } from "@/components/checklist/ProbabilityChart";

interface ArgumentItem {
  id: string;
  text: string;
}

interface SharedArgumentsProps {
  bullishArgs: ArgumentItem[];
  bearishArgs: ArgumentItem[];
}

export function SharedArguments({ bullishArgs, bearishArgs }: SharedArgumentsProps) {
  const bullishCount = bullishArgs.length;
  const bearishCount = bearishArgs.length;
  const totalPoints = bullishCount + bearishCount;

  const { bullishPct, bearishPct, label } = React.useMemo(() => {
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

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
      <h3 className="mb-6 text-xl font-bold text-gray-100">Análise de PD Array</h3>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Arguments Lists */}
        <div className="space-y-6">
          {/* Bullish */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-900/10 p-4">
            <h4 className="mb-3 flex items-center justify-between font-bold text-emerald-400">
              <span>🚀 Bullish Arguments</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                {bullishCount}
              </span>
            </h4>
            <div className="space-y-2">
              {bullishArgs.length === 0 ? (
                <p className="text-center text-sm text-gray-500 italic">Nenhum argumento.</p>
              ) : (
                bullishArgs.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5"
                  >
                    <span className="text-sm text-gray-200">{item.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Bearish */}
          <div className="rounded-lg border border-red-500/20 bg-red-900/10 p-4">
            <h4 className="mb-3 flex items-center justify-between font-bold text-red-400">
              <span>📉 Bearish Arguments</span>
              <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
                {bearishCount}
              </span>
            </h4>
            <div className="space-y-2">
              {bearishArgs.length === 0 ? (
                <p className="text-center text-sm text-gray-500 italic">Nenhum argumento.</p>
              ) : (
                bearishArgs.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5"
                  >
                    <span className="text-sm text-gray-200">{item.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Results / Chart */}
        <div className="flex flex-col justify-center space-y-6 rounded-lg border border-gray-800 bg-gray-900/80 p-6">
          <div className="flex justify-center">
            <ProbabilityChart bullishPct={bullishPct} bearishPct={bearishPct} />
          </div>

          <div className="text-center">
            <h4 className="mb-1 text-xs tracking-wider text-gray-500 uppercase">Resultado</h4>
            <div className="text-xl font-bold text-white">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

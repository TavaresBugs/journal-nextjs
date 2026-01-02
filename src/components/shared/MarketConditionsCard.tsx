"use client";

import React from "react";
import { getTimeframeAlignment } from "@/lib/timeframeUtils";
import { getPdArrayIcon, getPdArrayLabel } from "@/lib/utils/playbook";

/**
 * Props for MarketConditionsCard - read-only display of trade context
 */
export interface MarketConditionsCardProps {
  condition?: string;
  strategy?: string;
  strategyIcon?: string; // Playbook icon for the strategy
  tfAnalise?: string;
  tfEntrada?: string;
  setup?: string;
  htfAligned?: boolean;
  confluences?: string[]; // Already parsed array
  evaluation?: string;
  pdArray?: string;
}

/**
 * Check if there's any data worth displaying
 */
export function hasMarketConditionsData(props: MarketConditionsCardProps): boolean {
  return Boolean(
    props.condition ||
    props.strategy ||
    props.tfAnalise ||
    props.tfEntrada ||
    props.setup ||
    props.htfAligned !== undefined ||
    (props.confluences && props.confluences.length > 0) ||
    props.evaluation ||
    props.pdArray
  );
}

/**
 * Read-only card displaying trade market conditions
 * Used in shared journal entry page
 */
export function MarketConditionsCard({
  condition,
  strategy,
  strategyIcon,
  tfAnalise,
  tfEntrada,
  setup,
  htfAligned,
  confluences,
  evaluation,
  pdArray,
}: MarketConditionsCardProps) {
  // Don't render if no data
  if (
    !hasMarketConditionsData({
      condition,
      strategy,
      tfAnalise,
      tfEntrada,
      setup,
      htfAligned,
      confluences,
      evaluation,
      pdArray,
    })
  ) {
    return null;
  }

  // Filter out empty confluences
  const validConfluences = confluences?.filter((tag) => tag && tag !== "#SemConfluencias") || [];

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
      {/* Header */}
      <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-200">
        <span>📊</span> Condições de Mercado
      </h3>

      {/* Main Grid: 3 columns layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Row 1: Condition | Strategy | PD Array */}
        <div>
          <span className="mb-1.5 block text-center text-xs tracking-wider text-gray-500 uppercase">
            Condição
          </span>
          <div className="flex h-[42px] items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-center text-sm text-gray-200">
            {condition ? <span>{condition}</span> : <span className="text-gray-600">—</span>}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-center text-xs tracking-wider text-gray-500 uppercase">
            Estratégia
          </span>
          <div className="flex h-[42px] items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-center text-sm text-gray-200">
            {strategy ? (
              <>
                {strategyIcon && <span>{strategyIcon}</span>}
                <span className="font-medium">{strategy}</span>
              </>
            ) : (
              <span className="text-gray-600">—</span>
            )}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-center text-xs tracking-wider text-gray-500 uppercase">
            PD Array
          </span>
          <div className="flex h-[42px] items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-center text-sm text-gray-200">
            {pdArray ? (
              <>
                <span className="text-amber-400">{getPdArrayIcon(pdArray)}</span>
                <span className="font-medium text-amber-100">{getPdArrayLabel(pdArray)}</span>
              </>
            ) : (
              <span className="text-gray-600">—</span>
            )}
          </div>
        </div>

        {/* Row 2: TF Análise | TF Entrada | Setup */}
        <div>
          <span className="mb-1.5 block text-center text-xs tracking-wider text-gray-500 uppercase">
            TF Análise
          </span>
          <div className="flex h-[42px] items-center justify-center rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-center text-sm font-medium text-gray-200">
            {tfAnalise || <span className="text-gray-600">—</span>}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-center text-xs tracking-wider text-gray-500 uppercase">
            TF Entrada
          </span>
          <div className="flex h-[42px] items-center justify-center rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-center text-sm font-medium text-gray-200">
            {tfEntrada || <span className="text-gray-600">—</span>}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-center text-xs tracking-wider text-gray-500 uppercase">
            Setup
          </span>
          <div className="flex h-[42px] items-center justify-center rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-center text-sm font-medium text-gray-200">
            {setup || <span className="text-gray-600">—</span>}
          </div>
        </div>

        {/* Row 3: Alinhamento | Confluências | Avaliação ST */}
        <div>
          <span className="mb-1.5 block text-center text-xs tracking-wider text-gray-500 uppercase">
            Alinhamento
          </span>
          <div className="flex h-[42px] items-center justify-center">
            {tfAnalise && tfEntrada ? (
              (() => {
                const alignment = getTimeframeAlignment(tfAnalise, tfEntrada);
                return (
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                      alignment.isWarning
                        ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
                        : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {alignment.isWarning ? "⚠️ " : "✓ "}
                    {alignment.label}
                  </div>
                );
              })()
            ) : (
              <div className="flex h-[42px] w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-sm text-gray-600">
                —
              </div>
            )}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-center text-xs tracking-wider text-gray-500 uppercase">
            Confluências
          </span>
          {validConfluences.length > 0 ? (
            <div className="flex min-h-[42px] flex-wrap items-center justify-center gap-1.5">
              {validConfluences.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-300"
                >
                  <span>🏷️</span>
                  <span>{tag.replace(/^#/, "")}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="flex h-[42px] items-center justify-center rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-sm text-gray-600">
              —
            </div>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-center text-xs tracking-wider text-gray-500 uppercase">
            Avaliação ST
          </span>
          <div className="flex h-[42px] items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2.5 text-center text-sm text-gray-200">
            {evaluation ? <span>{evaluation}</span> : <span className="text-gray-600">—</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

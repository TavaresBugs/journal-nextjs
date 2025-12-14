'use client';

import React from 'react';
import { getTimeframeAlignment } from '@/lib/timeframeUtils';
import { getPdArrayIcon, getPdArrayLabel } from '@/lib/utils/playbook';

/**
 * Props for MarketConditionsCard - read-only display of trade context
 */
export interface MarketConditionsCardProps {
    condition?: string;
    strategy?: string;
    strategyIcon?: string;  // Playbook icon for the strategy
    tfAnalise?: string;
    tfEntrada?: string;
    setup?: string;
    htfAligned?: boolean;
    confluences?: string[];  // Already parsed array
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
    if (!hasMarketConditionsData({ condition, strategy, tfAnalise, tfEntrada, setup, htfAligned, confluences, evaluation, pdArray })) {
        return null;
    }

    // Filter out empty confluences
    const validConfluences = confluences?.filter(tag => tag && tag !== '#SemConfluencias') || [];

    return (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            {/* Header */}
            <h3 className="text-lg font-semibold text-gray-200 mb-5 flex items-center gap-2">
                <span>📊</span> Condições de Mercado
            </h3>

            {/* Main Grid: 3 columns layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Row 1: Condition | Strategy | PD Array */}
                <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5 text-center">Condição</span>
                    <div className="px-3 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700 text-sm text-gray-200 flex items-center justify-center gap-3 h-[42px] text-center">
                        {condition ? (
                            <span>{condition}</span>
                        ) : (
                            <span className="text-gray-600">—</span>
                        )}
                    </div>
                </div>

                <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5 text-center">Estratégia</span>
                    <div className="px-3 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700 text-sm text-gray-200 flex items-center justify-center gap-3 h-[42px] text-center">
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
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5 text-center">PD Array</span>
                    <div className="px-3 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700 text-sm text-gray-200 flex items-center justify-center gap-3 h-[42px] text-center">
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
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5 text-center">TF Análise</span>
                    <div className="px-3 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700 text-sm text-gray-200 text-center font-medium h-[42px] flex items-center justify-center">
                        {tfAnalise || <span className="text-gray-600">—</span>}
                    </div>
                </div>

                <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5 text-center">TF Entrada</span>
                    <div className="px-3 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700 text-sm text-gray-200 text-center font-medium h-[42px] flex items-center justify-center">
                        {tfEntrada || <span className="text-gray-600">—</span>}
                    </div>
                </div>

                <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5 text-center">Setup</span>
                    <div className="px-3 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700 text-sm text-gray-200 text-center font-medium h-[42px] flex items-center justify-center">
                        {setup || <span className="text-gray-600">—</span>}
                    </div>
                </div>

                {/* Row 3: Alinhamento | Confluências | Avaliação ST */}
                <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5 text-center">Alinhamento</span>
                    <div className="h-[42px] flex items-center justify-center">
                        {tfAnalise && tfEntrada ? (() => {
                            const alignment = getTimeframeAlignment(tfAnalise, tfEntrada);
                            return (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                    alignment.isWarning
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                    {alignment.isWarning ? '⚠️ ' : '✓ '}{alignment.label}
                                </div>
                            );
                        })() : (
                            <div className="px-3 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700 text-sm text-gray-600 h-[42px] flex items-center justify-center w-full">
                                —
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5 text-center">Confluências</span>
                    {validConfluences.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 min-h-[42px] items-center justify-center">
                            {validConfluences.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                >
                                    {tag.startsWith('#') ? tag : `#${tag}`}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="px-3 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700 text-sm text-gray-600 h-[42px] flex items-center justify-center">
                            —
                        </div>
                    )}
                </div>

                <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5 text-center">Avaliação ST</span>
                    <div className="px-3 py-2.5 bg-gray-900/50 rounded-lg border border-gray-700 text-sm text-gray-200 flex items-center justify-center gap-3 h-[42px] text-center">
                        {evaluation ? (
                            <span>{evaluation}</span>
                        ) : (
                            <span className="text-gray-600">—</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import React from 'react';

interface ProbabilityChartProps {
    bullishPct: number;
    bearishPct: number;
}

export function ProbabilityChart({ bullishPct, bearishPct }: ProbabilityChartProps) {
    const radius = 50;
    const strokeWidth = 10;
    const normalizedRadius = radius - strokeWidth * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;

    // Determine segments
    // If both are 0, we show a gray circle
    const isZeroState = bullishPct === 0 && bearishPct === 0;
    
    // Calculate stroke dash offsets
    const bullishOffset = circumference - (bullishPct / 100) * circumference;
    // The bearish part is effectively the "rest" of the circle, or we can draw it as a separate circle behind.
    // Simpler: Draw Bearish circle (Red) fully, then draw Bullish circle (Green) potentially partial on top.
    
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
                <svg
                    height="192"
                    width="192"
                    viewBox="0 0 100 100"
                    className="transform -rotate-90"
                >
                    {/* Background Circle (Track) or Bearish Segment base */}
                    {isZeroState ? (
                         <circle
                            stroke="#374151" // gray-700
                            fill="transparent"
                            strokeWidth={strokeWidth}
                            r={normalizedRadius}
                            cx="50"
                            cy="50"
                        />
                    ) : (
                        // If we have data, we assume the base is Red (Bearish) and we overlay Green (Bullish)
                        // Or we can calculate exact dashes. Let's do overlay for simplicity of 2 data points.
                        <>
                             {/* Bearish Circle (Full Background acting as red segment) */}
                             <circle
                                stroke="#EF4444" // red-500
                                fill="transparent"
                                strokeWidth={strokeWidth}
                                r={normalizedRadius}
                                cx="50"
                                cy="50"
                            />
                            {/* Bullish Circle (Overlay) */}
                             <circle
                                stroke="#10B981" // emerald-500
                                fill="transparent"
                                strokeWidth={strokeWidth}
                                strokeDasharray={`${circumference} ${circumference}`}
                                strokeDashoffset={bullishOffset}
                                r={normalizedRadius}
                                cx="50"
                                cy="50"
                                className="transition-all duration-500 ease-out"
                            />
                        </>
                    )}
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    {isZeroState ? (
                        <span className="text-gray-500 text-xs font-medium px-4">
                            Selecione argumentos
                        </span>
                    ) : (
                        <>
                            <span className={`text-3xl font-bold ${bullishPct >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {bullishPct.toFixed(1)}%
                            </span>
                            <span className="text-gray-400 text-xs uppercase tracking-wide mt-1">
                                {bullishPct >= 50 ? 'Bullish' : 'Bearish'}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Legend */}
            {!isZeroState && (
                <div className="flex gap-6 mt-4 opacity-0 animate-fadeIn" style={{ animationFillMode: 'forwards' }}>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-sm text-gray-300">Bullish ({bullishPct.toFixed(1)}%)</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm text-gray-300">Bearish ({bearishPct.toFixed(1)}%)</span>
                     </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ProbabilityChart } from './ProbabilityChart';

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
    onComplete
}: ArgumentsCalculatorProps) {
    // State now holds the actual list of argument strings
    const [bullishArgs, setBullishArgs] = useState<string[]>(initialBullishArgs);
    const [bearishArgs, setBearishArgs] = useState<string[]>(initialBearishArgs);
    
    // Input states for new arguments
    const [newBullish, setNewBullish] = useState('');
    const [newBearish, setNewBearish] = useState('');

    // Calculations based on array length
    const bullishCount = bullishArgs.length;
    const bearishCount = bearishArgs.length;
    const totalPoints = bullishCount + bearishCount;

    const { bullishPct, bearishPct, label } = useMemo(() => {
        if (totalPoints === 0) {
            return { bullishPct: 0, bearishPct: 0, label: 'Neutro' };
        }
        
        const bPct = (bullishCount / totalPoints) * 100;
        const bearPct = (bearishCount / totalPoints) * 100;
        
        let l = 'Neutro';
        if (bPct >= 70) l = 'High Probability Long 🟢';
        else if (bPct >= 55) l = 'Medium Probability Long 🟡';
        else if (bearPct >= 70) l = 'High Probability Short 🔴';
        else if (bearPct >= 55) l = 'Medium Probability Short 🟠';
        else l = 'Low Probability / Choppy ⚪';

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
        setNewBullish('');
    };

    const removeBullish = (index: number) => {
        setBullishArgs(bullishArgs.filter((_, i) => i !== index));
    };

    const addBearish = () => {
        if (!newBearish.trim()) return;
        setBearishArgs([...bearishArgs, newBearish.trim()]);
        setNewBearish('');
    };

    const removeBearish = (index: number) => {
        setBearishArgs(bearishArgs.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent, type: 'bullish' | 'bearish') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (type === 'bullish') addBullish();
            else addBearish();
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bullish Column */}
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col h-full">
                    <h3 className="text-emerald-400 font-bold mb-4 flex items-center justify-between">
                        <span>🚀 Bullish Arguments</span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded-full">{bullishCount}</span>
                    </h3>
                    
                    {/* List */}
                    <div className="flex-1 space-y-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {bullishArgs.length === 0 && (
                            <p className="text-gray-500 text-sm italic text-center py-4">Nenhum argumento adicionado.</p>
                        )}
                        {bullishArgs.map((arg, idx) => (
                            <div 
                                key={`bull-${idx}`} 
                                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/30 group"
                            >
                                <span className="text-sm text-gray-200 break-words">{arg}</span>
                                <button 
                                    onClick={() => removeBullish(idx)}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            onKeyDown={(e) => handleKeyDown(e, 'bullish')}
                            placeholder="Adicionar pró..."
                            className="flex-1 bg-black/20 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-600"
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
                <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-4 flex flex-col h-full">
                    <h3 className="text-red-400 font-bold mb-4 flex items-center justify-between">
                        <span>📉 Bearish Arguments</span>
                         <span className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full">{bearishCount}</span>
                    </h3>
                    
                    {/* List */}
                    <div className="flex-1 space-y-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                         {bearishArgs.length === 0 && (
                            <p className="text-gray-500 text-sm italic text-center py-4">Nenhum argumento adicionado.</p>
                        )}
                         {bearishArgs.map((arg, idx) => (
                            <div 
                                key={`bear-${idx}`} 
                                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-red-500/10 border-red-500/30 group"
                            >
                                <span className="text-sm text-gray-200 break-words">{arg}</span>
                                <button 
                                    onClick={() => removeBearish(idx)}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            onKeyDown={(e) => handleKeyDown(e, 'bearish')}
                            placeholder="Adicionar contra..."
                            className="flex-1 bg-black/20 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-600"
                        />
                         <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={addBearish}
                            disabled={!newBearish.trim()}
                            className="px-3 bg-red-500 hover:bg-red-600 border-none text-white"
                        >
                            +
                        </Button>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
                    
                    {/* Chart Side */}
                    <div className="flex-shrink-0">
                        <ProbabilityChart bullishPct={bullishPct} bearishPct={bearishPct} />
                    </div>

                    {/* Stats Side */}
                    <div className="flex-1 w-full text-center md:text-left space-y-4">
                        <div>
                            <h4 className="text-gray-400 text-sm uppercase tracking-wider mb-1">Resultado</h4>
                            <div className="text-2xl font-bold text-white">{label}</div>
                            {totalPoints === 0 && (
                                <p className="text-sm text-yellow-500 mt-1">
                                    ⚠️ Adicione pelo menos 1 argumento para calcular.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                <div className="text-xs text-emerald-400 mb-1">Prós (Bullish)</div>
                                <div className="text-xl font-mono text-white">{bullishCount} <span className="text-xs text-gray-500">pts</span></div>
                             </div>
                             <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                <div className="text-xs text-red-400 mb-1">Contras (Bearish)</div>
                                <div className="text-xl font-mono text-white">{bearishCount} <span className="text-xs text-gray-500">pts</span></div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

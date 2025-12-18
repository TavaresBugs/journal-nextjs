import React from 'react';

interface ToggleOption {
    label: string | React.ReactNode;
    value: string;
}

interface SegmentedToggleProps {
    options: ToggleOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function SegmentedToggle({ options, value, onChange, className = '' }: SegmentedToggleProps) {
    const selectedIndex = options.findIndex(o => o.value === value);
    const count = options.length;
    
    // Calculate position precisely
    // We assume p-1 (4px padding) on the container
    // Each item takes 100% / count width
    
    return (
        <div className={`bg-gray-900/80 backdrop-blur-md rounded-xl p-1 border border-gray-700/50 flex relative ${className}`}>
            {/* Animated Background Indicator */}
            <div 
                className="absolute top-1 bottom-1 rounded-lg bg-linear-to-r from-cyan-500/20 to-cyan-400/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 ease-out"
                style={{
                    width: `calc((100% - 8px) / ${count})`,
                    left: `calc(4px + (100% - 8px) * ${selectedIndex} / ${count})`
                }}
            />
            
            {/* Buttons */}
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all relative z-10 outline-none focus:outline-none ${
                        value === option.value 
                            ? 'text-cyan-400 font-semibold' 
                            : 'text-gray-400 hover:text-gray-200'
                    }`}
                    type="button"
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

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
    variant?: 'default' | 'responsive';
}

export function SegmentedToggle({ 
    options, 
    value, 
    onChange, 
    className = '', 
    variant = 'default' 
}: SegmentedToggleProps) {
    const selectedIndex = options.findIndex(o => o.value === value);
    const count = options.length;
    const isResponsive = variant === 'responsive';
    
    return (
        <div className={`
            p-1 border border-gray-700/50 rounded-xl relative bg-gray-900/80 backdrop-blur-md
            ${isResponsive 
                ? 'grid grid-cols-2 sm:grid-cols-3 md:flex gap-1 md:gap-0' 
                : 'flex'
            }
            ${className}
        `}>
            {/* Animated Background Indicator (Desktop/Default only) */}
            <div 
                className={`
                    absolute top-1 bottom-1 rounded-lg bg-linear-to-r from-cyan-500/20 to-cyan-400/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 ease-out z-0
                    ${isResponsive ? 'hidden md:block' : 'block'}
                `}
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
                    className={`
                        flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-base font-medium transition-all relative z-10 outline-none focus:outline-none select-none
                        ${isResponsive ? 'w-full' : ''}
                        ${value === option.value 
                            ? `text-cyan-400 font-semibold ${isResponsive ? 'bg-linear-to-r from-cyan-500/20 to-cyan-400/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] md:!bg-transparent md:!shadow-none' : ''}` 
                            : `${isResponsive ? 'bg-gray-800/30 hover:bg-gray-800/50 md:!bg-transparent' : ''} text-gray-400 hover:text-gray-200`
                        }
                    `}
                    type="button"
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

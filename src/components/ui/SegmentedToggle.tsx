import React from 'react';

interface ToggleOption {
    label: string | React.ReactNode;
    value: string;
    activeTextColor?: string; // e.g. 'text-amber-400'
    activeBgColor?: string;   // e.g. 'bg-linear-to-r from-amber-500/20 to-amber-400/10'
    activeShadowColor?: string; // e.g. 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
}

type ToggleSize = 'sm' | 'md' | 'lg';

interface SegmentedToggleProps {
    options: ToggleOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    variant?: 'default' | 'responsive';
    size?: ToggleSize;
}

const SIZE_CONFIG: Record<ToggleSize, string> = {
    sm: 'py-1 text-xs',
    md: 'py-2 text-sm',
    lg: 'py-3 text-base',
};

export function SegmentedToggle({ 
    options, 
    value, 
    onChange, 
    className = '', 
    variant = 'default',
    size = 'lg'
}: SegmentedToggleProps) {
    const selectedIndex = options.findIndex(o => o.value === value);
    const selectedOption = options[selectedIndex];
    const count = options.length;
    const isResponsive = variant === 'responsive';
    
    // Default Colors (Cyan)
    const activeText = selectedOption?.activeTextColor ?? 'text-cyan-400';
    const activeBg = selectedOption?.activeBgColor ?? 'bg-linear-to-r from-cyan-500/20 to-cyan-400/10';
    const activeShadow = selectedOption?.activeShadowColor ?? 'shadow-[0_0_15px_rgba(6,182,212,0.15)]';

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
                    absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out z-0
                    ${activeBg} ${activeShadow}
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
                        flex-1 flex items-center justify-center gap-2 rounded-lg font-medium transition-all relative z-10 outline-none focus:outline-none select-none
                        ${SIZE_CONFIG[size]}
                        ${isResponsive ? 'w-full' : ''}
                        ${value === option.value 
                            ? `${option.activeTextColor ?? 'text-cyan-400'} font-semibold ${isResponsive ? `${option.activeBgColor ?? 'bg-linear-to-r from-cyan-500/20 to-cyan-400/10'} ${option.activeShadowColor ?? 'shadow-[0_0_15px_rgba(6,182,212,0.15)]'} md:!bg-transparent md:!shadow-none` : ''}` 
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

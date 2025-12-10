'use client';

import { useId } from 'react';

interface CustomCheckboxProps {
    checked: boolean;
    onChange: () => void;
    label?: string;
    id?: string;
}

export function CustomCheckbox({ checked, onChange, label, id }: CustomCheckboxProps) {
    const generatedId = useId();
    const checkboxId = id || `checkbox-${generatedId}`;
    
    return (
        <label 
            htmlFor={checkboxId}
            className="flex items-center gap-3 cursor-pointer group"
        >
            {/* Hidden native input for accessibility */}
            <input
                type="checkbox"
                id={checkboxId}
                checked={checked}
                onChange={onChange}
                className="sr-only peer"
            />
            
            {/* Custom checkbox visual - Midnight Green Theme */}
            <div 
                className={`
                    relative w-6 h-6 rounded-md flex items-center justify-center
                    transition-all duration-200 ease-out
                    border-2
                    ${checked 
                        ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
                        : 'bg-transparent border-gray-500 group-hover:border-green-500'
                    }
                    peer-focus-visible:ring-2 peer-focus-visible:ring-green-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0f0f14]
                `}
            >
                {/* Check icon with animation */}
                <svg 
                    className={`
                        w-4 h-4 text-white
                        transition-all duration-200
                        ${checked 
                            ? 'opacity-100 scale-100' 
                            : 'opacity-0 scale-50'
                        }
                    `}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    strokeWidth={3}
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M5 13l4 4L19 7" 
                    />
                </svg>
            </div>
            
            {/* Label text */}
            {label && (
                <span className={`
                    text-sm transition-colors duration-200
                    ${checked ? 'text-white' : 'text-gray-300 group-hover:text-white'}
                `}>
                    {label}
                </span>
            )}
        </label>
    );
}

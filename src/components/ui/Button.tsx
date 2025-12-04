import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'info' | 'ghost-success' | 'gradient-success' | 'gradient-danger' | 'gold';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Button({ 
    children, 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    leftIcon, 
    rightIcon, 
    disabled,
    ...props 
}: ButtonProps) {
    
    const baseStyles = "inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        // Standard "Neutral Dark" style with Cyan hover effect (requested by user)
        primary: "bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-400 focus:ring-cyan-500/50 shadow-sm backdrop-blur-sm font-medium",
        
        // Secondary/Alternative
        secondary: "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500 font-medium",
        
        // Outline
        outline: "border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white focus:ring-gray-600 font-medium",
        
        // Ghost (for "Voltar" etc)
        ghost: "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 focus:ring-gray-600 font-medium",
        
        // Glowing/Neon variants (Robust & Thicker) - Progressive Fill Effect
        danger: "bg-red-500/10 text-red-500 border border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] font-black",
        success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] font-black",
        warning: "bg-orange-500/10 text-orange-500 border border-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] font-black",
        info: "bg-blue-500/10 text-blue-500 border border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] font-black",
        
        // Ghost with Success Hover (Neutral default, Green hover)
        'ghost-success': "bg-gray-800/30 text-gray-400 border border-gray-700 hover:text-emerald-500 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] font-medium",
        
        // Gradient Success (Solid Green Gradient) - NO font-weight here
        'gradient-success': "bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/30 border-none",
        
        // Gradient Danger (Solid Red Gradient) - NO font-weight here
        'gradient-danger': "bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30 border-none",
        
        // Gold (for Edit buttons)
        gold: "bg-yellow-500/10 text-yellow-500 border border-yellow-500 hover:shadow-[0_0_20px_rgba(234,179,8,0.6)] font-black",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        icon: "w-10 h-10 p-2 flex items-center justify-center", // Standard icon size
    };

    // Special handling for the "Settings" style icon button which is slightly larger
    // If className contains w-12, we might want to respect that or override it.
    // For now, let's trust the size prop or className overrides.

    // Determine if we should apply the progressive fill effect
    const isProgressive = variant === 'danger' || variant === 'success' || variant === 'warning' || variant === 'info' || variant === 'ghost-success' || variant === 'gold';

    return (
        <button 
            className={cn(
                "relative overflow-hidden group/btn",
                baseStyles,
                variants[variant],
                (size !== 'icon' || !className.includes('w-')) && sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {/* Progressive Fill Animation */}
            {isProgressive && (
                <span className={`absolute inset-0 w-0 transition-all duration-300 ease-out group-hover/btn:w-full opacity-30 ${
                    variant === 'danger' ? 'bg-red-500' : 
                    variant === 'success' || variant === 'ghost-success' ? 'bg-emerald-500' : 
                    variant === 'info' ? 'bg-blue-500' :
                    variant === 'gold' ? 'bg-yellow-500' :
                    'bg-orange-500'
                }`} />
            )}

            {/* Content Wrapper */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading && (
                    <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {!isLoading && leftIcon && <span>{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span>{rightIcon}</span>}
            </span>
        </button>
    );
}

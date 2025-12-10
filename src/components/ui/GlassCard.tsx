import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hover?: boolean;
    /** Add subtle glow effect on hover */
    glow?: boolean;
    /** Padding preset */
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Glassmorphism Card Component - Zorin Glass Design System
 * 
 * Core building block for the HUD aesthetic. Uses transparency + blur
 * so the wallpaper bleeds through subtly.
 */
export function GlassCard({ 
    children, 
    className = '', 
    onClick, 
    hover = false,
    glow = false,
    padding = 'md'
}: GlassCardProps) {
    
    const paddingStyles = {
        none: '',
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
    };
    
    return (
        <div
            className={cn(
                // Glassmorphism Base - Transparent with blur
                "bg-[#151521]/70 backdrop-blur-md",
                // Border - Subtle white edge
                "border border-white/5",
                // Shape
                "rounded-xl",
                // Shadow - Deep for floating effect
                "shadow-2xl",
                // Padding
                paddingStyles[padding],
                // Hover Effects
                hover && "hover:bg-[#151521]/80 hover:border-white/10 transition-all duration-300 cursor-pointer",
                // Glow Effect
                glow && "hover:shadow-[0_0_30px_rgba(0,200,83,0.15)]",
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

interface GlassCardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassCardHeader({ children, className = '' }: GlassCardHeaderProps) {
    return (
        <div className={cn(
            "mb-4 pb-4 border-b border-white/5",
            className
        )}>
            {children}
        </div>
    );
}

interface GlassCardTitleProps {
    children: React.ReactNode;
    className?: string;
    /** Icon to display before title */
    icon?: React.ReactNode;
}

export function GlassCardTitle({ children, className = '', icon }: GlassCardTitleProps) {
    return (
        <h3 className={cn(
            "text-xl font-bold text-gray-100 flex items-center gap-2",
            className
        )}>
            {icon && <span className="text-[#00c853]">{icon}</span>}
            {children}
        </h3>
    );
}

interface GlassCardContentProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassCardContent({ children, className = '' }: GlassCardContentProps) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}

interface GlassCardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassCardFooter({ children, className = '' }: GlassCardFooterProps) {
    return (
        <div className={cn(
            "mt-4 pt-4 border-t border-white/5 flex items-center justify-end gap-3",
            className
        )}>
            {children}
        </div>
    );
}

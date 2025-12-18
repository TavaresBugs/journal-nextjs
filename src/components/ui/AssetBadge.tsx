import React from 'react';
import { AssetIcon } from '@/components/shared/AssetIcon';

interface AssetBadgeProps {
    symbol: string;
    className?: string;
    size?: 'sm' | 'md';
}

export function AssetBadge({ symbol, className, size = 'md' }: AssetBadgeProps) {
    // sm for tighter spaces like tables
    const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
    
    return (
        <div className={`inline-flex items-center gap-1.5 ${padding} bg-gray-800/60 rounded-lg border border-gray-700/50 backdrop-blur-sm ${className}`}>
            <AssetIcon symbol={symbol} size={size === 'sm' ? 'sm' : 'sm'} />
            <span className={`${textSize} font-medium text-gray-300`}>{symbol}</span>
        </div>
    );
}

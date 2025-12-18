'use client';

import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/general';

type IconActionVariant = 'edit' | 'delete' | 'share' | 'view' | 'back' | 'close' | 'comments';
type IconActionSize = 'sm' | 'md';

interface IconActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant: IconActionVariant;
    size?: IconActionSize;
}

const VARIANT_CONFIG: Record<IconActionVariant, {
    hoverText: string;
    hoverBg: string;
    icon: React.ReactNode;
    defaultTitle: string;
}> = {
    back: {
        hoverText: 'hover:text-white',
        hoverBg: 'hover:bg-gray-800',
        defaultTitle: 'Voltar',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
            </svg>
        ),
    },
    edit: {
        hoverText: 'hover:text-amber-400',
        hoverBg: 'hover:bg-amber-500/10',
        defaultTitle: 'Editar',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
    },
    delete: {
        hoverText: 'hover:text-red-400',
        hoverBg: 'hover:bg-red-500/10',
        defaultTitle: 'Excluir',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
    share: {
        hoverText: 'hover:text-blue-400',
        hoverBg: 'hover:bg-blue-500/10',
        defaultTitle: 'Compartilhar',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
        ),
    },
    view: {
        hoverText: 'hover:text-cyan-400',
        hoverBg: 'hover:bg-cyan-500/10',
        defaultTitle: 'Visualizar',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ),
    },
    close: {
        hoverText: 'hover:text-red-400',
        hoverBg: 'hover:bg-red-500/10',
        defaultTitle: 'Fechar',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
    },
    comments: {
        hoverText: 'hover:text-purple-400',
        hoverBg: 'hover:bg-purple-500/10',
        defaultTitle: 'Comentários',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        ),
    },
};

const SIZE_CONFIG: Record<IconActionSize, string> = {
    sm: 'p-1',
    md: 'p-1.5',
};

export function IconActionButton({
    variant,
    size = 'md',
    className,
    title,
    ...props
}: IconActionButtonProps) {
    const config = VARIANT_CONFIG[variant];

    return (
        <button
            className={cn(
                'text-gray-400 rounded-lg transition-colors',
                config.hoverText,
                config.hoverBg,
                SIZE_CONFIG[size],
                className
            )}
            title={title ?? config.defaultTitle}
            {...props}
        >
            {config.icon}
        </button>
    );
}

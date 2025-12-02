'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type = 'success', isVisible, onClose, duration = 3000 }: ToastProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            // Use requestAnimationFrame to ensure the initial render happens before showing (for animation)
            const raf = requestAnimationFrame(() => {
                setShow(true);
            });
            
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 300); // Wait for animation to finish
            }, duration);
            
            return () => {
                cancelAnimationFrame(raf);
                clearTimeout(timer);
            };
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible && !show) return null;

    const bgColors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-yellow-600',
    };

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️',
    };

    return (
        <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-medium transition-all duration-300 transform ${
                show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
            } ${bgColors[type]}`}
        >
            <span className="text-xl">{icons[type]}</span>
            <span>{message}</span>
            <button onClick={() => setShow(false)} className="ml-4 text-white/80 hover:text-white">
                ✕
            </button>
        </div>
    );
}

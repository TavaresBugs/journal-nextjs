'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Toast, ToastType } from '@/components/ui/Toast';
import { registerToastHandler } from '@/lib/errorHandler';

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean; duration: number }>({
        message: '',
        type: 'success',
        isVisible: false,
        duration: 3000,
    });

    const showToast = (message: string, type: ToastType = 'success', duration: number = 3000) => {
        setToast({ message, type, isVisible: true, duration });
    };

    // Register toast handler for centralized error handling
    useEffect(() => {
        registerToastHandler((message, type) => {
            showToast(message, type as ToastType);
        });
    }, []);

    const hideToast = () => {
        setToast((prev) => ({ ...prev, isVisible: false }));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={hideToast}
                duration={toast.duration}
            />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

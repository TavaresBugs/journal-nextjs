'use client';

import { useState, useEffect, useCallback } from 'react';

const COOKIE_CONSENT_KEY = 'cookie_consent';

type ConsentStatus = 'pending' | 'accepted' | 'rejected';

interface CookieConsentProps {
    className?: string;
}

// Helper to safely check localStorage (SSR-safe)
function getStoredConsent(): ConsentStatus | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus | null;
}

export function CookieConsent({ className = '' }: CookieConsentProps) {
    const [mounted, setMounted] = useState(false);
    const [status, setStatus] = useState<ConsentStatus>('pending');
    const [isVisible, setIsVisible] = useState(false);

    // Only run on client after mount
    useEffect(() => {
        setMounted(true);
        const saved = getStoredConsent();
        if (saved) {
            setStatus(saved);
        } else {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = useCallback(() => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        setStatus('accepted');
        setIsVisible(false);
    }, []);

    const handleReject = useCallback(() => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
        setStatus('rejected');
        setIsVisible(false);
    }, []);

    // Don't render during SSR or if consent already given
    if (!mounted || status !== 'pending' || !isVisible) {
        return null;
    }

    return (
        <div 
            className={`fixed bottom-0 left-0 right-0 z-50 p-4 ${className}`}
            role="dialog"
            aria-label="Consentimento de cookies"
        >
            <div className="max-w-4xl mx-auto bg-[#2d3436] border border-gray-600 rounded-2xl shadow-2xl p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="text-4xl">🍪</div>
                    
                    <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">
                            Usamos Cookies
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Utilizamos cookies essenciais para autenticação e funcionamento do serviço. 
                            Não usamos cookies de rastreamento ou publicidade. 
                            Ao continuar, você concorda com nossa{' '}
                            <a 
                                href="/privacidade" 
                                className="text-[#4DB6AC] hover:underline"
                                target="_blank"
                            >
                                Política de Privacidade
                            </a>.
                        </p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={handleReject}
                            className="flex-1 md:flex-none px-4 py-2 text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
                        >
                            Recusar
                        </button>
                        <button
                            onClick={handleAccept}
                            className="flex-1 md:flex-none px-6 py-2 bg-[#4DB6AC] hover:bg-[#26A69A] text-white font-medium rounded-lg transition-colors"
                        >
                            Aceitar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook para verificar se o usuário aceitou cookies
 */
export function useCookieConsent(): boolean {
    const [hasConsent, setHasConsent] = useState(false);

    useEffect(() => {
        setHasConsent(getStoredConsent() === 'accepted');
    }, []);

    return hasConsent;
}

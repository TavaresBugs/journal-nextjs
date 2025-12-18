"use client";

import { useState, useEffect, useCallback } from "react";

const COOKIE_CONSENT_KEY = "cookie_consent";

type ConsentStatus = "pending" | "accepted" | "rejected";

interface CookieConsentProps {
  className?: string;
}

// Helper to safely check localStorage (SSR-safe)
function getStoredConsent(): ConsentStatus | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus | null;
}

export function CookieConsent({ className = "" }: CookieConsentProps) {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ConsentStatus>("pending");
  const [isVisible, setIsVisible] = useState(false);

  // Only run on client after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const saved = getStoredConsent();
    if (saved) {
      // Delay state update to next tick
      setTimeout(() => setStatus(saved), 0);
    } else {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const handleAccept = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setStatus("accepted");
    setIsVisible(false);
  }, []);

  const handleReject = useCallback(() => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    setStatus("rejected");
    setIsVisible(false);
  }, []);

  // Don't render during SSR or if consent already given
  if (!mounted || status !== "pending" || !isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed right-0 bottom-0 left-0 z-50 p-4 ${className}`}
      role="dialog"
      aria-label="Consentimento de cookies"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-600 bg-[#2d3436] p-6 shadow-2xl">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="text-4xl">🍪</div>

          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-white">Usamos Cookies</h3>
            <p className="text-sm text-gray-400">
              Utilizamos cookies essenciais para autenticação e funcionamento do serviço. Não usamos
              cookies de rastreamento ou publicidade. Ao continuar, você concorda com nossa{" "}
              <a href="/privacidade" className="text-[#4DB6AC] hover:underline" target="_blank">
                Política de Privacidade
              </a>
              .
            </p>
          </div>

          <div className="flex w-full gap-3 md:w-auto">
            <button
              onClick={handleReject}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-400 transition-colors hover:border-gray-500 hover:text-white md:flex-none"
            >
              Recusar
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 rounded-lg bg-[#4DB6AC] px-6 py-2 font-medium text-white transition-colors hover:bg-[#26A69A] md:flex-none"
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
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        setHasConsent(getStoredConsent() === "accepted");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  return hasConsent;
}

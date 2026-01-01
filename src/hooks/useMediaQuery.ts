"use client";

import { useState, useEffect } from "react";

/**
 * Hook para detectar media queries (mobile, tablet, desktop)
 * @param query - Media query string, ex: "(max-width: 768px)"
 * @returns boolean indicando se a media query está ativa
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // Server-side não tem window, retorna false
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    // Sincronizar imediatamente ao montar (intencional para SSR/hydration)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/**
 * Hook conveniente para detectar mobile
 * @returns true se viewport é mobile (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}

/**
 * Hook conveniente para detectar tablet
 * @returns true se viewport é tablet (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

/**
 * Hook conveniente para detectar desktop
 * @returns true se viewport é desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

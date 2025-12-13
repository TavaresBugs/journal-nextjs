'use client';

import { useEffect } from 'react';

/**
 * Hook que bloqueia scroll do body quando montado
 * Usa position: fixed para evitar shift de layout no iOS
 */
export function useBlockBodyScroll(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    // Salvar posição atual do scroll
    const scrollY = window.scrollY;
    
    // Aplicar estilos para bloquear scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.touchAction = 'none';
    
    // Cleanup: restaurar scroll ao desmontar
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      
      // Restaurar posição do scroll
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);
}

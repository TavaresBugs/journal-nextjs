'use client';

import { useEffect } from 'react';

// Reference counter for nested modals
let lockCount = 0;
let savedScrollY = 0;

/**
 * Hook que bloqueia scroll do body quando montado
 * Usa position: fixed para evitar shift de layout no iOS
 * Suporta múltiplos modais aninhados com contador de referência
 */
export function useBlockBodyScroll(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    // Incrementar contador
    lockCount++;
    
    // Só aplicar estilos no primeiro lock
    if (lockCount === 1) {
      // Salvar posição atual do scroll
      savedScrollY = window.scrollY;
      
      // Aplicar estilos para bloquear scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
    }
    
    // Cleanup: decrementar contador
    return () => {
      lockCount--;
      
      // Só restaurar estilos quando todos os modais fecharem
      if (lockCount === 0) {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.touchAction = '';
        
        // Restaurar posição do scroll
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isOpen]);
}

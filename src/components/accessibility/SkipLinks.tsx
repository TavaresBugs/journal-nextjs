"use client";

import React from "react";

/**
 * SkipLinks - Links para pular navegação e ir direto ao conteúdo principal
 * Melhora acessibilidade para usuários de teclado e leitores de tela
 */
export function SkipLinks() {
  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        Pular para o conteúdo principal
      </a>
      <a
        href="#main-nav"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-64 focus:z-[10000] focus:px-4 focus:py-2 focus:bg-cyan-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        Pular para navegação
      </a>
    </div>
  );
}

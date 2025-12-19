"use client";

import React from "react";

/**
 * SkipLinks - Links para pular navegação e ir direto ao conteúdo principal
 * Melhora acessibilidade para usuários de teclado e leitores de tela
 */
export function SkipLinks() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:rounded-md focus:bg-cyan-600 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"
    >
      Pular para o conteúdo principal
    </a>
  );
}

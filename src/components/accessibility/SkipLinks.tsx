"use client";

import React from "react";

/**
 * SkipLinks - Links para pular navegação e ir direto ao conteúdo principal
 * Melhora acessibilidade para usuários de teclado e leitores de tela
 *
 * Conformidade WCAG 2.1:
 * - 2.4.1 Bypass Blocks (A): Permite pular blocos repetitivos
 * - 2.1.1 Keyboard (A): Funcionalidade via teclado
 * - 2.4.3 Focus Order (A): Ordem lógica de foco
 */

const skipLinkStyles = `
  sr-only
  focus:not-sr-only
  focus:fixed
  focus:z-[10000]
  focus:rounded-lg
  focus:bg-gray-900
  focus:px-4
  focus:py-3
  focus:text-white
  focus:font-semibold
  focus:shadow-lg
  focus:shadow-cyan-500/30
  focus:ring-2
  focus:ring-cyan-400
  focus:outline-none
  focus:border
  focus:border-cyan-500/50
  transition-all
  duration-200
`;

export function SkipLinks() {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="skip-links" role="navigation" aria-label="Links de navegação rápida">
      <a
        href="#main-content"
        onClick={(e) => handleClick(e, "main-content")}
        className={`${skipLinkStyles} focus:top-4 focus:left-4`}
      >
        ⏭️ Pular para o conteúdo principal
      </a>
    </div>
  );
}

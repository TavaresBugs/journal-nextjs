"use client";

import React, { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/general";

type IconActionVariant =
  | "edit"
  | "delete"
  | "share"
  | "view"
  | "back"
  | "next"
  | "close"
  | "comments"
  | "journal"
  | "add"
  | "star"
  | "refresh"
  | "database"
  | "copy"
  | "approve"
  | "suspend"
  | "reactivate"
  | "promote"
  | "demote"
  | "import"
  | "pdarray";
type IconActionSize = "sm" | "md" | "lg";

interface IconActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: IconActionVariant;
  size?: IconActionSize;
}

const VARIANT_CONFIG: Record<
  IconActionVariant,
  {
    hoverText: string;
    hoverBg: string;
    icon: React.ReactNode;
    defaultTitle: string;
  }
> = {
  back: {
    hoverText: "hover:text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    defaultTitle: "Voltar",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    ),
  },
  next: {
    hoverText: "hover:text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    defaultTitle: "Avançar",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    ),
  },
  edit: {
    hoverText: "hover:text-amber-400",
    hoverBg: "hover:bg-amber-500/10",
    defaultTitle: "Editar",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  delete: {
    hoverText: "hover:text-red-400",
    hoverBg: "hover:bg-red-500/10",
    defaultTitle: "Excluir",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    ),
  },
  share: {
    hoverText: "hover:text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    defaultTitle: "Compartilhar",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
      </svg>
    ),
  },
  view: {
    hoverText: "hover:text-cyan-400",
    hoverBg: "hover:bg-cyan-500/10",
    defaultTitle: "Visualizar",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  },
  close: {
    hoverText: "hover:text-red-400",
    hoverBg: "hover:bg-red-500/10",
    defaultTitle: "Fechar",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
  comments: {
    hoverText: "hover:text-purple-400",
    hoverBg: "hover:bg-purple-500/10",
    defaultTitle: "Comentários",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  journal: {
    hoverText: "hover:text-green-400",
    hoverBg: "hover:bg-green-500/10",
    defaultTitle: "Ver Diário",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  add: {
    hoverText: "hover:text-green-400",
    hoverBg: "hover:bg-green-500/10",
    defaultTitle: "Adicionar",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  star: {
    hoverText: "hover:text-amber-400",
    hoverBg: "hover:bg-amber-500/10",
    defaultTitle: "Favoritar",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  refresh: {
    hoverText: "hover:text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    defaultTitle: "Atualizar",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  database: {
    hoverText: "hover:text-purple-400",
    hoverBg: "hover:bg-purple-500/10",
    defaultTitle: "Sync Histórico",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  copy: {
    hoverText: "hover:text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    defaultTitle: "Clonar Playbook",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
  },
  approve: {
    hoverText: "hover:text-emerald-400",
    hoverBg: "hover:bg-emerald-500/10",
    defaultTitle: "Aprovar",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  suspend: {
    hoverText: "hover:text-red-400",
    hoverBg: "hover:bg-red-500/10",
    defaultTitle: "Suspender",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    ),
  },
  reactivate: {
    hoverText: "hover:text-emerald-400",
    hoverBg: "hover:bg-emerald-500/10",
    defaultTitle: "Reativar",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  promote: {
    hoverText: "hover:text-cyan-400",
    hoverBg: "hover:bg-cyan-500/10",
    defaultTitle: "Tornar Mentor",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* User with plus icon */}
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  demote: {
    hoverText: "hover:text-red-400",
    hoverBg: "hover:bg-red-500/10",
    defaultTitle: "Remover Mentor",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* User with minus icon */}
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  import: {
    hoverText: "hover:text-green-400",
    hoverBg: "hover:bg-green-500/10",
    defaultTitle: "Importar",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  pdarray: {
    hoverText: "hover:text-cyan-400",
    hoverBg: "hover:bg-cyan-500/10",
    defaultTitle: "Análise PDArray",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v10" />
        <path d="M12 12h10" />
      </svg>
    ),
  },
};

const SIZE_CONFIG: Record<IconActionSize, string> = {
  sm: "p-1",
  md: "p-1.5",
  lg: "p-3",
};

export function IconActionButton({
  variant,
  size = "md",
  className,
  title,
  ...props
}: IconActionButtonProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <button
      className={cn(
        "rounded-lg text-gray-400 transition-colors",
        config.hoverText,
        config.hoverBg,
        SIZE_CONFIG[size],
        className
      )}
      title={title ?? config.defaultTitle}
      aria-label={title ?? config.defaultTitle}
      {...props}
    >
      {config.icon}
    </button>
  );
}

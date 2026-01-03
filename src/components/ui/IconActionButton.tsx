"use client";

import React, { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/general";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Share2,
  Eye,
  X,
  MessageCircle,
  BookOpen,
  Plus,
  Star,
  RefreshCw,
  Database,
  Copy,
  Check,
  Pause,
  Play,
  UserPlus,
  UserMinus,
  Download,
  PieChart,
  type LucideIcon,
} from "lucide-react";

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

interface VariantConfig {
  hoverText: string;
  hoverBg: string;
  Icon: LucideIcon;
  defaultTitle: string;
  iconSize?: "sm" | "lg"; // Default is regular (h-5 w-5)
}

const VARIANT_CONFIG: Record<IconActionVariant, VariantConfig> = {
  back: {
    hoverText: "hover:text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    defaultTitle: "Voltar",
    Icon: ChevronLeft,
    iconSize: "lg",
  },
  next: {
    hoverText: "hover:text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    defaultTitle: "Avançar",
    Icon: ChevronRight,
    iconSize: "lg",
  },
  edit: {
    hoverText: "hover:text-amber-400",
    hoverBg: "hover:bg-amber-500/10",
    defaultTitle: "Editar",
    Icon: Pencil,
  },
  delete: {
    hoverText: "hover:text-red-400",
    hoverBg: "hover:bg-red-500/10",
    defaultTitle: "Excluir",
    Icon: Trash2,
  },
  share: {
    hoverText: "hover:text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    defaultTitle: "Compartilhar",
    Icon: Share2,
  },
  view: {
    hoverText: "hover:text-cyan-400",
    hoverBg: "hover:bg-cyan-500/10",
    defaultTitle: "Visualizar",
    Icon: Eye,
  },
  close: {
    hoverText: "hover:text-red-400",
    hoverBg: "hover:bg-red-500/10",
    defaultTitle: "Fechar",
    Icon: X,
    iconSize: "lg",
  },
  comments: {
    hoverText: "hover:text-purple-400",
    hoverBg: "hover:bg-purple-500/10",
    defaultTitle: "Comentários",
    Icon: MessageCircle,
  },
  journal: {
    hoverText: "hover:text-green-400",
    hoverBg: "hover:bg-green-500/10",
    defaultTitle: "Ver Diário",
    Icon: BookOpen,
  },
  add: {
    hoverText: "hover:text-green-400",
    hoverBg: "hover:bg-green-500/10",
    defaultTitle: "Adicionar",
    Icon: Plus,
  },
  star: {
    hoverText: "hover:text-amber-400",
    hoverBg: "hover:bg-amber-500/10",
    defaultTitle: "Favoritar",
    Icon: Star,
  },
  refresh: {
    hoverText: "hover:text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    defaultTitle: "Atualizar",
    Icon: RefreshCw,
  },
  database: {
    hoverText: "hover:text-purple-400",
    hoverBg: "hover:bg-purple-500/10",
    defaultTitle: "Sync Histórico",
    Icon: Database,
  },
  copy: {
    hoverText: "hover:text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    defaultTitle: "Clonar Playbook",
    Icon: Copy,
  },
  approve: {
    hoverText: "hover:text-emerald-400",
    hoverBg: "hover:bg-emerald-500/10",
    defaultTitle: "Aprovar",
    Icon: Check,
  },
  suspend: {
    hoverText: "hover:text-red-400",
    hoverBg: "hover:bg-red-500/10",
    defaultTitle: "Suspender",
    Icon: Pause,
  },
  reactivate: {
    hoverText: "hover:text-emerald-400",
    hoverBg: "hover:bg-emerald-500/10",
    defaultTitle: "Reativar",
    Icon: Play,
  },
  promote: {
    hoverText: "hover:text-cyan-400",
    hoverBg: "hover:bg-cyan-500/10",
    defaultTitle: "Tornar Mentor",
    Icon: UserPlus,
  },
  demote: {
    hoverText: "hover:text-red-400",
    hoverBg: "hover:bg-red-500/10",
    defaultTitle: "Remover Mentor",
    Icon: UserMinus,
  },
  import: {
    hoverText: "hover:text-green-400",
    hoverBg: "hover:bg-green-500/10",
    defaultTitle: "Importar",
    Icon: Download,
  },
  pdarray: {
    hoverText: "hover:text-cyan-400",
    hoverBg: "hover:bg-cyan-500/10",
    defaultTitle: "Análise PDArray",
    Icon: PieChart,
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
  const IconComponent = config.Icon;
  const iconClass = config.iconSize === "lg" ? "h-6 w-6" : "h-5 w-5";

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
      <IconComponent className={iconClass} />
    </button>
  );
}

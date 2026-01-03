"use client";

import { cn } from "@/lib/utils";

type Permission = "view" | "comment";

interface PermissionBadgeProps {
  permission: Permission;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

const permissionStyles: Record<Permission, string> = {
  view: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  comment: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const permissionLabels: Record<Permission, string> = {
  view: "Visualizar",
  comment: "Comentar",
};

/**
 * PermissionBadge
 *
 * Reusable badge component for displaying permission type (view/comment).
 * Can be clickable for toggling permission.
 * Used by ConvitesTable and MentoradosTable.
 */
export function PermissionBadge({
  permission,
  clickable = false,
  onClick,
  className,
}: PermissionBadgeProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-colors";

  const hoverStyles = clickable ? "hover:opacity-80 cursor-pointer" : "cursor-default";

  if (clickable && onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(baseStyles, permissionStyles[permission], hoverStyles, className)}
        title="Clique para alterar permissão"
      >
        {permissionLabels[permission]}
      </button>
    );
  }

  return (
    <span className={cn(baseStyles, permissionStyles[permission], className)}>
      {permissionLabels[permission]}
    </span>
  );
}

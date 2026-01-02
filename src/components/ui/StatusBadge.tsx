"use client";

import { cn } from "@/lib/utils";

type Status =
  // Mentor statuses
  | "pending"
  | "accepted"
  | "active"
  | "rejected"
  | "revoked"
  // Admin statuses
  | "approved"
  | "suspended"
  | "banned";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusStyles: Record<Status, string> = {
  // Mentor
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  revoked: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  // Admin
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  suspended: "bg-red-500/20 text-red-400 border-red-500/30",
  banned: "bg-red-700/20 text-red-500 border-red-700/30",
};

const statusLabels: Record<Status, string> = {
  // Mentor
  pending: "Pendente",
  accepted: "Aceito",
  active: "Ativo",
  rejected: "Rejeitado",
  revoked: "Revogado",
  // Admin
  approved: "Aprovado",
  suspended: "Suspenso",
  banned: "Banido",
};

/**
 * StatusBadge
 *
 * Reusable badge component for displaying status (pending, active, etc.)
 * Used by ConvitesTable, MentoradosTable, and AdminUserTable.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded border px-2 py-1 text-center text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

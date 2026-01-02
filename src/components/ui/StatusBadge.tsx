"use client";

import { cn } from "@/lib/utils";

type Status = "pending" | "accepted" | "active" | "rejected" | "revoked";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusStyles: Record<Status, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  revoked: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const statusLabels: Record<Status, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  active: "Ativo",
  rejected: "Rejeitado",
  revoked: "Revogado",
};

/**
 * StatusBadge
 *
 * Reusable badge component for displaying status (pending, active, etc.)
 * Used by ConvitesTable and MentoradosTable.
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

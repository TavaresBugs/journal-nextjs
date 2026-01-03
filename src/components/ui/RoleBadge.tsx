"use client";

import { cn } from "@/lib/utils";

type Role = "admin" | "mentor" | "user" | "guest";

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const roleStyles: Record<Role, string> = {
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  mentor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  user: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  guest: "bg-gray-600/20 text-gray-400 border-gray-600/30",
};

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  mentor: "Mentor",
  user: "User",
  guest: "Guest",
};

/**
 * RoleBadge
 *
 * Reusable badge component for displaying user roles (admin, mentor, user, guest).
 * Used by AdminUserTable.
 */
export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded border px-2 py-1 text-center text-xs font-medium",
        roleStyles[role],
        className
      )}
    >
      {roleLabels[role]}
    </span>
  );
}

"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import type { UserExtended, UserStatus, UserRole } from "@/types";

interface AdminUserTableProps {
  users: UserExtended[];
  onApprove: (id: string) => void;
  onSuspend: (id: string) => void;
  loading: boolean;
}

const getStatusBadge = (status: UserStatus) => {
  const styles: Record<UserStatus, string> = {
    pending: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    approved: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    suspended: "bg-red-500/20 text-red-400 border border-red-500/30",
    banned: "bg-red-700/20 text-red-500 border border-red-700/30",
    rejected: "bg-gray-700/20 text-gray-500 border border-gray-700/30",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const getRoleBadge = (role: UserRole) => {
  const styles: Record<UserRole, string> = {
    admin: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    mentor: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
    user: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
    guest: "bg-gray-600/20 text-gray-500 border border-gray-600/30",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${styles[role]}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
};

/**
 * Admin user table with status badges and action buttons.
 */
export function AdminUserTable({ users, onApprove, onSuspend, loading }: AdminUserTableProps) {
  if (loading) {
    return <PageSkeleton />;
  }

  if (users.length === 0) {
    return <div className="py-12 text-center text-gray-400">Nenhum usuário encontrado.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-900/50">
            <th className="w-[280px] px-6 py-4 text-left font-medium text-gray-400">Usuário</th>
            <th className="w-[100px] px-4 py-4 text-center font-medium text-gray-400">Status</th>
            <th className="w-[80px] px-4 py-4 text-center font-medium text-gray-400">Role</th>
            <th className="w-[110px] px-4 py-4 text-center font-medium text-gray-400">Criado em</th>
            <th className="w-[110px] px-4 py-4 text-center font-medium text-gray-400">
              Último Login
            </th>
            <th className="w-[120px] px-4 py-4 text-center font-medium text-gray-400">Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-800 transition-colors hover:bg-gray-900/30"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {user.avatarUrl && user.avatarUrl.length > 0 ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-700">
                      <Image
                        src={user.avatarUrl}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-gray-800 font-medium text-gray-400">
                      {user.name?.charAt(0).toUpperCase() ||
                        user.email?.charAt(0).toUpperCase() ||
                        "U"}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white">{user.name || "Sem nome"}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-center">{getStatusBadge(user.status)}</td>
              <td className="px-4 py-4 text-center">{getRoleBadge(user.role)}</td>
              <td className="px-4 py-4 text-center text-sm text-gray-400">
                {new Date(user.createdAt).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-4 text-center text-sm text-gray-400">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("pt-BR") : "—"}
              </td>
              <td className="px-4 py-4 text-center">
                <div className="flex justify-center gap-2">
                  {user.status === "pending" && (
                    <Button size="sm" variant="success" onClick={() => onApprove(user.id)}>
                      Aprovar
                    </Button>
                  )}
                  {user.status === "approved" && user.role !== "admin" && (
                    <Button size="sm" variant="danger" onClick={() => onSuspend(user.id)}>
                      Suspender
                    </Button>
                  )}
                  {user.status === "suspended" && (
                    <Button size="sm" variant="success" onClick={() => onApprove(user.id)}>
                      Reativar
                    </Button>
                  )}
                  {user.role === "admin" && <span className="text-xs text-gray-500">—</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

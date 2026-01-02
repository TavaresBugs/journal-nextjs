"use client";

import Image from "next/image";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { StatusBadge, RoleBadge } from "@/components/ui";
import type { UserExtended, UserStatus, UserRole } from "@/types";

interface AdminUserTableProps {
  users: UserExtended[];
  onApprove: (id: string) => void;
  onSuspend: (id: string) => void;
  onDelete?: (id: string) => void;
  loading: boolean;
}

/**
 * Admin user table with status badges and action buttons.
 */
export function AdminUserTable({
  users,
  onApprove,
  onSuspend,
  onDelete,
  loading,
}: AdminUserTableProps) {
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
              <td className="px-4 py-4 text-center">
                <StatusBadge status={user.status as UserStatus} className="w-24" />
              </td>
              <td className="px-4 py-4 text-center">
                <RoleBadge role={user.role as UserRole} className="w-24" />
              </td>
              <td className="px-4 py-4 text-center text-sm text-gray-400">
                {new Date(user.createdAt).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-4 text-center text-sm text-gray-400">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("pt-BR") : "—"}
              </td>
              <td className="px-4 py-4 text-center">
                <div className="flex justify-center gap-1">
                  {user.status === "pending" && (
                    <IconActionButton
                      variant="approve"
                      size="sm"
                      onClick={() => onApprove(user.id)}
                      title="Aprovar usuário"
                    />
                  )}
                  {user.status === "approved" && user.role !== "admin" && (
                    <IconActionButton
                      variant="suspend"
                      size="sm"
                      onClick={() => onSuspend(user.id)}
                      title="Suspender usuário"
                    />
                  )}
                  {user.status === "suspended" && (
                    <IconActionButton
                      variant="reactivate"
                      size="sm"
                      onClick={() => onApprove(user.id)}
                      title="Reativar usuário"
                    />
                  )}
                  {user.role !== "admin" && onDelete && (
                    <IconActionButton
                      variant="delete"
                      size="sm"
                      onClick={() => onDelete(user.id)}
                      title="Deletar usuário"
                    />
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

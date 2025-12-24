"use client";

import type { AuditLog } from "@/types";

interface AdminAuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
}

/**
 * Format action name to Portuguese-friendly display.
 */
function formatAction(action: string): string {
  const actionMap: Record<string, string> = {
    delete_user: "Deletou usuário",
    user_deleted: "Deletou usuário",
    update_user_status: "Alterou status",
    user_status_change: "Alterou status",
    update_user_role: "Alterou permissão",
    user_role_change: "Alterou permissão",
  };
  return actionMap[action] || action.replace(/_/g, " ");
}

/**
 * Get badge color based on action type.
 */
function getActionBadgeStyle(action: string): string {
  if (action.includes("delete")) {
    return "border-red-500/30 bg-red-500/20 text-red-400";
  }
  if (action.includes("status")) {
    return "border-amber-500/30 bg-amber-500/20 text-amber-400";
  }
  if (action.includes("role")) {
    return "border-purple-500/30 bg-purple-500/20 text-purple-400";
  }
  return "border-gray-700 bg-gray-800 text-gray-300";
}

/**
 * Format email for display (truncate if too long).
 */
function formatEmail(email: string | null | undefined, fallbackId?: string | null): string {
  if (email) {
    if (email.length <= 30) return email;
    const [user, domain] = email.split("@");
    if (user && domain) {
      return `${user.slice(0, 12)}...@${domain}`;
    }
    return email.slice(0, 27) + "...";
  }
  if (fallbackId) {
    return `ID: ${fallbackId.slice(0, 8)}`;
  }
  return "—";
}

/**
 * Admin audit log table showing system actions with full context.
 */
export function AdminAuditLogTable({ logs, loading }: AdminAuditLogTableProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500"></div>
        Carregando logs...
      </div>
    );
  }

  if (logs.length === 0) {
    return <div className="py-12 text-center text-gray-400">Nenhum log encontrado.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-900/50">
            <th className="w-36 px-4 py-3 text-center text-sm font-medium text-gray-400">Data</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">
              Executado por
            </th>
            <th className="w-32 px-4 py-3 text-center text-sm font-medium text-gray-400">Ação</th>
            <th className="px-4 py-3 text-center text-sm font-medium text-gray-400">
              Usuário Afetado
            </th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => {
            const adminDisplay = formatEmail(log.actorEmail, log.userId);
            const targetDisplay = formatEmail(log.targetUserEmail, log.resourceId);

            return (
              <tr
                key={log.id}
                className="border-b border-gray-800 transition-colors hover:bg-gray-900/30"
              >
                {/* Data */}
                <td className="px-4 py-3 text-center text-sm text-gray-400">
                  {new Date(log.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>

                {/* Admin que executou */}
                <td className="px-4 py-3 text-center text-sm">
                  <span
                    className="font-medium text-cyan-400"
                    title={log.actorEmail || log.userId || ""}
                  >
                    {adminDisplay}
                  </span>
                </td>

                {/* Ação */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block rounded border px-3 py-1 text-xs font-medium whitespace-nowrap ${getActionBadgeStyle(log.action)}`}
                  >
                    {formatAction(log.action)}
                  </span>
                </td>

                {/* Usuário afetado */}
                <td className="px-4 py-3 text-center text-sm">
                  {log.resourceType === "user" ? (
                    <span
                      className="font-medium text-white"
                      title={log.targetUserEmail || log.resourceId || ""}
                    >
                      {targetDisplay}
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

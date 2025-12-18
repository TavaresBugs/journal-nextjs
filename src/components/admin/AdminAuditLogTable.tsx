"use client";

import type { AuditLog } from "@/types";

interface AdminAuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
}

/**
 * Admin audit log table showing system actions.
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
            <th className="px-4 py-4 text-left font-medium text-gray-400">Data</th>
            <th className="px-4 py-4 text-left font-medium text-gray-400">Usuário</th>
            <th className="px-4 py-4 text-left font-medium text-gray-400">Ação</th>
            <th className="px-4 py-4 text-left font-medium text-gray-400">Recurso</th>
            <th className="px-4 py-4 text-left font-medium text-gray-400">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-gray-800 transition-colors hover:bg-gray-900/30"
            >
              <td className="px-4 py-4 text-sm text-gray-400">
                {new Date(log.createdAt).toLocaleString("pt-BR")}
              </td>
              <td className="px-4 py-4 text-sm text-white">
                {log.userEmail || log.userId?.slice(0, 8) || "Sistema"}
              </td>
              <td className="px-4 py-4">
                <span className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs font-medium text-gray-300">
                  {log.action}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-400">
                {log.resourceType && (
                  <span>
                    {log.resourceType}/{log.resourceId?.slice(0, 8)}
                  </span>
                )}
              </td>
              <td className="px-4 py-4 font-mono text-xs text-gray-500">
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <code className="rounded bg-gray-900 px-2 py-1">
                    {JSON.stringify(log.metadata)}
                  </code>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

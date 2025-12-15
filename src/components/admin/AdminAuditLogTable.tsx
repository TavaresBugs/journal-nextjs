'use client';

import type { AuditLog } from '@/types';

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
            <div className="text-gray-400 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                Carregando logs...
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-gray-400 py-12 text-center">
                Nenhum log encontrado.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-700 bg-gray-900/50">
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Data</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Usuário</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Ação</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Recurso</th>
                        <th className="text-left py-4 px-4 text-gray-400 font-medium">Detalhes</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                            <td className="py-4 px-4 text-gray-400 text-sm">
                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-4 px-4 text-sm text-white">
                                {log.userEmail || log.userId?.slice(0, 8) || 'Sistema'}
                            </td>
                            <td className="py-4 px-4">
                                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                                    {log.action}
                                </span>
                            </td>
                            <td className="py-4 px-4 text-gray-400 text-sm">
                                {log.resourceType && (
                                    <span>{log.resourceType}/{log.resourceId?.slice(0, 8)}</span>
                                )}
                            </td>
                            <td className="py-4 px-4 text-gray-500 text-xs font-mono">
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <code className="bg-gray-900 px-2 py-1 rounded">{JSON.stringify(log.metadata)}</code>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

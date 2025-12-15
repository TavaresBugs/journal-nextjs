'use client';

import { Button } from '@/components/ui/Button';
import type { MentorInvite } from '@/types';

interface ConvitesTableProps {
    invites: MentorInvite[];
    onRevoke: (id: string) => void;
    loading: boolean;
}

const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        accepted: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
        revoked: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    };
    const labels: Record<string, string> = {
        pending: 'Pendente',
        accepted: 'Aceito',
        rejected: 'Rejeitado',
        revoked: 'Revogado',
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
            {labels[status]}
        </span>
    );
};

/**
 * Table showing sent invites with status and actions.
 */
export function ConvitesTable({ invites, onRevoke, loading }: ConvitesTableProps) {
    if (loading) {
        return (
            <div className="text-gray-400 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                Carregando convites...
            </div>
        );
    }

    if (invites.length === 0) {
        return (
            <div className="text-gray-500 py-12 text-center">
                <span className="text-4xl block mb-3">📤</span>
                Nenhum convite enviado ainda.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-700 bg-gray-900/50">
                        <th className="text-left py-4 px-6 text-gray-400 font-medium">Mentorado</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Permissão</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Status</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Enviado em</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {invites.map(invite => (
                        <tr key={invite.id} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 font-bold">
                                        {invite.menteeEmail?.charAt(0).toUpperCase() || 'M'}
                                    </div>
                                    <span className="text-white">{invite.menteeEmail || 'Email não disponível'}</span>
                                </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    invite.permission === 'comment' 
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                }`}>
                                    {invite.permission === 'comment' ? 'Comentar' : 'Visualizar'}
                                </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                                {getStatusBadge(invite.status)}
                            </td>
                            <td className="py-4 px-4 text-center text-gray-400">
                                {new Date(invite.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-4 px-4 text-center">
                                {invite.status === 'pending' && (
                                    <Button size="sm" variant="danger" onClick={() => onRevoke(invite.id)}>
                                        Cancelar
                                    </Button>
                                )}
                                {invite.status === 'accepted' && (
                                    <Button size="sm" variant="danger" onClick={() => onRevoke(invite.id)}>
                                        Revogar
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

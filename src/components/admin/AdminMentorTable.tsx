'use client';

import Image from 'next/image';
import type { UserExtended } from '@/types';

interface AdminMentorTableProps {
    users: UserExtended[];
    onToggleMentor: (id: string, isMentor: boolean) => void;
    loading: boolean;
}

/**
 * Admin mentor management table.
 * Shows current mentors and allows adding/removing mentor role.
 */
export function AdminMentorTable({ users, onToggleMentor, loading }: AdminMentorTableProps) {
    if (loading) {
        return (
            <div className="text-gray-400 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                Carregando usuários...
            </div>
        );
    }

    // Filter to show only approved users (potential mentors)
    const approvedUsers = users.filter(u => u.status === 'approved' && u.role !== 'admin');
    const mentors = approvedUsers.filter(u => u.role === 'mentor');
    const nonMentors = approvedUsers.filter(u => u.role !== 'mentor');

    return (
        <div className="p-6">
            {/* Current Mentors */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    🎓 Mentores Ativos ({mentors.length})
                </h3>
                {mentors.length === 0 ? (
                    <div className="text-gray-500 py-4 text-center border border-dashed border-gray-700 rounded-lg">
                        Nenhum mentor definido ainda.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mentors.map(user => (
                            <div key={user.id} className="bg-gray-800/50 border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {user.avatarUrl && user.avatarUrl.length > 0 ? (
                                        <div className="relative w-10 h-10 rounded-full border border-cyan-500/30 overflow-hidden">
                                            <Image
                                                src={user.avatarUrl}
                                                alt=""
                                                fill
                                                className="object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-white font-medium">{user.name || 'Sem nome'}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onToggleMentor(user.id, false)}
                                    className="px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                    Remover
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add New Mentors */}
            <div>
                <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                    👤 Adicionar como Mentor
                </h3>
                {nonMentors.length === 0 ? (
                    <div className="text-gray-500 py-4 text-center border border-dashed border-gray-700 rounded-lg">
                        Todos os usuários aprovados já são mentores.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700 bg-gray-900/50">
                                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Usuário</th>
                                    <th className="text-center py-3 px-4 text-gray-400 font-medium w-32">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nonMentors.map(user => (
                                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatarUrl && user.avatarUrl.length > 0 ? (
                                                    <div className="relative w-8 h-8 rounded-full border border-gray-700 overflow-hidden">
                                                        <Image
                                                            src={user.avatarUrl}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 text-sm font-medium">
                                                        {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-white">{user.name || 'Sem nome'}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => onToggleMentor(user.id, true)}
                                                className="px-3 py-1.5 text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors"
                                            >
                                                + Tornar Mentor
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

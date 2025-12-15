'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import type { UserExtended, UserStatus, UserRole } from '@/types';

interface AdminUserTableProps {
    users: UserExtended[];
    onApprove: (id: string) => void;
    onSuspend: (id: string) => void;
    loading: boolean;
}

const getStatusBadge = (status: UserStatus) => {
    const styles: Record<UserStatus, string> = {
        pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        approved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        suspended: 'bg-red-500/20 text-red-400 border border-red-500/30',
        banned: 'bg-red-700/20 text-red-500 border border-red-700/30',
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

const getRoleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
        admin: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
        mentor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
        user: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
        guest: 'bg-gray-600/20 text-gray-500 border border-gray-600/30',
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${styles[role]}`}>
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
        return (
            <div className="text-gray-400 py-12 text-center">
                Nenhum usuário encontrado.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-700 bg-gray-900/50">
                        <th className="text-left py-4 px-6 text-gray-400 font-medium w-[280px]">Usuário</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium w-[100px]">Status</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium w-[80px]">Role</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium w-[110px]">Criado em</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium w-[110px]">Último Login</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium w-[120px]">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    {user.avatarUrl && user.avatarUrl.length > 0 ? (
                                        <div className="relative w-10 h-10 rounded-full border border-gray-700 overflow-hidden">
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
                                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 font-medium">
                                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-white font-medium">{user.name || 'Sem nome'}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 px-4 text-center">{getStatusBadge(user.status)}</td>
                            <td className="py-4 px-4 text-center">{getRoleBadge(user.role)}</td>
                            <td className="py-4 px-4 text-gray-400 text-sm text-center">
                                {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-4 px-4 text-gray-400 text-sm text-center">
                                {user.lastLoginAt 
                                    ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR')
                                    : '—'
                                }
                            </td>
                            <td className="py-4 px-4 text-center">
                                <div className="flex gap-2 justify-center">
                                    {user.status === 'pending' && (
                                        <Button size="sm" variant="success" onClick={() => onApprove(user.id)}>
                                            Aprovar
                                        </Button>
                                    )}
                                    {user.status === 'approved' && user.role !== 'admin' && (
                                        <Button size="sm" variant="danger" onClick={() => onSuspend(user.id)}>
                                            Suspender
                                        </Button>
                                    )}
                                    {user.status === 'suspended' && (
                                        <Button size="sm" variant="success" onClick={() => onApprove(user.id)}>
                                            Reativar
                                        </Button>
                                    )}
                                    {user.role === 'admin' && (
                                        <span className="text-xs text-gray-500">—</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

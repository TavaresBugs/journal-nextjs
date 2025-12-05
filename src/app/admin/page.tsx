'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { 
    getAllUsers, 
    getAdminStats, 
    updateUserStatus,
    updateUserRole,
    getAuditLogs
} from '@/services/adminService';
import { UserExtended, AuditLog, UserStatus, UserRole, AdminStats } from '@/types';

// ============================================
// STATS CARDS
// ============================================

function StatsCards({ stats }: { stats: AdminStats | null }) {
    if (!stats) return <div className="text-gray-400">Carregando estatísticas...</div>;

    const cards = [
        { label: 'Total Usuários', value: stats.totalUsers, color: 'text-white', border: 'border-gray-700' },
        { label: 'Pendentes', value: stats.pendingUsers, color: 'text-amber-400', border: 'border-amber-500/30' },
        { label: 'Aprovados', value: stats.approvedUsers, color: 'text-emerald-400', border: 'border-emerald-500/30' },
        { label: 'Suspensos', value: stats.suspendedUsers, color: 'text-red-400', border: 'border-red-500/30' },
        { label: 'Admins', value: stats.adminUsers, color: 'text-purple-400', border: 'border-purple-500/30' },
        { label: 'Logins Hoje', value: stats.todayLogins, color: 'text-cyan-400', border: 'border-cyan-500/30' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {cards.map(card => (
                <div 
                    key={card.label} 
                    className={`bg-gray-900/50 border ${card.border} p-4 rounded-xl backdrop-blur-sm`}
                >
                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                    <div className="text-sm text-gray-400">{card.label}</div>
                </div>
            ))}
        </div>
    );
}

// ============================================
// USER TABLE
// ============================================

function UserTable({ 
    users, 
    onApprove, 
    onSuspend, 
    loading 
}: { 
    users: UserExtended[]; 
    onApprove: (id: string) => void;
    onSuspend: (id: string) => void;
    loading: boolean;
}) {
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

    if (loading) {
        return (
            <div className="text-gray-400 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                Carregando usuários...
            </div>
        );
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
                                    {user.avatarUrl ? (
                                        <div className="relative w-10 h-10 rounded-full border border-gray-700 overflow-hidden">
                                            <Image
                                                src={user.avatarUrl}
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 font-medium">
                                            {user.email?.charAt(0).toUpperCase()}
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
                                        <Button 
                                            size="sm" 
                                            variant="success"
                                            onClick={() => onApprove(user.id)}
                                        >
                                            Aprovar
                                        </Button>
                                    )}
                                    {user.status === 'approved' && user.role !== 'admin' && (
                                        <Button 
                                            size="sm" 
                                            variant="danger"
                                            onClick={() => onSuspend(user.id)}
                                        >
                                            Suspender
                                        </Button>
                                    )}
                                    {user.status === 'suspended' && (
                                        <Button 
                                            size="sm" 
                                            variant="success"
                                            onClick={() => onApprove(user.id)}
                                        >
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

// ============================================
// AUDIT LOG TABLE
// ============================================

function AuditLogTable({ logs, loading }: { logs: AuditLog[]; loading: boolean }) {
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

// ============================================
// MENTOR TABLE
// ============================================

function MentorTable({ 
    users, 
    onToggleMentor,
    loading 
}: { 
    users: UserExtended[]; 
    onToggleMentor: (id: string, isMentor: boolean) => void;
    loading: boolean;
}) {
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
                                    {user.avatarUrl ? (
                                        <div className="relative w-10 h-10 rounded-full border border-cyan-500/30 overflow-hidden">
                                            <Image
                                                src={user.avatarUrl}
                                                alt=""
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
                                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
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
                                                {user.avatarUrl ? (
                                                    <div className="relative w-8 h-8 rounded-full border border-gray-700 overflow-hidden">
                                                        <Image
                                                            src={user.avatarUrl}
                                                            alt=""
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 text-sm font-medium">
                                                        {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
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

// ============================================
// MAIN PAGE
// ============================================

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'mentors'>('users');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<UserExtended[]>([]);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const loadData = useCallback(async () => {
        const [statsData, usersData] = await Promise.all([
            getAdminStats(),
            getAllUsers(),
        ]);
        setStats(statsData);
        setUsers(usersData);
        setLoadingUsers(false);
    }, []);

    const loadLogs = useCallback(async () => {
        setLoadingLogs(true);
        const logsData = await getAuditLogs({ limit: 50 });
        setLogs(logsData);
        setLoadingLogs(false);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
             await loadData();
        };
        fetchData();
    }, [loadData]);

    useEffect(() => {
        if (activeTab === 'logs' && logs.length === 0) {
            const fetchLogs = async () => {
                 await loadLogs();
            };
            fetchLogs();
        }
    }, [activeTab, logs.length, loadLogs]);

    const handleApprove = async (id: string) => {
        await updateUserStatus(id, 'approved');
        loadData();
    };

    const handleSuspend = async (id: string) => {
        await updateUserStatus(id, 'suspended');
        loadData();
    };

    const handleToggleMentor = async (id: string, makeMentor: boolean) => {
        await updateUserRole(id, makeMentor ? 'mentor' : 'user');
        loadData();
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Grid pattern overlay - same as main page */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />

            <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
                {/* Header Box - matching main page style */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-xl">
                    {/* Left: Title & Subtitle */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-800/50 rounded-xl flex items-center justify-center text-3xl border border-gray-700 shadow-inner">
                            🛡️
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: '#bde6fb' }}>Painel Admin</h1>
                            <p className="text-gray-400">Gerenciamento de usuários e logs</p>
                        </div>
                    </div>

                    {/* Right: Back Button */}
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 text-gray-400 hover:text-cyan-400 bg-gray-950/50 hover:bg-gray-900 border border-gray-700 hover:border-cyan-500/50 rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Voltar ao Dashboard
                    </button>
                </div>

                {/* Stats */}
                <StatsCards stats={stats} />

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-3 px-1 font-medium transition-colors ${
                            activeTab === 'users'
                                ? 'border-b-2'
                                : 'text-gray-400 hover:text-white'
                        }`}
                        style={activeTab === 'users' ? { color: '#bde6fb', borderColor: '#bde6fb' } : {}}
                    >
                        👥 Usuários
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`pb-3 px-1 font-medium transition-colors ${
                            activeTab === 'logs'
                                ? 'border-b-2'
                                : 'text-gray-400 hover:text-white'
                        }`}
                        style={activeTab === 'logs' ? { color: '#bde6fb', borderColor: '#bde6fb' } : {}}
                    >
                        📋 Audit Logs
                    </button>
                    <button
                        onClick={() => setActiveTab('mentors')}
                        className={`pb-3 px-1 font-medium transition-colors ${
                            activeTab === 'mentors'
                                ? 'border-b-2'
                                : 'text-gray-400 hover:text-white'
                        }`}
                        style={activeTab === 'mentors' ? { color: '#bde6fb', borderColor: '#bde6fb' } : {}}
                    >
                        🎓 Mentores
                    </button>
                </div>

                {/* Content */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl backdrop-blur-sm overflow-hidden">
                    {activeTab === 'users' && (
                        <UserTable 
                            users={users} 
                            onApprove={handleApprove}
                            onSuspend={handleSuspend}
                            loading={loadingUsers}
                        />
                    )}
                    {activeTab === 'logs' && (
                        <AuditLogTable logs={logs} loading={loadingLogs} />
                    )}
                    {activeTab === 'mentors' && (
                        <MentorTable 
                            users={users}
                            onToggleMentor={handleToggleMentor}
                            loading={loadingUsers}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

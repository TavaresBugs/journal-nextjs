'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
    getAllUsers, 
    getAdminStats, 
    updateUserStatus,
    updateUserRole,
    getAuditLogs
} from '@/services/admin/admin';
import { 
    AdminStatsCards, 
    AdminUserTable, 
    AdminAuditLogTable, 
    AdminMentorTable 
} from '@/components/admin';
import { UserExtended, AuditLog, AdminStats } from '@/types';
import { BackButton } from '@/components/shared/BackButton';
import { SegmentedToggle } from '@/components/ui';

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (activeTab === 'logs' && logs.length === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadLogs();
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
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] bg-size-[20px_20px] mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />

            <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
                {/* Header Box */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-800/50 rounded-xl flex items-center justify-center text-3xl border border-gray-700 shadow-inner">
                            🛡️
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: '#bde6fb' }}>Painel Admin</h1>
                            <p className="text-gray-400">Gerenciamento de usuários e logs</p>
                        </div>
                    </div>
                    <BackButton />
                </div>

                {/* Stats */}
                <AdminStatsCards stats={stats} />

                {/* Tabs */}
                <SegmentedToggle
                    options={[
                        { value: 'users', label: '👥 Usuários' },
                        { value: 'logs', label: '📋 Audit Logs' },
                        { value: 'mentors', label: '🎓 Mentores' }
                    ]}
                    value={activeTab}
                    onChange={(val) => setActiveTab(val as 'users' | 'logs' | 'mentors')}
                    className="mb-6 w-full max-w-md"
                />

                {/* Content */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl backdrop-blur-sm overflow-hidden">
                    {activeTab === 'users' && (
                        <AdminUserTable 
                            users={users} 
                            onApprove={handleApprove}
                            onSuspend={handleSuspend}
                            loading={loadingUsers}
                        />
                    )}
                    {activeTab === 'logs' && (
                        <AdminAuditLogTable logs={logs} loading={loadingLogs} />
                    )}
                    {activeTab === 'mentors' && (
                        <AdminMentorTable 
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

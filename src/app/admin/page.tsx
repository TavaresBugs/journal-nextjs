'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAccountStore } from '@/store/useAccountStore';
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

// Back button component (small, kept inline)
function BackButton() {
    const router = useRouter();
    const { currentAccountId } = useAccountStore();
    
    const goBack = () => {
        if (currentAccountId) {
            router.push(`/dashboard/${currentAccountId}`);
        } else {
            router.push('/');
        }
    };
    
    return (
        <Button variant="ghost" onClick={goBack} leftIcon={
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
        }>
            Voltar ao Dashboard
        </Button>
    );
}

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
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (activeTab === 'logs' && logs.length === 0) {
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

    const tabs = [
        { id: 'users', label: '👥 Usuários' },
        { id: 'logs', label: '📋 Audit Logs' },
        { id: 'mentors', label: '🎓 Mentores' },
    ] as const;

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />

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
                <div className="flex gap-4 mb-6 border-b border-gray-700">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 px-1 font-medium transition-colors ${
                                activeTab === tab.id ? 'border-b-2' : 'text-gray-400 hover:text-white'
                            }`}
                            style={activeTab === tab.id ? { color: '#bde6fb', borderColor: '#bde6fb' } : {}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

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

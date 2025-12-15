'use client';

import type { AdminStats } from '@/types';

interface AdminStatsCardsProps {
    stats: AdminStats | null;
}

/**
 * Admin stats cards showing user statistics.
 */
export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
    if (!stats) {
        return <div className="text-gray-400">Carregando estatísticas...</div>;
    }

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

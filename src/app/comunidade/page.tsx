'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useAccountStore } from '@/store/useAccountStore';
import { 
    getPublicPlaybooks,
    togglePlaybookStar
} from '@/services/community/playbookService';
import {
    getLeaderboard,
    getMyLeaderboardStatus,
    joinLeaderboard,
    leaveLeaderboard,
    getCurrentUserDisplayName
} from '@/services/community/leaderboardService';
import { SharedPlaybook, LeaderboardEntry, LeaderboardOptIn } from '@/types';

// ============================================
// STATS CARDS
// ============================================

interface CommunityStats {
    totalPlaybooks: number;
    topContributors: number;
    totalStars: number;
}

function StatsCards({ stats }: { stats: CommunityStats }) {
    const cards = [
        { label: 'Playbooks Públicos', value: stats.totalPlaybooks, color: 'text-cyan-400', border: 'border-cyan-500/30' },
        { label: 'Contribuidores', value: stats.topContributors, color: 'text-purple-400', border: 'border-purple-500/30' },
        { label: 'Total de Stars', value: stats.totalStars, color: 'text-amber-400', border: 'border-amber-500/30' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
// PLAYBOOKS GRID
// ============================================

function PlaybooksGrid({ 
    playbooks, 
    onStar,
    onView,
    loading 
}: { 
    playbooks: SharedPlaybook[];
    onStar: (id: string) => void;
    onView: (playbook: SharedPlaybook) => void;
    loading: boolean;
}) {
    if (loading) {
        return <PageSkeleton />;
    }

    if (playbooks.length === 0) {
        return (
            <div className="text-gray-500 py-12 text-center">
                <span className="text-4xl block mb-3">📚</span>
                Nenhum playbook compartilhado ainda.
                <br />
                <span className="text-sm">Seja o primeiro a compartilhar!</span>
            </div>
        );
    }

    // Helper function to format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    // Helper for win rate color
    const getWinRateColor = (winRate: number) => {
        if (winRate >= 70) return '#10b981'; // green
        if (winRate >= 50) return '#3b82f6'; // blue
        if (winRate >= 30) return '#f59e0b'; // amber
        return '#ef4444'; // red
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {playbooks.map(playbook => {
                const stats = playbook.authorStats;
                const winRate = stats?.winRate || 0;
                const netPnl = stats?.netPnl || 0;
                const totalTrades = stats?.totalTrades || 0;
                const avgRR = stats?.avgRR || 0;
                const maxWinStreak = stats?.maxWinStreak || 0;

                return (
                    <div 
                        key={playbook.id}
                        className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden transition-all duration-300 hover:border-gray-600 cursor-pointer"
                        onClick={() => onView(playbook)}
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-gray-700/50">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3 flex-1">
                                    <div 
                                        className="text-3xl p-2 rounded-lg bg-gray-900/50"
                                        style={{ color: playbook.playbook?.color }}
                                    >
                                        {playbook.playbook?.icon || '📘'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-100">
                                            {playbook.playbook?.name || 'Playbook'}
                                        </h3>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {totalTrades} trade{totalTrades !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Star Button */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStar(playbook.id);
                                    }}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                                        playbook.hasUserStarred 
                                            ? 'bg-amber-500/20 text-amber-400' 
                                            : 'bg-gray-700/50 text-gray-400 hover:text-amber-400'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={playbook.hasUserStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                    </svg>
                                    <span className="text-sm">{playbook.stars}</span>
                                </button>
                            </div>
                        </div>

                        {/* Main Metrics */}
                        <div className="p-5">
                            <div className="flex items-center justify-between gap-6 mb-5">
                                {/* Win Rate Circle */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-[90px] h-[90px]">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle
                                                cx="45"
                                                cy="45"
                                                r="40"
                                                stroke="#374151"
                                                strokeWidth="10"
                                                fill="none"
                                            />
                                            <circle
                                                cx="45"
                                                cy="45"
                                                r="40"
                                                stroke={getWinRateColor(winRate)}
                                                strokeWidth="10"
                                                fill="none"
                                                strokeDasharray={`${(winRate / 100) * 251.2} 251.2`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xl font-bold text-white">{winRate.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">Win rate</div>
                                </div>

                                {/* Net P&L */}
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 mb-1">Net P&L</div>
                                    <div className={`text-2xl font-bold ${netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(netPnl)}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Metrics */}
                            <div className="pt-4 border-t border-gray-700/50">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Avg RR</div>
                                        <div className="text-lg font-bold text-gray-200">
                                            {avgRR.toFixed(2)}R
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Win Streak</div>
                                        <div className="text-lg font-bold text-green-400">
                                            {maxWinStreak}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Author Info */}
                            <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-3 border-t border-gray-700/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs text-cyan-400 font-bold">
                                        {playbook.userName?.charAt(0).toUpperCase() || 'T'}
                                    </div>
                                    <span className="text-gray-400">{playbook.userName || 'Trader Anônimo'}</span>
                                </div>
                                <span className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                    {playbook.downloads}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================
// LEADERBOARD TABLE
// ============================================

function LeaderboardTable({ 
    entries,
    optInStatus,
    onJoin,
    onLeave,
    loading 
}: { 
    entries: LeaderboardEntry[];
    optInStatus: LeaderboardOptIn | null;
    onJoin: () => void;
    onLeave: () => void;
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="text-gray-400 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                Carregando leaderboard...
            </div>
        );
    }

    return (
        <div>
            {/* Opt-in banner */}
            <div className="p-4 border-b border-gray-700 bg-gray-900/30">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-white font-medium">Participar do Leaderboard</h4>
                        <p className="text-sm text-gray-400">
                            {optInStatus 
                                ? `Você está participando como "${optInStatus.displayName}"`
                                : 'Apareça no ranking e compare com outros traders.'}
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant={optInStatus ? 'danger' : 'success'}
                        onClick={optInStatus ? onLeave : onJoin}
                    >
                        {optInStatus ? 'Sair do Ranking' : 'Participar'}
                    </Button>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="text-gray-500 py-12 text-center">
                    <span className="text-4xl block mb-3">🏆</span>
                    Nenhum participante ainda.
                    <br />
                    <span className="text-sm">Seja o primeiro a aparecer no ranking!</span>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700 bg-gray-900/50">
                                <th className="text-center py-4 px-4 text-gray-400 font-medium w-16">#</th>
                                <th className="text-left py-4 px-6 text-gray-400 font-medium">Trader</th>
                                <th className="py-4 px-4 text-center text-gray-400 font-medium text-sm">Win Rate</th>
                                <th className="py-4 px-4 text-center text-gray-400 font-medium text-sm">
                                    <div className="flex items-center justify-center gap-1">
                                        Streak
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.3.3.5.6.8.9.7 1.2.7 2.4.1 2.9Z" />
                                        </svg>
                                    </div>
                                </th>
                                <th className="py-4 px-4 text-center text-gray-400 font-medium text-sm">Avg RR</th>
                                <th className="py-4 px-4 text-center text-gray-400 font-medium text-sm">Trades</th>
                                <th className="py-4 px-4 text-center text-gray-400 font-medium text-sm">Total P&L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, index) => (
                                <tr key={entry.userId} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                                    <td className="py-4 px-4 text-center">
                                        {index < 3 ? (
                                            <span className="text-2xl">
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">{index + 1}</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                                index === 0 ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' :
                                                index === 1 ? 'bg-gray-400/20 border border-gray-400/30 text-gray-300' :
                                                index === 2 ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400' :
                                                'bg-gray-800 border border-gray-700 text-gray-400'
                                            }`}>
                                                {entry.displayName?.charAt(0).toUpperCase() || 'T'}
                                            </div>
                                            <span className="text-white font-medium">{entry.displayName || 'Trader'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        {entry.showWinRate && entry.winRate !== undefined ? (
                                            <span className={`font-bold ${entry.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                {entry.winRate.toFixed(1)}%
                                            </span>
                                        ) : (
                                            <span className="text-gray-600">—</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-center font-bold text-cyan-400">
                                        {entry.streak || 0}
                                    </td>
                                    <td className="py-4 px-4 text-center text-gray-300">
                                        {entry.avgRR !== undefined 
                                            ? `${entry.avgRR.toFixed(2)}R`
                                            : '—'}
                                    </td>
                                    <td className="py-4 px-4 text-center text-gray-300">
                                        {entry.showTotalTrades && entry.totalTrades !== undefined 
                                            ? entry.totalTrades 
                                            : '—'}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        {entry.showPnl && entry.totalPnl !== undefined ? (
                                            <span className={`font-bold text-base ${entry.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {entry.totalPnl >= 0 ? '+' : ''}R${entry.totalPnl.toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-600">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function ComunidadePage() {
    const router = useRouter();
    const { currentAccountId } = useAccountStore();
    const [activeTab, setActiveTab] = useState<'playbooks' | 'leaderboard'>('playbooks');
    const [playbooks, setPlaybooks] = useState<SharedPlaybook[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [optInStatus, setOptInStatus] = useState<LeaderboardOptIn | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewingPlaybook, setViewingPlaybook] = useState<SharedPlaybook | null>(null);

    // Stats calculadas
    const stats: CommunityStats = {
        totalPlaybooks: playbooks.length,
        topContributors: new Set(playbooks.map(p => p.userId)).size,
        totalStars: playbooks.reduce((acc, p) => acc + (p.stars || 0), 0),
    };

    // Voltar para última carteira ou home
    const goBack = () => {
        if (currentAccountId) {
            router.push(`/dashboard/${currentAccountId}`);
        } else {
            router.push('/');
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [playbooksData, leaderboardData, optIn] = await Promise.all([
                getPublicPlaybooks(),
                getLeaderboard(),
                getMyLeaderboardStatus(),
            ]);
            setPlaybooks(playbooksData);
            setLeaderboard(leaderboardData);
            setOptInStatus(optIn);
        } catch (error) {
            console.error('Error loading community data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Wrap loadData call in a function to avoid direct promise return
        const fetchData = async () => {
             await loadData();
        };
        fetchData();
    }, [loadData]);

    const handleStar = async (playbookId: string) => {
        const success = await togglePlaybookStar(playbookId);
        if (success) loadData();
    };

    const handleJoinLeaderboard = async () => {
        let displayName = await getCurrentUserDisplayName();
        
        if (!displayName) {
            displayName = prompt('Escolha um nome de exibição:');
        }
        
        if (!displayName) return;
        
        const result = await joinLeaderboard(displayName, {
            showWinRate: true,
            showProfitFactor: true,
            showTotalTrades: true,
            showPnl: true
        });
        if (result) loadData();
    };

    const handleLeaveLeaderboard = async () => {
        if (!confirm('Tem certeza que deseja sair do leaderboard?')) return;
        const success = await leaveLeaderboard();
        if (success) loadData();
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Grid pattern overlay - same as admin page */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />

            <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
                {/* Header Box - matching admin page style */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-xl">
                    {/* Left: Title & Subtitle */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-800/50 rounded-xl flex items-center justify-center text-3xl border border-gray-700 shadow-inner">
                            🌐
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: '#bde6fb' }}>Comunidade</h1>
                            <p className="text-gray-400">Playbooks públicos e leaderboard</p>
                        </div>
                    </div>

                    {/* Right: Back Button */}
                    <button 
                        onClick={goBack}
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
                        onClick={() => setActiveTab('playbooks')}
                        className={`pb-3 px-1 font-medium transition-colors ${
                            activeTab === 'playbooks'
                                ? 'border-b-2'
                                : 'text-gray-400 hover:text-white'
                        }`}
                        style={activeTab === 'playbooks' ? { color: '#bde6fb', borderColor: '#bde6fb' } : {}}
                    >
                        📚 Playbooks Públicos
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`pb-3 px-1 font-medium transition-colors ${
                            activeTab === 'leaderboard'
                                ? 'border-b-2'
                                : 'text-gray-400 hover:text-white'
                        }`}
                        style={activeTab === 'leaderboard' ? { color: '#bde6fb', borderColor: '#bde6fb' } : {}}
                    >
                        🏆 Leaderboard
                    </button>
                </div>

                {/* Content */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl backdrop-blur-sm overflow-hidden">
                    {activeTab === 'playbooks' && (
                        <PlaybooksGrid 
                            playbooks={playbooks}
                            onStar={handleStar}
                            onView={(playbook) => setViewingPlaybook(playbook)}
                            loading={loading}
                        />
                    )}
                    {activeTab === 'leaderboard' && (
                        <LeaderboardTable 
                            entries={leaderboard}
                            optInStatus={optInStatus}
                            onJoin={handleJoinLeaderboard}
                            onLeave={handleLeaveLeaderboard}
                            loading={loading}
                        />
                    )}
                </div>
            </div>

            {/* View Playbook Modal */}
            {viewingPlaybook && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 rounded-2xl w-full max-w-4xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                            <div className="flex items-center gap-4">
                                <div 
                                    className="text-4xl p-3 rounded-xl bg-gray-800/50"
                                    style={{ color: viewingPlaybook.playbook?.color }}
                                >
                                    {viewingPlaybook.playbook?.icon || '📘'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{viewingPlaybook.playbook?.name || 'Playbook'}</h2>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <div className="flex items-center gap-1.5 bg-gray-800 px-2 py-0.5 rounded-full">
                                            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                            {viewingPlaybook.userName}
                                        </div>
                                        <span className="flex items-center gap-1 text-amber-400">
                                            ⭐ {viewingPlaybook.stars}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingPlaybook(null)}
                                className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                             {/* Description */}
                            {(viewingPlaybook.description || viewingPlaybook.playbook?.description) && (
                                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                                    <p className="text-gray-300 leading-relaxed">
                                        {viewingPlaybook.description || viewingPlaybook.playbook?.description}
                                    </p>
                                </div>
                            )}

                            {/* Rules Section - Prominent */}
                            {viewingPlaybook.playbook?.ruleGroups && viewingPlaybook.playbook.ruleGroups.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        REGRAS DO PLAYBOOK
                                    </h3>
                                    <div className="grid gap-4">
                                        {viewingPlaybook.playbook.ruleGroups.map((group, idx) => (
                                            <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                                                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 font-semibold text-gray-200">
                                                    {group.name}
                                                </div>
                                                <div className="p-4">
                                                    <ul className="space-y-2">
                                                        {group.rules.map((rule, ruleIdx) => (
                                                            <li key={ruleIdx} className="flex items-start gap-3 text-gray-300">
                                                                <span className="text-cyan-500 mt-1">•</span>
                                                                <span>{rule}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Author Stats - Detailed Grid */}
                            {viewingPlaybook.authorStats ? (
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                        PERFORMANCE DO AUTOR
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* Main Cards */}
                                        <div className="col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group">
                                            <div className="text-sm text-gray-400 font-medium">Net P&L</div>
                                            <div className={`text-3xl font-bold ${viewingPlaybook.authorStats.netPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {viewingPlaybook.authorStats.netPnl >= 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(viewingPlaybook.authorStats.netPnl)}
                                            </div>
                                        </div>

                                        <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                                            <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                                            <div className={`text-xl font-bold ${viewingPlaybook.authorStats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                {viewingPlaybook.authorStats.winRate.toFixed(1)}%
                                            </div>
                                        </div>

                                        <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                                            <div className="text-xs text-gray-400 mb-1">Avg RR</div>
                                            <div className="text-xl font-bold text-gray-200">
                                                {viewingPlaybook.authorStats.avgRR.toFixed(2)}R
                                            </div>
                                        </div>

                                        {/* Detailed Metrics - Row 2 */}
                                        <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                                            <div className="text-xs text-gray-400 mb-1">Sequência Win</div>
                                            <div className="text-lg font-bold text-green-400">
                                                {viewingPlaybook.authorStats.maxWinStreak}
                                            </div>
                                        </div>

                                        <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                                            <div className="text-xs text-gray-400 mb-1">Duração Média</div>
                                            <div className="text-lg font-bold text-gray-200">
                                                {viewingPlaybook.authorStats.avgDuration || '-'}
                                            </div>
                                        </div>

                                        <div className="col-span-2 bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
                                            <div className="text-xs text-gray-400 mb-1">Preferências</div>
                                            <div className="text-sm font-medium text-white flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <span className="text-gray-500">Ativo:</span> {viewingPlaybook.authorStats.preferredSymbol || '-'}
                                                </span>
                                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                <span className="flex items-center gap-1">
                                                    <span className="text-gray-500">Sessão:</span> {viewingPlaybook.authorStats.preferredSession || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-800/30 border border-gray-800 border-dashed rounded-xl p-8 text-center">
                                    <div className="text-4xl mb-3">👻</div>
                                    <h3 className="text-gray-300 font-medium">Sem dados de performance</h3>
                                    <p className="text-gray-500 text-sm mt-1">O autor ainda não registrou trades suficientes com este playbook.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

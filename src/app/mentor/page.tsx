'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAccountStore } from '@/store/useAccountStore';
import { 
    getMentees, 
    getSentInvites, 
    inviteMentee,
    revokeInvite 
} from '@/services/mentor/inviteService';
import { MentorInvite, MenteeOverview, MentorPermission } from '@/types';

// ============================================
// STATS CARDS
// ============================================

interface MentorStats {
    totalMentorados: number;
    convitesPendentes: number;
    convitesAceitos: number;
}

function StatsCards({ stats }: { stats: MentorStats }) {
    const cards = [
        { label: 'Meus Mentorados', value: stats.totalMentorados, color: 'text-emerald-400', border: 'border-emerald-500/30' },
        { label: 'Aguardando Resposta', value: stats.convitesPendentes, color: 'text-amber-400', border: 'border-amber-500/30' },
        { label: 'Convites Aceitos', value: stats.convitesAceitos, color: 'text-green-400', border: 'border-green-500/30' },
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
// MENTORADOS TABLE
// ============================================

function MentoradosTable({ 
    mentees, 
    onViewTrades,
    loading 
}: { 
    mentees: MenteeOverview[];
    onViewTrades: (id: string) => void;
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="text-gray-400 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                Carregando mentorados...
            </div>
        );
    }

    if (mentees.length === 0) {
        return (
            <div className="text-gray-500 py-12 text-center">
                <span className="text-4xl block mb-3">🎓</span>
                Você ainda não tem mentorados.
                <br />
                <span className="text-sm">Convide alguém para começar!</span>
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
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Total Trades</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Win Rate</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Esta Semana</th>
                        <th className="text-center py-4 px-4 text-gray-400 font-medium">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {mentees.map(mentee => (
                        <tr key={mentee.menteeId} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                                        {mentee.menteeName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{mentee.menteeName}</div>
                                        <div className="text-sm text-gray-500">{mentee.menteeEmail}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    mentee.permission === 'comment' 
                                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                }`}>
                                    {mentee.permission === 'comment' ? 'Comentar' : 'Visualizar'}
                                </span>
                            </td>
                            <td className="py-4 px-4 text-center text-gray-300">{mentee.totalTrades}</td>
                            <td className="py-4 px-4 text-center">
                                <span className={mentee.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
                                    {mentee.winRate}%
                                </span>
                            </td>
                            <td className="py-4 px-4 text-center text-gray-300">{mentee.recentTradesCount}</td>
                            <td className="py-4 px-4 text-center">
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => onViewTrades(mentee.menteeId)}
                                >
                                    Ver Trades
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============================================
// CONVITES TABLE
// ============================================

function ConvitesTable({ 
    invites,
    onRevoke,
    loading 
}: { 
    invites: MentorInvite[];
    onRevoke: (id: string) => void;
    loading: boolean;
}) {
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
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => onRevoke(invite.id)}
                                    >
                                        Cancelar
                                    </Button>
                                )}
                                {invite.status === 'accepted' && (
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => onRevoke(invite.id)}
                                    >
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

// ============================================
// MAIN PAGE
// ============================================

export default function MentoriaPage() {
    const router = useRouter();
    const { currentAccountId } = useAccountStore();
    const [activeTab, setActiveTab] = useState<'mentorados' | 'convites'>('mentorados');
    const [mentees, setMentees] = useState<MenteeOverview[]>([]);
    const [sentInvites, setSentInvites] = useState<MentorInvite[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal de convite
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const invitePermission: MentorPermission = 'comment'; // Fixed to 'comment' - view + comment
    const [inviting, setInviting] = useState(false);

    // Voltar para última carteira ou home
    const goBack = () => {
        if (currentAccountId) {
            router.push(`/dashboard/${currentAccountId}`);
        } else {
            router.push('/');
        }
    };

    // Stats
    const stats: MentorStats = {
        totalMentorados: mentees.length,
        convitesPendentes: sentInvites.filter(i => i.status === 'pending').length,
        convitesAceitos: sentInvites.filter(i => i.status === 'accepted').length,
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [menteesData, sentData] = await Promise.all([
                getMentees(),
                getSentInvites(),
            ]);
            setMentees(menteesData);
            setSentInvites(sentData);
        } catch (error) {
            console.error('Error loading mentor data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
             await loadData();
        };
        fetchData();
    }, [loadData]);

    const handleSendInvite = async () => {
        if (!inviteEmail.trim()) return;
        
        setInviting(true);
        try {
            console.log('[handleSendInvite] Starting invite for:', inviteEmail);
            const result = await inviteMentee(inviteEmail, invitePermission);
            
            if (result) {
                console.log('[handleSendInvite] SUCCESS:', result);
                alert('✅ Convite enviado com sucesso para ' + inviteEmail);
                setInviteEmail('');
                setShowInviteModal(false);
                loadData();
            } else {
                console.error('[handleSendInvite] FAILED: returned null');
                alert('❌ Erro ao enviar convite. Verifique o console para mais detalhes.');
            }
        } catch (err) {
            console.error('[handleSendInvite] Exception:', err);
            alert('❌ Erro inesperado ao enviar convite: ' + String(err));
        }
        setInviting(false);
    };



    const handleRevokeAccess = async (inviteId: string) => {
        if (!confirm('Tem certeza que deseja revogar o acesso?')) return;
        const success = await revokeInvite(inviteId);
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
                            👥
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: '#bde6fb' }}>Mentoria</h1>
                            <p className="text-gray-400">Gerencie seus mentorados e mentores</p>
                        </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex gap-3">
                        <button 
                            onClick={goBack}
                            className="px-4 py-2 text-gray-400 hover:text-cyan-400 bg-gray-950/50 hover:bg-gray-900 border border-gray-700 hover:border-cyan-500/50 rounded-lg transition-all duration-200 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Voltar ao Dashboard
                        </button>
                        <button 
                            onClick={() => setShowInviteModal(true)}
                            className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <line x1="19" y1="8" x2="19" y2="14"/>
                                <line x1="22" y1="11" x2="16" y2="11"/>
                            </svg>
                            Convidar Mentorado
                        </button>
                    </div>
                </div>


                {/* Stats */}
                <StatsCards stats={stats} />

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('mentorados')}
                        className={`pb-3 px-1 font-medium transition-colors ${
                            activeTab === 'mentorados'
                                ? 'border-b-2'
                                : 'text-gray-400 hover:text-white'
                        }`}
                        style={activeTab === 'mentorados' ? { color: '#bde6fb', borderColor: '#bde6fb' } : {}}
                    >
                        🎓 Meus Mentorados
                    </button>

                    <button
                        onClick={() => setActiveTab('convites')}
                        className={`pb-3 px-1 font-medium transition-colors ${
                            activeTab === 'convites'
                                ? 'border-b-2'
                                : 'text-gray-400 hover:text-white'
                        }`}
                        style={activeTab === 'convites' ? { color: '#bde6fb', borderColor: '#bde6fb' } : {}}
                    >
                        📤 Convites Enviados
                    </button>
                </div>

                {/* Content */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl backdrop-blur-sm overflow-hidden">
                    {activeTab === 'mentorados' && (
                        <MentoradosTable 
                            mentees={mentees} 
                            onViewTrades={(id) => router.push(`/mentor/${id}`)}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'convites' && (
                        <ConvitesTable 
                            invites={sentInvites.filter(i => i.status !== 'revoked')}
                            onRevoke={handleRevokeAccess}
                            loading={loading}
                        />
                    )}
                </div>

                {/* Invite Modal */}
                {showInviteModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-4">
                                Convidar Mentorado
                            </h2>
                            <p className="text-gray-400 text-sm mb-4">
                                Convide um aluno para acompanhar seus trades e oferecer feedback através de análises e comentários.
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">
                                        Email do mentorado
                                    </label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                        placeholder="aluno@email.com"
                                    />
                                </div>
                                
                                {/* Permission info (fixed to 'comment') */}
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-purple-400">
                                        <span>💬</span>
                                        <span className="font-medium">Análise + Comentários</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Você poderá visualizar os trades e journals do mentorado e adicionar comentários de feedback.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSendInvite}
                                    disabled={inviting || !inviteEmail.trim()}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {inviting ? 'Enviando...' : 'Enviar Convite'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

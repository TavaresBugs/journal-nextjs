'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAccountStore } from '@/store/useAccountStore';
import { 
    MentorStatsCards, 
    MentoradosTable, 
    ConvitesTable,
    StudentCalendarModal 
} from '@/components/mentor';
import { getMentees, getSentInvites, inviteMentee, revokeInvite } from '@/services/mentor/invites';
import { MentorInvite, MenteeOverview, MentorPermission } from '@/types';

export default function MentoriaPage() {
    const router = useRouter();
    const { currentAccountId } = useAccountStore();
    const [activeTab, setActiveTab] = useState<'mentorados' | 'convites'>('mentorados');
    const [mentees, setMentees] = useState<MenteeOverview[]>([]);
    const [sentInvites, setSentInvites] = useState<MentorInvite[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Invite modal state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const invitePermission: MentorPermission = 'comment';
    const [inviting, setInviting] = useState(false);

    // Trades modal state
    const [showTradesModal, setShowTradesModal] = useState(false);
    const [selectedMentee, setSelectedMentee] = useState<{ id: string; name: string } | null>(null);

    // Stats
    const stats = {
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
        loadData();
    }, [loadData]);

    const handleViewTrades = (menteeId: string) => {
        const mentee = mentees.find(m => m.menteeId === menteeId);
        if (mentee) {
            setSelectedMentee({ id: menteeId, name: mentee.menteeName || mentee.menteeEmail });
            setShowTradesModal(true);
        }
    };

    const goBack = () => {
        if (currentAccountId) {
            router.push(`/dashboard/${currentAccountId}`);
        } else {
            router.push('/');
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        try {
            const result = await inviteMentee(inviteEmail, invitePermission);
            if (result) {
                alert('✅ Convite enviado com sucesso para ' + inviteEmail);
                setInviteEmail('');
                setShowInviteModal(false);
                loadData();
            } else {
                alert('❌ Erro ao enviar convite. Verifique o console para mais detalhes.');
            }
        } catch (err) {
            alert('❌ Erro inesperado ao enviar convite: ' + String(err));
        }
        setInviting(false);
    };

    const handleRevokeAccess = async (inviteId: string) => {
        if (!confirm('Tem certeza que deseja revogar o acesso?')) return;
        const success = await revokeInvite(inviteId);
        if (success) loadData();
    };

    const tabs = [
        { id: 'mentorados', label: '🎓 Meus Mentorados' },
        { id: 'convites', label: '📤 Convites Enviados' },
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
                            👥
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold" style={{ color: '#bde6fb' }}>Mentoria</h1>
                            <p className="text-gray-400">Gerencie seus mentorados e mentores</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={goBack} leftIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        }>
                            Voltar ao Dashboard
                        </Button>
                        <Button variant="success" onClick={() => setShowInviteModal(true)} leftIcon={
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <line x1="19" y1="8" x2="19" y2="14"/>
                                <line x1="22" y1="11" x2="16" y2="11"/>
                            </svg>
                        }>
                            Convidar Mentorado
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <MentorStatsCards stats={stats} />

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
                    {activeTab === 'mentorados' && (
                        <MentoradosTable mentees={mentees} onViewTrades={handleViewTrades} loading={loading} />
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
                            <h2 className="text-xl font-bold text-white mb-4">Convidar Mentorado</h2>
                            <p className="text-gray-400 text-sm mb-4">
                                Convide um aluno para acompanhar seus trades e oferecer feedback através de análises e comentários.
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Email do mentorado</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                        placeholder="aluno@email.com"
                                    />
                                </div>
                                
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
                                <Button variant="ghost" className="flex-1" onClick={() => setShowInviteModal(false)}>
                                    Cancelar
                                </Button>
                                <Button 
                                    variant="success" 
                                    className="flex-1" 
                                    onClick={handleSendInvite}
                                    disabled={inviting || !inviteEmail.trim()}
                                >
                                    {inviting ? 'Enviando...' : 'Enviar Convite'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mentee Trades Modal */}
                {selectedMentee && (
                    <StudentCalendarModal
                        isOpen={showTradesModal}
                        onClose={() => { setShowTradesModal(false); setSelectedMentee(null); }}
                        menteeId={selectedMentee.id}
                        menteeName={selectedMentee.name}
                    />
                )}
            </div>
        </div>
    );
}

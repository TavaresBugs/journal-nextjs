'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getReceivedInvites, acceptInvite, rejectInvite } from '@/services/mentorService';
import { MentorInvite, Notification } from '@/types';
import { NotificationsModal } from './NotificationsModal';

// Anúncios do projeto (podem vir de um CMS ou banco futuramente)
const PROJECT_ANNOUNCEMENTS = [
    {
        id: 'v1.5-mentor',
        title: '🎉 Novo: Modo Mentoria',
        message: 'Agora você pode convidar mentores para analisar seus trades!',
        date: new Date('2024-12-05'),
    },
    {
        id: 'v1.4-community',
        title: '🌐 Comunidade',
        message: 'Compartilhe playbooks e participe do leaderboard.',
        date: new Date('2024-12-04'),
    },
];

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [showFullModal, setShowFullModal] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        
        // Carregar convites pendentes
        const invites = await getReceivedInvites();
        
        // Converter para notificações
        const inviteNotifs: Notification[] = invites.map(invite => ({
            id: `invite-${invite.id}`,
            type: 'invite',
            title: '👨‍🏫 Convite de Mentoria',
            message: `${invite.mentorEmail} quer ser seu mentor`,
            timestamp: new Date(invite.createdAt),
            read: false,
            data: invite,
        }));

        // Anúncios do projeto (marcar como lidos se já vistos)
        const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        const announcementNotifs: Notification[] = PROJECT_ANNOUNCEMENTS.map(ann => ({
            id: ann.id,
            type: 'announcement',
            title: ann.title,
            message: ann.message,
            timestamp: ann.date,
            read: readAnnouncements.includes(ann.id),
        }));

        // Combinar e ordenar por data
        const allNotifs = [...inviteNotifs, ...announcementNotifs]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setNotifications(allNotifs);
        setLoading(false);
    }, []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (mounted) await loadNotifications();
        };
        load();
        return () => { mounted = false; };
    }, [loadNotifications]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAcceptInvite = async (invite: MentorInvite) => {
        const success = await acceptInvite(invite.inviteToken);
        if (success) {
            loadNotifications();
        }
    };

    const handleRejectInvite = async (invite: MentorInvite) => {
        const success = await rejectInvite(invite.id);
        if (success) {
            loadNotifications();
        }
    };

    const markAnnouncementRead = (id: string) => {
        const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        if (!readAnnouncements.includes(id)) {
            readAnnouncements.push(id);
            localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
        }
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAnnouncementsRead = () => {
        const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        notifications.forEach(n => {
            if (n.type === 'announcement' && !readAnnouncements.includes(n.id)) {
                readAnnouncements.push(n.id);
            }
        });
        localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncements));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}m atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                {/* Bell Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative w-12 h-12 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-400 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
                    title="Notificações"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24"
                        height="24"
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                        />
                    </svg>
                    
                    {/* Badge */}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-[#2d3436] rounded-xl border border-gray-700 shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-white font-semibold">Notificações</h3>
                            {notifications.length > 0 && (
                                <button
                                    onClick={markAllAnnouncementsRead}
                                    className="text-sm text-[#4DB6AC] hover:underline"
                                >
                                    Marcar lidas
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="py-8 text-center text-gray-500">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4DB6AC] mx-auto"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-8 text-center text-gray-500">
                                    <span className="text-3xl block mb-2">🔔</span>
                                    Nenhuma notificação
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`px-4 py-3 border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors ${
                                            !notif.read ? 'bg-[#4DB6AC]/5' : ''
                                        }`}
                                        onClick={() => {
                                            if (notif.type === 'announcement') {
                                                markAnnouncementRead(notif.id);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                                notif.type === 'invite' 
                                                    ? 'bg-purple-500/20 text-purple-400'
                                                    : 'bg-[#4DB6AC]/20 text-[#4DB6AC]'
                                            }`}>
                                                {notif.type === 'invite' ? '👨‍🏫' : '📢'}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-white text-sm font-medium truncate">
                                                        {notif.title}
                                                    </p>
                                                    {!notif.read && (
                                                        <span className="w-2 h-2 bg-[#4DB6AC] rounded-full shrink-0"></span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-sm truncate">
                                                    {notif.message}
                                                </p>
                                                <p className="text-gray-500 text-xs mt-1">
                                                    {formatTimeAgo(notif.timestamp)}
                                                </p>

                                                {/* Invite Actions (compact) */}
                                                {notif.type === 'invite' && notif.data && (
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleAcceptInvite(notif.data!);
                                                            }}
                                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg"
                                                        >
                                                            Aceitar
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRejectInvite(notif.data!);
                                                            }}
                                                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg"
                                                        >
                                                            Recusar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer - Updated to Open Modal */}
                        <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/30">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowFullModal(true);
                                }}
                                className="text-sm text-gray-400 hover:text-white w-full text-center flex items-center justify-center gap-2 py-1"
                            >
                                <span>📨</span>
                                Ver todas as mensagens
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Full Modal */}
            <NotificationsModal
                isOpen={showFullModal}
                onClose={() => setShowFullModal(false)}
                notifications={notifications}
                onAcceptInvite={handleAcceptInvite}
                onRejectInvite={handleRejectInvite}
                onMarkRead={markAnnouncementRead}
                onReviewAnnouncements={markAllAnnouncementsRead}
            />
        </>
    );
}

// Hook para usar em outros lugares
export function useNotifications() {
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshCount = useCallback(async () => {
        const invites = await getReceivedInvites();
        const readAnnouncements = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
        const unreadAnnouncements = PROJECT_ANNOUNCEMENTS.filter(
            ann => !readAnnouncements.includes(ann.id)
        ).length;
        setUnreadCount(invites.length + unreadAnnouncements);
    }, []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (mounted) await refreshCount();
        };
        load();
        const interval = setInterval(refreshCount, 30000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [refreshCount]);

    return { unreadCount, refreshCount };
}

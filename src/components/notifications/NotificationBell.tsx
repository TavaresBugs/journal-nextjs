"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getReceivedInvitesAction as getReceivedInvites,
  acceptInviteAction as acceptInvite,
  rejectInviteAction as rejectInvite,
} from "@/app/actions/mentor";
import { getMyReviewsAction } from "@/app/actions/reviews";
import { MentorInvite, Notification } from "@/types";
import { NotificationsModal } from "./NotificationsModal";

// Anúncios do projeto (podem vir de um CMS ou banco futuramente)
const PROJECT_ANNOUNCEMENTS = [
  {
    id: "v1.5-mentor",
    title: "🎉 Novo: Modo Mentoria",
    message: "Agora você pode convidar mentores para analisar seus trades!",
    date: new Date("2024-12-05"),
  },
  {
    id: "v1.4-community",
    title: "🌐 Comunidade",
    message: "Compartilhe playbooks e participe do leaderboard.",
    date: new Date("2024-12-04"),
  },
];

export function NotificationBell({ accountId }: { accountId?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showFullModal, setShowFullModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Carregar convites
      const invites = await getReceivedInvites();
      const inviteNotifs: Notification[] = invites.map((inv) => ({
        id: inv.id,
        type: "invite",
        title: "Convite de Mentoria",
        message: `${inv.mentorName || inv.mentorEmail} convidou você.`,
        timestamp: new Date(inv.createdAt),
        read: false,
        data: inv,
      }));

      // 2. Carregar Feedback (Reviews)
      const reviews = await getMyReviewsAction();
      const reviewNotifs: Notification[] = reviews
        .filter((r) => !r.isRead)
        .map((r) => ({
          id: r.id,
          type: "feedback", // Cast as generic or 'feedback' if type updated
          title: "Novo Feedback",
          message:
            r.reviewType === "correction"
              ? "Nova correção recebida."
              : r.reviewType === "suggestion"
                ? "Nova sugestão recebida."
                : "Novo comentário recebido.",
          timestamp: new Date(r.createdAt),
          read: false,
          data: {
            journalEntryId: r.journalEntryId,
            date: r.entryDate,
            accountId: r.entryAccountId,
          },
        })) as Notification[];

      // 3. Carregar Anúncios
      const readAnnouncements = JSON.parse(localStorage.getItem("readAnnouncements") || "[]");
      const announcementNotifs: Notification[] = PROJECT_ANNOUNCEMENTS.map((ann) => ({
        id: ann.id,
        type: "announcement",
        title: ann.title,
        message: ann.message,
        timestamp: ann.date,
        read: readAnnouncements.includes(ann.id),
      }));

      // Merge and Sort
      const all = [...inviteNotifs, ...reviewNotifs, ...announcementNotifs].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      setNotifications(all);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (mounted) await loadNotifications();
    };
    load();
    return () => {
      mounted = false;
    };
  }, [loadNotifications]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    const readAnnouncements = JSON.parse(localStorage.getItem("readAnnouncements") || "[]");
    if (!readAnnouncements.includes(id)) {
      readAnnouncements.push(id);
      localStorage.setItem("readAnnouncements", JSON.stringify(readAnnouncements));
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAnnouncementsRead = () => {
    const readAnnouncements = JSON.parse(localStorage.getItem("readAnnouncements") || "[]");
    notifications.forEach((n) => {
      if (n.type === "announcement" && !readAnnouncements.includes(n.id)) {
        readAnnouncements.push(n.id);
      }
    });
    localStorage.setItem("readAnnouncements", JSON.stringify(readAnnouncements));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleViewFeedback = (notification: Notification) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { date, accountId: entryAccountId } = (notification.data as any) || {};
    // Prefer prop accountId, then entryAccountId
    const targetAccountId = accountId || entryAccountId;

    if (targetAccountId && date) {
      router.push(`/dashboard/${targetAccountId}?date=${date}`);
      setIsOpen(false); // Close bell dropdown/modal
    } else {
      console.error("Dados insuficientes para navegação", notification);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-gray-700 bg-gray-800/80 text-gray-400 backdrop-blur-sm transition-all duration-200 hover:border-cyan-500/50 hover:bg-gray-800 hover:text-cyan-400"
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
            <span className="absolute -top-1 -right-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-700 bg-[#2d3436] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
              <h3 className="font-semibold text-white">Notificações</h3>
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
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-[#4DB6AC]"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <span className="mb-2 block text-3xl">🔔</span>
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`border-b border-gray-700/50 px-4 py-3 transition-colors hover:bg-gray-800/50 ${
                      !notif.read ? "bg-[#4DB6AC]/5" : ""
                    }`}
                    onClick={() => {
                      if (notif.type === "announcement") {
                        markAnnouncementRead(notif.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          notif.type === "invite"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-[#4DB6AC]/20 text-[#4DB6AC]"
                        }`}
                      >
                        {notif.type === "invite" ? "👨‍🏫" : "📢"}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-white">{notif.title}</p>
                          {!notif.read && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#4DB6AC]"></span>
                          )}
                        </div>
                        <p className="truncate text-sm text-gray-400">{notif.message}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatTimeAgo(notif.timestamp)}
                        </p>

                        {/* Invite Actions (compact) */}
                        {notif.type === "invite" && !!notif.data && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptInvite(notif.data as MentorInvite);
                              }}
                              className="rounded-lg bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
                            >
                              Aceitar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectInvite(notif.data as MentorInvite);
                              }}
                              className="rounded-lg bg-red-500/20 px-3 py-1 text-xs text-red-400 hover:bg-red-500/30"
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
            <div className="border-t border-gray-700 bg-gray-800/30 px-4 py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowFullModal(true);
                }}
                className="flex w-full items-center justify-center gap-2 py-1 text-center text-sm text-gray-400 hover:text-white"
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
        onViewFeedback={handleViewFeedback}
      />
    </>
  );
}

// Hook para usar em outros lugares
export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(async () => {
    const invites = await getReceivedInvites();
    const readAnnouncements = JSON.parse(localStorage.getItem("readAnnouncements") || "[]");
    const unreadAnnouncements = PROJECT_ANNOUNCEMENTS.filter(
      (ann) => !readAnnouncements.includes(ann.id)
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

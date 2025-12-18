"use client";

import { Notification } from "@/types";
import { MentorInvite } from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onAcceptInvite: (invite: MentorInvite) => void;
  onRejectInvite: (invite: MentorInvite) => void;
  onMarkRead: (id: string) => void;
  onReviewAnnouncements: () => void;
  onViewFeedback: (notification: Notification) => void;
}

export function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onAcceptInvite,
  onRejectInvite,
  onMarkRead,
  onReviewAnnouncements,
  onViewFeedback,
}: NotificationsModalProps) {
  // Filter notifications
  const invites = notifications.filter((n) => n.type === "invite");
  const announcements = notifications.filter((n) => n.type === "announcement");
  const feedbacks = notifications.filter((n) => n.type === "feedback");

  // Helper to format time
  const formatTime = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-xl text-cyan-400">
        📬
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Mensagens</h2>
        <p className="text-sm text-gray-400">Gerencie seus convites e avisos</p>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl" title={modalTitle}>
      <div className="space-y-8">
        {/* SECTION: Invites */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-700 pb-2 font-medium text-cyan-400">
            <span>👨‍🏫</span>
            <span>Convites de Mentoria ({invites.length})</span>
          </div>

          {invites.length === 0 ? (
            <p className="py-2 text-sm text-gray-500 italic">Nenhum convite pendente.</p>
          ) : (
            <div className="grid gap-3">
              {invites.map((notif) => (
                <div
                  key={notif.id}
                  className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-700/50 bg-gray-800/50 p-4 transition-colors hover:bg-gray-800 md:flex-row md:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/20 font-bold text-cyan-400">
                      {(notif.data as MentorInvite)?.mentorEmail?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">
                        {(notif.data as MentorInvite)?.mentorEmail}
                      </h4>
                      <p className="text-sm text-gray-400">Convidou você para ser mentorado</p>
                      <span className="mt-1 block text-xs text-gray-500">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>
                  </div>

                  {!!notif.data && (
                    <div className="flex w-full gap-2 md:w-auto">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          onAcceptInvite(notif.data as MentorInvite);
                          onClose();
                        }}
                        className="flex-1 md:flex-none"
                      >
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          onRejectInvite(notif.data as MentorInvite);
                        }}
                        className="flex-1 md:flex-none"
                      >
                        Recusar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: Feedbacks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-700 pb-2 font-medium text-yellow-500">
            <span>📝</span>
            <span>Feedbacks ({feedbacks.length})</span>
          </div>

          {feedbacks.length === 0 ? (
            <p className="py-2 text-sm text-gray-500 italic">Nenhum feedback não lido.</p>
          ) : (
            <div className="grid gap-3">
              {feedbacks.map((notif) => (
                <div
                  key={notif.id}
                  className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-700/50 bg-gray-800/50 p-4 transition-colors hover:bg-gray-800 md:flex-row md:items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/20 font-bold text-yellow-500">
                      📝
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{notif.title}</h4>
                      <p className="text-sm text-gray-400">{notif.message}</p>
                      <span className="mt-1 block text-xs text-gray-500">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full gap-2 md:w-auto">
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => {
                        onViewFeedback(notif);
                        onClose();
                      }}
                      className="flex-1 md:flex-none"
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: System Announcements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-gray-700 pb-2 font-medium text-cyan-400">
            <div className="flex items-center gap-2">
              <span>📢</span>
              <span>Avisos do Sistema ({announcements.length})</span>
            </div>
            {announcements.some((n) => !n.read) && (
              <button
                onClick={onReviewAnnouncements}
                className="text-xs text-cyan-500 hover:text-cyan-400 hover:underline"
              >
                Marcar todos como lidos
              </button>
            )}
          </div>

          {announcements.length === 0 ? (
            <p className="py-2 text-sm text-gray-500 italic">Nenhum aviso do sistema.</p>
          ) : (
            <div className="grid gap-3">
              {announcements.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex cursor-pointer gap-4 rounded-xl border p-4 transition-colors ${
                    notif.read
                      ? "border-gray-700 bg-transparent text-gray-400"
                      : "border-cyan-500/20 bg-cyan-500/5 text-white hover:bg-cyan-500/10"
                  }`}
                  onClick={() => !notif.read && onMarkRead(notif.id)}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      notif.read ? "bg-gray-800 text-gray-600" : "bg-cyan-500/20 text-cyan-400"
                    }`}
                  >
                    📢
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className={`font-medium ${!notif.read ? "text-cyan-400" : ""}`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-gray-500">{formatTime(notif.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-sm">{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Button */}
        <Button variant="gradient-danger" onClick={onClose} className="w-full py-3 font-extrabold">
          Fechar
        </Button>
      </div>
    </Modal>
  );
}

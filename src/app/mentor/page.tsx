"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button, SegmentedToggle } from "@/components/ui";
import { useAccountStore } from "@/store/useAccountStore";
import {
  MentorStatsCards,
  MentoradosTable,
  ConvitesTable,
  StudentCalendarModal,
  InviteMenteeModal,
} from "@/components/mentor";
import {
  getMenteesOverviewAction as getMentees,
  getSentInvitesAction as getSentInvites,
  revokeInviteAction as revokeInvite,
} from "@/app/actions/mentor";
import { MentorInvite, MenteeOverview } from "@/types";

export default function MentoriaPage() {
  const router = useRouter();
  const { currentAccountId } = useAccountStore();
  const [activeTab, setActiveTab] = useState<"mentorados" | "convites">("mentorados");
  const [mentees, setMentees] = useState<MenteeOverview[]>([]);
  const [sentInvites, setSentInvites] = useState<MentorInvite[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Trades modal state
  const [showTradesModal, setShowTradesModal] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<{ id: string; name: string } | null>(null);

  // Stats
  const stats = {
    totalMentorados: mentees.length,
    convitesPendentes: sentInvites.filter((i) => i.status === "pending").length,
    convitesAceitos: sentInvites.filter((i) => i.status === "accepted").length,
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [menteesData, sentData] = await Promise.all([getMentees(), getSentInvites()]);
      setMentees(menteesData);
      setSentInvites(sentData);
    } catch (error) {
      console.error("Error loading mentor data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewTrades = (menteeId: string) => {
    const mentee = mentees.find((m) => m.menteeId === menteeId);
    if (mentee) {
      setSelectedMentee({ id: menteeId, name: mentee.menteeName || mentee.menteeEmail });
      setShowTradesModal(true);
    }
  };

  const goBack = () => {
    if (currentAccountId) {
      router.push(`/dashboard/${currentAccountId}`);
    } else {
      router.push("/");
    }
  };

  const handleRevokeAccess = async (inviteId: string) => {
    if (!confirm("Tem certeza que deseja revogar o acesso?")) return;
    const success = await revokeInvite(inviteId);
    if (success) loadData();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] bg-size-[20px_20px] opacity-10" />

      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-6">
        {/* Header Box */}
        <div className="mb-8 flex flex-col items-center justify-between gap-6 rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl backdrop-blur-sm md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gray-700 bg-gray-800/50 text-3xl shadow-inner">
              👥
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#bde6fb" }}>
                Mentoria
              </h1>
              <p className="text-gray-400">Gerencie seus mentorados e mentores</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={goBack}
              leftIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              }
            >
              Voltar ao Dashboard
            </Button>
            <Button
              variant="success"
              onClick={() => setShowInviteModal(true)}
              leftIcon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              }
            >
              Convidar Mentorado
            </Button>
          </div>
        </div>

        {/* Stats */}
        <MentorStatsCards stats={stats} />

        {/* Tabs */}
        <SegmentedToggle
          options={[
            { value: "mentorados", label: "🎓 Meus Mentorados" },
            { value: "convites", label: "📤 Convites Enviados" },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as "mentorados" | "convites")}
          className="mb-6 w-full"
        />

        {/* Content */}
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          {activeTab === "mentorados" && (
            <MentoradosTable mentees={mentees} onViewTrades={handleViewTrades} loading={loading} />
          )}
          {activeTab === "convites" && (
            <ConvitesTable
              invites={sentInvites.filter((i) => i.status !== "revoked")}
              onRevoke={handleRevokeAccess}
              loading={loading}
            />
          )}
        </div>

        {/* Invite Modal */}
        <InviteMenteeModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={loadData}
        />

        {/* Mentee Trades Modal */}
        {selectedMentee && (
          <StudentCalendarModal
            isOpen={showTradesModal}
            onClose={() => {
              setShowTradesModal(false);
              setSelectedMentee(null);
            }}
            menteeId={selectedMentee.id}
            menteeName={selectedMentee.name}
          />
        )}
      </div>
    </div>
  );
}

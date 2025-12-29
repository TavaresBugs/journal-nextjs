"use client";

import { useState } from "react";
import { useAdminStats, useAdminUsers, useAuditLogs, useAdminActions } from "@/hooks/useAdminData";
import {
  AdminStatsCards,
  AdminUserTable,
  AdminAuditLogTable,
  AdminMentorTable,
  AdminSyncControl,
} from "@/components/admin";
import { BackButton } from "@/components/shared/BackButton";
import { SegmentedToggle } from "@/components/ui";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "logs" | "mentors">("users");

  const { data: stats } = useAdminStats();
  const { data: users, isLoading: loadingUsers } = useAdminUsers();
  const { data: logs, isLoading: loadingLogs } = useAuditLogs({ limit: 50 });

  const { handleApprove, handleSuspend, handleToggleMentor, handleDelete } = useAdminActions();

  // If we wanted to prefetch logs when tab changes
  // useEffect(() => {
  //   if (activeTab === "logs") {
  //     loadLogs();
  //   }
  // }, [activeTab]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] bg-size-[20px_20px] opacity-10" />

      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-6">
        {/* Header Box */}
        <div className="mb-8 flex flex-col items-center justify-between gap-6 rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl backdrop-blur-sm md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gray-700 bg-gray-800/50 text-3xl shadow-inner">
              🛡️
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#bde6fb" }}>
                Painel Admin
              </h1>
              <p className="text-gray-400">Gerenciamento de usuários e logs</p>
            </div>
          </div>
          <BackButton />
        </div>

        {/* Stats */}
        <AdminStatsCards stats={stats || null} />

        {/* Sync Control */}
        <AdminSyncControl />

        {/* Tabs */}
        <SegmentedToggle
          options={[
            { value: "users", label: "👥 Usuários" },
            { value: "logs", label: "📋 Audit Logs" },
            { value: "mentors", label: "🎓 Mentores" },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as "users" | "logs" | "mentors")}
          className="mb-6 w-full"
        />

        {/* Content */}
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          {activeTab === "users" && (
            <AdminUserTable
              users={users || []}
              onApprove={handleApprove}
              onSuspend={handleSuspend}
              onDelete={handleDelete}
              loading={loadingUsers}
            />
          )}

          {activeTab === "logs" && <AdminAuditLogTable logs={logs || []} loading={loadingLogs} />}
          {activeTab === "mentors" && (
            <AdminMentorTable
              users={users || []}
              onToggleMentor={handleToggleMentor}
              loading={loadingUsers}
            />
          )}
        </div>
      </div>
    </div>
  );
}

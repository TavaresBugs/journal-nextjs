"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, SegmentedToggle } from "@/components/ui";
import { ViewSharedPlaybookModal } from "@/components/playbook/ViewSharedPlaybookModal";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { useAccountStore } from "@/store/useAccountStore";
import {
  useCommunityPlaybooks,
  useCommunityLeaderboard,
  useLeaderboardOptIn,
  useCommunityActions,
} from "@/hooks/useCommunityData";
import { SharedPlaybook, LeaderboardEntry, LeaderboardOptIn } from "@/types";

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
    {
      label: "Playbooks Públicos",
      value: stats.totalPlaybooks,
      color: "text-cyan-400",
      border: "border-cyan-500/30",
    },
    {
      label: "Contribuidores",
      value: stats.topContributors,
      color: "text-purple-400",
      border: "border-purple-500/30",
    },
    {
      label: "Total de Stars",
      value: stats.totalStars,
      color: "text-amber-400",
      border: "border-amber-500/30",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`border bg-gray-900/50 ${card.border} rounded-xl p-4 backdrop-blur-sm`}
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
  loading,
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
      <div className="py-12 text-center text-gray-500">
        <span className="mb-3 block text-4xl">📚</span>
        Nenhum playbook compartilhado ainda.
        <br />
        <span className="text-sm">Seja o primeiro a compartilhar!</span>
      </div>
    );
  }

  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Helper for win rate color
  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return "#10b981"; // green
    if (winRate >= 50) return "#3b82f6"; // blue
    if (winRate >= 30) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  return (
    <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
      {playbooks.map((playbook) => {
        const stats = playbook.authorStats;
        const winRate = stats?.winRate || 0;
        const netPnl = stats?.netPnl || 0;
        const totalTrades = stats?.totalTrades || 0;
        const avgRR = stats?.avgRR || 0;
        const maxWinStreak = stats?.maxWinStreak || 0;

        return (
          <div
            key={playbook.id}
            className="cursor-pointer overflow-hidden rounded-2xl border border-gray-700 bg-gray-800/50 transition-all duration-300 hover:border-gray-600"
            onClick={() => onView(playbook)}
          >
            {/* Header */}
            <div className="border-b border-gray-700/50 p-5">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div
                    className="rounded-lg bg-gray-900/50 p-2 text-3xl"
                    style={{ color: playbook.playbook?.color }}
                  >
                    {playbook.playbook?.icon || "📘"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-100">
                      {playbook.playbook?.name || "Playbook"}
                    </h3>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {totalTrades} trade{totalTrades !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Star Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onStar(playbook.id);
                  }}
                  className={`flex h-auto items-center gap-1 rounded-lg px-2 py-1 transition-colors ${
                    playbook.hasUserStarred
                      ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      : "bg-gray-700/50 text-gray-400 hover:bg-gray-700 hover:text-amber-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={playbook.hasUserStarred ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="text-sm">{playbook.stars}</span>
                </Button>
              </div>
            </div>

            {/* Main Metrics */}
            <div className="p-5">
              <div className="mb-5 flex items-center justify-between gap-6">
                {/* Win Rate Circle */}
                <div className="flex flex-col items-center">
                  <div className="relative h-[90px] w-[90px]">
                    <svg className="h-full w-full -rotate-90">
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
                  <div className="mt-2 text-xs text-gray-500">Win rate</div>
                </div>

                {/* Net P&L */}
                <div className="flex-1">
                  <div className="mb-1 text-xs text-gray-500">Net P&L</div>
                  <div
                    className={`text-2xl font-bold ${netPnl >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {formatCurrency(netPnl)}
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="border-t border-gray-700/50 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Avg RR</div>
                    <div className="text-lg font-bold text-gray-200">{avgRR.toFixed(2)}R</div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-gray-500">Win Streak</div>
                    <div className="text-lg font-bold text-green-400">{maxWinStreak}</div>
                  </div>
                </div>
              </div>

              {/* Author Info */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-700/50 pt-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  {playbook.userAvatar ? (
                    <Image
                      src={playbook.userAvatar}
                      alt={playbook.userName || "Avatar"}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/20 text-xs font-bold text-cyan-400">
                      {playbook.userName?.charAt(0).toUpperCase() || "T"}
                    </div>
                  )}
                  <span className="text-gray-400">{playbook.userName || "Trader Anônimo"}</span>
                </div>
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
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
  loading,
}: {
  entries: LeaderboardEntry[];
  optInStatus: LeaderboardOptIn | null;
  onJoin: () => void;
  onLeave: () => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500"></div>
        Carregando leaderboard...
      </div>
    );
  }

  return (
    <div>
      {/* Opt-in banner */}
      <div className="border-b border-gray-700 bg-gray-900/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-white">Participar do Leaderboard</h4>
            <p className="text-sm text-gray-400">
              {optInStatus
                ? `Você está participando como "${optInStatus.displayName}"`
                : "Apareça no ranking e compare com outros traders."}
            </p>
          </div>
          <Button
            size="sm"
            variant={optInStatus ? "danger" : "success"}
            onClick={optInStatus ? onLeave : onJoin}
          >
            {optInStatus ? "Sair do Ranking" : "Participar"}
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <span className="mb-3 block text-4xl">🏆</span>
          Nenhum participante ainda.
          <br />
          <span className="text-sm">Seja o primeiro a aparecer no ranking!</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900/50">
                <th className="w-16 px-4 py-4 text-center font-medium text-gray-400">#</th>
                <th className="px-6 py-4 text-left font-medium text-gray-400">Trader</th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-400">
                  Win Rate
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-400">
                  <div className="flex items-center justify-center gap-1">
                    Streak
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-orange-500"
                    >
                      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.3.3.5.6.8.9.7 1.2.7 2.4.1 2.9Z" />
                    </svg>
                  </div>
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-400">Avg RR</th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-400">Trades</th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-400">
                  Total P&L
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr
                  key={entry.userId}
                  className="border-b border-gray-800 transition-colors hover:bg-gray-900/30"
                >
                  <td className="px-4 py-4 text-center">
                    {index < 3 ? (
                      <span className="text-2xl">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                    ) : (
                      <span className="text-gray-500">{index + 1}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {entry.avatarUrl ? (
                        <Image
                          src={entry.avatarUrl}
                          alt={entry.displayName || "Avatar"}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                            index === 0
                              ? "border border-amber-500/30 bg-amber-500/20 text-amber-400"
                              : index === 1
                                ? "border border-gray-400/30 bg-gray-400/20 text-gray-300"
                                : index === 2
                                  ? "border border-orange-500/30 bg-orange-500/20 text-orange-400"
                                  : "border border-gray-700 bg-gray-800 text-gray-400"
                          }`}
                        >
                          {entry.displayName?.charAt(0).toUpperCase() || "T"}
                        </div>
                      )}
                      <span className="font-medium text-white">
                        {entry.displayName || "Trader"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {entry.showWinRate && entry.winRate !== undefined ? (
                      <span
                        className={`font-bold ${entry.winRate >= 50 ? "text-green-400" : "text-red-400"}`}
                      >
                        {entry.winRate.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-cyan-400">
                    {entry.streak || 0}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-300">
                    {entry.avgRR !== undefined ? `${entry.avgRR.toFixed(2)}R` : "—"}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-300">
                    {entry.showTotalTrades && entry.totalTrades !== undefined
                      ? entry.totalTrades
                      : "—"}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {entry.showPnl && entry.totalPnl !== undefined ? (
                      <span
                        className={`text-base font-bold ${entry.totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {entry.totalPnl >= 0 ? "+" : ""}R${entry.totalPnl.toFixed(2)}
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
  const [activeTab, setActiveTab] = useState<"playbooks" | "leaderboard">("playbooks");
  const [viewingPlaybook, setViewingPlaybook] = useState<SharedPlaybook | null>(null);

  // React Query hooks for data fetching with caching
  const { data: playbooks = [], isLoading: loadingPlaybooks } = useCommunityPlaybooks();
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useCommunityLeaderboard();
  const { data: optInStatus = null } = useLeaderboardOptIn();
  const { handleStar, handleJoinLeaderboard, handleLeaveLeaderboard } = useCommunityActions();

  const loading = loadingPlaybooks || loadingLeaderboard;

  // Stats calculadas
  const stats: CommunityStats = {
    totalPlaybooks: playbooks.length,
    topContributors: new Set(playbooks.map((p) => p.userId)).size,
    totalStars: playbooks.reduce((acc, p) => acc + (p.stars || 0), 0),
  };

  // Voltar para última carteira ou home
  const goBack = () => {
    if (currentAccountId) {
      router.push(`/dashboard/${currentAccountId}`);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Grid pattern overlay - same as admin page */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] mask-[linear-gradient(180deg,white,rgba(255,255,255,0))] bg-size-[20px_20px] opacity-10" />

      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-6">
        {/* Header Box - matching admin page style */}
        <div className="mb-8 flex flex-col items-center justify-between gap-6 rounded-2xl border border-gray-800 bg-gray-900/80 p-6 shadow-xl backdrop-blur-sm md:flex-row">
          {/* Left: Title & Subtitle */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-gray-700 bg-gray-800/50 text-3xl shadow-inner">
              🌐
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#bde6fb" }}>
                Comunidade
              </h1>
              <p className="text-gray-400">Playbooks públicos e leaderboard</p>
            </div>
          </div>

          {/* Right: Back Button */}
          {/* Right: Back Button */}
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
        </div>

        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Tabs */}
        {/* Tabs */}
        <SegmentedToggle
          options={[
            { value: "playbooks", label: "📚 Playbooks Públicos" },
            { value: "leaderboard", label: "🏆 Leaderboard" },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val as "playbooks" | "leaderboard")}
          className="mb-6 w-full"
        />

        {/* Content */}
        <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          {activeTab === "playbooks" && (
            <PlaybooksGrid
              playbooks={playbooks}
              onStar={handleStar}
              onView={(playbook) => setViewingPlaybook(playbook)}
              loading={loading}
            />
          )}
          {activeTab === "leaderboard" && (
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
      <ViewSharedPlaybookModal
        playbook={viewingPlaybook}
        onClose={() => setViewingPlaybook(null)}
      />
    </div>
  );
}

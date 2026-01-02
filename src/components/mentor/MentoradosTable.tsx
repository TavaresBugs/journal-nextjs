"use client";

import { IconActionButton } from "@/components/ui/IconActionButton";
import { StatusBadge, PermissionBadge } from "@/components/ui";
import Image from "next/image";
import { MentorTableSkeleton } from "./MentorTableSkeleton";
import type { MenteeOverview } from "@/types";

// SVG Icons
const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

interface MentoradosTableProps {
  mentees: MenteeOverview[];
  onViewTrades: (id: string) => void;
  onRevoke?: (inviteId: string) => void;
  onUpdatePermission?: (inviteId: string, permission: "view" | "comment") => void;
  loading: boolean;
}

export function MentoradosTable({
  mentees,
  onViewTrades,
  onRevoke,
  onUpdatePermission,
  loading,
}: MentoradosTableProps) {
  if (loading) {
    return <MentorTableSkeleton />;
  }

  if (mentees.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <span className="mb-3 block text-4xl">🎓</span>
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
            <th className="px-6 py-4 text-left font-medium text-gray-400">Mentorado</th>
            <th className="w-32 px-4 py-4 text-center font-medium text-gray-400">Status</th>
            <th className="w-32 px-4 py-4 text-center font-medium text-gray-400">Permissão</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Total Trades</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Win Rate</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Esta Semana</th>
            <th className="w-32 px-4 py-4 text-center font-medium text-gray-400">Ações</th>
          </tr>
        </thead>
        <tbody>
          {mentees.map((mentee) => {
            const isPending = mentee.status === "pending";

            return (
              <tr
                key={mentee.inviteId || mentee.menteeId}
                className="border-b border-gray-800 transition-colors hover:bg-gray-900/30"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0">
                      {mentee.menteeAvatar ? (
                        <Image
                          src={mentee.menteeAvatar}
                          alt={mentee.menteeName}
                          width={40}
                          height={40}
                          className={`h-full w-full rounded-full border object-cover ${
                            isPending ? "border-yellow-500/30 grayscale" : "border-emerald-500/30"
                          }`}
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center rounded-full border font-bold ${
                            isPending
                              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                              : "border-emerald-500/30 bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {mentee.menteeName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">{mentee.menteeName}</div>
                      <div className="group relative flex items-center gap-2 text-sm text-gray-500">
                        {mentee.menteeEmail}
                        {/* Info Icon with Tooltip */}
                        <div className="group/info relative cursor-help">
                          <InfoIcon />
                          <div className="absolute top-1/2 left-full z-50 ml-2 hidden w-56 -translate-y-1/2 rounded border border-gray-700 bg-gray-800 p-3 text-xs text-gray-300 shadow-xl group-hover/info:block">
                            <div className="mb-1 font-semibold text-white">
                              Status: {isPending ? "Pendente" : "Ativo"}
                            </div>
                            {isPending ? (
                              <span>
                                Convidado em:{" "}
                                {mentee.createdAt
                                  ? new Date(mentee.createdAt).toLocaleDateString()
                                  : "-"}
                              </span>
                            ) : (
                              <span>
                                Membro desde:{" "}
                                {mentee.acceptedAt
                                  ? new Date(mentee.acceptedAt).toLocaleDateString()
                                  : "-"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <StatusBadge status={isPending ? "pending" : "active"} className="w-24" />
                </td>
                <td className="px-4 py-4 text-center">
                  <PermissionBadge
                    permission={mentee.permission}
                    clickable={!!onUpdatePermission && !!mentee.inviteId}
                    onClick={() => {
                      if (onUpdatePermission && mentee.inviteId) {
                        const newPerm = mentee.permission === "comment" ? "view" : "comment";
                        onUpdatePermission(mentee.inviteId, newPerm);
                      }
                    }}
                    className="w-24"
                  />
                </td>
                {/* Stats - Show placeholders if pending */}
                <td className="px-4 py-4 text-center text-gray-300">
                  {isPending ? "-" : mentee.totalTrades}
                </td>
                <td className="px-4 py-4 text-center">
                  {isPending ? (
                    <span className="text-gray-600">-</span>
                  ) : (
                    <span className={mentee.winRate >= 50 ? "text-green-400" : "text-red-400"}>
                      {mentee.winRate}%
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-center text-gray-300">
                  {isPending ? "-" : mentee.recentTradesCount}
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {/* View Trades Button - Active only */}
                    {!isPending && (
                      <IconActionButton
                        variant="view"
                        onClick={() => onViewTrades(mentee.menteeId)}
                        title="Ver Trades"
                      />
                    )}

                    {/* Revoke/Suspend/Delete Button - Available for both */}
                    <IconActionButton
                      variant="delete"
                      onClick={() => onRevoke && mentee.inviteId && onRevoke(mentee.inviteId)}
                      title={isPending ? "Revogar convite" : "Remover acesso"}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

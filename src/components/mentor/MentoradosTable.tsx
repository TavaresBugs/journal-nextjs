"use client";

import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import type { MenteeOverview } from "@/types";

interface MentoradosTableProps {
  mentees: MenteeOverview[];
  onViewTrades: (id: string) => void;
  loading: boolean;
}

/**
 * Table showing mentor's mentees with stats and actions.
 */
export function MentoradosTable({ mentees, onViewTrades, loading }: MentoradosTableProps) {
  if (loading) {
    return <PageSkeleton />;
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
            <th className="px-4 py-4 text-center font-medium text-gray-400">Permissão</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Total Trades</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Win Rate</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Esta Semana</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Ações</th>
          </tr>
        </thead>
        <tbody>
          {mentees.map((mentee) => (
            <tr
              key={mentee.menteeId}
              className="border-b border-gray-800 transition-colors hover:bg-gray-900/30"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 font-bold text-emerald-400">
                    {mentee.menteeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white">{mentee.menteeName}</div>
                    <div className="text-sm text-gray-500">{mentee.menteeEmail}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    mentee.permission === "comment"
                      ? "border border-purple-500/30 bg-purple-500/20 text-purple-400"
                      : "border border-cyan-500/30 bg-cyan-500/20 text-cyan-400"
                  }`}
                >
                  {mentee.permission === "comment" ? "Comentar" : "Visualizar"}
                </span>
              </td>
              <td className="px-4 py-4 text-center text-gray-300">{mentee.totalTrades}</td>
              <td className="px-4 py-4 text-center">
                <span className={mentee.winRate >= 50 ? "text-green-400" : "text-red-400"}>
                  {mentee.winRate}%
                </span>
              </td>
              <td className="px-4 py-4 text-center text-gray-300">{mentee.recentTradesCount}</td>
              <td className="px-4 py-4 text-center">
                <Button size="sm" variant="primary" onClick={() => onViewTrades(mentee.menteeId)}>
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

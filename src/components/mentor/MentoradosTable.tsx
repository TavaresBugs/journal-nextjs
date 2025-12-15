'use client';

import { Button } from '@/components/ui/Button';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import type { MenteeOverview } from '@/types';

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

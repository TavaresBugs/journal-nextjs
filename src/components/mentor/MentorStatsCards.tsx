'use client';

interface MentorStats {
    totalMentorados: number;
    convitesPendentes: number;
    convitesAceitos: number;
}

interface MentorStatsCardsProps {
    stats: MentorStats;
}

/**
 * Mentor stats cards showing mentee statistics.
 */
export function MentorStatsCards({ stats }: MentorStatsCardsProps) {
    const cards = [
        { label: 'Meus Mentorados', value: stats.totalMentorados, color: 'text-emerald-400', border: 'border-emerald-500/30' },
        { label: 'Aguardando Resposta', value: stats.convitesPendentes, color: 'text-amber-400', border: 'border-amber-500/30' },
        { label: 'Convites Aceitos', value: stats.convitesAceitos, color: 'text-green-400', border: 'border-green-500/30' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {cards.map(card => (
                <div 
                    key={card.label} 
                    className={`bg-gray-900/50 border ${card.border} p-4 rounded-xl backdrop-blur-sm`}
                >
                    <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                    <div className="text-sm text-gray-400">{card.label}</div>
                </div>
            ))}
        </div>
    );
}

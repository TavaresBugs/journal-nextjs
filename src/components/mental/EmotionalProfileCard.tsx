"use client";

import { GlassCard } from "@/components/ui";
import type { EmotionalProfile } from "@/lib/database/repositories/EmotionalProfileRepository";

interface EmotionalProfileCardProps {
  profile: EmotionalProfile;
  onClick: () => void;
}

const EMOTION_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  fear: { emoji: "😰", label: "Medo", color: "text-blue-400" },
  greed: { emoji: "🤑", label: "Ganância", color: "text-yellow-400" },
  fomo: { emoji: "😱", label: "FOMO", color: "text-purple-400" },
  tilt: { emoji: "🤬", label: "Tilt", color: "text-red-400" },
  revenge: { emoji: "😤", label: "Revenge", color: "text-orange-400" },
  hesitation: { emoji: "🤔", label: "Hesitação", color: "text-cyan-400" },
  overconfidence: { emoji: "😎", label: "Excesso de Confiança", color: "text-green-400" },
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Nunca";

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  return `${Math.floor(diffDays / 30)} meses atrás`;
}

export function EmotionalProfileCard({ profile, onClick }: EmotionalProfileCardProps) {
  const config = EMOTION_CONFIG[profile.emotionType] || {
    emoji: "💭",
    label: profile.emotionType,
    color: "text-gray-400",
  };

  const hasContent =
    profile.firstSign ||
    profile.correctiveActions ||
    profile.injectingLogic ||
    profile.triggers.length > 0;

  return (
    <button onClick={onClick} className="w-full text-left">
      <GlassCard className="p-4 transition-all duration-200 hover:border-white/10 hover:bg-white/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.emoji}</span>
            <div>
              <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
              <p className="text-xs text-gray-500">
                {profile.occurrenceCount} ocorrência{profile.occurrenceCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="text-right">
            {profile.occurrenceCount > 0 && (
              <p className="text-xs text-gray-500">
                Última: {formatRelativeTime(profile.lastOccurrence)}
              </p>
            )}
            {hasContent ? (
              <span className="mt-1 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                Configurado
              </span>
            ) : (
              <span className="mt-1 inline-block rounded-full bg-gray-500/20 px-2 py-0.5 text-xs text-gray-500">
                Vazio
              </span>
            )}
          </div>
        </div>

        {/* Quick preview of triggers */}
        {profile.triggers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {profile.triggers.slice(0, 3).map((trigger, i) => (
              <span key={i} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-gray-400">
                {trigger}
              </span>
            ))}
            {profile.triggers.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">
                +{profile.triggers.length - 3}
              </span>
            )}
          </div>
        )}
      </GlassCard>
    </button>
  );
}

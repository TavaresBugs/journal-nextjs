"use client";

import { GlassCard, Textarea } from "@/components/ui";

interface JournalReviewProps {
  technicalWins: string;
  setTechnicalWins: (value: string) => void;
  improvements: string;
  setImprovements: (value: string) => void;
  errors: string;
  setErrors: (value: string) => void;
}

export function JournalReview({
  technicalWins,
  setTechnicalWins,
  improvements,
  setImprovements,
  errors,
  setErrors,
}: JournalReviewProps) {
  return (
    <GlassCard className="bg-zorin-bg/30 space-y-4 border-white/5 p-4">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
        <span>📜</span> Review
      </label>

      <div className="space-y-2">
        <label className="text-zorin-accent flex items-center gap-2 text-sm">
          ✅ Acertos técnicos:
        </label>
        <Textarea
          value={technicalWins}
          onChange={(e) => setTechnicalWins(e.target.value)}
          className="h-20 border-white/5"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-yellow-400">
          ⚠️ Pontos a melhorar:
        </label>
        <Textarea
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          className="h-20 border-white/5"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-red-400">
          ❌ Erros/Indisciplina:
        </label>
        <Textarea
          value={errors}
          onChange={(e) => setErrors(e.target.value)}
          className="h-20 border-white/5"
        />
      </div>
    </GlassCard>
  );
}

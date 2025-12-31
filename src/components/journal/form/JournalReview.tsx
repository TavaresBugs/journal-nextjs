"use client";

import { memo } from "react";
import { GlassCard } from "@/components/ui";
import { DebouncedTextarea } from "@/components/ui/DebouncedTextarea";

interface JournalReviewProps {
  technicalWins: string;
  setTechnicalWins: (value: string) => void;
  improvements: string;
  setImprovements: (value: string) => void;
  errors: string;
  setErrors: (value: string) => void;
}

const JournalReviewComponent = ({
  technicalWins,
  setTechnicalWins,
  improvements,
  setImprovements,
  errors,
  setErrors,
}: JournalReviewProps) => {
  return (
    <GlassCard className="bg-zorin-bg/30 space-y-4 border-white/5 p-4">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
        <span>📜</span> Review
      </label>

      <div className="space-y-2">
        <label className="text-zorin-accent flex items-center gap-2 text-sm">
          ✅ Acertos técnicos:
        </label>
        <DebouncedTextarea
          value={technicalWins}
          onDebouncedChange={setTechnicalWins}
          className="h-20 border-white/5"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-yellow-400">
          ⚠️ Pontos a melhorar:
        </label>
        <DebouncedTextarea
          value={improvements}
          onDebouncedChange={setImprovements}
          className="h-20 border-white/5"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-red-400">
          ❌ Erros/Indisciplina:
        </label>
        <DebouncedTextarea
          value={errors}
          onDebouncedChange={setErrors}
          className="h-20 border-white/5"
        />
      </div>
    </GlassCard>
  );
};

export const JournalReview = memo(JournalReviewComponent);

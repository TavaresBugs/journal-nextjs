"use client";

import React, { memo } from "react";

interface RecapTextareasProps {
  whatWorked: string;
  whatFailed: string;
  lessonsLearned: string;
  onWhatWorkedChange: (value: string) => void;
  onWhatFailedChange: (value: string) => void;
  onLessonsLearnedChange: (value: string) => void;
  reviewType: "daily" | "weekly";
}

export const RecapTextareas = memo(function RecapTextareas({
  whatWorked,
  whatFailed,
  lessonsLearned,
  onWhatWorkedChange,
  onWhatFailedChange,
  onLessonsLearnedChange,
  reviewType,
}: RecapTextareasProps) {
  return (
    <>
      {/* What Worked / What Failed */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-green-400">✓ O que funcionou</label>
          <textarea
            value={whatWorked}
            onChange={(e) => onWhatWorkedChange(e.target.value)}
            placeholder="Pontos positivos do trade..."
            className="w-full resize-none rounded-xl border border-green-700/30 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-green-500 focus:ring-1 focus:ring-green-500"
            rows={5}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-red-400">✗ O que falhou</label>
          <textarea
            value={whatFailed}
            onChange={(e) => onWhatFailedChange(e.target.value)}
            placeholder="O que poderia melhorar..."
            className="w-full resize-none rounded-xl border border-red-700/30 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500"
            rows={5}
          />
        </div>
      </div>

      {/* Lessons Learned */}
      <div>
        <label className="mb-2 block text-sm font-medium text-cyan-400">💡 Lições Aprendidas</label>
        <textarea
          value={lessonsLearned}
          onChange={(e) => onLessonsLearnedChange(e.target.value)}
          placeholder={
            reviewType === "daily"
              ? "O que você aprendeu com este trade..."
              : "O que você aprendeu nesta semana de trading..."
          }
          className="w-full resize-none rounded-xl border border-cyan-700/30 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          rows={6}
        />
      </div>
    </>
  );
});

"use client";

import React, { memo } from "react";
import type { EmotionalState } from "@/types";

const EMOTION_OPTIONS: { value: EmotionalState; label: string; emoji: string }[] = [
  { value: "confiante", label: "Confiante", emoji: "💪" },
  { value: "disciplinado", label: "Disciplinado", emoji: "🎯" },
  { value: "neutro", label: "Neutro", emoji: "😐" },
  { value: "ansioso", label: "Ansioso", emoji: "😰" },
  { value: "fomo", label: "FOMO", emoji: "🔥" },
  { value: "euforico", label: "Eufórico", emoji: "🚀" },
  { value: "frustrado", label: "Frustrado", emoji: "😤" },
];

interface EmotionSelectorProps {
  value: EmotionalState | "";
  onChange: (value: EmotionalState | "") => void;
}

export const EmotionSelector = memo(function EmotionSelector({
  value,
  onChange,
}: EmotionSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">Estado Emocional</label>
      <div className="flex flex-wrap gap-2">
        {EMOTION_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(value === option.value ? "" : option.value)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              value === option.value
                ? "border border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
                : "border border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
            }`}
          >
            <span>{option.emoji}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

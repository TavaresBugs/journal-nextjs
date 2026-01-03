"use client";

import React from "react";
import { BaseLabCard } from "./BaseLabCard";
import type { LaboratoryRecap, EmotionalState } from "@/types";

interface RecapCardProps {
  recap: LaboratoryRecap;
  onView: (recap: LaboratoryRecap) => void;
  onEdit: (recap: LaboratoryRecap) => void;
  onDelete: (id: string) => void;
}

const EMOTION_CONFIG: Record<
  EmotionalState,
  { label: string; emoji: string; color: string; bgColor: string }
> = {
  confiante: {
    label: "Confiante",
    emoji: "💪",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  ansioso: { label: "Ansioso", emoji: "😰", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  fomo: { label: "FOMO", emoji: "🔥", color: "text-orange-400", bgColor: "bg-orange-500/20" },
  disciplinado: {
    label: "Disciplinado",
    emoji: "🎯",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  frustrado: { label: "Frustrado", emoji: "😤", color: "text-red-400", bgColor: "bg-red-500/20" },
  euforico: {
    label: "Eufórico",
    emoji: "🚀",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  neutro: { label: "Neutro", emoji: "😐", color: "text-gray-400", bgColor: "bg-gray-500/20" },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = datePart.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function RecapCard({ recap, onView, onEdit, onDelete }: RecapCardProps) {
  const emotionConfig = recap.emotionalState ? EMOTION_CONFIG[recap.emotionalState] : null;

  const badges = emotionConfig ? [{ ...emotionConfig, emoji: emotionConfig.emoji }] : [];

  return (
    <BaseLabCard
      title={recap.title}
      thumbnail={recap.images?.[0]}
      badges={badges}
      date={recap.createdAt}
      imageCount={recap.images?.length}
      actions={[
        { variant: "edit", onClick: () => onEdit(recap) },
        { variant: "delete", onClick: () => onDelete(recap.id) },
      ]}
      onClick={() => onView(recap)}
    >
      {/* Linked Trade */}
      {recap.trade && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
            📊 Trade
          </span>
          <span className="rounded-full bg-gray-700/50 px-2 py-1 text-xs font-medium text-gray-300">
            {recap.trade.symbol}
          </span>
          <span className="rounded-full bg-gray-700/50 px-2 py-1 text-xs font-medium text-gray-300">
            {formatDate(recap.trade.entryDate)}
          </span>
        </div>
      )}

      {/* Linked Journal */}
      {recap.journal && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400">
            📓 Diário
          </span>
          {recap.journal.asset && (
            <span className="rounded-full bg-gray-700/50 px-2 py-1 text-xs font-medium text-gray-300">
              {recap.journal.asset}
            </span>
          )}
          <span className="rounded-full bg-gray-700/50 px-2 py-1 text-xs font-medium text-gray-300">
            {formatDate(recap.journal.date)}
          </span>
        </div>
      )}

      {/* Lessons Learned */}
      {recap.lessonsLearned && (
        <div className="mb-3">
          <p className="mb-1 text-xs text-cyan-400">Lições Aprendidas:</p>
          <p className="line-clamp-2 text-sm text-gray-400">{recap.lessonsLearned}</p>
        </div>
      )}
    </BaseLabCard>
  );
}

"use client";

import React from "react";
import { GlassCard, IconActionButton } from "@/components/ui";
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

export function RecapCard({ recap, onView, onEdit, onDelete }: RecapCardProps) {
  const emotionConfig = recap.emotionalState ? EMOTION_CONFIG[recap.emotionalState] : null;
  const firstImage = recap.images?.[0];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    // Handle ISO string or simple YYYY-MM-DD
    const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const [year, month, day] = datePart.split("-").map(Number);

    // Create date at local midnight to avoid timezone shifts
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <GlassCard
      className="group cursor-pointer transition-all duration-300 hover:border-cyan-500/50"
      onClick={() => onView(recap)}
    >
      {/* Thumbnail */}
      {firstImage && (
        <div className="relative -mx-4 -mt-4 mb-4 h-24 overflow-hidden rounded-t-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firstImage}
            alt={recap.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="line-clamp-2 text-lg font-semibold text-white">{recap.title}</h3>
        </div>
        {emotionConfig && (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${emotionConfig.bgColor} ${emotionConfig.color} flex items-center gap-1 whitespace-nowrap`}
          >
            <span>{emotionConfig.emoji}</span>
            <span>{emotionConfig.label}</span>
          </span>
        )}
      </div>

      {/* Linked Trade - Badge Style */}
      {recap.trade && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {/* Type Badge */}
          <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
            📊 Trade
          </span>
          {/* Asset Badge */}
          <span className="rounded-full bg-gray-700/50 px-2 py-1 text-xs font-medium text-gray-300">
            {recap.trade.symbol}
          </span>
          {/* Date Badge */}
          <span className="rounded-full bg-gray-700/50 px-2 py-1 text-xs font-medium text-gray-300">
            {formatDate(recap.trade.entryDate)}
          </span>
        </div>
      )}

      {/* Linked Journal - Badge Style */}
      {recap.journal && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {/* Type Badge */}
          <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-400">
            📓 Diário
          </span>
          {/* Asset Badge */}
          {recap.journal.asset && (
            <span className="rounded-full bg-gray-700/50 px-2 py-1 text-xs font-medium text-gray-300">
              {recap.journal.asset}
            </span>
          )}
          {/* Date Badge */}
          <span className="rounded-full bg-gray-700/50 px-2 py-1 text-xs font-medium text-gray-300">
            {formatDate(recap.journal.date)}
          </span>
        </div>
      )}

      {/* Lessons Learned Preview */}
      {recap.lessonsLearned && (
        <div className="mb-3">
          <p className="mb-1 text-xs text-cyan-400">Lições Aprendidas:</p>
          <p className="line-clamp-2 text-sm text-gray-400">{recap.lessonsLearned}</p>
        </div>
      )}

      {/* Image count */}
      {recap.images.length > 0 && (
        <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{recap.images.length} imagem(ns)</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-700/50 pt-3">
        <span className="text-xs text-gray-500">{formatDate(recap.createdAt)}</span>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <IconActionButton variant="edit" onClick={() => onEdit(recap)} />
          <IconActionButton variant="delete" onClick={() => onDelete(recap.id)} />
        </div>
      </div>
    </GlassCard>
  );
}

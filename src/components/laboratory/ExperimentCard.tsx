"use client";

import React from "react";
import { GlassCard, IconActionButton } from "@/components/ui";
import type { LaboratoryExperiment, ExperimentStatus, ExperimentType } from "@/types";

interface ExperimentCardProps {
  experiment: LaboratoryExperiment;
  onView: (experiment: LaboratoryExperiment) => void;
  onEdit: (experiment: LaboratoryExperiment) => void;
  onDelete: (id: string) => void;
  onPromote: (id: string) => void;
}

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string; bgColor: string }> = {
  em_aberto: { label: "Em Aberto", color: "text-gray-400", bgColor: "bg-gray-500/20" },
  testando: { label: "Testando", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  validado: { label: "Validado", color: "text-green-400", bgColor: "bg-green-500/20" },
  descartado: { label: "Descartado", color: "text-red-400", bgColor: "bg-red-500/20" },
};

const TAG_COLORS = [
  { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
  { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30" },
  { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
];

const TIPO_CONFIG: Record<ExperimentType, { label: string; color: string; bgColor: string }> = {
  contexto: { label: "Contexto", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  entrada: { label: "Entrada", color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
};

const getTagColor = (index: number) => TAG_COLORS[index % TAG_COLORS.length];

export function ExperimentCard({
  experiment,
  onView,
  onEdit,
  onDelete,
  onPromote,
}: ExperimentCardProps) {
  const statusConfig = STATUS_CONFIG[experiment.status];
  const tipoConfig = experiment.experimentType ? TIPO_CONFIG[experiment.experimentType] : null;
  const firstImage = experiment.images?.[0]?.imageUrl;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <GlassCard
      className="group cursor-pointer transition-all duration-300 hover:border-cyan-500/50"
      onClick={() => onView(experiment)}
    >
      {/* Thumbnail */}
      {firstImage && (
        <div className="relative -mx-4 -mt-4 mb-4 h-32 overflow-hidden rounded-t-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firstImage}
            alt={experiment.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 flex-1 text-lg font-semibold text-white">{experiment.title}</h3>
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} whitespace-nowrap`}
          >
            {statusConfig.label}
          </span>
          {tipoConfig && (
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${tipoConfig.bgColor} ${tipoConfig.color} whitespace-nowrap`}
            >
              {tipoConfig.label}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {experiment.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-400">{experiment.description}</p>
      )}

      {/* Stats */}
      <div className="mb-4 flex items-center gap-4 text-sm">
        {experiment.expectedWinRate && (
          <div className="flex items-center gap-1 text-cyan-400">
            <span className="text-xs">WR:</span>
            <span className="font-medium">{experiment.expectedWinRate}%</span>
          </div>
        )}
        {experiment.expectedRiskReward && (
          <div className="flex items-center gap-1 text-cyan-400">
            <span className="text-xs">R:R:</span>
            <span className="font-medium">1:{experiment.expectedRiskReward}</span>
          </div>
        )}
        {experiment.category && (
          <div className="flex flex-wrap gap-1">
            {experiment.category.split(", ").map((tag, index) => {
              const color = getTagColor(index);
              return (
                <span
                  key={tag}
                  className={`rounded px-2 py-0.5 text-xs font-medium ${color.bg} ${color.text} border ${color.border}`}
                >
                  🏷️ {tag.trim()}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-700/50 pt-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{formatDate(experiment.createdAt)}</span>
          {experiment.images.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {experiment.images.length} imagem(ns)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <IconActionButton variant="edit" onClick={() => onEdit(experiment)} />

          {experiment.status === "validado" && !experiment.promotedToPlaybook && (
            <IconActionButton
              variant="promote"
              onClick={() => onPromote(experiment.id)}
              title="Promover para Playbook"
            />
          )}

          {experiment.promotedToPlaybook && (
            <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
              📕 No Playbook
            </span>
          )}

          <IconActionButton variant="delete" onClick={() => onDelete(experiment.id)} />
        </div>
      </div>
    </GlassCard>
  );
}

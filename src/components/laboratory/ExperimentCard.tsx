"use client";

import React from "react";
import { BaseLabCard, type ActionConfig } from "./BaseLabCard";
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

const TIPO_CONFIG: Record<ExperimentType, { label: string; color: string; bgColor: string }> = {
  contexto: { label: "Contexto", color: "text-purple-400", bgColor: "bg-purple-500/20" },
  entrada: { label: "Entrada", color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
};

const TAG_COLORS = [
  { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
  { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30" },
  { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
];

export function ExperimentCard({
  experiment,
  onView,
  onEdit,
  onDelete,
  onPromote,
}: ExperimentCardProps) {
  const statusConfig = STATUS_CONFIG[experiment.status];
  const tipoConfig = experiment.experimentType ? TIPO_CONFIG[experiment.experimentType] : null;

  const badges = [statusConfig];
  if (tipoConfig) badges.push(tipoConfig);

  const actions: ActionConfig[] = [{ variant: "edit", onClick: () => onEdit(experiment) }];

  if (experiment.status === "validado" && !experiment.promotedToPlaybook) {
    actions.push({
      variant: "promote",
      onClick: () => onPromote(experiment.id),
      title: "Promover para Playbook",
    });
  }

  actions.push({ variant: "delete", onClick: () => onDelete(experiment.id) });

  return (
    <BaseLabCard
      title={experiment.title}
      thumbnail={experiment.images?.[0]?.imageUrl}
      badges={badges}
      date={experiment.createdAt}
      imageCount={experiment.images?.length}
      actions={actions}
      onClick={() => onView(experiment)}
      footer={
        experiment.promotedToPlaybook ? (
          <span className="mr-2 rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
            📕 No Playbook
          </span>
        ) : undefined
      }
    >
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
              const color = TAG_COLORS[index % TAG_COLORS.length];
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
    </BaseLabCard>
  );
}

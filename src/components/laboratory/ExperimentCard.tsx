"use client";

import React from "react";
import { GlassCard, IconActionButton } from "@/components/ui";
import type { LaboratoryExperiment, ExperimentStatus } from "@/types";

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

export function ExperimentCard({
  experiment,
  onView,
  onEdit,
  onDelete,
  onPromote,
}: ExperimentCardProps) {
  const statusConfig = STATUS_CONFIG[experiment.status];
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
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} whitespace-nowrap`}
        >
          {statusConfig.label}
        </span>
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
          <div className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
            {experiment.category}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-700/50 pt-3">
        <span className="text-xs text-gray-500">{formatDate(experiment.createdAt)}</span>

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

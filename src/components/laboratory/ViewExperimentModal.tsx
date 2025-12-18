"use client";

import React from "react";
import { Modal, Button } from "@/components/ui";
import type { LaboratoryExperiment, ExperimentStatus } from "@/types";

interface ViewExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  experiment: LaboratoryExperiment | null;
  onEdit: (experiment: LaboratoryExperiment) => void;
  onPromote: (id: string) => void;
}

const STATUS_CONFIG: Record<ExperimentStatus, { label: string; color: string; bgColor: string }> = {
  em_aberto: { label: "Em Aberto", color: "text-gray-400", bgColor: "bg-gray-500/20" },
  testando: { label: "Testando", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  validado: { label: "Validado", color: "text-green-400", bgColor: "bg-green-500/20" },
  descartado: { label: "Descartado", color: "text-red-400", bgColor: "bg-red-500/20" },
};

export function ViewExperimentModal({
  isOpen,
  onClose,
  experiment,
  onEdit,
  onPromote,
}: ViewExperimentModalProps) {
  if (!experiment) return null;

  const statusConfig = STATUS_CONFIG[experiment.status];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🧪 Detalhes do Experimento" maxWidth="3xl">
      <div className="space-y-6">
        {/* Header with status */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-white">{experiment.title}</h2>
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Description */}
        {experiment.description && (
          <div className="rounded-xl bg-gray-800/50 p-4">
            <h3 className="mb-2 text-sm font-medium text-cyan-400">Hipótese / Descrição</h3>
            <p className="whitespace-pre-wrap text-gray-300">{experiment.description}</p>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {experiment.expectedWinRate && (
            <div className="rounded-xl bg-gray-800/50 p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{experiment.expectedWinRate}%</div>
              <div className="mt-1 text-xs text-gray-400">Win Rate Esperado</div>
            </div>
          )}
          {experiment.expectedRiskReward && (
            <div className="rounded-xl bg-gray-800/50 p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">
                1:{experiment.expectedRiskReward}
              </div>
              <div className="mt-1 text-xs text-gray-400">R:R Esperado</div>
            </div>
          )}
          {experiment.category && (
            <div className="rounded-xl bg-gray-800/50 p-4 text-center">
              <div className="text-lg font-medium text-cyan-400">{experiment.category}</div>
              <div className="mt-1 text-xs text-gray-400">Categoria</div>
            </div>
          )}
          <div className="rounded-xl bg-gray-800/50 p-4 text-center">
            <div className="text-lg font-medium text-gray-300">{experiment.images.length}</div>
            <div className="mt-1 text-xs text-gray-400">Imagens</div>
          </div>
        </div>

        {/* Images Gallery */}
        {experiment.images.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-300">Screenshots</h3>
            <div className="grid grid-cols-2 gap-4">
              {experiment.images.map((img, index) => (
                <a
                  key={img.id}
                  href={img.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-xl border border-gray-700 transition-colors hover:border-cyan-500"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={img.description || `Screenshot ${index + 1}`}
                    className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center justify-between border-t border-gray-700 pt-4 text-xs text-gray-500">
          <span>Criado em: {formatDate(experiment.createdAt)}</span>
          <span>Atualizado em: {formatDate(experiment.updatedAt)}</span>
        </div>

        {/* Promoted Status */}
        {experiment.promotedToPlaybook && (
          <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <span className="text-2xl">📕</span>
            <div>
              <div className="font-medium text-green-400">Promovido para Playbook</div>
              <div className="text-sm text-gray-400">
                Esta estratégia já faz parte do seu Playbook
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-700 pt-4">
          {experiment.status === "validado" && !experiment.promotedToPlaybook && (
            <Button
              variant="gradient-success"
              onClick={() => {
                onPromote(experiment.id);
                onClose();
              }}
              leftIcon={<span>📕</span>}
            >
              Promover para Playbook
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              onEdit(experiment);
              onClose();
            }}
          >
            Editar
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

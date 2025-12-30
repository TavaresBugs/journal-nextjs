"use client";

import React, { useState } from "react";
import { Modal, Button, IconActionButton } from "@/components/ui";
import { ImagePreviewLightbox, type ImageItem } from "@/components/shared/ImagePreviewLightbox";
import { ExperimentTradesSection } from "./experiment";
import type {
  LaboratoryExperiment,
  ExperimentStatus,
  ExperimentType,
  TradeLite,
  Account,
} from "@/types";

interface ViewExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  experiment: LaboratoryExperiment | null;
  onEdit: (experiment: LaboratoryExperiment) => void;
  onPromote: (id: string) => void;
  availableTrades?: TradeLite[];
  accounts?: Account[];
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

const getTagColor = (index: number) => TAG_COLORS[index % TAG_COLORS.length];

export function ViewExperimentModal({
  isOpen,
  onClose,
  experiment,
  onEdit,
  onPromote,
  availableTrades = [],
  accounts = [],
}: ViewExperimentModalProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (!experiment) return null;

  const statusConfig = STATUS_CONFIG[experiment.status];
  const tipoConfig = experiment.experimentType ? TIPO_CONFIG[experiment.experimentType] : null;
  const tags = experiment.category ? experiment.category.split(", ").map((t) => t.trim()) : [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Convert images to ImageItem format for lightbox
  const imageItems: ImageItem[] = experiment.images.map((img, index) => ({
    url: img.imageUrl,
    label: img.description || `Screenshot ${index + 1}`,
  }));

  const openImagePreview = (index: number) => {
    setPreviewIndex(index);
  };

  const closeImagePreview = () => {
    setPreviewIndex(null);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`🧪 ${experiment.title}`}
        maxWidth="3xl"
        headerActions={
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            {/* Tipo Badge */}
            {tipoConfig && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${tipoConfig.bgColor} ${tipoConfig.color}`}
              >
                {tipoConfig.label}
              </span>
            )}
            <IconActionButton
              variant="edit"
              size="md"
              onClick={() => onEdit(experiment)}
              className="[&_svg]:h-6 [&_svg]:w-6"
            />
          </div>
        }
      >
        <div className="space-y-4">
          {/* Description with lightbulb */}
          {experiment.description && (
            <div className="rounded-xl bg-gray-800/50 p-4">
              <h3 className="mb-2 text-sm font-medium text-cyan-400">💡 Hipótese / Descrição</h3>
              <p className="whitespace-pre-wrap text-gray-300">{experiment.description}</p>
            </div>
          )}

          {/* Tags as colorful badges */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => {
                const color = getTagColor(index);
                return (
                  <span
                    key={tag}
                    className={`rounded px-2.5 py-1 text-sm font-medium ${color.bg} ${color.text} border ${color.border}`}
                  >
                    🏷️ {tag}
                  </span>
                );
              })}
            </div>
          )}

          {/* Images Gallery - Clickable for preview (matching RecapModal pattern) */}
          {experiment.images.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-300">Screenshots</h3>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {experiment.images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => openImagePreview(index)}
                    className="group relative overflow-hidden rounded-lg border border-gray-700 transition-colors hover:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.imageUrl}
                      alt={img.description || `Screenshot ${index + 1}`}
                      className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <svg
                        className="h-6 w-6 text-white"
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
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trades Section - Prós/Contras */}
          <ExperimentTradesSection
            experimentId={experiment.id}
            availableTrades={availableTrades}
            accounts={accounts}
          />

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

          {/* Footer - Timestamp and Promote button only */}
          <div className="flex items-center justify-between border-t border-gray-700 pt-3">
            <span className="text-xs text-gray-500">
              Criado em: {formatDate(experiment.createdAt)}
            </span>

            {experiment.status === "validado" && !experiment.promotedToPlaybook && (
              <Button
                variant="gradient-success"
                size="sm"
                onClick={() => {
                  onPromote(experiment.id);
                  onClose();
                }}
                leftIcon={<span>📕</span>}
              >
                Promover para Playbook
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Reusable Image Preview Lightbox (same as RecapModal) */}
      {previewIndex !== null && (
        <ImagePreviewLightbox
          images={imageItems}
          currentIndex={previewIndex}
          onClose={closeImagePreview}
          onNavigate={setPreviewIndex}
        />
      )}
    </>
  );
}

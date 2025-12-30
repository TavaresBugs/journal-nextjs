"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Modal,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  ModalFooterActions,
} from "@/components/ui";
import type { ExperimentStatus, ExperimentType, LaboratoryExperiment } from "@/types";
import { CreateExperimentData, UpdateExperimentData } from "@/store/useLaboratoryStore";
import { RecapImageUploader } from "./recap";

interface ExperimentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: LaboratoryExperiment | null;
  onSubmit: (data: CreateExperimentData | UpdateExperimentData, files: File[]) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_OPTIONS: { value: ExperimentStatus; label: string }[] = [
  { value: "testando", label: "Testando" },
  { value: "validado", label: "Validado" },
  { value: "descartado", label: "Descartado" },
];

const TIPO_OPTIONS = [
  { value: "contexto", label: "Contexto" },
  { value: "entrada", label: "Entrada" },
];

const getStatusLabel = (value: ExperimentStatus) =>
  STATUS_OPTIONS.find((o) => o.value === value)?.label || value;
const getTipoLabel = (value: string) => TIPO_OPTIONS.find((o) => o.value === value)?.label || value;

// Badge colors for tags
const TAG_COLORS = [
  { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
  { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30" },
  { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
];

const getTagColor = (index: number) => TAG_COLORS[index % TAG_COLORS.length];

export function ExperimentFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
  isLoading = false,
}: ExperimentFormModalProps) {
  const isEditMode = mode === "edit";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [experimentType, setExperimentType] = useState<ExperimentType | "">("");
  const [status, setStatus] = useState<ExperimentStatus>("testando");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Reset & Initialize
  const handleReset = useCallback(() => {
    setTitle("");
    setDescription("");
    setExperimentType("");
    setStatus("testando");
    setTags([]);
    setTagInput("");
    setSelectedFiles([]);
    setPreviews([]);
    setCarouselIndex(0);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setExperimentType(initialData.experimentType || "");
      setStatus(initialData.status);
      setTags(initialData.category ? initialData.category.split(", ").map((t) => t.trim()) : []);
      setPreviews(initialData.images?.map((img) => img.imageUrl) || []);
      setSelectedFiles([]);
      setCarouselIndex(0);
    } else {
      handleReset();
    }
  }, [isOpen, isEditMode, initialData, handleReset]);

  const handleAddFiles = useCallback((files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleRemoveImage = useCallback(
    (index: number) => {
      const isNewFile = index >= previews.length - selectedFiles.length;
      if (isNewFile) {
        const existingCount = previews.length - selectedFiles.length;
        const fileIndex = index - existingCount;
        setSelectedFiles((files) => files.filter((_, i) => i !== fileIndex));
      }
      setPreviews((prev) => prev.filter((_, i) => i !== index));
      setCarouselIndex((prevIdx) => Math.max(0, Math.min(prevIdx, previews.length - 2)));
    },
    [previews.length, selectedFiles.length]
  );

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const newTag = tagInput.trim().toUpperCase();
        if (newTag && !tags.includes(newTag)) {
          setTags((prev) => [...prev, newTag]);
          setTagInput("");
        }
      } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [tagInput, tags]
  );

  const removeTag = useCallback((index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditMode && initialData) {
      const updateData: UpdateExperimentData = {
        id: initialData.id,
        title: title.trim(),
        description: description.trim() || undefined,
        experimentType: experimentType || undefined,
        status,
        category: tags.length > 0 ? tags.join(", ") : undefined,
      };
      await onSubmit(updateData, selectedFiles);
    } else {
      const createData: CreateExperimentData = {
        title: title.trim(),
        description: description.trim() || undefined,
        experimentType: experimentType || undefined,
        status,
        category: tags.length > 0 ? tags.join(", ") : undefined,
      };
      await onSubmit(createData, selectedFiles);
    }

    handleClose();
  };

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? `✏️ Editar Experimento` : "🧪 Novo Experimento"}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
        {/* Title */}
        <Input
          label="Título da Estratégia"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Breakout com FVG no M5"
          required
          autoComplete="off"
        />

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Descrição / Hipótese
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a ideia, condições de entrada, saída esperada..."
            className="w-full resize-none rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            rows={4}
            autoComplete="off"
          />
        </div>

        {/* Tipo and Status row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Tipo</label>
            <Select
              value={experimentType}
              onValueChange={(v) => setExperimentType(v as ExperimentType)}
            >
              <SelectTrigger className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-700 bg-gray-800/50 px-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                <span>{experimentType ? getTipoLabel(experimentType) : "Selecione..."}</span>
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800">
                {TIPO_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="cursor-pointer py-2.5 text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as ExperimentStatus)}>
              <SelectTrigger className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-700 bg-gray-800/50 px-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                <span>{getStatusLabel(status)}</span>
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="cursor-pointer py-2.5 text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags with badges */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Tags</label>
          <div
            className="flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/50 px-3 py-2 transition-colors focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500"
            onClick={() => document.getElementById("experiment-tag-input")?.focus()}
          >
            {tags.map((tag, index) => {
              const color = getTagColor(index);
              return (
                <span
                  key={index}
                  className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${color.bg} ${color.text} border ${color.border}`}
                >
                  🏷️ {tag}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(index);
                    }}
                    className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-black/20 hover:text-white"
                    title="Remover tag"
                  >
                    ×
                  </button>
                </span>
              );
            })}
            <input
              id="experiment-tag-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? "Scalping Breakout FVG" : ""}
              className="min-w-[80px] flex-1 border-none bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Image Upload - Using standardized RecapImageUploader */}
        <RecapImageUploader
          previews={previews}
          carouselIndex={carouselIndex}
          onCarouselIndexChange={setCarouselIndex}
          onAddFiles={handleAddFiles}
          onRemoveImage={handleRemoveImage}
        />

        {/* Actions - Using standardized ModalFooterActions */}
        <ModalFooterActions
          isSubmit
          onSecondary={handleClose}
          primaryLabel={isEditMode ? "Salvar Alterações" : "Criar Experimento"}
          isLoading={isLoading}
          disabled={!title.trim()}
          primaryVariant="gradient-success"
        />
      </form>
    </Modal>
  );
}

// Re-export as CreateExperimentModal for backwards compatibility
export function CreateExperimentModal(
  props: Omit<ExperimentFormModalProps, "mode" | "initialData">
) {
  return <ExperimentFormModal {...props} mode="create" initialData={null} />;
}

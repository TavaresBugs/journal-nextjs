"use client";

import React, { useState, useCallback } from "react";
import {
  Modal,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  ModalFooterActions,
} from "@/components/ui";
import type { ExperimentStatus } from "@/types";
import { CreateExperimentData } from "@/store/useLaboratoryStore";
import { RecapImageUploader } from "./recap";

interface CreateExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExperimentData, files: File[]) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_OPTIONS: { value: ExperimentStatus; label: string }[] = [
  { value: "em_aberto", label: "Em Aberto" },
  { value: "testando", label: "Testando" },
  { value: "validado", label: "Validado" },
  { value: "descartado", label: "Descartado" },
];

// Badge colors for tags
const TAG_COLORS = [
  { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
  { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30" },
  { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
];

const getTagColor = (index: number) => TAG_COLORS[index % TAG_COLORS.length];

export function CreateExperimentModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateExperimentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ExperimentStatus>("em_aberto");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [expectedWinRate, setExpectedWinRate] = useState("");
  const [expectedRiskReward, setExpectedRiskReward] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

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

    const data: CreateExperimentData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      category: tags.length > 0 ? tags.join(", ") : undefined,
      expectedWinRate: expectedWinRate ? parseFloat(expectedWinRate) : undefined,
      expectedRiskReward: expectedRiskReward ? parseFloat(expectedRiskReward) : undefined,
    };

    await onSubmit(data, selectedFiles);
    handleReset();
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setStatus("em_aberto");
    setTags([]);
    setTagInput("");
    setExpectedWinRate("");
    setExpectedRiskReward("");
    setSelectedFiles([]);
    setPreviews([]);
    setCarouselIndex(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🧪 Novo Experimento" maxWidth="xl">
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

        {/* Status and Tags row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as ExperimentStatus)}>
              <SelectTrigger className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-700 bg-gray-800/50 px-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500">
                <SelectValue placeholder="Selecione..." />
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

          {/* Tags with badges */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Tags / Categoria</label>
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
        </div>

        {/* Expected metrics row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Win Rate Esperado (%)"
            type="number"
            value={expectedWinRate}
            onChange={(e) => setExpectedWinRate(e.target.value)}
            placeholder="Ex: 65"
            min="0"
            max="100"
            step="0.1"
            autoComplete="off"
          />

          <Input
            label="Risk/Reward Esperado"
            type="number"
            value={expectedRiskReward}
            onChange={(e) => setExpectedRiskReward(e.target.value)}
            placeholder="Ex: 2.5"
            min="0"
            step="0.1"
            autoComplete="off"
          />
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
          primaryLabel="Criar Experimento"
          isLoading={isLoading}
          disabled={!title.trim()}
          primaryVariant="gradient-success"
        />
      </form>
    </Modal>
  );
}

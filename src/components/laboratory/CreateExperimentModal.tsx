"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Modal,
  Input,
  Button,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import type { ExperimentStatus } from "@/types";
import { CreateExperimentData } from "@/store/useLaboratoryStore";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviews((prev) => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

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

        {/* Image Upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Screenshots de Gráficos
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-600 py-8 text-gray-400 transition-colors hover:border-cyan-500 hover:text-cyan-400"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Clique para adicionar imagens</span>
          </button>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {previews.map((preview, index) => (
                <div key={index} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 rounded-full bg-red-500/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-700 pt-4">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="gradient-success" disabled={!title.trim() || isLoading}>
            {isLoading ? "Salvando..." : "Criar Experimento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

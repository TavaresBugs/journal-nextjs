"use client";

import { Input } from "@/components/ui";
import { DebouncedTextarea } from "@/components/ui/DebouncedTextarea";
import { TimeframeImageGrid } from "@/components/shared";
import type { ClipboardEvent, ChangeEvent } from "react";

interface JournalAnalysisProps {
  emotion: string;
  setEmotion: (value: string) => void;
  analysis: string;
  setAnalysis: (value: string) => void;
  images: Record<string, string[]>;
  onPasteImage: (e: ClipboardEvent<HTMLDivElement>, key: string) => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>, key: string) => void;
  onRemoveImage: (key: string) => void;
  timeframes: ReadonlyArray<{ key: string; label: string }>;
}

export function JournalAnalysis({
  emotion,
  setEmotion,
  analysis,
  setAnalysis,
  images,
  onPasteImage,
  onFileSelect,
  onRemoveImage,
  timeframes,
}: JournalAnalysisProps) {
  return (
    <>
      {/* Análise Multi-Timeframe (Imagens) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-400">Análise Multi-Timeframe (Imagens)</label>
          <span className="text-xs text-gray-500">
            Clique no ícone de upload ou use CTRL+V para colar
          </span>
        </div>

        <TimeframeImageGrid
          timeframes={timeframes}
          images={images}
          onPaste={onPasteImage}
          onFileSelect={onFileSelect}
          onRemoveImage={onRemoveImage}
        />
      </div>

      {/* Estado Emocional */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <span>🧠</span> Estado Emocional
        </label>
        <Input
          value={emotion}
          onChange={(e) => setEmotion(e.target.value)}
          placeholder="Ex: Calmo, Ansioso, Focado, Vingativo..."
          className=""
        />
      </div>

      {/* Leitura do Ativo */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <span>🔍</span> Leitura do Ativo Operado
        </label>
        <DebouncedTextarea
          value={analysis}
          onDebouncedChange={setAnalysis}
          placeholder="Descreva sua análise do ativo em cada timeframe..."
          className="h-48 border-white/5 font-mono text-sm"
        />
      </div>
    </>
  );
}

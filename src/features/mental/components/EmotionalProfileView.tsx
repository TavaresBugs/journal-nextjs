"use client";

import { useState, useEffect } from "react";
import { GlassCard, Button } from "@/components/ui";
import { saveEmotionalProfileAction } from "@/app/actions/emotionalProfile";
import {
  getMentalLogsByMoodAction,
  deleteMentalLogAction,
  updateMentalLogAction,
} from "@/app/actions/mental";
import type { EmotionalProfile } from "@/lib/database/repositories/EmotionalProfileRepository";
import type { EmotionType } from "@/lib/database/repositories/EmotionalProfileRepository";
import type { MentalLog } from "@/lib/database/repositories/MentalRepository";
import { HistoryCardCompact } from "./history/HistoryCardCompact";
import { ViewEntryModal } from "./history/ViewEntryModal";
import { EditEntryModal } from "./history/EditEntryModal";
import { DeleteConfirmDialog } from "./history/DeleteConfirmDialog";

interface EmotionalProfileViewProps {
  profile: EmotionalProfile;
  onBack: () => void;
  onSave?: () => void;
}

const EMOTION_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  fear: { emoji: "😰", label: "Medo", color: "text-blue-400" },
  greed: { emoji: "🤑", label: "Ganância", color: "text-yellow-400" },
  fomo: { emoji: "😱", label: "FOMO", color: "text-purple-400" },
  tilt: { emoji: "🤬", label: "Tilt", color: "text-red-400" },
  revenge: { emoji: "😤", label: "Revenge", color: "text-orange-400" },
  hesitation: { emoji: "🤔", label: "Hesitação", color: "text-cyan-400" },
  overconfidence: { emoji: "😎", label: "Excesso de Confiança", color: "text-green-400" },
};

// Map emotion type to mood tag (how it's stored in mental_logs)
const EMOTION_TO_MOOD: Record<string, string> = {
  fear: "fear",
  greed: "greed",
  fomo: "fomo",
  tilt: "tilt",
  revenge: "revenge",
  hesitation: "hesitation",
  overconfidence: "overconfidence",
};

export function EmotionalProfileView({ profile, onBack, onSave }: EmotionalProfileViewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [firstSign, setFirstSign] = useState(profile.firstSign || "");
  const [correctiveActions, setCorrectiveActions] = useState(profile.correctiveActions || "");
  const [injectingLogic, setInjectingLogic] = useState(profile.injectingLogic || "");
  const [angerLevels, setAngerLevels] = useState<Record<string, string>>(profile.angerLevels || {});
  const [technicalChanges, setTechnicalChanges] = useState<Record<string, string>>(
    profile.technicalChanges || {}
  );
  const [triggers, setTriggers] = useState<string[]>(profile.triggers || []);
  const [newTrigger, setNewTrigger] = useState("");
  const [history, setHistory] = useState(profile.history || "");

  // History entries from mental_logs
  const [historyEntries, setHistoryEntries] = useState<MentalLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<MentalLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const config = EMOTION_CONFIG[profile.emotionType] || {
    emoji: "💭",
    label: profile.emotionType,
    color: "text-gray-400",
  };

  // Load history entries
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const moodTag = EMOTION_TO_MOOD[profile.emotionType] || profile.emotionType;
        const entries = await getMentalLogsByMoodAction(moodTag, 10);
        setHistoryEntries(entries);
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [profile.emotionType]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveEmotionalProfileAction(profile.emotionType as EmotionType, {
        firstSign,
        correctiveActions,
        injectingLogic,
        angerLevels,
        technicalChanges,
        triggers,
        history,
      });

      if (result.success) {
        onSave?.();
        onBack();
      } else {
        alert("Erro ao salvar: " + result.error);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Erro ao salvar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const addTrigger = () => {
    if (newTrigger.trim()) {
      setTriggers([...triggers, newTrigger.trim()]);
      setNewTrigger("");
    }
  };

  const removeTrigger = (index: number) => {
    setTriggers(triggers.filter((_, i) => i !== index));
  };

  const updateLevel = (type: "anger" | "technical", level: string, value: string) => {
    if (type === "anger") {
      setAngerLevels({ ...angerLevels, [level]: value });
    } else {
      setTechnicalChanges({ ...technicalChanges, [level]: value });
    }
  };

  // History Handlers
  const handleView = (entry: MentalLog) => {
    setSelectedEntry(entry);
    setViewModalOpen(true);
  };

  const handleEdit = (entry: MentalLog) => {
    setSelectedEntry(entry);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const entry = historyEntries.find((e) => e.id === id);
    if (!entry) return;

    setSelectedEntry(entry);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEntry) return;

    setIsDeleting(true);
    try {
      const result = await deleteMentalLogAction(selectedEntry.id);

      if (result.success) {
        setHistoryEntries((prev) => prev.filter((e) => e.id !== selectedEntry.id));
        setDeleteConfirmOpen(false);
        setSelectedEntry(null);
      } else {
        alert("Erro ao excluir: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("Erro ao excluir log");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateSuccess = (updatedEntry: MentalLog) => {
    setHistoryEntries((prev) => prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)));
    // Check if currently viewing the same entry
    if (selectedEntry?.id === updatedEntry.id) {
      setSelectedEntry(updatedEntry);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Notes */}
      <GlassCard className="p-4">
        <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-300 uppercase">
          Quick Notes
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">
              • Primeiro sinal de que você está ficando {config.label.toLowerCase()}:
            </label>
            <input
              type="text"
              value={firstSign}
              onChange={(e) => setFirstSign(e.target.value)}
              placeholder="Ex: Começar a pensar em aumentar a mão..."
              className="w-full rounded-lg border border-white/5 bg-[#232b32] px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-white/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">• Ações corretivas:</label>
            <input
              type="text"
              value={correctiveActions}
              onChange={(e) => setCorrectiveActions(e.target.value)}
              placeholder="Ex: Parar, respirar, revisar o plano..."
              className="w-full rounded-lg border border-white/5 bg-[#232b32] px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-white/20 focus:outline-none"
            />
          </div>
        </div>
      </GlassCard>

      {/* Injecting Logic */}
      <GlassCard className="p-4">
        <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-300 uppercase">
          Injecting Logic
        </h3>
        <textarea
          value={injectingLogic}
          onChange={(e) => setInjectingLogic(e.target.value)}
          placeholder="Lógica para injetar quando sentir essa emoção..."
          rows={3}
          className="w-full resize-none rounded-lg border border-white/5 bg-[#232b32] px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-white/20 focus:outline-none"
        />
      </GlassCard>

      {/* Levels Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Anger/Emotion Level */}
        <GlassCard className="p-4">
          <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-300 uppercase">
            Nível de {config.label}
          </h3>
          <p className="mb-3 text-xs text-gray-500">
            Descreva pensamentos e emoções em cada nível (1-10)
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <div key={level} className="flex items-center gap-2">
                <span className="w-4 text-xs text-gray-500">{level}:</span>
                <input
                  type="text"
                  value={angerLevels[level.toString()] || ""}
                  onChange={(e) => updateLevel("anger", level.toString(), e.target.value)}
                  placeholder={`Nível ${level}...`}
                  className="flex-1 rounded border border-white/5 bg-[#232b32] px-2 py-1 text-sm text-gray-100 placeholder-gray-600 focus:border-white/20 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Technical Changes */}
        <GlassCard className="p-4">
          <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-300 uppercase">
            Mudanças Técnicas
          </h3>
          <p className="mb-3 text-xs text-gray-500">Como seu trading muda em cada nível (1-10)</p>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <div key={level} className="flex items-center gap-2">
                <span className="w-4 text-xs text-gray-500">{level}:</span>
                <input
                  type="text"
                  value={technicalChanges[level.toString()] || ""}
                  onChange={(e) => updateLevel("technical", level.toString(), e.target.value)}
                  placeholder={`Nível ${level}...`}
                  className="flex-1 rounded border border-white/5 bg-[#232b32] px-2 py-1 text-sm text-gray-100 placeholder-gray-600 focus:border-white/20 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Triggers */}
      <GlassCard className="p-4">
        <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-300 uppercase">
          {config.label} Triggers
        </h3>
        <p className="mb-3 text-xs text-gray-500">O que dispara essa emoção em você?</p>
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTrigger()}
            placeholder="Adicionar trigger..."
            className="flex-1 rounded-lg border border-white/5 bg-[#232b32] px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-white/20 focus:outline-none"
          />
          <button
            onClick={addTrigger}
            className="rounded-lg bg-white/5 px-4 py-2 text-gray-300 transition-colors hover:bg-white/10"
          >
            +
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {triggers.map((trigger, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-gray-300"
            >
              {trigger}
              <button
                onClick={() => removeTrigger(i)}
                className="ml-1 text-gray-500 hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
          {triggers.length === 0 && (
            <span className="text-sm text-gray-500">Nenhum trigger adicionado</span>
          )}
        </div>
      </GlassCard>

      {/* History - New Redesign */}
      <GlassCard className="p-4">
        <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-300 uppercase">
          Histórico de {config.label}
        </h3>
        <p className="mb-3 text-xs text-gray-500">
          Suas entradas da &quot;Análise do Momento&quot; relacionadas a{" "}
          {config.label.toLowerCase()}
        </p>

        {isLoadingHistory ? (
          <div className="py-4 text-center text-sm text-gray-500">Carregando...</div>
        ) : historyEntries.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">
            Nenhuma entrada encontrada. Use &quot;Análise do Momento&quot; para registrar quando
            sentir {config.label.toLowerCase()}.
          </div>
        ) : (
          <div className="custom-scrollbar max-h-96 space-y-2 overflow-y-auto pr-2">
            {historyEntries.map((entry) => (
              <HistoryCardCompact
                key={entry.id}
                entry={entry}
                entryConfig={config}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </GlassCard>

      {/* Modals */}
      {selectedEntry && (
        <>
          <ViewEntryModal
            entry={selectedEntry}
            entryConfig={config}
            isOpen={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            onEdit={() => {
              // Close view modal and open edit modal
              setEditModalOpen(true);
            }}
          />

          <EditEntryModal
            entry={selectedEntry}
            entryConfig={config}
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSave={handleUpdateSuccess}
            updateAction={updateMentalLogAction}
          />

          <DeleteConfirmDialog
            isOpen={deleteConfirmOpen}
            entry={selectedEntry}
            entryConfig={config}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteConfirmOpen(false)}
            isDeleting={isDeleting}
          />
        </>
      )}

      {/* Additional Notes */}
      <GlassCard className="p-4">
        <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-300 uppercase">
          Notas Adicionais
        </h3>
        <p className="mb-3 text-xs text-gray-500">Contexto adicional sobre essa emoção</p>
        <textarea
          value={history}
          onChange={(e) => setHistory(e.target.value)}
          placeholder="Reflexões gerais sobre como essa emoção afeta seu trading..."
          rows={3}
          className="w-full resize-none rounded-lg border border-white/5 bg-[#232b32] px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-white/20 focus:outline-none"
        />
      </GlassCard>

      {/* Save Button at Bottom */}
      <div className="flex justify-center border-t border-gray-800 pt-4">
        <Button
          variant="zorin-primary"
          size="lg"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={isSaving}
          className="px-8"
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}

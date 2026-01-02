import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Zap, AlertOctagon, ClipboardCheck } from "lucide-react";
import { Modal, ModalFooterActions } from "@/components/ui";
import { MentalStepSection } from "../MentalStepSection";
import type { MentalLog } from "@/lib/database/repositories/MentalRepository";

interface Props {
  entry: MentalLog;
  entryConfig: { emoji: string; label: string; color: string };
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEntry: MentalLog) => void;
  updateAction: (
    id: string,
    data: {
      moodTag?: string;
      step1Problem?: string;
      step2Validation?: string;
      step3Flaw?: string;
      step4Correction?: string;
      step5Logic?: string;
    }
  ) => Promise<{ success: boolean; log?: MentalLog; error?: string }>;
}

export function EditEntryModal({
  entry,
  entryConfig,
  isOpen,
  onClose,
  onSave,
  updateAction,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    step1Problem: entry.step1Problem,
    step2Validation: entry.step2Validation || "",
    step3Flaw: entry.step3Flaw || "",
    step4Correction: entry.step4Correction || "",
    step5Logic: entry.step5Logic || "",
  });

  // Reset form when entry changes
  useEffect(() => {
    setFormData({
      step1Problem: entry.step1Problem,
      step2Validation: entry.step2Validation || "",
      step3Flaw: entry.step3Flaw || "",
      step4Correction: entry.step4Correction || "",
      step5Logic: entry.step5Logic || "",
    });
  }, [entry]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const result = await updateAction(entry.id, formData);

      if (result.success && result.log) {
        onSave(result.log);
        onClose();
      } else {
        alert(result.error || "Erro ao salvar alterações");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Erro ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  const TitleComponent = (
    <div className="flex items-center gap-3">
      <span className="text-3xl">{entryConfig.emoji}</span>
      <div>
        <h2 className="text-xl font-bold text-gray-100">Editar Entrada</h2>
        <p className={`text-sm ${entryConfig.color} font-medium capitalize opacity-80`}>
          {entryConfig.label}
        </p>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={TitleComponent} maxWidth="2xl">
      <div className="space-y-6">
        {/* O Problema */}
        <MentalStepSection
          icon={<AlertTriangle size={16} />}
          label="O PROBLEMA"
          colorClass="text-red-400"
        >
          <textarea
            value={formData.step1Problem}
            onChange={(e) => handleChange("step1Problem", e.target.value)}
            className="min-h-[100px] w-full resize-none rounded-lg border border-red-500/20 bg-[#232b32] px-4 py-3 text-gray-200 placeholder-gray-600 transition-all focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 focus:outline-none"
            placeholder="Descreva o problema..."
          />
        </MentalStepSection>

        {/* A Falha Lógica */}
        <MentalStepSection
          icon={<AlertOctagon size={16} />}
          label="A FALHA LÓGICA"
          colorClass="text-orange-400"
        >
          <textarea
            value={formData.step3Flaw}
            onChange={(e) => handleChange("step3Flaw", e.target.value)}
            className="min-h-[80px] w-full resize-none rounded-lg border border-orange-500/20 bg-[#232b32] px-4 py-3 text-gray-200 placeholder-gray-600 transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:outline-none"
            placeholder="A falha no meu pensamento é..."
          />
        </MentalStepSection>

        {/* A Correção */}
        <MentalStepSection
          icon={<CheckCircle size={16} />}
          label="A CORREÇÃO"
          colorClass="text-green-400"
        >
          <textarea
            value={formData.step4Correction}
            onChange={(e) => handleChange("step4Correction", e.target.value)}
            className="min-h-[100px] w-full resize-none rounded-lg border border-green-500/20 bg-[#232b32] px-4 py-3 text-gray-200 placeholder-gray-600 transition-all focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 focus:outline-none"
            placeholder="A correção é..."
          />
        </MentalStepSection>

        {/* Validação */}
        <MentalStepSection
          icon={<ClipboardCheck size={16} />}
          label="VALIDAÇÃO"
          colorClass="text-gray-400"
        >
          <textarea
            value={formData.step2Validation}
            onChange={(e) => handleChange("step2Validation", e.target.value)}
            className="min-h-[80px] w-full resize-none rounded-lg border border-gray-700/50 bg-[#232b32] px-4 py-3 text-gray-300 placeholder-gray-600 transition-all focus:border-gray-500 focus:outline-none"
            placeholder="Eu validei..."
          />
        </MentalStepSection>

        {/* Reforço Lógico */}
        <MentalStepSection
          icon={<Zap size={16} />}
          label="REFORÇO LÓGICO"
          colorClass="text-blue-400"
        >
          <textarea
            value={formData.step5Logic}
            onChange={(e) => handleChange("step5Logic", e.target.value)}
            className="min-h-[80px] w-full resize-none rounded-lg border border-blue-500/20 bg-[#232b32] px-4 py-3 text-blue-100/90 italic placeholder-gray-600 transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:outline-none"
            placeholder="Lógica para reforçar..."
          />
        </MentalStepSection>

        {/* Footer Actions */}
        <ModalFooterActions
          mode="save-cancel"
          primaryLabel="Salvar Alterações"
          secondaryLabel="Cancelar"
          onPrimary={handleSubmit}
          onSecondary={onClose}
          isLoading={isSaving}
          disabled={isSaving}
        />
      </div>
    </Modal>
  );
}

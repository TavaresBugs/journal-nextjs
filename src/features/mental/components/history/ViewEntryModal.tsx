import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertTriangle, CheckCircle, Zap, AlertOctagon, ClipboardCheck } from "lucide-react";
import { Modal, IconActionButton } from "@/components/ui";
import { MentalStepSection } from "../MentalStepSection";
import type { MentalLog } from "@/lib/database/repositories/MentalRepository";

interface Props {
  entry: MentalLog;
  entryConfig: { emoji: string; label: string; color: string };
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ViewEntryModal({ entry, entryConfig, isOpen, onClose, onEdit }: Props) {
  const TitleComponent = (
    <div className="flex items-center gap-3">
      <span className="text-3xl">{entryConfig.emoji}</span>
      <div>
        <h2 className={`text-xl font-bold capitalize ${entryConfig.color}`}>{entryConfig.label}</h2>
        <p className="text-sm text-gray-500">
          {format(new Date(entry.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
            locale: ptBR,
          })}
        </p>
      </div>
    </div>
  );

  const EditButton = (
    <IconActionButton
      variant="edit"
      onClick={() => {
        onClose();
        onEdit();
      }}
    />
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={TitleComponent}
      headerActions={EditButton}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Tempo Relativo */}
        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3 text-sm text-gray-500">
          <Clock size={16} />
          <span>
            Registrado{" "}
            {formatDistanceToNow(new Date(entry.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>

        {/* O Problema */}
        <MentalStepSection
          icon={<AlertTriangle size={16} />}
          label="O PROBLEMA"
          colorClass="text-red-400"
          bgClass="bg-red-500/10"
        >
          <p className="leading-relaxed whitespace-pre-wrap text-gray-200">{entry.step1Problem}</p>
        </MentalStepSection>

        {/* A Falha Lógica */}
        {entry.step3Flaw && (
          <MentalStepSection
            icon={<AlertOctagon size={16} />}
            label="A FALHA LÓGICA"
            colorClass="text-orange-400"
            bgClass="bg-orange-500/10"
          >
            <p className="leading-relaxed whitespace-pre-wrap text-gray-200">{entry.step3Flaw}</p>
          </MentalStepSection>
        )}

        {/* A Correção */}
        {entry.step4Correction && (
          <MentalStepSection
            icon={<CheckCircle size={16} />}
            label="A CORREÇÃO"
            colorClass="text-green-400"
            bgClass="bg-green-500/10"
          >
            <p className="leading-relaxed whitespace-pre-wrap text-gray-200">
              {entry.step4Correction}
            </p>
          </MentalStepSection>
        )}

        {/* Validação */}
        {entry.step2Validation && (
          <MentalStepSection
            icon={<ClipboardCheck size={16} />}
            label="VALIDAÇÃO"
            colorClass="text-gray-400"
            bgClass="bg-gray-700/30"
          >
            <p className="leading-relaxed whitespace-pre-wrap text-gray-300">
              {entry.step2Validation}
            </p>
          </MentalStepSection>
        )}

        {/* Reforço Lógico */}
        {entry.step5Logic && (
          <MentalStepSection
            icon={<Zap size={16} />}
            label="REFORÇO LÓGICO"
            colorClass="text-blue-400"
            bgClass="bg-blue-500/10"
          >
            <p className="leading-relaxed whitespace-pre-wrap text-blue-100/90 italic">
              &quot;{entry.step5Logic}&quot;
            </p>
          </MentalStepSection>
        )}
      </div>
    </Modal>
  );
}

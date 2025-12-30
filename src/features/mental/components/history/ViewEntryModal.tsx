import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, AlertTriangle, CheckCircle, Zap, AlertOctagon, ClipboardCheck } from "lucide-react";
import { Modal, IconActionButton } from "@/components/ui";
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
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium tracking-wide text-red-400 uppercase">
            <AlertTriangle size={16} />O PROBLEMA
          </label>
          <div className="rounded-lg bg-red-500/10 p-4">
            <p className="leading-relaxed whitespace-pre-wrap text-gray-200">
              {entry.step1Problem}
            </p>
          </div>
        </div>

        {/* A Falha Lógica */}
        {entry.step3Flaw && (
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium tracking-wide text-orange-400 uppercase">
              <AlertOctagon size={16} />A FALHA LÓGICA
            </label>
            <div className="rounded-lg bg-orange-500/10 p-4">
              <p className="leading-relaxed whitespace-pre-wrap text-gray-200">{entry.step3Flaw}</p>
            </div>
          </div>
        )}

        {/* A Correção */}
        {entry.step4Correction && (
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium tracking-wide text-green-400 uppercase">
              <CheckCircle size={16} />A CORREÇÃO
            </label>
            <div className="rounded-lg bg-green-500/10 p-4">
              <p className="leading-relaxed whitespace-pre-wrap text-gray-200">
                {entry.step4Correction}
              </p>
            </div>
          </div>
        )}

        {/* Validação */}
        {entry.step2Validation && (
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium tracking-wide text-gray-400 uppercase">
              <ClipboardCheck size={16} />
              VALIDAÇÃO
            </label>
            <div className="rounded-lg bg-gray-700/30 p-4">
              <p className="leading-relaxed whitespace-pre-wrap text-gray-300">
                {entry.step2Validation}
              </p>
            </div>
          </div>
        )}

        {/* Reforço Lógico */}
        {entry.step5Logic && (
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium tracking-wide text-blue-400 uppercase">
              <Zap size={16} />
              REFORÇO LÓGICO
            </label>
            <div className="rounded-lg bg-blue-500/10 p-4">
              <p className="leading-relaxed whitespace-pre-wrap text-blue-100/90 italic">
                &quot;{entry.step5Logic}&quot;
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

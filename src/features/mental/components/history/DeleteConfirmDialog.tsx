import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, AlertOctagon } from "lucide-react";
import { Modal, ModalFooterActions } from "@/components/ui";
import type { MentalLog } from "@/lib/database/repositories/MentalRepository";

interface Props {
  isOpen: boolean;
  entry: MentalLog;
  entryConfig: { emoji: string; label: string; color: string };
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  entry,
  entryConfig,
  onConfirm,
  onCancel,
  isDeleting = false,
}: Props) {
  const TitleComponent = (
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-red-900/20 p-3">
        <Trash2 className="text-red-500" size={24} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-100">Excluir entrada?</h3>
        <p className="text-sm text-gray-400">
          Tem certeza que deseja excluir esta entrada de{" "}
          <span className={`font-medium capitalize ${entryConfig.color}`}>{entryConfig.label}</span>
          ?
        </p>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={TitleComponent} maxWidth="md">
      <div className="space-y-4">
        <div className="rounded-lg border border-white/5 bg-black/30 p-3">
          <p className="mb-2 flex items-center gap-2 text-sm text-gray-400">
            <span>{entryConfig.emoji}</span>
            <span>{format(new Date(entry.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}</span>
          </p>
          <div className="border-l-2 border-gray-700 pl-2">
            <p className="line-clamp-2 text-xs text-gray-500">{entry.step1Problem}</p>
          </div>
        </div>

        <p className="flex items-center gap-2 rounded bg-yellow-900/10 p-2 text-xs text-yellow-500/80">
          <AlertOctagon size={14} />
          Esta ação não pode ser desfeita.
        </p>

        {/* Footer Actions */}
        <ModalFooterActions
          mode="destructive"
          primaryLabel="Excluir"
          secondaryLabel="Cancelar"
          onPrimary={onConfirm}
          onSecondary={onCancel}
          isLoading={isDeleting}
          disabled={isDeleting}
        />
      </div>
    </Modal>
  );
}

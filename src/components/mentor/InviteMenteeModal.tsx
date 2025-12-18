import { useState } from "react";
import { Modal, ModalFooterActions } from "@/components/ui";
import { inviteMentee } from "@/services/mentor/invites";
import { MentorPermission } from "@/types";

interface InviteMenteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteMenteeModal({ isOpen, onClose, onSuccess }: InviteMenteeModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const permission: MentorPermission = "comment"; // Default permission

  const handleSubmit = async () => {
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await inviteMentee(email, permission);
      if (result) {
        alert("✅ Convite enviado com sucesso para " + email);
        setEmail("");
        onSuccess();
        onClose();
      } else {
        alert("❌ Erro ao enviar convite. Verifique se o email é válido.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Erro inesperado ao enviar convite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Convidar Mentorado" maxWidth="md">
      <div className="space-y-6">
        <p className="text-sm text-gray-400">
          Convide um aluno para acompanhar seus trades e oferecer feedback através de análises e
          comentários.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Email do mentorado</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white transition-colors focus:border-cyan-500 focus:outline-none"
              placeholder="aluno@email.com"
              autoFocus
            />
          </div>

          <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
            <div className="flex items-center gap-2 text-purple-400">
              <span>💬</span>
              <span className="font-medium">Análise + Comentários</span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Você poderá visualizar os trades e journals do mentorado e adicionar comentários de
              feedback.
            </p>
          </div>
        </div>

        <ModalFooterActions
          mode="create-close"
          primaryLabel="Enviar Convite"
          primaryVariant="success"
          onPrimary={handleSubmit}
          onSecondary={onClose}
          isLoading={isSubmitting}
          disabled={!email.trim()}
          isFullWidth
          className="pt-2" // Adjust padding to match previous design if needed, or stick to standard
        />
      </div>
    </Modal>
  );
}

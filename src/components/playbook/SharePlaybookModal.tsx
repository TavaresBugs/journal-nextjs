"use client";

import { useState, useEffect } from "react";
import { Button, Modal, Input } from "@/components/ui";
import { Playbook } from "@/types";
import { sharePlaybookAction, getCurrentUserDisplayNameAction } from "@/app/actions/community";
import { updateUserNameAction } from "@/app/actions/admin";

interface SharePlaybookModalProps {
  playbook: Playbook;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SharePlaybookModal({
  playbook,
  isOpen,
  onClose,
  onSuccess,
}: SharePlaybookModalProps) {
  const [step, setStep] = useState<"loading" | "nickname" | "confirm">("loading");
  const [nickname, setNickname] = useState("");
  const [existingName, setExistingName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has a display name
  useEffect(() => {
    if (!isOpen) return;

    const checkUserName = async () => {
      setStep("loading");
      setError(null);

      const displayName = await getCurrentUserDisplayNameAction();

      if (displayName) {
        setExistingName(displayName);
        setStep("confirm");
      } else {
        setStep("nickname");
      }
    };

    checkUserName();
  }, [isOpen]);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) {
      setError("Por favor, digite um nickname");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await updateUserNameAction(nickname.trim());

    if (result.success) {
      setExistingName(nickname.trim());
      setStep("confirm");
    } else {
      setError(result.error || "Erro ao salvar. Tente novamente.");
    }

    setIsSubmitting(false);
  };

  const handleShare = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await sharePlaybookAction(playbook.id);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "Erro ao compartilhar. Tente novamente.");
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🌐 Compartilhar Playbook" maxWidth="md">
      <div className="space-y-4">
        {/* Header Subtitle */}
        <p className="-mt-2 mb-4 text-sm text-gray-400">Torne público na comunidade</p>

        {/* Loading State */}
        {step === "loading" && (
          <div className="py-8 text-center text-gray-400">
            <div className="border-zorin-accent mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
            Verificando...
          </div>
        )}

        {/* Nickname Step */}
        {step === "nickname" && (
          <div className="space-y-4">
            <p className="text-gray-300">
              Para compartilhar playbooks, você precisa de um nome de exibição.
            </p>

            <Input
              label="Seu nickname na comunidade"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ex: TraderPro, João Silva..."
              maxLength={50}
            />

            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

            <div className="mt-6 flex gap-3 border-t border-white/5 pt-4">
              <Button variant="zorin-ghost" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="zorin-primary"
                onClick={handleSaveNickname}
                isLoading={isSubmitting}
                className="flex-1"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {/* Confirm Step */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="bg-zorin-bg/30 rounded-xl border border-white/5 p-4">
              <div className="flex items-center gap-3">
                <div
                  className="bg-zorin-bg/50 rounded-lg p-2 text-2xl"
                  style={{ color: playbook.color }}
                >
                  {playbook.icon}
                </div>
                <div>
                  <div className="font-semibold text-white">{playbook.name}</div>
                  <div className="text-sm text-gray-400">
                    Será exibido como: <span className="text-zorin-accent">{existingName}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-300">
              Outros usuários poderão ver e se inspirar nas suas regras.
            </p>

            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 border-t border-white/5 pt-4">
              <Button variant="zorin-ghost" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="zorin-primary"
                onClick={handleShare}
                isLoading={isSubmitting}
                className="flex-1"
              >
                🌐 Compartilhar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

"use client";

import { Modal } from "@/components/ui";
import { TradeForm } from "./TradeForm";
import type { Trade } from "@/types";

interface EditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
  onUpdateTrade: (trade: Trade) => void | Promise<void>;
  /** When true, modal is opened from another modal (e.g., DayDetailModal) and should not have backdrop */
  isSecondaryModal?: boolean;
}

export function EditTradeModal({
  isOpen,
  onClose,
  trade,
  onUpdateTrade,
  isSecondaryModal = false,
}: EditTradeModalProps) {
  if (!trade) return null;

  const handleUpdate = async (tradeData: Omit<Trade, "id" | "createdAt" | "updatedAt">) => {
    const updatedTrade: Trade = {
      ...trade,
      ...tradeData,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateTrade(updatedTrade);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✏️ Editar Trade"
      maxWidth="6xl"
      noBackdrop={isSecondaryModal}
    >
      <TradeForm
        accountId={trade.accountId}
        onSubmit={handleUpdate}
        onCancel={onClose}
        initialData={trade}
        mode="edit"
      />
    </Modal>
  );
}

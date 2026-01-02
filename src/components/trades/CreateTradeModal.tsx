"use client";

import { Modal } from "@/components/ui";
import { TradeForm } from "./TradeForm";
import type { Trade } from "@/types";

interface CreateTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onCreateTrade: (trade: Omit<Trade, "id" | "createdAt" | "updatedAt">) => void;
}

/**
 * CreateTradeModal - Modal for creating new trades
 *
 * Reuses TradeForm component for consistent form behavior and validation.
 * Pattern mirrors EditTradeModal for maintainability.
 */
export function CreateTradeModal({
  isOpen,
  onClose,
  accountId,
  onCreateTrade,
}: CreateTradeModalProps) {
  const handleCreate = async (tradeData: Omit<Trade, "id" | "createdAt" | "updatedAt">) => {
    onCreateTrade(tradeData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="➕ Novo Trade" maxWidth="6xl">
      <TradeForm accountId={accountId} onSubmit={handleCreate} onCancel={onClose} mode="create" />
    </Modal>
  );
}

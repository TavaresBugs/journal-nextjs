"use client";

import { Modal } from "@/components/ui";
import { TradeForm } from "./TradeForm";
import type { Trade } from "@/types";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  mode: "create" | "edit";
  /** Required for edit mode */
  trade?: Trade | null;
  onSubmit: (trade: Trade | Omit<Trade, "id" | "createdAt" | "updatedAt">) => void | Promise<void>;
  /** When true, modal is opened from another modal (e.g., DayDetailModal) and should not have backdrop */
  isSecondaryModal?: boolean;
}

/**
 * TradeModal - Unified modal for creating and editing trades
 *
 * Replaces CreateTradeModal and EditTradeModal with a single component.
 * Uses TradeForm component for consistent form behavior and validation.
 *
 * @example
 * // Create mode
 * <TradeModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   accountId={accountId}
 *   mode="create"
 *   onSubmit={handleCreateTrade}
 * />
 *
 * @example
 * // Edit mode
 * <TradeModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   accountId={trade.accountId}
 *   mode="edit"
 *   trade={trade}
 *   onSubmit={handleUpdateTrade}
 *   isSecondaryModal={true}
 * />
 */
export function TradeModal({
  isOpen,
  onClose,
  accountId,
  mode,
  trade,
  onSubmit,
  isSecondaryModal = false,
}: TradeModalProps) {
  // Edit mode requires a trade
  if (mode === "edit" && !trade) return null;

  const handleSubmit = async (tradeData: Omit<Trade, "id" | "createdAt" | "updatedAt">) => {
    if (mode === "edit" && trade) {
      // For edit mode, merge with existing trade data
      const updatedTrade: Trade = {
        ...trade,
        ...tradeData,
        updatedAt: new Date().toISOString(),
      };
      await onSubmit(updatedTrade);
    } else {
      // For create mode, just pass the new data
      await onSubmit(tradeData);
    }
    onClose();
  };

  const title = mode === "create" ? "➕ Novo Trade" : "✏️ Editar Trade";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="6xl"
      noBackdrop={isSecondaryModal}
    >
      <TradeForm
        accountId={accountId}
        onSubmit={handleSubmit}
        onCancel={onClose}
        initialData={mode === "edit" && trade ? trade : undefined}
        mode={mode}
      />
    </Modal>
  );
}

// Re-export legacy components for backwards compatibility
// These can be deprecated in future versions

/** @deprecated Use TradeModal with mode="create" instead */
export function CreateTradeModal({
  isOpen,
  onClose,
  accountId,
  onCreateTrade,
}: {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onCreateTrade: (trade: Omit<Trade, "id" | "createdAt" | "updatedAt">) => void;
}) {
  return (
    <TradeModal
      isOpen={isOpen}
      onClose={onClose}
      accountId={accountId}
      mode="create"
      onSubmit={onCreateTrade}
    />
  );
}

/** @deprecated Use TradeModal with mode="edit" instead */
export function EditTradeModal({
  isOpen,
  onClose,
  trade,
  onUpdateTrade,
  isSecondaryModal = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
  onUpdateTrade: (trade: Trade) => void | Promise<void>;
  isSecondaryModal?: boolean;
}) {
  if (!trade) return null;

  return (
    <TradeModal
      isOpen={isOpen}
      onClose={onClose}
      accountId={trade.accountId}
      mode="edit"
      trade={trade}
      onSubmit={
        onUpdateTrade as (trade: Trade | Omit<Trade, "id" | "createdAt" | "updatedAt">) => void
      }
      isSecondaryModal={isSecondaryModal}
    />
  );
}

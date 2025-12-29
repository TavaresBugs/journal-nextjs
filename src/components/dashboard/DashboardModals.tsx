import React from "react";
import {
  CreateTradeModal,
  EditTradeModal,
  SettingsModal,
  PlaybookFormModal,
  ViewPlaybookModal,
  SharePlaybookModal,
  DayDetailModal,
  ImportModal,
} from "@/components/modals/DynamicModals";
import { Trade, Playbook } from "@/types";

interface DashboardModalsProps {
  accountId: string;
  currentBalance: number;
  currency: string;
  allHistory: Trade[];

  // Modal States
  isCreateModalOpen: boolean;
  isImportModalOpen: boolean;
  isEditModalOpen: boolean;
  isDayDetailModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isCreatePlaybookModalOpen: boolean;
  isEditFromDayDetail: boolean;

  // Selected Data
  selectedTrade: Trade | null;
  selectedDate: string;
  editingPlaybook: Playbook | null;
  viewingPlaybook: Playbook | null;
  sharingPlaybook: Playbook | null;

  // Actions
  onCloseCreateModal: () => void;
  onCloseImportModal: () => void;
  onCloseEditModal: () => void;
  onCloseDayDetailModal: () => void;
  onCloseSettingsModal: () => void;
  onCloseCreatePlaybookModal: () => void;

  setEditingPlaybook: (playbook: Playbook | null) => void;
  setViewingPlaybook: (playbook: Playbook | null) => void;
  setSharingPlaybook: (playbook: Playbook | null) => void;

  // Handlers
  handleCreateTrade: (tradeData: Omit<Trade, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  handleUpdateTrade: (trade: Trade) => Promise<void>;
  handleDeleteTrade: (tradeId: string) => Promise<void>;
  handleEditTrade: (trade: Trade, fromDayDetail?: boolean) => void; // Used by DayDetailModal
  handleImportComplete: () => void;
  handleUpdateBalance: (newBalance: number) => Promise<void>;
  handlePlaybookCreated: () => void;
  handleUpdatePlaybook: () => Promise<void>;
  handleShareSuccess: () => void;
}

export function DashboardModals({
  accountId,
  currentBalance,
  currency,
  allHistory,

  isCreateModalOpen,
  isImportModalOpen,
  isEditModalOpen,
  isDayDetailModalOpen,
  isSettingsModalOpen,
  isCreatePlaybookModalOpen,
  isEditFromDayDetail,

  selectedTrade,
  selectedDate,
  editingPlaybook,
  viewingPlaybook,
  sharingPlaybook,

  onCloseCreateModal,
  onCloseImportModal,
  onCloseEditModal,
  onCloseDayDetailModal,
  onCloseSettingsModal,
  onCloseCreatePlaybookModal,

  setEditingPlaybook,
  setViewingPlaybook,
  setSharingPlaybook,

  handleCreateTrade,
  handleUpdateTrade,
  handleDeleteTrade,
  handleEditTrade,
  handleImportComplete,
  handleUpdateBalance,
  handlePlaybookCreated,
  handleUpdatePlaybook,
  handleShareSuccess,
}: DashboardModalsProps) {
  return (
    <>
      <CreateTradeModal
        isOpen={isCreateModalOpen}
        onClose={onCloseCreateModal}
        accountId={accountId}
        onCreateTrade={handleCreateTrade}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={onCloseImportModal}
        defaultAccountId={accountId}
        onImportComplete={handleImportComplete}
      />

      <EditTradeModal
        isOpen={isEditModalOpen}
        onClose={onCloseEditModal}
        trade={selectedTrade}
        onUpdateTrade={handleUpdateTrade}
        isSecondaryModal={isEditFromDayDetail}
      />

      <DayDetailModal
        isOpen={isDayDetailModalOpen}
        onClose={onCloseDayDetailModal}
        date={selectedDate}
        trades={allHistory.filter((t) => t.entryDate.split("T")[0] === selectedDate)}
        accountId={accountId}
        onDeleteTrade={handleDeleteTrade}
        onEditTrade={handleEditTrade}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={onCloseSettingsModal}
        accountId={accountId}
        currentBalance={currentBalance}
        onUpdateBalance={handleUpdateBalance}
      />

      {/* Create Playbook Modal */}
      <PlaybookFormModal
        isOpen={isCreatePlaybookModalOpen}
        onClose={onCloseCreatePlaybookModal}
        onSuccess={handlePlaybookCreated}
      />

      {/* Edit Playbook Modal */}
      <PlaybookFormModal
        isOpen={!!editingPlaybook}
        onClose={() => setEditingPlaybook(null)}
        playbook={editingPlaybook}
        onSuccess={handleUpdatePlaybook}
        onBack={() => {
          const pb = editingPlaybook;
          setEditingPlaybook(null);
          if (pb) setViewingPlaybook(pb);
        }}
      />

      <ViewPlaybookModal
        isOpen={!!viewingPlaybook}
        onClose={() => setViewingPlaybook(null)}
        playbook={viewingPlaybook}
        trades={allHistory}
        currency={currency}
        onEdit={(playbook) => {
          setViewingPlaybook(null);
          setEditingPlaybook(playbook);
        }}
      />

      {sharingPlaybook && (
        <SharePlaybookModal
          playbook={sharingPlaybook}
          isOpen={!!sharingPlaybook}
          onClose={() => setSharingPlaybook(null)}
          onSuccess={handleShareSuccess}
        />
      )}
    </>
  );
}

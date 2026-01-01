"use client";

import { memo, useState } from "react";
import { Modal, IconActionButton, AssetBadge } from "@/components/ui";
import type { Trade, JournalEntry } from "@/types";
import { JournalEntryContent } from "./JournalEntryContent";
import { TradeArgumentsPanel } from "../trade-arguments";

interface JournalEntryPreviewProps {
  entry: JournalEntry;
  linkedTrades?: Trade[]; // Multiple linked trades
  onClose: () => void;
  onEdit: () => void;
  onShare: () => void;
  isSharingLoading: boolean;
  hasMentor?: boolean;
  hasUnreadComments?: boolean;
  noBackdrop?: boolean;
  onDelete?: () => void;
}

/**
 * Preview mode component for viewing journal entries.
 * Displays all entry information in a read-only format with edit and share options.
 * Memoized to prevent unnecessary re-renders.
 */
const JournalEntryPreviewComponent = ({
  entry,
  linkedTrades = [],
  onClose,
  onEdit,
  onShare,
  isSharingLoading,

  hasUnreadComments = false,
  noBackdrop = true,
  onDelete,
}: JournalEntryPreviewProps) => {
  const [showComments, setShowComments] = useState(false);
  const [showPdArray, setShowPdArray] = useState(false);

  // Get asset from linked trades or entry
  const asset = linkedTrades[0]?.symbol || entry.asset || "";

  const CustomTitle = (
    <div className="flex min-w-0 items-center gap-2 md:gap-3">
      <h2 className="text-zorin-ice truncate text-base font-bold md:text-xl">{entry.title}</h2>
      {asset && <AssetBadge symbol={asset} />}
    </div>
  );

  const HeaderActions = (
    <>
      {/* PDArray Analysis Button */}
      <IconActionButton
        variant="pdarray"
        size="md"
        onClick={() => {
          setShowPdArray(!showPdArray);
          if (!showPdArray) setShowComments(false);
        }}
        className="[&_svg]:h-6 [&_svg]:w-6"
      />

      <div className="relative">
        <IconActionButton
          variant="comments"
          size="md"
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments) setShowPdArray(false);
          }}
          title={showComments ? "Esconder comentários" : "Ver comentários"}
          className="[&_svg]:h-6 [&_svg]:w-6"
        />
        {hasUnreadComments && !showComments && (
          <span className="pointer-events-none absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-red-500" />
        )}
      </div>

      {onDelete && (
        <IconActionButton
          variant="delete"
          size="md"
          onClick={() => {
            if (confirm("Tem certeza que deseja excluir esta entrada? Ação irreversível.")) {
              onDelete();
            }
          }}
          className="[&_svg]:h-6 [&_svg]:w-6"
        />
      )}

      <IconActionButton
        variant="share"
        size="md"
        onClick={onShare}
        disabled={isSharingLoading}
        className="[&_svg]:h-6 [&_svg]:w-6"
      />
      <IconActionButton
        variant="edit"
        size="md"
        onClick={onEdit}
        className="[&_svg]:h-6 [&_svg]:w-6"
      />
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={CustomTitle}
      headerActions={HeaderActions}
      maxWidth={showComments ? "full" : "6xl"}
      noBackdrop={noBackdrop}
    >
      <div className="space-y-6">
        {/* Main Content */}
        <JournalEntryContent
          entry={entry}
          linkedTrades={linkedTrades}
          showComments={showComments}
        />

        {/* PDArray Panel - Opens BELOW the content */}
        {showPdArray && entry.id && (
          <div className="animate-in slide-in-from-bottom-4 fade-in border-t border-gray-800 pt-6 duration-300">
            <TradeArgumentsPanel journalEntryId={entry.id} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export const JournalEntryPreview = memo(JournalEntryPreviewComponent);

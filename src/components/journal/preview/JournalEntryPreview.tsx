"use client";

import { memo, useState } from "react";
import { Modal, IconActionButton, AssetBadge } from "@/components/ui";
import type { Trade, JournalEntry } from "@/types";
import { JournalEntryContent } from "./JournalEntryContent";

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
}

/**
 * Preview mode component for viewing journal entries.
 * Displays all entry information in a read-only format with edit and share options.
 * Memoized to prevent unnecessary re-renders.
 *
 * @param entry - The journal entry to display
 * @param trade - The linked trade (optional)
 * @param onClose - Callback to close the preview
 * @param onEdit - Callback to switch to edit mode
 * @param onShare - Callback to share the entry
 * @param isSharingLoading - Loading state for share action
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
}: JournalEntryPreviewProps) => {
  const [showComments, setShowComments] = useState(false);

  // Get asset from linked trades or entry
  const asset = linkedTrades[0]?.symbol || entry.asset || "";

  const CustomTitle = (
    <div className="flex items-center gap-3">
      <h2 className="text-zorin-ice text-xl font-bold">{entry.title}</h2>
      {asset && <AssetBadge symbol={asset} />}
    </div>
  );

  const HeaderActions = (
    <>
      <div className="relative">
        <IconActionButton
          variant="comments"
          size="md"
          onClick={() => setShowComments(!showComments)}
          title={showComments ? "Esconder comentários" : "Ver comentários"}
          className="[&_svg]:h-6 [&_svg]:w-6"
        />
        {hasUnreadComments && !showComments && (
          <span className="pointer-events-none absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-red-500" />
        )}
      </div>
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
        <JournalEntryContent
          entry={entry}
          linkedTrades={linkedTrades}
          showComments={showComments}
        />
      </div>
    </Modal>
  );
};

export const JournalEntryPreview = memo(JournalEntryPreviewComponent);

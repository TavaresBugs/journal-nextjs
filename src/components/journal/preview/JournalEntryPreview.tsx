'use client';

import { memo, useState } from 'react';
import { Modal, IconActionButton } from '@/components/ui';
import { AssetIcon } from '@/components/shared/AssetIcon';
import type { Trade, JournalEntry } from '@/types';
import { JournalEntryContent } from './JournalEntryContent';

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
  noBackdrop = true
}: JournalEntryPreviewProps) => {
  const [showComments, setShowComments] = useState(false);
  
  // Get asset from linked trades or entry
  const asset = linkedTrades[0]?.symbol || entry.asset || '';

  const CustomTitle = (
    <div className="flex items-center gap-3">
      <h2 className="text-xl font-bold text-zorin-ice">{entry.title}</h2>
      {asset && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800/60 rounded-lg border border-gray-700">
          <AssetIcon symbol={asset} size="sm" />
          <span className="text-sm font-medium text-gray-300">{asset}</span>
        </div>
      )}
    </div>
  );

  const HeaderActions = (
    <>
      <div className="relative">
        <IconActionButton
          variant="comments"
          size="md"
          onClick={() => setShowComments(!showComments)}
          title={showComments ? 'Esconder comentários' : 'Ver comentários'}
          className="[&_svg]:w-6 [&_svg]:h-6"
        />
        {hasUnreadComments && !showComments && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 pointer-events-none" />
        )}
      </div>
      <IconActionButton
        variant="share"
        size="md"
        onClick={onShare}
        disabled={isSharingLoading}
        className="[&_svg]:w-6 [&_svg]:h-6"
      />
      <IconActionButton
        variant="edit"
        size="md"
        onClick={onEdit}
        className="[&_svg]:w-6 [&_svg]:h-6"
      />
    </>
  );

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={CustomTitle}
      headerActions={HeaderActions}
      maxWidth={showComments ? 'full' : '6xl'}
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

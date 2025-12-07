'use client';

import { useState } from 'react';
import type { Trade, JournalEntry } from '@/types';
import { useJournalStore } from '@/store/useJournalStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useToast } from '@/contexts/ToastContext';
import { JournalEntryPreview } from './preview';
import { JournalEntryForm, type FormSubmissionData } from './form';
import dayjs from 'dayjs';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade?: Trade | null;
  existingEntry?: JournalEntry;
  initialDate?: string;
  accountId?: string;
  availableTrades?: Trade[];
  startEditing?: boolean;
  hasMentor?: boolean;
  hasUnreadComments?: boolean;
}

/**
 * Main orchestrator component for journal entry modal.
 * Manages state and delegates to Preview or Form components.
 * 
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback to close the modal
 * @param trade - Initial trade data (optional)
 * @param existingEntry - Existing journal entry to edit (optional)
 * @param initialDate - Initial date for the entry (optional)
 * @param accountId - Account ID associated with the entry
 * @param availableTrades - List of trades available to link
 * @param startEditing - Whether to start in edit mode (default: false)
 * @param hasMentor - Whether the user has an active mentor
 * @param hasUnreadComments - Whether there are unread comments for this entry/trade
 */
export function JournalEntryModal({
  isOpen,
  onClose,
  trade: initialTrade,
  existingEntry,
  initialDate,
  accountId,
  availableTrades = [],
  startEditing = false,
  hasMentor = false,
  hasUnreadComments = false
}: JournalEntryModalProps) {
  const { addEntry, updateEntry } = useJournalStore();
  const { trades: allTrades } = useTradeStore();
  const { showToast } = useToast();
  
  const [trade] = useState<Trade | null | undefined>(() => {
    if (initialTrade) return initialTrade;
    if (existingEntry?.tradeId) {
      return allTrades.find(t => t.id === existingEntry.tradeId) || null;
    }
    return null;
  });
  const [isEditing, setIsEditing] = useState(startEditing || !existingEntry);
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  // Handle share functionality
  const handleShare = async () => {
    if (!existingEntry?.id) return;
    setIsSharingLoading(true);
    try {
      const { createShareLink, copyToClipboard } = await import('@/lib/shareUtils');
      const shareUrl = await createShareLink(existingEntry.id);
      if (shareUrl && await copyToClipboard(shareUrl)) {
        showToast('🔗 Link copiado! Válido por 3 dias', 'success');
      } else {
        showToast('Erro ao gerar link de compartilhamento', 'error');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('Erro ao compartilhar', 'error');
    } finally {
      setIsSharingLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: FormSubmissionData) => {
    const targetAccountId = trade?.accountId || accountId || existingEntry?.accountId;
    
    if (!targetAccountId) {
      console.error('Account ID is missing');
      showToast('Erro: Account ID não encontrado', 'error');
      return;
    }

    // Show loading toast
    showToast('Salvando entrada...', 'loading', 0);

    try {
      const entryData = {
        userId: '',
        accountId: targetAccountId,
        date: data.date,
        title: data.title,
        asset: data.asset,
        tradeId: data.tradeId,
        // Cast to unknown first to avoid 'any', assuming store handles the type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        images: data.images as unknown as any,
        emotion: data.emotion,
        analysis: data.analysis,
        notes: JSON.stringify({
          technicalWins: data.technicalWins,
          improvements: data.improvements,
          errors: data.errors
        })
      };

      if (existingEntry) {
        await updateEntry({ ...existingEntry, ...entryData });
        showToast('Entrada atualizada com sucesso!', 'success');
        setIsEditing(false);
      } else {
        await addEntry(entryData);
        showToast('Entrada salva com sucesso!', 'success');
        onClose();
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      showToast('Erro ao salvar entrada', 'error');
    }
  };

  // Format default title
  const getDefaultTitle = () => {
    if (existingEntry?.title) return existingEntry.title;
    
    if (initialTrade) {
      const [year, month, day] = initialTrade.entryDate.split('T')[0].split('-');
      return `Journal - ${initialTrade.symbol} - ${day}/${month}/${year}`;
    }
    
    const entryDate = initialDate ? dayjs(initialDate) : dayjs();
    return `Diário - ${entryDate.format('DD/MM/YYYY')}`;
  };

  // Prepare initial form data
  const getInitialFormData = () => {
    const parsedNotes = existingEntry?.notes ? JSON.parse(existingEntry.notes) : {};
    
    // Parse images
    const images: Record<string, string[]> = {};
    if (existingEntry?.images && Array.isArray(existingEntry.images)) {
      const sortedImages = [...existingEntry.images].sort((a, b) => a.displayOrder - b.displayOrder);
      sortedImages.forEach(img => {
        if (!images[img.timeframe]) images[img.timeframe] = [];
        images[img.timeframe].push(img.url);
      });
    }
    
    return {
      date: existingEntry?.date || (initialTrade ? initialTrade.entryDate.split('T')[0] : initialDate || dayjs().format('YYYY-MM-DD')),
      title: getDefaultTitle(),
      asset: existingEntry?.asset || initialTrade?.symbol || '',
      emotion: existingEntry?.emotion || '',
      analysis: existingEntry?.analysis || '',
      technicalWins: parsedNotes.technicalWins || '',
      improvements: parsedNotes.improvements || '',
      errors: parsedNotes.errors || '',
      images
    };
  };

  if (!isOpen) return null;

  // Show preview mode if we have an existing entry and not editing
  if (!isEditing && existingEntry) {
    return (
      <JournalEntryPreview
        entry={existingEntry}
        trade={trade}
        onClose={onClose}
        onEdit={() => setIsEditing(true)}
        onShare={handleShare}
        isSharingLoading={isSharingLoading}
        hasMentor={hasMentor}
        hasUnreadComments={hasUnreadComments}
      />
    );
  }

  // Show form mode
  return (
    <JournalEntryForm
      isOpen={isOpen}
      onClose={existingEntry ? () => setIsEditing(false) : onClose}
      onSubmit={handleSubmit}
      initialData={getInitialFormData()}
      trade={trade}
      availableTrades={availableTrades}
      accountId={accountId || trade?.accountId || existingEntry?.accountId || ''}
      isEditing={!!existingEntry}
    />
  );
}

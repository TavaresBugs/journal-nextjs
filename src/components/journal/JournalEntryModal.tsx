"use client";

import { useState, useMemo, useEffect } from "react";
import type { Trade, JournalEntry } from "@/types";
import { useJournalStore } from "@/store/useJournalStore";
import { useTradeStore } from "@/store/useTradeStore";
import { useToast } from "@/providers/ToastProvider";
import { useImageCache } from "@/hooks/useImageCache";
import { JournalEntryPreview } from "./preview";
import { JournalEntryForm, type FormSubmissionData } from "./form";
import { getTradesByIds } from "@/services/trades/trade";
import { ensureFreshImageUrl } from "@/lib/utils/general";
import dayjs from "dayjs";

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
  onEntrySelect?: (id: string) => void;
  noBackdrop?: boolean;
}

// Enhanced type for Optimistic UI
type OptimisticEntry = JournalEntry & {
  _isPending?: boolean;
  _optimisticImages?: Record<string, string[]>;
};

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
 * @param onEntrySelect - Callback when a new entry is created to select it
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
  hasUnreadComments = false,
  noBackdrop = true,
}: JournalEntryModalProps) {
  const { addEntry, updateEntry, deleteEntry } = useJournalStore();
  const { trades: allTrades } = useTradeStore();
  const { showToast } = useToast();

  // State for trades fetched from DB when not found locally
  const [fetchedTrades, setFetchedTrades] = useState<Trade[]>([]);

  // Fetch missing trades from DB when entry has tradeIds not in local sources
  useEffect(() => {
    const fetchMissingTrades = async () => {
      if (!existingEntry?.tradeIds || existingEntry.tradeIds.length === 0) return;

      // Find which IDs are missing from local sources
      const localIds = new Set([
        ...allTrades.map((t) => t.id),
        ...availableTrades.map((t) => t.id),
      ]);

      const missingIds = existingEntry.tradeIds.filter((id) => !localIds.has(id));

      if (missingIds.length > 0) {
        const trades = await getTradesByIds(missingIds);
        setFetchedTrades(trades);
      }
    };

    fetchMissingTrades();
  }, [existingEntry?.tradeIds, allTrades, availableTrades]);

  // Combine all trade sources for resolution
  const combinedTrades = useMemo(() => {
    const tradeMap = new Map<string, Trade>();
    // Add store trades first
    allTrades.forEach((t) => tradeMap.set(t.id, t));
    // Then add availableTrades (may include older trades from context)
    availableTrades.forEach((t) => tradeMap.set(t.id, t));
    // Finally add fetched trades (from DB for missing ones)
    fetchedTrades.forEach((t) => tradeMap.set(t.id, t));
    return Array.from(tradeMap.values());
  }, [allTrades, availableTrades, fetchedTrades]);

  const linkedTrades = useMemo(() => {
    // If we have an existing entry with tradeIds, resolve them
    if (existingEntry?.tradeIds && existingEntry.tradeIds.length > 0) {
      const resolved = existingEntry.tradeIds
        .map((id) => combinedTrades.find((t) => t.id === id))
        .filter((t): t is Trade => t !== undefined);
      return resolved;
    }
    // If we have an initial trade passed in
    if (initialTrade) return [initialTrade];
    return [];
  }, [existingEntry?.tradeIds, combinedTrades, initialTrade]);

  const [isEditing, setIsEditing] = useState(startEditing || !existingEntry);
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  // Image cache for cleanup when modal closes
  const imageCache = useImageCache();

  // Optimistic UI State
  const [optimisticEntry, setOptimisticEntry] = useState<OptimisticEntry | null>(null);

  // Cleanup image cache when modal closes
  useEffect(() => {
    const entryId = existingEntry?.id || "new-entry";

    return () => {
      // Clear cached images for this journal entry when modal closes
      const cleared = imageCache.clear((key) => key.includes(entryId) || key.startsWith("upload"));
      if (cleared > 0 && process.env.NODE_ENV === "development") {
        console.log(`[JournalEntryModal] Cleanup: cleared ${cleared} cached images on close`);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingEntry?.id]);

  // Reset optimistic state when real entry updates (synced with server)
  useEffect(() => {
    // If we have an existing entry (ID matches or just presence for new creation)
    if (existingEntry) {
      // If we were in optimistic mode (pending save), we transition to "confirmed" mode
      // BUT we keep the optimistic images to prevent the "blink" effect of loading remote URLs
      // The user will see the local base64/blob images until they close the modal
      if (optimisticEntry && optimisticEntry._isPending) {
        setOptimisticEntry({
          ...existingEntry,
          _isPending: false,
          _optimisticImages: optimisticEntry._optimisticImages,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optimisticEntry intentionally omitted to avoid infinite loop
  }, [existingEntry]);

  // Handle share functionality
  const handleShare = async () => {
    if (!existingEntry?.id) return;
    setIsSharingLoading(true);
    try {
      const { createShareLink, copyToClipboard } = await import("@/lib/shareUtils");
      const shareUrl = await createShareLink(existingEntry.id);
      if (shareUrl && (await copyToClipboard(shareUrl))) {
        showToast("🔗 Link copiado! Válido por 3 dias", "success");
      } else {
        showToast("Erro ao gerar link de compartilhamento", "error");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      showToast("Erro ao compartilhar", "error");
    } finally {
      setIsSharingLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: FormSubmissionData) => {
    const targetAccountId = linkedTrades[0]?.accountId || accountId || existingEntry?.accountId;

    if (!targetAccountId) {
      console.error("Account ID is missing");
      showToast("Erro: Account ID não encontrado", "error");
      return;
    }

    // Show loading toast
    showToast("Salvando entrada...", "loading", 0);

    // Optimistic Update Preparation
    const baseEntryForOptimistic: JournalEntry = existingEntry || {
      id: "temp-optimistic-id",
      userId: "",
      accountId: targetAccountId,
      date: data.date,
      title: data.title,
      asset: data.asset,
      tradeIds: data.tradeIds || [],
      images: [], // Will be mapped below
      emotion: data.emotion,
      analysis: data.analysis,
      notes: JSON.stringify({
        technicalWins: data.technicalWins,
        improvements: data.improvements,
        errors: data.errors,
      }),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Construct Optimistic Entry with pending flag and images
    const newOptimisticEntry: OptimisticEntry = {
      ...baseEntryForOptimistic,
      ...data, // overwrite with form data
      tradeIds: data.tradeIds || [],
      // Explicitly set images to empty array or existing images to avoid type error
      // The actual images for preview will be taken from _optimisticImages
      images: existingEntry?.images || [],
      _isPending: true,
      _optimisticImages: data.images as Record<string, string[]>,
    };

    setOptimisticEntry(newOptimisticEntry);
    setIsEditing(false); // Close form immediately to show preview

    try {
      const entryData = {
        userId: "",
        accountId: targetAccountId,
        date: data.date,
        title: data.title,
        asset: data.asset,
        tradeIds: data.tradeIds, // Now using tradeIds array
        // Cast to unknown first to avoid 'any', assuming store handles the type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        images: data.images as unknown as any,
        emotion: data.emotion,
        analysis: data.analysis,
        notes: JSON.stringify({
          technicalWins: data.technicalWins,
          improvements: data.improvements,
          errors: data.errors,
        }),
      };

      if (existingEntry) {
        await updateEntry({ ...existingEntry, ...entryData });
        showToast("Entrada atualizada com sucesso!", "success");
      } else {
        await addEntry(entryData);
        showToast("Entrada salva com sucesso!", "success");
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      showToast("Erro ao salvar entrada", "error");
      // Revert optimistic update on error and go back to edit mode
      setOptimisticEntry(null);
      setIsEditing(true);
    }
  };

  // Format default title
  const getDefaultTitle = () => {
    if (existingEntry?.title) return existingEntry.title;

    if (initialTrade) {
      const [year, month, day] = initialTrade.entryDate.split("T")[0].split("-");
      return `Journal - ${initialTrade.symbol} - ${day}/${month}/${year}`;
    }

    const entryDate = initialDate ? dayjs(initialDate) : dayjs();
    return `Diário - ${entryDate.format("DD/MM/YYYY")}`;
  };

  // Prepare initial form data
  const getInitialFormData = () => {
    const parsedNotes = existingEntry?.notes ? JSON.parse(existingEntry.notes) : {};

    // Parse images and ensure all URLs are complete
    const images: Record<string, string[]> = {};
    if (existingEntry?.images && Array.isArray(existingEntry.images)) {
      const sortedImages = [...existingEntry.images].sort(
        (a, b) => a.displayOrder - b.displayOrder
      );
      sortedImages.forEach((img) => {
        if (!images[img.timeframe]) images[img.timeframe] = [];
        // Ensure URL is complete with Supabase storage base and cache buster
        images[img.timeframe].push(ensureFreshImageUrl(img.url));
      });
    }

    return {
      date:
        existingEntry?.date ||
        (initialTrade
          ? initialTrade.entryDate.split("T")[0]
          : initialDate || dayjs().format("YYYY-MM-DD")),
      title: getDefaultTitle(),
      asset: existingEntry?.asset || linkedTrades[0]?.symbol || "",
      emotion: existingEntry?.emotion || "",
      analysis: existingEntry?.analysis || "",
      technicalWins: parsedNotes.technicalWins || "",
      improvements: parsedNotes.improvements || "",
      errors: parsedNotes.errors || "",
      images,
    };
  };

  // Handle entry deletion
  const handleDelete = async () => {
    if (!existingEntry?.id) return;

    try {
      showToast("Excluindo entrada...", "loading", 0);
      await deleteEntry(existingEntry.id);
      showToast("Entrada excluída com sucesso!", "success");
      onClose();
    } catch (error) {
      console.error("Error deleting entry:", error);
      showToast("Erro ao excluir entrada", "error");
    }
  };

  if (!isOpen) return null;

  // Show preview mode if we have an existing entry (or optimistic) and not editing
  if (!isEditing && (existingEntry || optimisticEntry)) {
    return (
      <JournalEntryPreview
        entry={(optimisticEntry || existingEntry)!}
        linkedTrades={linkedTrades}
        onClose={onClose}
        onEdit={() => setIsEditing(true)}
        onShare={handleShare}
        isSharingLoading={isSharingLoading}
        hasMentor={hasMentor}
        hasUnreadComments={hasUnreadComments}
        noBackdrop={noBackdrop}
        onDelete={existingEntry ? handleDelete : undefined}
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
      linkedTrades={linkedTrades}
      availableTrades={availableTrades}
      accountId={accountId || linkedTrades[0]?.accountId || existingEntry?.accountId || ""}
      isEditing={!!existingEntry}
      noBackdrop={noBackdrop}
    />
  );
}

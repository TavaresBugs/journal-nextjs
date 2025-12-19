"use client";

import { useState, useCallback, useMemo } from "react";
import { Modal, IconActionButton, ModalFooterActions } from "@/components/ui";
import type { Trade } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useBlockBodyScroll } from "@/hooks/useBlockBodyScroll";
import dayjs from "dayjs";
import { EntryHeader } from "./EntryHeader";
import { TradeLinker } from "./TradeLinker";
import { JournalAnalysis } from "./JournalAnalysis";
import { JournalReview } from "./JournalReview";
import { LinkTradeModal } from "./LinkTradeModal";

interface JournalEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormSubmissionData) => Promise<void>;
  initialData?: Partial<FormSubmissionData>;
  linkedTrades?: Trade[]; // Trades already linked (for editing)
  availableTrades?: Trade[];
  accountId: string;
  isEditing?: boolean;
  noBackdrop?: boolean;
}

export interface FormData {
  date: string;
  title: string;
  asset: string;
  emotion: string;
  analysis: string;
  technicalWins: string;
  improvements: string;
  errors: string;
}

export interface FormSubmissionData extends FormData {
  images: Record<string, string[]>;
  tradeIds?: string[]; // Multiple trade IDs
}

const timeframes = [
  { key: "tfM", label: "Mensal" },
  { key: "tfW", label: "Semanal" },
  { key: "tfD", label: "Diário" },
  { key: "tfH4", label: "4H" },
  { key: "tfH1", label: "1H" },
  { key: "tfM15", label: "M15" },
  { key: "tfM5", label: "M5" },
  { key: "tfM3", label: "M3/M1" },
] as const;

/**
 * Form component for creating/editing journal entries.
 * Handles all form state and image uploads.
 */
export function JournalEntryForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  linkedTrades: initialLinkedTrades = [],
  availableTrades = [],
  isEditing = false,
  noBackdrop = true,
}: JournalEntryFormProps) {
  const {} = useSettingsStore();

  // Form state
  const [date, setDate] = useState(initialData?.date || dayjs().format("YYYY-MM-DD"));
  const [title, setTitle] = useState(
    initialData?.title || `Diário - ${dayjs().format("DD/MM/YYYY")}`
  );
  const [asset, setAsset] = useState(initialData?.asset || initialLinkedTrades[0]?.symbol || "");
  const [emotion, setEmotion] = useState(initialData?.emotion || "");
  const [analysis, setAnalysis] = useState(initialData?.analysis || "");
  const [technicalWins, setTechnicalWins] = useState(initialData?.technicalWins || "");
  const [improvements, setImprovements] = useState(initialData?.improvements || "");
  const [errors, setErrors] = useState(initialData?.errors || "");

  // Trade management - support multiple trades
  const [trades, setTrades] = useState<Trade[]>(initialLinkedTrades);
  const [isLinkTradeModalOpen, setIsLinkTradeModalOpen] = useState(false);

  // Block body scroll when link trade modal is open
  useBlockBodyScroll(isLinkTradeModalOpen);

  // Image management
  const initialImages = initialData?.images || {};
  const { images, handlePasteImage, handleFileSelect, removeLastImage } = useImageUpload(
    initialImages as Record<string, string[]>
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        date,
        title,
        asset: asset || "Diário",
        emotion,
        analysis,
        technicalWins,
        improvements,
        errors,
        images,
        tradeIds: trades.map((t) => t.id),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSubmit, date, title, asset, emotion, analysis, technicalWins, improvements, errors, images, trades]);

  const handleLinkTrade = useCallback((selectedTrade: Trade) => {
    // Add trade if not already linked
    if (!trades.find((t) => t.id === selectedTrade.id)) {
      setTrades((prev) => [...prev, selectedTrade]);
      // Set asset from first trade if not set
      if (!asset && trades.length === 0) {
        setAsset(selectedTrade.symbol);
      }
    }
    setIsLinkTradeModalOpen(false);
  }, [trades, asset]);

  const handleRemoveTrade = useCallback((tradeId: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== tradeId));
  }, []);

  const modalTitle = useMemo(() => (
    <div className="flex items-center gap-3">
      {isEditing && (
        <IconActionButton variant="back" onClick={onClose} title="Voltar para visualização" />
      )}
      <h2 className="text-xl font-bold text-gray-100">
        {isEditing ? "📝 Editando Diário" : "📝 Nova Entrada no Diário"}
      </h2>
    </div>
  ), [isEditing, onClose]);

  const openLinkTradeModal = useCallback(() => {
    setIsLinkTradeModalOpen(true);
  }, []);

  const closeLinkTradeModal = useCallback(() => {
    setIsLinkTradeModalOpen(false);
  }, []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        maxWidth="6xl"
        noBackdrop={noBackdrop}
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <EntryHeader
            title={title}
            setTitle={setTitle}
            asset={asset}
            setAsset={setAsset}
            date={date}
            setDate={setDate}
          />

          <TradeLinker
            trades={trades}
            onLinkTradeOpen={openLinkTradeModal}
            onRemoveTrade={handleRemoveTrade}
          />

          <JournalAnalysis
            emotion={emotion}
            setEmotion={setEmotion}
            analysis={analysis}
            setAnalysis={setAnalysis}
            images={images}
            onPasteImage={handlePasteImage}
            onFileSelect={handleFileSelect}
            onRemoveImage={removeLastImage}
            timeframes={timeframes}
          />

          <JournalReview
            technicalWins={technicalWins}
            setTechnicalWins={setTechnicalWins}
            improvements={improvements}
            setImprovements={setImprovements}
            errors={errors}
            setErrors={setErrors}
          />

          <ModalFooterActions
            isSubmit
            onSecondary={isEditing ? onClose : undefined}
            primaryLabel="Salvar Entrada"
            primaryVariant="gradient-success"
            isLoading={isSubmitting}
            isFullWidth
          />
        </form>
      </Modal>

      <LinkTradeModal
        isOpen={isLinkTradeModalOpen}
        onClose={closeLinkTradeModal}
        availableTrades={availableTrades}
        onSelectTrade={handleLinkTrade}
      />
    </>
  );
}

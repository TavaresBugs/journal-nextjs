"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, SegmentedToggle, ModalFooterActions } from "@/components/ui";
import type {
  EmotionalState,
  TradeLite,
  JournalEntryLite,
  RecapLinkedType,
  LaboratoryRecap,
} from "@/types";
import { CreateRecapData, UpdateRecapData } from "@/store/useLaboratoryStore";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Memoized subcomponents
import {
  RecapTextareas,
  EmotionSelector,
  DailyRecapSection,
  WeeklyRecapSection,
  RecapImageUploader,
} from "./recap";

const REVIEW_TYPE_OPTIONS = [
  { value: "daily", label: <>📅 Review Diário</> },
  { value: "weekly", label: <>📊 Review Semanal</> },
];

interface RecapFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: LaboratoryRecap | null;
  onSubmit: (data: CreateRecapData | UpdateRecapData, files: File[]) => Promise<void>;
  trades: TradeLite[];
  journalEntries?: JournalEntryLite[];
  isLoading?: boolean;
}

export function RecapFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
  trades,
  journalEntries = [],
  isLoading = false,
}: RecapFormModalProps) {
  const isEditMode = mode === "edit";

  // ========== Form State ==========
  const [title, setTitle] = useState("");
  const [reviewType, setReviewType] = useState<"daily" | "weekly">("daily");
  const [linkedType, setLinkedType] = useState<RecapLinkedType | undefined>();
  const [linkedId, setLinkedId] = useState("");
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [whatWorked, setWhatWorked] = useState("");
  const [whatFailed, setWhatFailed] = useState("");
  const [emotionalState, setEmotionalState] = useState<EmotionalState | "">("");
  const [lessonsLearned, setLessonsLearned] = useState("");

  // Week state
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    return format(now, "yyyy-'W'ww");
  });

  // Search state
  const [recordSearch, setRecordSearch] = useState("");
  const [showRecordDropdown, setShowRecordDropdown] = useState(false);

  // File state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // ========== Derived Values ==========
  const weekDates = useMemo(() => {
    try {
      const [year, week] = selectedWeek.split("-W").map(Number);
      const firstDayOfYear = new Date(year, 0, 1);
      const daysToAdd = (week - 1) * 7;
      const weekStart = startOfWeek(
        new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000),
        { locale: ptBR }
      );
      const weekEnd = endOfWeek(weekStart, { locale: ptBR });
      return { weekStart, weekEnd };
    } catch {
      return { weekStart: new Date(), weekEnd: new Date() };
    }
  }, [selectedWeek]);

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (!isEditMode && reviewType === "weekly" && selectedTradeIds.length === 0) return false;
    return true;
  }, [title, isEditMode, reviewType, selectedTradeIds]);

  // ========== Reset & Initialization ==========
  const handleReset = useCallback(() => {
    setTitle("");
    setReviewType("daily");
    setLinkedType(undefined);
    setLinkedId("");
    setSelectedTradeIds([]);
    setWhatWorked("");
    setWhatFailed("");
    setEmotionalState("");
    setLessonsLearned("");
    setSelectedFiles([]);
    setPreviews([]);
    setCarouselIndex(0);
    setRecordSearch("");
    setShowRecordDropdown(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(initialData.title);
      setReviewType(initialData.type === "weekly" ? "weekly" : "daily");
      setLinkedType(initialData.linkedType);
      setLinkedId(initialData.linkedId || initialData.tradeId || "");
      setWhatWorked(initialData.whatWorked || "");
      setWhatFailed(initialData.whatFailed || "");
      setEmotionalState(initialData.emotionalState || "");
      setLessonsLearned(initialData.lessonsLearned || "");
      setPreviews(initialData.images?.length ? initialData.images : []);
      setSelectedFiles([]);
      setCarouselIndex(0);

      if (initialData.linkedType === "trade" && initialData.trade) {
        setRecordSearch(initialData.trade.symbol);
      } else if (initialData.linkedType === "journal" && initialData.journal) {
        setRecordSearch(initialData.journal.title || initialData.journal.asset || "Diário");
      } else {
        setRecordSearch("");
      }
    } else {
      handleReset();
    }
  }, [isOpen, isEditMode, initialData, handleReset]);

  // ========== Handlers ==========
  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleSelectRecord = useCallback((type: RecapLinkedType, id: string, label: string) => {
    setLinkedType(type);
    setLinkedId(id);
    setRecordSearch(label);
  }, []);

  const handleClearRecord = useCallback(() => {
    setLinkedType(undefined);
    setLinkedId("");
  }, []);

  const handleToggleTradeSelection = useCallback((id: string) => {
    setSelectedTradeIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }, []);

  // File handlers
  const handleAddFiles = useCallback((files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleRemoveImage = useCallback(
    (index: number) => {
      const isNewFile = index >= previews.length - selectedFiles.length;
      if (isNewFile) {
        const existingCount = previews.length - selectedFiles.length;
        const fileIndex = index - existingCount;
        setSelectedFiles((files) => files.filter((_, i) => i !== fileIndex));
      }
      setPreviews((prev) => prev.filter((_, i) => i !== index));
      setCarouselIndex((prevIdx) => Math.max(0, Math.min(prevIdx, previews.length - 2)));
    },
    [previews.length, selectedFiles.length]
  );

  // Global paste handler
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        handleAddFiles(imageFiles);
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [isOpen, handleAddFiles]);

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditMode && initialData) {
      const keptImages = previews.filter((url) => !url.startsWith("data:"));
      const updateData: UpdateRecapData = {
        id: initialData.id,
        title: title.trim(),
        linkedType,
        linkedId: linkedId || undefined,
        whatWorked: whatWorked.trim() || undefined,
        whatFailed: whatFailed.trim() || undefined,
        emotionalState: emotionalState || undefined,
        lessonsLearned: lessonsLearned.trim() || undefined,
        images: keptImages,
      };
      await onSubmit(updateData, selectedFiles);
    } else {
      const createData: CreateRecapData = {
        title: title.trim(),
        reviewType,
        linkedType: reviewType === "daily" ? linkedType : undefined,
        linkedId: reviewType === "daily" ? linkedId || undefined : undefined,
        tradeIds: reviewType === "weekly" ? selectedTradeIds : undefined,
        weekStartDate:
          reviewType === "weekly" ? format(weekDates.weekStart, "yyyy-MM-dd") : undefined,
        weekEndDate: reviewType === "weekly" ? format(weekDates.weekEnd, "yyyy-MM-dd") : undefined,
        whatWorked: whatWorked.trim() || undefined,
        whatFailed: whatFailed.trim() || undefined,
        emotionalState: emotionalState || undefined,
        lessonsLearned: lessonsLearned.trim() || undefined,
      };
      await onSubmit(createData, selectedFiles);
    }

    handleClose();
  };

  // ========== Render ==========
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? `✏️ ${initialData?.title || "Editar Recap"}` : "📝 Novo Recap"}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Review Type Toggle (Create Mode Only) */}
        {!isEditMode && (
          <SegmentedToggle
            value={reviewType}
            onChange={(val) => setReviewType(val as "daily" | "weekly")}
            options={REVIEW_TYPE_OPTIONS}
            className="mb-6"
            size="md"
          />
        )}

        {/* Title */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Título do Recap</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              reviewType === "daily"
                ? "Ex: Análise do trade EURUSD 11/12"
                : "Ex: Review Semana 50 - Dezembro 2024"
            }
            required
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Daily Mode - Record Search */}
        {reviewType === "daily" && (
          <DailyRecapSection
            trades={trades}
            journalEntries={journalEntries}
            recordSearch={recordSearch}
            showRecordDropdown={showRecordDropdown}
            linkedType={linkedType}
            linkedId={linkedId}
            onRecordSearchChange={setRecordSearch}
            onShowDropdownChange={setShowRecordDropdown}
            onSelectRecord={handleSelectRecord}
            onClearRecord={handleClearRecord}
          />
        )}

        {/* Weekly Mode - Week Selection & Trade Multi-Select */}
        {reviewType === "weekly" && !isEditMode && (
          <WeeklyRecapSection
            trades={trades}
            selectedWeek={selectedWeek}
            selectedTradeIds={selectedTradeIds}
            onWeekChange={setSelectedWeek}
            onToggleTradeSelection={handleToggleTradeSelection}
          />
        )}

        {/* Memoized Textareas */}
        <RecapTextareas
          whatWorked={whatWorked}
          whatFailed={whatFailed}
          lessonsLearned={lessonsLearned}
          onWhatWorkedChange={setWhatWorked}
          onWhatFailedChange={setWhatFailed}
          onLessonsLearnedChange={setLessonsLearned}
          reviewType={reviewType}
        />

        {/* Memoized Emotion Selector */}
        <EmotionSelector value={emotionalState} onChange={setEmotionalState} />

        {/* Memoized Image Uploader */}
        <RecapImageUploader
          previews={previews}
          carouselIndex={carouselIndex}
          onCarouselIndexChange={setCarouselIndex}
          onAddFiles={handleAddFiles}
          onRemoveImage={handleRemoveImage}
        />

        {/* Actions */}
        <ModalFooterActions
          isSubmit
          onSecondary={handleClose}
          primaryLabel={isEditMode ? "Salvar Alterações" : "Criar Recap"}
          isLoading={isLoading}
          disabled={!canSubmit}
          primaryVariant="gradient-success"
        />
      </form>
    </Modal>
  );
}

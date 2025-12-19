"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  GlassCard,
  WeekPicker,
  SegmentedToggle,
  IconActionButton,
  ModalFooterActions,
} from "@/components/ui";
import { CustomCheckbox } from "@/components/checklist/CustomCheckbox";
import type {
  EmotionalState,
  TradeLite,
  JournalEntryLite,
  RecapLinkedType,
  LaboratoryRecap,
} from "@/types";
import { CreateRecapData, UpdateRecapData } from "@/store/useLaboratoryStore";
import { formatCurrency } from "@/lib/calculations";
import { startOfWeek, endOfWeek, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const REVIEW_TYPE_OPTIONS = [
  { value: "daily", label: <>📅 Review Diário</> },
  { value: "weekly", label: <>📊 Review Semanal</> },
];

/** Unified search record for trades and journal entries */
interface SearchRecord {
  type: RecapLinkedType;
  id: string;
  label: string;
  // Additional data for display
  symbol?: string;
  date: string;
  outcome?: string;
  title?: string;
}

const EMOTION_OPTIONS: { value: EmotionalState; label: string; emoji: string }[] = [
  { value: "confiante", label: "Confiante", emoji: "💪" },
  { value: "disciplinado", label: "Disciplinado", emoji: "🎯" },
  { value: "neutro", label: "Neutro", emoji: "😐" },
  { value: "ansioso", label: "Ansioso", emoji: "😰" },
  { value: "fomo", label: "FOMO", emoji: "🔥" },
  { value: "euforico", label: "Eufórico", emoji: "🚀" },
  { value: "frustrado", label: "Frustrado", emoji: "😤" },
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

  // Review type toggle
  const [reviewType, setReviewType] = useState<"daily" | "weekly">("daily");

  // Form state
  const [title, setTitle] = useState("");
  const [linkedType, setLinkedType] = useState<RecapLinkedType | undefined>();
  const [linkedId, setLinkedId] = useState("");
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [whatWorked, setWhatWorked] = useState("");
  const [whatFailed, setWhatFailed] = useState("");
  const [emotionalState, setEmotionalState] = useState<EmotionalState | "">("");
  const [lessonsLearned, setLessonsLearned] = useState("");

  // Files state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // New files to upload
  const [previews, setPreviews] = useState<string[]>([]); // URLs for display (remote or local blob)

  // Search state
  const [recordSearch, setRecordSearch] = useState("");
  const [showRecordDropdown, setShowRecordDropdown] = useState(false);

  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Week selection
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    return format(now, "yyyy-'W'ww");
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const uploadZoneRef = useRef<HTMLDivElement>(null);

  // Parse week string to dates
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

  // Filter trades for weekly review
  const weekTrades = useMemo(() => {
    if (reviewType !== "weekly") return [];
    return trades.filter((trade) => {
      const tradeDate = parseISO(trade.entryDate);
      return tradeDate >= weekDates.weekStart && tradeDate <= weekDates.weekEnd;
    });
  }, [trades, weekDates, reviewType]);

  // Get recent records (last 7 days) for initial display
  const recentRecords = useMemo((): SearchRecord[] => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

    // Recent trades
    const recentTrades: SearchRecord[] = trades
      .filter((t) => t.entryDate >= oneWeekAgoStr)
      .slice(0, 5)
      .map((t) => ({
        type: "trade" as const,
        id: t.id,
        label: t.symbol,
        symbol: t.symbol,
        date: t.entryDate,
        outcome: t.outcome,
      }));

    // Recent journals
    const recentJournals: SearchRecord[] = journalEntries
      .filter((j) => j.date >= oneWeekAgoStr)
      .slice(0, 5)
      .map((j) => ({
        type: "journal" as const,
        id: j.id,
        label: j.asset || "Observação",
        date: j.date,
        title: j.title,
      }));

    // Sort by date descending
    return [...recentJournals, ...recentTrades]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [trades, journalEntries]);

  // Unified search results
  const searchResults = useMemo((): SearchRecord[] => {
    if (!recordSearch || recordSearch.length < 2) {
      return showRecordDropdown ? recentRecords : [];
    }

    const query = recordSearch.toLowerCase();

    const matchingTrades: SearchRecord[] = trades
      .filter((t) => t.symbol.toLowerCase().includes(query) || t.entryDate.includes(query))
      .slice(0, 5)
      .map((t) => ({
        type: "trade" as const,
        id: t.id,
        label: t.symbol,
        symbol: t.symbol,
        date: t.entryDate,
        outcome: t.outcome,
      }));

    const matchingJournals: SearchRecord[] = journalEntries
      .filter(
        (j) =>
          j.title?.toLowerCase().includes(query) ||
          j.asset?.toLowerCase().includes(query) ||
          j.date.includes(query)
      )
      .slice(0, 5)
      .map((j) => ({
        type: "journal" as const,
        id: j.id,
        label: j.asset || "Observação",
        date: j.date,
        title: j.title,
      }));

    return [...matchingJournals, ...matchingTrades];
  }, [recordSearch, trades, journalEntries, showRecordDropdown, recentRecords]);

  // Calculate stats for selected trades
  const weekStats = useMemo(() => {
    const selected = weekTrades.filter((t) => selectedTradeIds.includes(t.id));
    const wins = selected.filter((t) => (t.pnl ?? 0) > 0).length;
    const total = selected.length;
    const totalPnL = selected.reduce((sum, t) => sum + (t.pnl || 0), 0);

    return {
      count: total,
      total: weekTrades.length,
      winRate: total > 0 ? (wins / total) * 100 : 0,
      totalPnL,
    };
  }, [weekTrades, selectedTradeIds]);

  const handleReset = () => {
    setTitle("");
    setLinkedType(undefined);
    setLinkedId("");
    setRecordSearch("");
    setSelectedTradeIds([]);
    setWhatWorked("");
    setWhatFailed("");
    setEmotionalState("");
    setLessonsLearned("");
    setSelectedFiles([]);
    setPreviews([]);
    setReviewType("daily");
    setCarouselIndex(0);
  };

  // Initialization Effect - sets form state based on mode
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && initialData) {
      // EDIT MODE - populate form with existing data
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(initialData.title);
      setReviewType(initialData.type === "weekly" ? "weekly" : "daily");
      setLinkedType(initialData.linkedType);
      setLinkedId(initialData.linkedId || initialData.tradeId || "");
      setWhatWorked(initialData.whatWorked || "");
      setWhatFailed(initialData.whatFailed || "");
      setEmotionalState(initialData.emotionalState || "");
      setLessonsLearned(initialData.lessonsLearned || "");

      // Image handling for edit:
      // Existing images come as URLs. We put them in 'previews'.
      // 'selectedFiles' remains empty initially.
      if (initialData.images?.length) {
        setPreviews(initialData.images);
      } else {
        setPreviews([]);
      }

      setSelectedFiles([]);
      setCarouselIndex(0);

      // Populate search field based on linked record
      if (initialData.linkedType === "trade" && initialData.trade) {
        setRecordSearch(initialData.trade.symbol);
      } else if (initialData.linkedType === "journal" && initialData.journal) {
        setRecordSearch(initialData.journal.title || initialData.journal.asset || "Diário");
      } else {
        setRecordSearch("");
      }
    } else {
      // CREATE MODE
      handleReset();
    }
  }, [isOpen, isEditMode, initialData]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRecordDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  const handleClose = () => {
    handleReset();
    onClose();
  };

  // File Handling
  const processFiles = useCallback((files: File[]) => {
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviews((prev) => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    // Reset input to allow selecting same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement> | ClipboardEvent) => {
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
        e.stopPropagation(); // Stop propagation if it's an event handler
        processFiles(imageFiles);
      }
    },
    [processFiles]
  );

  // Global Paste Listener (only when modal is open)
  useEffect(() => {
    if (!isOpen) return;
    const globalPasteHandler = (e: ClipboardEvent) => handlePaste(e);
    document.addEventListener("paste", globalPasteHandler);
    return () => document.removeEventListener("paste", globalPasteHandler);
  }, [isOpen, handlePaste]);

  const removeImage = (index: number) => {
    // We need to know if the image being removed is an existing remote image (edit mode)
    // or a newly uploaded file.
    // Logic:
    // We have 'previews'. We have 'selectedFiles'.
    // BUT 'previews' contains BOTH existing URLs AND new local blob URLs.
    // We need to sync removals.

    // This simple approach assumes updates send ALL 'newFiles'.
    // For deleting existing files, the API likely expects the full list of remaining images or separate delete endpoint.
    // Our 'UpdateRecapData' interface supports passing 'images' array (existing ones).
    // So we need to separate 'remainingExistingImages' vs 'newlyAddedFiles'.

    // Let's refine the logic:

    const isNewFile = index >= previews.length - selectedFiles.length;

    if (isNewFile) {
      // It's in selectedFiles. But at what index?
      // If we have 3 existing images (0,1,2) and 2 new (3,4).
      // Removing index 4 (2nd new file).
      // Index in selectedFiles = 4 - 3 = 1.
      const existingCount = previews.length - selectedFiles.length;
      const fileIndex = index - existingCount;
      setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }

    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setCarouselIndex((prev) => Math.max(0, Math.min(prev, previews.length - 2)));
  };

  // Selection Handlers
  const selectRecord = (record: SearchRecord) => {
    setLinkedType(record.type);
    setLinkedId(record.id);
    setRecordSearch(record.label);
    setShowRecordDropdown(false);
  };

  const toggleTradeSelection = (id: string) => {
    setSelectedTradeIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    if (isEditMode && initialData) {
      // UPDATE
      // We need to pass the list of 'kept' images.
      // Any URL in 'previews' that isn't a data: blob is an existing image we kept.
      const keptImages = previews.filter((url) => !url.startsWith("data:"));

      const updateData: UpdateRecapData = {
        id: initialData.id,
        title: title.trim(),
        linkedType: linkedType,
        linkedId: linkedId || undefined,
        whatWorked: whatWorked.trim() || undefined,
        whatFailed: whatFailed.trim() || undefined,
        emotionalState: emotionalState || undefined,
        lessonsLearned: lessonsLearned.trim() || undefined,
        images: keptImages, // API should handle reconciling this
      };

      await onSubmit(updateData, selectedFiles);
    } else {
      // CREATE
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

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (!isEditMode && reviewType === "weekly" && selectedTradeIds.length === 0) return false;
    return true;
  }, [title, isEditMode, reviewType, selectedTradeIds]);

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

        {/* Record Link - Daily Mode (Search & Link) */}
        {reviewType === "daily" && (
          <div className="relative" ref={dropdownRef}>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Vincular a um registro (opcional)
            </label>
            <div className="relative">
              <input
                type="text"
                value={recordSearch}
                onChange={(e) => {
                  setRecordSearch(e.target.value);
                  setShowRecordDropdown(true);
                  if (e.target.value === "") {
                    setLinkedType(undefined);
                    setLinkedId("");
                  }
                }}
                onFocus={() => setShowRecordDropdown(true)}
                placeholder="Buscar por ativo, data ou diário..."
                className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 pr-10 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              {/* Clear Search Button */}
              {recordSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setRecordSearch("");
                    setLinkedType(undefined);
                    setLinkedId("");
                  }}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-red-400"
                >
                  ×
                </button>
              )}
            </div>

            {showRecordDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 mt-2 max-h-48 w-full overflow-auto rounded-xl border border-gray-700 bg-gray-800 shadow-xl">
                {searchResults.map((record) => (
                  <button
                    key={`${record.type}-${record.id}`}
                    type="button"
                    onClick={() => selectRecord(record)}
                    className="flex w-full items-center gap-3 border-b border-gray-700/50 px-4 py-3 text-left last:border-0 hover:bg-gray-700/50"
                  >
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        record.type === "trade"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {record.type === "trade" ? "TRADE" : "DIÁRIO"}
                    </span>
                    <span className="flex-1 truncate text-white">{record.label}</span>
                    <span className="text-sm text-gray-400">
                      {format(parseISO(record.date), "dd/MM")}
                    </span>
                    {record.outcome && (
                      <span
                        className={`text-sm ${
                          record.outcome === "win"
                            ? "text-green-400"
                            : record.outcome === "loss"
                              ? "text-red-400"
                              : "text-yellow-400"
                        }`}
                      >
                        {record.outcome === "win" ? "✓" : record.outcome === "loss" ? "✗" : "⬤"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Week Selection and Trade Multi-Select - Weekly Mode */}
        {reviewType === "weekly" && !isEditMode && (
          <GlassCard className="space-y-4 border-white/5 bg-gray-800/30 p-4">
            {/* Week Selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Semana de Análise
              </label>
              <WeekPicker selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
            </div>

            {/* Trades Multi-Select */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Trades da Semana (selecione para incluir)
              </label>

              {weekTrades.length > 0 ? (
                <>
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
                    {weekTrades.map((trade) => (
                      <div
                        key={trade.id}
                        onClick={() => toggleTradeSelection(trade.id)}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                          selectedTradeIds.includes(trade.id)
                            ? "bg-zorin-accent/10 border-zorin-accent/50 shadow-[0_0_10px_rgba(0,200,83,0.15)]"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        }`}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <CustomCheckbox
                            checked={selectedTradeIds.includes(trade.id)}
                            onChange={() => toggleTradeSelection(trade.id)}
                          />
                        </div>
                        <div className="flex flex-1 items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${trade.type === "Long" ? "text-green-400" : "text-red-400"}`}
                            >
                              {trade.type}
                            </span>
                            <span className="text-white">{trade.symbol}</span>
                            <span className="text-gray-400">
                              {format(parseISO(trade.entryDate), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <span
                            className={
                              (trade.pnl ?? 0) > 0
                                ? "font-medium text-green-400"
                                : "font-medium text-red-400"
                            }
                          >
                            {(trade.pnl ?? 0) > 0 ? "+" : ""}
                            {formatCurrency(trade.pnl ?? 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stats Footer */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 p-3 text-sm">
                    <span className="text-gray-400">
                      {weekStats.count} de {weekStats.total} trades
                    </span>
                    <span className="text-gray-300">
                      Win Rate:{" "}
                      <span className={weekStats.winRate >= 50 ? "text-green-400" : "text-red-400"}>
                        {weekStats.winRate.toFixed(0)}%
                      </span>
                    </span>
                    <span
                      className={
                        weekStats.totalPnL > 0
                          ? "font-bold text-green-400"
                          : "font-bold text-red-400"
                      }
                    >
                      {weekStats.totalPnL > 0 ? "+" : ""}
                      {formatCurrency(weekStats.totalPnL)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <p>Nenhum trade encontrado nesta semana</p>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* What Worked / What Failed */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-green-400">
              ✓ O que funcionou
            </label>
            <textarea
              value={whatWorked}
              onChange={(e) => setWhatWorked(e.target.value)}
              placeholder="Pontos positivos do trade..."
              className="w-full resize-none rounded-xl border border-green-700/30 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-green-500 focus:ring-1 focus:ring-green-500"
              rows={5}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-red-400">✗ O que falhou</label>
            <textarea
              value={whatFailed}
              onChange={(e) => setWhatFailed(e.target.value)}
              placeholder="O que poderia melhorar..."
              className="w-full resize-none rounded-xl border border-red-700/30 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500"
              rows={5}
            />
          </div>
        </div>

        {/* Emotional State */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Estado Emocional</label>
          <div className="flex flex-wrap gap-2">
            {EMOTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setEmotionalState(emotionalState === option.value ? "" : option.value)
                }
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  emotionalState === option.value
                    ? "border border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
                    : "border border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
                }`}
              >
                <span>{option.emoji}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lessons Learned */}
        <div>
          <label className="mb-2 block text-sm font-medium text-cyan-400">
            💡 Lições Aprendidas
          </label>
          <textarea
            value={lessonsLearned}
            onChange={(e) => setLessonsLearned(e.target.value)}
            placeholder={
              reviewType === "daily"
                ? "O que você aprendeu com este trade..."
                : "O que você aprendeu nesta semana de trading..."
            }
            className="w-full resize-none rounded-xl border border-cyan-700/30 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            rows={6}
          />
        </div>

        {/* Image Upload - Paste Zone with Carousel */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">Screenshots</label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload Zone - Focusable for paste */}
          <div
            ref={uploadZoneRef}
            tabIndex={0}
            onClick={() => uploadZoneRef.current?.focus()}
            className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/50 transition-all outline-none hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
          >
            {previews.length > 0 ? (
              <>
                {/* Main Image Display */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previews[carouselIndex]}
                  alt={`Screenshot ${carouselIndex + 1}`}
                  className="h-full w-full object-cover"
                />

                {/* Image Counter Badge */}
                <div className="absolute top-3 left-3 rounded bg-black/70 px-2 py-1 text-xs font-medium text-cyan-400">
                  {carouselIndex + 1} / {previews.length}
                </div>

                {/* Delete Current Image Button */}
                <IconActionButton
                  variant="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(carouselIndex);
                  }}
                  className="absolute top-3 right-3 bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/80"
                />

                {/* Carousel Navigation */}
                {previews.length > 1 && (
                  <>
                    <IconActionButton
                      variant="back"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCarouselIndex((prev) => (prev > 0 ? prev - 1 : previews.length - 1));
                      }}
                      className="absolute top-1/2 left-3 -translate-y-1/2 bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/80"
                    />
                    <IconActionButton
                      variant="next"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCarouselIndex((prev) => (prev < previews.length - 1 ? prev + 1 : 0));
                      }}
                      className="absolute top-1/2 right-3 -translate-y-1/2 bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/80"
                    />
                  </>
                )}

                {/* Bottom Controls */}
                <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-400">
                    CTRL+V
                  </span>
                  <IconActionButton
                    variant="add"
                    title="Adicionar mais imagens"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="bg-cyan-500 text-white hover:bg-cyan-400 hover:text-white"
                  />
                </div>

                {/* Thumbnail Strip */}
                {previews.length > 1 && (
                  <div className="absolute right-3 bottom-14 left-3 flex justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {previews.map((preview, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarouselIndex(index);
                        }}
                        className={`h-10 w-10 overflow-hidden rounded-lg border-2 transition-all ${
                          index === carouselIndex
                            ? "border-cyan-500 ring-2 ring-cyan-500/50"
                            : "border-white/30 hover:border-white/60"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt={`Thumb ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <svg
                  className="mb-3 h-10 w-10 text-gray-600 group-hover:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mb-1 text-sm text-gray-500">Clique ou cole uma imagem</p>

                {/* Controls visible on hover/focus */}
                <div className="absolute bottom-3 flex w-full items-end justify-between px-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                  <span className="rounded bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-400">
                    CTRL+V
                  </span>
                  <IconActionButton
                    variant="add"
                    title="Upload Imagem"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="bg-cyan-500 text-white hover:bg-cyan-400 hover:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
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

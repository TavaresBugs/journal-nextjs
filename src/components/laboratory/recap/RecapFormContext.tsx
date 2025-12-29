"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { EmotionalState, RecapLinkedType } from "@/types";

interface RecapFormState {
  // Form values
  title: string;
  reviewType: "daily" | "weekly";
  linkedType: RecapLinkedType | undefined;
  linkedId: string;
  selectedTradeIds: string[];
  whatWorked: string;
  whatFailed: string;
  emotionalState: EmotionalState | "";
  lessonsLearned: string;
  selectedWeek: string;

  // File state
  selectedFiles: File[];
  previews: string[];
  carouselIndex: number;

  // Search state
  recordSearch: string;
  showRecordDropdown: boolean;
}

interface RecapFormActions {
  setTitle: (value: string) => void;
  setReviewType: (value: "daily" | "weekly") => void;
  setLinkedType: (value: RecapLinkedType | undefined) => void;
  setLinkedId: (value: string) => void;
  setSelectedTradeIds: React.Dispatch<React.SetStateAction<string[]>>;
  setWhatWorked: (value: string) => void;
  setWhatFailed: (value: string) => void;
  setEmotionalState: (value: EmotionalState | "") => void;
  setLessonsLearned: (value: string) => void;
  setSelectedWeek: (value: string) => void;
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setPreviews: React.Dispatch<React.SetStateAction<string[]>>;
  setCarouselIndex: (value: number) => void;
  setRecordSearch: (value: string) => void;
  setShowRecordDropdown: (value: boolean) => void;
  resetForm: () => void;
  toggleTradeSelection: (id: string) => void;
}

type RecapFormContextType = RecapFormState & RecapFormActions;

const RecapFormContext = createContext<RecapFormContextType | null>(null);

export function useRecapForm() {
  const context = useContext(RecapFormContext);
  if (!context) {
    throw new Error("useRecapForm must be used within RecapFormProvider");
  }
  return context;
}

// Selectors for optimized re-renders
export function useRecapFormValue<T>(selector: (state: RecapFormState) => T): T {
  const context = useContext(RecapFormContext);
  if (!context) {
    throw new Error("useRecapFormValue must be used within RecapFormProvider");
  }
  return selector(context);
}

interface RecapFormProviderProps {
  children: React.ReactNode;
  initialWeek?: string;
}

export function RecapFormProvider({ children, initialWeek }: RecapFormProviderProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [reviewType, setReviewType] = useState<"daily" | "weekly">("daily");
  const [linkedType, setLinkedType] = useState<RecapLinkedType | undefined>();
  const [linkedId, setLinkedId] = useState("");
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  const [whatWorked, setWhatWorked] = useState("");
  const [whatFailed, setWhatFailed] = useState("");
  const [emotionalState, setEmotionalState] = useState<EmotionalState | "">("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(initialWeek || "");

  // File state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Search state
  const [recordSearch, setRecordSearch] = useState("");
  const [showRecordDropdown, setShowRecordDropdown] = useState(false);

  const resetForm = useCallback(() => {
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

  const toggleTradeSelection = useCallback((id: string) => {
    setSelectedTradeIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }, []);

  const value = useMemo(
    () => ({
      // State
      title,
      reviewType,
      linkedType,
      linkedId,
      selectedTradeIds,
      whatWorked,
      whatFailed,
      emotionalState,
      lessonsLearned,
      selectedWeek,
      selectedFiles,
      previews,
      carouselIndex,
      recordSearch,
      showRecordDropdown,
      // Actions
      setTitle,
      setReviewType,
      setLinkedType,
      setLinkedId,
      setSelectedTradeIds,
      setWhatWorked,
      setWhatFailed,
      setEmotionalState,
      setLessonsLearned,
      setSelectedWeek,
      setSelectedFiles,
      setPreviews,
      setCarouselIndex,
      setRecordSearch,
      setShowRecordDropdown,
      resetForm,
      toggleTradeSelection,
    }),
    [
      title,
      reviewType,
      linkedType,
      linkedId,
      selectedTradeIds,
      whatWorked,
      whatFailed,
      emotionalState,
      lessonsLearned,
      selectedWeek,
      selectedFiles,
      previews,
      carouselIndex,
      recordSearch,
      showRecordDropdown,
      resetForm,
      toggleTradeSelection,
    ]
  );

  return <RecapFormContext.Provider value={value}>{children}</RecapFormContext.Provider>;
}

"use client";

import React, { useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { RecapCard } from "./RecapCard";
import type { LaboratoryRecap, EmotionalState, RecapLinkedType, Account } from "@/types";

interface RecapsTabProps {
  recaps: LaboratoryRecap[];
  accounts?: Account[];
  onCreateNew: () => void;
  onView: (recap: LaboratoryRecap) => void;
  onEdit: (recap: LaboratoryRecap) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

type LinkFilter = "all" | "trades" | "journals" | "none";

const LINK_FILTERS: { value: LinkFilter; label: string; icon: string }[] = [
  { value: "all", label: "Todos", icon: "📋" },
  { value: "trades", label: "Trades", icon: "📊" },
  { value: "journals", label: "Diários", icon: "📓" },
  { value: "none", label: "Reflexões", icon: "💭" },
];

const EMOTION_FILTERS: { value: EmotionalState | "all"; label: string; emoji?: string }[] = [
  { value: "all", label: "Todos" },
  { value: "confiante", label: "Confiante", emoji: "💪" },
  { value: "disciplinado", label: "Disciplinado", emoji: "🎯" },
  { value: "ansioso", label: "Ansioso", emoji: "😰" },
  { value: "fomo", label: "FOMO", emoji: "🔥" },
  { value: "frustrado", label: "Frustrado", emoji: "😤" },
];

/** Get the effective link type from a recap (handles legacy tradeId) */
function getRecapLinkType(recap: LaboratoryRecap): RecapLinkedType | "none" {
  return recap.linkedType || (recap.tradeId ? "trade" : "none");
}

export function RecapsTab({
  recaps,
  accounts = [],
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: RecapsTabProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [emotionFilter, setEmotionFilter] = useState<EmotionalState | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [linkFilter, setLinkFilter] = useState<LinkFilter>("all");

  // Filter recaps
  const filteredRecaps = recaps.filter((recap) => {
    // Account filter
    if (selectedAccountId !== "all") {
      let matchesAccount = false;

      // Check trade
      if (recap.trade && recap.trade.accountId === selectedAccountId) {
        matchesAccount = true;
      }

      // Check journal
      if (recap.journal && recap.journal.accountId === selectedAccountId) {
        matchesAccount = true;
      }

      if (!matchesAccount) return false;
    }

    // Emotion filter
    if (emotionFilter !== "all" && recap.emotionalState !== emotionFilter) return false;

    // Link type filter
    if (linkFilter !== "all") {
      const recapLinkType = getRecapLinkType(recap);
      if (linkFilter === "trades" && recapLinkType !== "trade") return false;
      if (linkFilter === "journals" && recapLinkType !== "journal") return false;
      if (linkFilter === "none" && recapLinkType !== "none") return false;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        recap.title.toLowerCase().includes(query) ||
        recap.lessonsLearned?.toLowerCase().includes(query) ||
        recap.whatWorked?.toLowerCase().includes(query) ||
        recap.whatFailed?.toLowerCase().includes(query) ||
        recap.trade?.symbol.toLowerCase().includes(query) ||
        recap.journal?.title?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate stats
  const tradeCount = recaps.filter((r) => getRecapLinkType(r) === "trade").length;
  const journalCount = recaps.filter((r) => getRecapLinkType(r) === "journal").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Recaps</h2>
          <p className="text-sm text-gray-400">
            Analise e documente seus trades e observações do mercado
          </p>
        </div>
        <Button variant="gradient-success" onClick={onCreateNew} leftIcon={<span>+</span>}>
          Novo Recap
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Search */}
        <div className="flex flex-1 gap-2">
          {/* Account Filter Dropdown */}
          {accounts.length > 1 && (
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[180px] rounded-xl border-gray-700 bg-gray-800/50 text-white">
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <input
            type="text"
            placeholder="Buscar recaps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        {/* Link Type Filters */}
        <div className="flex gap-2">
          {LINK_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setLinkFilter(filter.value)}
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                linkFilter === filter.value
                  ? filter.value === "trades"
                    ? "border border-green-500/50 bg-green-500/20 text-green-400"
                    : filter.value === "journals"
                      ? "border border-blue-500/50 bg-blue-500/20 text-blue-400"
                      : filter.value === "none"
                        ? "border border-gray-500/50 bg-gray-500/20 text-gray-300"
                        : "border border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
                  : "border border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Emotion Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {EMOTION_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setEmotionFilter(filter.value)}
            className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              emotionFilter === filter.value
                ? "border border-cyan-500/50 bg-cyan-500/20 text-cyan-400"
                : "border border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
            }`}
          >
            {filter.emoji && <span>{filter.emoji}</span>}
            <span>{filter.label}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredRecaps.length === 0 && (
        <div className="py-12 text-center">
          <div className="mb-4 text-4xl">📝</div>
          <h3 className="mb-2 text-lg font-medium text-white">
            {recaps.length === 0 ? "Nenhum recap ainda" : "Nenhum recap encontrado"}
          </h3>
          <p className="mb-6 text-gray-400">
            {recaps.length === 0
              ? "Começe documentando os aprendizados dos seus trades"
              : "Tente ajustar os filtros de busca"}
          </p>
          {recaps.length === 0 && (
            <Button variant="gradient-success" onClick={onCreateNew}>
              Criar Primeiro Recap
            </Button>
          )}
        </div>
      )}

      {/* Recaps Grid */}
      {!isLoading && filteredRecaps.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecaps.map((recap) => (
            <RecapCard
              key={recap.id}
              recap={recap}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {recaps.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-700/50 pt-4 text-sm text-gray-400">
          <span>
            {filteredRecaps.length} de {recaps.length} recaps
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-green-400">
              <span>📊</span>
              {tradeCount} trades
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <span>📓</span>
              {journalCount} diários
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { memo, useMemo, useRef, useEffect, useState } from "react";
import type { TradeLite, JournalEntryLite, RecapLinkedType, Account } from "@/types";
import { format, parseISO } from "date-fns";
import { AssetIcon } from "@/components/shared/AssetIcon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";

interface SearchRecord {
  type: RecapLinkedType;
  id: string;
  label: string;
  symbol?: string;
  date: string;
  outcome?: string;
  title?: string;
}

interface DailyRecapSectionProps {
  trades: TradeLite[];
  journalEntries: JournalEntryLite[];
  recordSearch: string;
  showRecordDropdown: boolean;
  linkedType: RecapLinkedType | undefined;
  linkedId: string;
  accounts?: Account[];
  onRecordSearchChange: (value: string) => void;
  onShowDropdownChange: (value: boolean) => void;
  onSelectRecord: (type: RecapLinkedType, id: string, label: string) => void;
  onClearRecord: () => void;
}

export const DailyRecapSection = memo(function DailyRecapSection({
  trades,
  journalEntries,
  recordSearch,
  showRecordDropdown,
  linkedType,
  linkedId,
  accounts = [],
  onRecordSearchChange,
  onShowDropdownChange,
  onSelectRecord,
  onClearRecord,
}: DailyRecapSectionProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onShowDropdownChange(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onShowDropdownChange]);

  // Get linked record details from id
  const linkedRecordDetails = useMemo(() => {
    if (!linkedType || !linkedId) return null;

    if (linkedType === "trade") {
      const trade = trades.find((t) => t.id === linkedId);
      if (trade) {
        return {
          type: "trade" as const,
          symbol: trade.symbol,
          date: trade.entryDate,
          outcome: trade.outcome,
        };
      }
    } else {
      const journal = journalEntries.find((j) => j.id === linkedId);
      if (journal) {
        return {
          type: "journal" as const,
          symbol: journal.asset,
          date: journal.date,
          title: journal.title,
        };
      }
    }
    return null;
  }, [linkedType, linkedId, trades, journalEntries]);

  // Filter trades by account
  const filteredTrades = useMemo(() => {
    if (selectedAccountId === "all") return trades;
    return trades.filter((t) => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  // Get recent records (last 30 days)
  const recentRecords = useMemo((): SearchRecord[] => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const oneMonthAgoStr = oneMonthAgo.toISOString().split("T")[0];

    const recentTrades: SearchRecord[] = filteredTrades
      .filter((t) => t.entryDate >= oneMonthAgoStr)
      .slice(0, 10)
      .map((t) => ({
        type: "trade" as const,
        id: t.id,
        label: t.symbol,
        symbol: t.symbol,
        date: t.entryDate,
        outcome: t.outcome,
      }));

    const recentJournals: SearchRecord[] = journalEntries
      .filter((j) => j.date >= oneMonthAgoStr)
      .slice(0, 10)
      .map((j) => ({
        type: "journal" as const,
        id: j.id,
        label: j.asset || "Observação",
        date: j.date,
        title: j.title,
      }));

    return [...recentJournals, ...recentTrades]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [filteredTrades, journalEntries]);

  // Search results
  const searchResults = useMemo((): SearchRecord[] => {
    // Always show recent records when dropdown is open and no search query
    if (!recordSearch || recordSearch.length < 2) {
      return showRecordDropdown ? recentRecords : [];
    }

    const query = recordSearch.toLowerCase();

    const matchingTrades: SearchRecord[] = filteredTrades
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
  }, [recordSearch, filteredTrades, journalEntries, showRecordDropdown, recentRecords]);

  const handleSelectRecord = (record: SearchRecord) => {
    onSelectRecord(record.type, record.id, record.label);
    onShowDropdownChange(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-gray-300">
          Vincular a um registro (opcional)
        </label>
        {/* Account Filter */}
        {accounts.length > 1 && (
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="h-7 w-[140px] rounded-lg border-gray-700 bg-gray-800/50 px-2 text-xs text-white">
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
      </div>
      <div className="relative">
        {linkedType && linkedId && linkedRecordDetails ? (
          <div className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3">
            {/* Type Badge */}
            <span
              className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                linkedType === "trade"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {linkedType === "trade" ? "TRADE" : "DIÁRIO"}
            </span>

            {/* Asset Icon + Symbol */}
            {linkedRecordDetails.symbol && (
              <div className="flex items-center gap-1.5 rounded-lg border border-gray-700/50 bg-gray-800/60 px-2 py-0.5">
                <AssetIcon symbol={linkedRecordDetails.symbol} size="sm" />
                <span className="text-xs font-medium text-gray-300">
                  {linkedRecordDetails.symbol}
                </span>
              </div>
            )}

            {/* Date */}
            <span className="text-sm text-gray-400">
              {format(parseISO(linkedRecordDetails.date), "dd MMM yyyy")}
            </span>

            {/* Outcome indicator for trades */}
            {linkedRecordDetails.outcome && (
              <span
                className={`text-sm font-bold ${
                  linkedRecordDetails.outcome === "win"
                    ? "text-green-400"
                    : linkedRecordDetails.outcome === "loss"
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                {linkedRecordDetails.outcome === "win"
                  ? "✓"
                  : linkedRecordDetails.outcome === "loss"
                    ? "✗"
                    : "⬤"}
              </span>
            )}

            {/* Spacer + Remove button */}
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => {
                onRecordSearchChange("");
                onClearRecord();
              }}
              className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
              title="Remover vínculo"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              value={recordSearch}
              onChange={(e) => {
                onRecordSearchChange(e.target.value);
                onShowDropdownChange(true);
                if (e.target.value === "") {
                  onClearRecord();
                }
              }}
              onFocus={() => onShowDropdownChange(true)}
              placeholder="Ex: NQ, ES, 2024-12-15 ou título do diário"
              className="w-full rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3 pr-10 text-white placeholder-gray-500 transition-colors focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {recordSearch && (
              <button
                type="button"
                onClick={() => {
                  onRecordSearchChange("");
                  onClearRecord();
                }}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-red-400"
              >
                ×
              </button>
            )}
          </>
        )}
      </div>

      {showRecordDropdown && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-gray-700 bg-gray-800 shadow-xl">
          {searchResults.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">
              {trades.length === 0 && journalEntries.length === 0 ? (
                <span>Nenhum trade ou diário encontrado nos últimos 30 dias</span>
              ) : (
                <span>Nenhum resultado para a busca</span>
              )}
            </div>
          ) : (
            <>
              {!recordSearch && (
                <div className="border-b border-gray-700/50 px-4 py-2 text-xs text-gray-500">
                  📋 Últimos registros (clique para selecionar)
                </div>
              )}
              {searchResults.map((record) => (
                <button
                  key={`${record.type}-${record.id}`}
                  type="button"
                  onClick={() => handleSelectRecord(record)}
                  className="flex w-full items-center gap-3 border-b border-gray-700/50 px-4 py-3 text-left last:border-0 hover:bg-gray-700/50"
                >
                  {/* Type Badge */}
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                      record.type === "trade"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {record.type === "trade" ? "TRADE" : "DIÁRIO"}
                  </span>

                  {/* Asset Icon + Symbol */}
                  {record.symbol && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <AssetIcon symbol={record.symbol} size="sm" />
                      <span className="text-sm font-medium text-white">{record.symbol}</span>
                    </div>
                  )}
                  {!record.symbol && (
                    <span className="flex-1 truncate text-white">{record.label}</span>
                  )}

                  {/* Date */}
                  <span className="ml-auto text-sm text-gray-400">
                    {format(parseISO(record.date), "dd/MM")}
                  </span>

                  {/* Outcome indicator */}
                  {record.outcome && (
                    <span
                      className={`text-sm font-bold ${
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
            </>
          )}
        </div>
      )}
    </div>
  );
});

"use client";

import React, { memo, useMemo, useRef, useEffect } from "react";
import type { TradeLite, JournalEntryLite, RecapLinkedType } from "@/types";
import { format, parseISO } from "date-fns";

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
  onRecordSearchChange,
  onShowDropdownChange,
  onSelectRecord,
  onClearRecord,
}: DailyRecapSectionProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Get recent records (last 7 days)
  const recentRecords = useMemo((): SearchRecord[] => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0];

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

    return [...recentJournals, ...recentTrades]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [trades, journalEntries]);

  // Search results
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

  const handleSelectRecord = (record: SearchRecord) => {
    onSelectRecord(record.type, record.id, record.label);
    onShowDropdownChange(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="mb-2 block text-sm font-medium text-gray-300">
        Vincular a um registro (opcional)
      </label>
      <div className="relative">
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
          placeholder="Buscar por ativo, data ou diário..."
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
      </div>

      {showRecordDropdown && searchResults.length > 0 && (
        <div className="absolute z-50 mt-2 max-h-48 w-full overflow-auto rounded-xl border border-gray-700 bg-gray-800 shadow-xl">
          {searchResults.map((record) => (
            <button
              key={`${record.type}-${record.id}`}
              type="button"
              onClick={() => handleSelectRecord(record)}
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
  );
});

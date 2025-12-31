"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { Trade, JournalEntry } from "@/types";
import { groupTradesByDay, formatCurrency } from "@/lib/calculations";
import { useJournalStore } from "@/store/useJournalStore";
// import { usePrefetchCalendarData } from "@/hooks/usePrefetchCalendarData";
import { GlassCard } from "@/components/ui";
import dayjs from "dayjs";

interface TradeCalendarProps {
  trades: Trade[];
  entries?: JournalEntry[];
  journalAvailability?: Record<string, number>; // OPTIMIZED: date -> count map for instant badges
  accountId?: string; // For prefetching
  onDayClick?: (date: string, dayTrades: Trade[]) => void;
  onMonthChange?: (date: dayjs.Dayjs) => void;
}

interface DayStatsResult {
  totalPnL: number;
  tradeCount: number;
  wins: number;
  losses: number;
  breakeven: number;
  statusText: string;
  statusColor: string;
  textClass: string;
  bgClass: string;
}

export function TradeCalendar({
  trades,
  entries: propEntries,
  journalAvailability,
  accountId,
  onDayClick,
  onMonthChange,
}: TradeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const { entries: storeEntries, currentAccountId: storeAccountId } = useJournalStore();
  // Only use store entries if they match the current account (prevents stale data)
  // Wrapped in useMemo to ensure stable reference
  const entries = useMemo(() => {
    return propEntries || (storeAccountId === accountId ? storeEntries : []);
  }, [propEntries, storeAccountId, accountId, storeEntries]);

  // Prefetch hook for lazy loading
  // DISABLED TEMPORARILY due to Next.js 16/Turbopack issues with Server Actions in Client/Hooks
  // const { prefetchDayData, prefetchNearbyDays } = usePrefetchCalendarData(accountId || "");
  const hoverCancelRef = useRef<(() => void) | null>(null);
  const hasPrefetchedNearby = useRef(false);

  // Prefetch nearby days on mount (background loading)
  useEffect(() => {
    if (accountId && !hasPrefetchedNearby.current) {
      hasPrefetchedNearby.current = true;
      // const today = dayjs().format("YYYY-MM-DD");
      // Delay to not block initial render
      // setTimeout(() => prefetchNearbyDays(today), 500);
    }
  }, [accountId]);

  const currentMonth = currentDate.month();
  const currentYear = currentDate.year();

  // Get first day of month
  const firstDayOfMonth = dayjs().year(currentYear).month(currentMonth).date(1);

  // Get starting day (include previous month days to fill first week)
  const startingDayOfWeek = firstDayOfMonth.day(); // 0 = Sunday
  const startDate = firstDayOfMonth.subtract(startingDayOfWeek, "day");

  // Generate 42 days (6 weeks) for calendar grid
  const calendarDays = [];
  let currentDay = startDate;

  for (let i = 0; i < 42; i++) {
    calendarDays.push(currentDay);
    currentDay = currentDay.add(1, "day");
  }

  // Always display all 42 days (6 weeks) for consistent height
  const displayDays = calendarDays;

  // Group trades by day
  const tradesByDay = groupTradesByDay(trades);

  // Pure function to calculate day stats (not a hook)
  const calculateDayStats = (dayTrades: Trade[]): DayStatsResult => {
    const totalPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const tradeCount = dayTrades.length;
    const wins = dayTrades.filter((t) => t.outcome === "win").length;
    const losses = dayTrades.filter((t) => t.outcome === "loss").length;
    const breakeven = dayTrades.filter((t) => t.outcome === "breakeven").length;

    let statusText = "N/A";
    let statusColor = "text-gray-400";
    let textClass = "text-gray-400";
    let bgClass = "bg-gray-800/20 border-gray-800 hover:border-gray-700";

    if (tradeCount > 0) {
      if (totalPnL > 0) {
        statusText = "WIN";
        statusColor = "text-green-500";
        textClass = "text-green-400";
        bgClass = "bg-[#1f2e2f] border-green-500/20 hover:border-green-500/50";
      } else if (totalPnL < 0) {
        statusText = "LOSS";
        statusColor = "text-red-500";
        textClass = "text-red-400";
        bgClass = "bg-[#2a262c] border-red-500/20 hover:border-red-500/50";
      } else {
        statusText = "B/E";
        statusColor = "text-gray-400";
        textClass = "text-gray-400";
        bgClass = "bg-[#212930] border-gray-800 hover:border-gray-700";
      }
    }

    return {
      totalPnL,
      tradeCount,
      wins,
      losses,
      breakeven,
      statusText,
      statusColor,
      textClass,
      bgClass,
    };
  };

  // Pre-calculate stats for all days in calendar using useMemo
  // OPTIMIZED: Use Maps and Sets for O(n) complexity instead of O(n*m)
  const dayStatsMap = useMemo(() => {
    const statsMap: Record<string, DayStatsResult & { dayTrades: Trade[]; journalCount: number }> =
      {};

    // PRE-INDEX: Group entries by date for O(1) lookup
    const entriesByDate = new Map<string, typeof entries>();
    entries.forEach((e) => {
      if (!entriesByDate.has(e.date)) entriesByDate.set(e.date, []);
      entriesByDate.get(e.date)!.push(e);
    });

    // PRE-INDEX: Create set of ALL trade IDs to check if entries are linked to trades in ANY date
    const allTradeIds = new Set(trades.map((t) => t.id));

    // Calculate stats for days with trades
    Object.keys(tradesByDay).forEach((dateStr) => {
      const dayTrades = tradesByDay[dateStr];
      const stats = calculateDayStats(dayTrades);

      // PRE-INDEX: Create Set of trade IDs for O(1) lookup
      const dayTradeIds = new Set(dayTrades.map((t) => t.id));

      // Count journal entries for this day, excluding ones linked to today's trades
      // Now O(k) where k = entries for this day, instead of O(n*m)
      const dayEntriesRaw = entriesByDate.get(dateStr) || [];
      const dayEntries = dayEntriesRaw.filter((e) => {
        // If no trade IDs linked, include the entry
        if (!e.tradeIds?.length) return true;
        // Exclude if any linked trade is in today's trades (O(1) lookup per tradeId)
        return !e.tradeIds.some((tid) => dayTradeIds.has(tid));
      });

      statsMap[dateStr] = {
        ...stats,
        dayTrades,
        journalCount: dayEntries.length,
      };
    });

    // Also add stats for days with only journal entries (no trades)
    // Use entriesByDate for efficiency
    const tradeDates = new Set(Object.keys(tradesByDay));
    entriesByDate.forEach((dayEntries, dateStr) => {
      if (tradeDates.has(dateStr)) return; // Already processed above

      // FIX: Filter out entries that are linked to trades in other dates
      // These entries should only be shown on the date of their linked trade
      const standaloneEntries = dayEntries.filter((e) => {
        // If no trade IDs linked, include the entry
        if (!e.tradeIds?.length) return true;
        // Exclude if linked to ANY existing trade (it will be shown on the trade's date)
        return !e.tradeIds.some((tid) => allTradeIds.has(tid));
      });

      // Only add to statsMap if there are standalone entries
      if (standaloneEntries.length > 0) {
        statsMap[dateStr] = {
          ...calculateDayStats([]),
          dayTrades: [],
          journalCount: standaloneEntries.length,
        };
      }
    });

    return statsMap;
  }, [tradesByDay, entries, trades]);

  // Get journal count for a date (from lightweight availability map or full entries)
  const getJournalCountForDate = (dateStr: string): number => {
    // Prioritize lightweight availability map if provided (has counts)
    if (journalAvailability && Object.keys(journalAvailability).length > 0) {
      return journalAvailability[dateStr] || 0;
    }
    // Fallback to 0 so we use the deduplicated stats.journalCount
    return 0;
  };

  // Get stats for a specific day
  const getDayStats = (date: dayjs.Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    return (
      dayStatsMap[dateStr] || {
        ...calculateDayStats([]),
        dayTrades: [],
        journalCount: 0,
      }
    );
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const handlePrevMonth = () => {
    const newDate = currentDate.subtract(1, "month");
    console.log("📅 TradeCalendar: Prev Month clicked:", newDate.format("YYYY-MM"));
    setCurrentDate(newDate);
    if (onMonthChange) {
      console.log("calendar: triggering onMonthChange");
      onMonthChange(newDate);
    } else {
      console.warn("calendar: onMonthChange prop is missing");
    }
  };

  const handleNextMonth = () => {
    const newDate = currentDate.add(1, "month");
    console.log("📅 TradeCalendar: Next Month clicked:", newDate.format("YYYY-MM"));
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  return (
    <GlassCard className="w-full p-6">
      {/* Month/Year Header */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-100 capitalize">
          {currentDate.format("MMMM YYYY")}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={handleNextMonth}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid - Responsive: 3 cols on mobile, 4 on tablet, 7 on desktop */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {/* Week day headers - Only show on desktop */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="hidden py-2 text-center text-sm font-semibold text-gray-400 lg:block"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {displayDays.map((date, index) => {
          const isCurrentMonth = date.month() === currentMonth;
          const isToday = date.isSame(dayjs(), "day");
          const stats = getDayStats(date);
          const hasTrades = stats.tradeCount > 0;
          // Get journal count from availability map OR stats
          const dateStr = date.format("YYYY-MM-DD");
          const journalCount = getJournalCountForDate(dateStr) || stats.journalCount;
          const hasJournal = journalCount > 0;

          // Use styling from stats hook, with fallback for journal-only days
          let bgClass = stats.bgClass;

          if (!hasTrades && hasJournal) {
            // Style for days with ONLY journal entries but no trades
            bgClass = "bg-[#212930] border-cyan-500/30 hover:border-cyan-500/50";
          } else if (!hasTrades && !hasJournal && isCurrentMonth) {
            bgClass = "bg-[#212930] border-gray-800 hover:border-gray-700";
          }

          return (
            <button
              key={index}
              onClick={() =>
                (hasTrades || hasJournal || isCurrentMonth) &&
                onDayClick &&
                onDayClick(date.format("YYYY-MM-DD"), stats.dayTrades)
              }
              onMouseEnter={() => {
                // Cancel any previous hover
                hoverCancelRef.current?.();
                // Start prefetch with 150ms delay
                // const { start, cancel } = prefetchDayData(dateStr, 150);
                // hoverCancelRef.current = cancel;
                // start();
              }}
              onMouseLeave={() => {
                // Cancel prefetch if mouse leaves before delay
                hoverCancelRef.current?.();
                hoverCancelRef.current = null;
              }}
              className={`relative flex h-[150px] min-w-[100px] touch-manipulation flex-col items-center justify-between rounded-xl border p-3 transition-all ${bgClass} ${isToday ? "border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]" : ""} ${hasTrades || hasJournal || isCurrentMonth ? "cursor-pointer hover:border-cyan-500" : ""} ${!isCurrentMonth ? "opacity-30" : ""} `}
            >
              {/* Day number */}
              <div
                className={`mb-2 flex w-full items-start justify-between text-sm font-medium ${isCurrentMonth ? "text-gray-400" : "text-gray-600"}`}
              >
                <span>{date.date()}</span>
                {isToday && (
                  <span className="rounded border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
                    Hoje
                  </span>
                )}
              </div>

              {/* Content */}
              {hasTrades ? (
                <div className="my-auto flex w-full flex-col items-center gap-1">
                  {/* Status (WIN/LOSS) */}
                  <div className={`text-sm font-bold tracking-wider ${stats.statusColor}`}>
                    {stats.statusText}
                  </div>

                  {/* P&L */}
                  <div className={`text-xs font-medium ${stats.textClass}`}>
                    {stats.totalPnL > 0 ? "+" : ""}
                    {formatCurrency(stats.totalPnL)}
                  </div>

                  {/* Trade Count */}
                  <div className="text-[10px] text-gray-500">
                    {stats.tradeCount} {stats.tradeCount === 1 ? "Trade" : "Trades"}
                  </div>

                  {/* Journal Indicator - use journalCount from availability map */}
                  {hasJournal && (
                    <div className="mt-1 text-[10px] font-medium text-cyan-400">
                      Diário ({journalCount})
                    </div>
                  )}
                </div>
              ) : hasJournal ? (
                /* Only Journal Entries - use journalCount from availability map */
                <div className="my-auto flex w-full flex-col items-center justify-center gap-1">
                  <div className="text-sm font-bold text-cyan-400">Diário</div>
                  <div className="text-[10px] text-gray-400">
                    {journalCount} {journalCount === 1 ? "Entrada" : "Entradas"}
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="flex-1"></div>
              )}
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}

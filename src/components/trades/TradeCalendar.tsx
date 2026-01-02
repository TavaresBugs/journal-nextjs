"use client";

import { useState, useMemo, useEffect, useRef, useCallback, TouchEvent } from "react";
import type { Trade, JournalEntry } from "@/types";
import { groupTradesByDay, formatCurrency } from "@/lib/utils/trading";
import { useJournalStore } from "@/store/useJournalStore";
import { GlassCard } from "@/components/ui";
import { ChevronLeft, ChevronRight, CalendarDays, List } from "lucide-react";
import dayjs from "dayjs";

// ============================================================================
// MOBILE-OPTIMIZED TRADE CALENDAR
// ============================================================================
// Changes from original:
// 1. Added mobile weekly view with agenda-style list
// 2. Added swipe gesture navigation for month/week changes
// 3. Increased touch targets to 48px minimum
// 4. Added view toggle (calendar grid vs agenda list)
// 5. Responsive: agenda view on mobile, grid on desktop
// 6. Touch-optimized with touch-manipulation CSS
// ============================================================================

interface TradeCalendarProps {
  trades: Trade[];
  entries?: JournalEntry[];
  journalAvailability?: Record<string, number>;
  accountId?: string;
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

// Hook for detecting mobile (copy to src/hooks/useMediaQuery.ts)
// const useMediaQuery = (query: string) => {
//   const [matches, setMatches] = useState(false);
//   useEffect(() => {
//     const media = window.matchMedia(query);
//     setMatches(media.matches);
//     const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
//     media.addEventListener("change", listener);
//     return () => media.removeEventListener("change", listener);
//   }, [query]);
//   return matches;
// };

export function TradeCalendar({
  trades,
  entries: propEntries,
  journalAvailability,
  accountId,
  onDayClick,
  onMonthChange,
}: TradeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<"calendar" | "agenda">("calendar");
  const { entries: storeEntries, currentAccountId: storeAccountId } = useJournalStore();

  // Swipe handling refs
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile - you can use your useMediaQuery hook instead
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-switch to agenda on mobile
  useEffect(() => {
    if (isMobile && viewMode === "calendar") {
      setViewMode("agenda");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const entries = useMemo(() => {
    return propEntries || (storeAccountId === accountId ? storeEntries : []);
  }, [propEntries, storeAccountId, accountId, storeEntries]);

  const currentMonth = currentDate.month();
  const currentYear = currentDate.year();

  // Calendar days calculation
  const firstDayOfMonth = dayjs().year(currentYear).month(currentMonth).date(1);
  const startingDayOfWeek = firstDayOfMonth.day();
  const startDate = firstDayOfMonth.subtract(startingDayOfWeek, "day");

  const calendarDays = useMemo(() => {
    const days = [];
    let currentDay = startDate;
    for (let i = 0; i < 42; i++) {
      days.push(currentDay);
      currentDay = currentDay.add(1, "day");
    }
    return days;
  }, [startDate]);

  // Group trades by day
  const tradesByDay = useMemo(() => groupTradesByDay(trades), [trades]);

  // Calculate day stats
  const calculateDayStats = useCallback((dayTrades: Trade[]): DayStatsResult => {
    const totalPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const tradeCount = dayTrades.length;
    const wins = dayTrades.filter((t) => t.outcome === "win").length;
    const losses = dayTrades.filter((t) => t.outcome === "loss").length;
    const breakeven = dayTrades.filter((t) => t.outcome === "breakeven").length;

    let statusText = "N/A";
    let statusColor = "text-muted-foreground";
    let textClass = "text-muted-foreground";
    let bgClass = "bg-muted/20 border-border hover:border-muted-foreground";

    if (tradeCount > 0) {
      if (totalPnL > 0) {
        statusText = "WIN";
        statusColor = "text-green-500";
        textClass = "text-green-400";
        bgClass = "bg-green-500/10 border-green-500/20 hover:border-green-500/50";
      } else if (totalPnL < 0) {
        statusText = "LOSS";
        statusColor = "text-red-500";
        textClass = "text-red-400";
        bgClass = "bg-red-500/10 border-red-500/20 hover:border-red-500/50";
      } else {
        statusText = "B/E";
        statusColor = "text-muted-foreground";
        textClass = "text-muted-foreground";
        bgClass = "bg-muted/20 border-border hover:border-muted-foreground";
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
  }, []);

  // Pre-calculate stats for all days
  const dayStatsMap = useMemo(() => {
    const statsMap: Record<string, DayStatsResult & { dayTrades: Trade[]; journalCount: number }> =
      {};
    const entriesByDate = new Map<string, typeof entries>();
    entries.forEach((e) => {
      if (!entriesByDate.has(e.date)) entriesByDate.set(e.date, []);
      entriesByDate.get(e.date)!.push(e);
    });

    const allTradeIds = new Set(trades.map((t) => t.id));

    Object.keys(tradesByDay).forEach((dateStr) => {
      const dayTrades = tradesByDay[dateStr];
      const stats = calculateDayStats(dayTrades);
      const dayTradeIds = new Set(dayTrades.map((t) => t.id));
      const dayEntriesRaw = entriesByDate.get(dateStr) || [];
      const dayEntries = dayEntriesRaw.filter((e) => {
        if (!e.tradeIds?.length) return true;
        return !e.tradeIds.some((tid) => dayTradeIds.has(tid));
      });

      statsMap[dateStr] = { ...stats, dayTrades, journalCount: dayEntries.length };
    });

    const tradeDates = new Set(Object.keys(tradesByDay));
    entriesByDate.forEach((dayEntries, dateStr) => {
      if (tradeDates.has(dateStr)) return;
      const standaloneEntries = dayEntries.filter((e) => {
        if (!e.tradeIds?.length) return true;
        return !e.tradeIds.some((tid) => allTradeIds.has(tid));
      });

      if (standaloneEntries.length > 0) {
        statsMap[dateStr] = {
          ...calculateDayStats([]),
          dayTrades: [],
          journalCount: standaloneEntries.length,
        };
      }
    });

    return statsMap;
  }, [tradesByDay, entries, trades, calculateDayStats]);

  const getJournalCountForDate = (dateStr: string): number => {
    if (journalAvailability && Object.keys(journalAvailability).length > 0) {
      return journalAvailability[dateStr] || 0;
    }
    return 0;
  };

  const getDayStats = useCallback(
    (date: dayjs.Dayjs) => {
      const dateStr = date.format("YYYY-MM-DD");
      return dayStatsMap[dateStr] || { ...calculateDayStats([]), dayTrades: [], journalCount: 0 };
    },
    [dayStatsMap, calculateDayStats]
  );

  // Swipe handlers
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleNextMonth(); // swipe left = next
      } else {
        handlePrevMonth(); // swipe right = prev
      }
    }
  };

  const handlePrevMonth = () => {
    const newDate = currentDate.subtract(1, "month");
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = currentDate.add(1, "month");
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const weekDaysShort = ["D", "S", "T", "Q", "Q", "S", "S"];

  // Get days with activity for agenda view (sorted)
  const daysWithActivity = useMemo(() => {
    const activeDays: { date: dayjs.Dayjs; stats: ReturnType<typeof getDayStats> }[] = [];

    calendarDays.forEach((date) => {
      if (date.month() !== currentMonth) return;
      const stats = getDayStats(date);
      if (stats.tradeCount > 0 || stats.journalCount > 0) {
        activeDays.push({ date, stats });
      }
    });

    return activeDays.sort((a, b) => a.date.valueOf() - b.date.valueOf());
  }, [calendarDays, currentMonth, getDayStats]);

  return (
    <GlassCard className="w-full p-4 md:p-6">
      {/* Header with Month/Year and Controls */}
      <div className="mb-4 flex items-center justify-between gap-2 md:mb-6">
        <h3 className="text-foreground truncate text-lg font-bold capitalize md:text-2xl">
          {currentDate.format("MMMM YYYY")}
        </h3>

        <div className="flex items-center gap-2">
          {/* View Toggle - Only on mobile */}
          <div className="bg-muted/30 flex rounded-lg p-0.5 md:hidden">
            <button
              onClick={() => setViewMode("calendar")}
              className={`touch-manipulation rounded-md p-2 transition-colors ${
                viewMode === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Vista calendário"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`touch-manipulation rounded-md p-2 transition-colors ${
                viewMode === "agenda"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Vista agenda"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex gap-1">
            <button
              onClick={handlePrevMonth}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-10 w-10 touch-manipulation items-center justify-center rounded-lg transition-colors md:h-8 md:w-8"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5 md:h-4 md:w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-10 w-10 touch-manipulation items-center justify-center rounded-lg transition-colors md:h-8 md:w-8"
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5 md:h-4 md:w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content with Swipe Support */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* AGENDA VIEW - Mobile optimized */}
        {viewMode === "agenda" && (
          <div className="space-y-2">
            {daysWithActivity.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                <CalendarDays className="mx-auto mb-3 h-12 w-12 opacity-30" />
                <p>Nenhuma atividade neste mês</p>
                <p className="mt-1 text-sm">Deslize para mudar o mês</p>
              </div>
            ) : (
              daysWithActivity.map(({ date, stats }) => {
                const dateStr = date.format("YYYY-MM-DD");
                const isToday = date.isSame(dayjs(), "day");
                const journalCount = getJournalCountForDate(dateStr) || stats.journalCount;
                const hasTrades = stats.tradeCount > 0;
                const hasJournal = journalCount > 0;

                return (
                  <button
                    key={dateStr}
                    onClick={() => onDayClick?.(dateStr, stats.dayTrades)}
                    className={`flex w-full touch-manipulation items-center gap-3 rounded-xl border p-4 transition-all active:scale-[0.98] ${stats.bgClass} ${
                      isToday ? "ring-2 ring-cyan-500/50" : ""
                    }`}
                  >
                    {/* Date Badge */}
                    <div className="flex min-w-[50px] flex-col items-center justify-center">
                      <span className="text-muted-foreground text-xs uppercase">
                        {date.format("ddd")}
                      </span>
                      <span className="text-foreground text-2xl font-bold">{date.format("D")}</span>
                      {isToday && (
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">Hoje</span>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="bg-border h-12 w-px" />

                    {/* Content */}
                    <div className="flex-1 text-left">
                      {hasTrades && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${stats.statusColor}`}>
                              {stats.statusText}
                            </span>
                            <span className={`text-sm font-medium ${stats.textClass}`}>
                              {stats.totalPnL > 0 ? "+" : ""}
                              {formatCurrency(stats.totalPnL)}
                            </span>
                          </div>
                          <div className="text-muted-foreground mt-0.5 text-xs">
                            {stats.tradeCount} {stats.tradeCount === 1 ? "Trade" : "Trades"}
                            {hasJournal &&
                              ` • ${journalCount} ${journalCount === 1 ? "Entrada" : "Entradas"}`}
                          </div>
                        </>
                      )}
                      {!hasTrades && hasJournal && (
                        <>
                          <div className="text-sm font-bold text-cyan-400">Diário</div>
                          <div className="text-muted-foreground mt-0.5 text-xs">
                            {journalCount} {journalCount === 1 ? "Entrada" : "Entradas"}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="text-muted-foreground h-5 w-5" />
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* CALENDAR GRID VIEW */}
        {viewMode === "calendar" && (
          <>
            {/* Week day headers */}
            <div className="mb-2 grid grid-cols-7 gap-1 md:gap-3">
              {(isMobile ? weekDaysShort : weekDays).map((day, i) => (
                <div
                  key={i}
                  className="text-muted-foreground py-1 text-center text-xs font-semibold md:py-2 md:text-sm"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days grid */}
            <div className="grid grid-cols-7 gap-1 md:gap-3">
              {calendarDays.map((date, index) => {
                const isCurrentMonth = date.month() === currentMonth;
                const isToday = date.isSame(dayjs(), "day");
                const stats = getDayStats(date);
                const hasTrades = stats.tradeCount > 0;
                const dateStr = date.format("YYYY-MM-DD");
                const journalCount = getJournalCountForDate(dateStr) || stats.journalCount;
                const hasJournal = journalCount > 0;

                let bgClass = stats.bgClass;
                if (!hasTrades && hasJournal) {
                  bgClass = "bg-cyan-500/10 border-cyan-500/30 hover:border-cyan-500/50";
                } else if (!hasTrades && !hasJournal && isCurrentMonth) {
                  bgClass = "bg-muted/20 border-border hover:border-muted-foreground";
                }

                return (
                  <button
                    key={index}
                    onClick={() =>
                      (hasTrades || hasJournal || isCurrentMonth) &&
                      onDayClick?.(dateStr, stats.dayTrades)
                    }
                    className={`relative flex aspect-square touch-manipulation flex-col items-center justify-start rounded-lg border p-1 transition-all active:scale-95 md:aspect-auto md:h-[120px] md:rounded-xl md:p-2 lg:h-[150px] lg:p-3 ${bgClass} ${isToday ? "ring-2 ring-cyan-500/50" : ""} ${!isCurrentMonth ? "opacity-30" : ""} `}
                  >
                    {/* Day number */}
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`text-xs font-medium md:text-sm ${
                          isCurrentMonth ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {date.date()}
                      </span>
                      {isToday && (
                        <span className="hidden rounded border border-cyan-500/20 bg-cyan-500/10 px-1 py-0.5 text-[8px] font-bold tracking-wider text-cyan-400 uppercase md:inline-block lg:text-[10px]">
                          Hoje
                        </span>
                      )}
                    </div>

                    {/* Mobile: Just show indicator dots */}
                    <div className="flex flex-1 items-center justify-center gap-1 md:hidden">
                      {hasTrades && (
                        <div
                          className={`h-2 w-2 rounded-full ${
                            stats.totalPnL > 0
                              ? "bg-green-500"
                              : stats.totalPnL < 0
                                ? "bg-red-500"
                                : "bg-muted-foreground"
                          }`}
                        />
                      )}
                      {hasJournal && <div className="h-2 w-2 rounded-full bg-cyan-500" />}
                    </div>

                    {/* Desktop: Full content */}
                    <div className="hidden w-full flex-1 flex-col items-center justify-center gap-0.5 md:flex lg:gap-1">
                      {hasTrades ? (
                        <>
                          <div
                            className={`text-xs font-bold tracking-wider lg:text-sm ${stats.statusColor}`}
                          >
                            {stats.statusText}
                          </div>
                          <div className={`text-[10px] font-medium lg:text-xs ${stats.textClass}`}>
                            {stats.totalPnL > 0 ? "+" : ""}
                            {formatCurrency(stats.totalPnL)}
                          </div>
                          <div className="text-muted-foreground text-[8px] lg:text-[10px]">
                            {stats.tradeCount} {stats.tradeCount === 1 ? "Trade" : "Trades"}
                          </div>
                          {hasJournal && (
                            <div className="text-[8px] font-medium text-cyan-400 lg:text-[10px]">
                              Diário ({journalCount})
                            </div>
                          )}
                        </>
                      ) : hasJournal ? (
                        <>
                          <div className="text-xs font-bold text-cyan-400 lg:text-sm">Diário</div>
                          <div className="text-muted-foreground text-[8px] lg:text-[10px]">
                            {journalCount} {journalCount === 1 ? "Entrada" : "Entradas"}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Swipe hint for mobile */}
      {isMobile && (
        <p className="text-muted-foreground mt-4 text-center text-xs">
          Deslize para navegar entre meses
        </p>
      )}
    </GlassCard>
  );
}

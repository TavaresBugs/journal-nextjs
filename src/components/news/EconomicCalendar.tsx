"use client";

import { useState, useMemo, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { getEventsForWeek, getEventsByDate } from "@/lib/repositories/economicEvents.repository";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { WeekPickerCalendar } from "@/components/ui/WeekPicker";
import { EventRow, EventsTableHeader } from "./EventRow";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isAdminAction as isAdmin } from "@/app/actions/admin";

// Icons (inline SVGs)

const RefreshIcon = ({ className = "" }: { className?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

type ImpactLevel = "high" | "medium" | "low" | "none";
type ViewMode = "week" | "today";

const IMPACT_OPTIONS: {
  value: ImpactLevel;
  label: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
}[] = [
  {
    value: "high",
    label: "Alto",
    emoji: "🔴",
    bgColor: "bg-red-500",
    borderColor: "border-red-500",
    shadowColor: "shadow-[0_0_10px_rgba(239,68,68,0.4)]",
  },
  {
    value: "medium",
    label: "Médio",
    emoji: "🟠",
    bgColor: "bg-orange-500",
    borderColor: "border-orange-500",
    shadowColor: "shadow-[0_0_10px_rgba(249,115,22,0.4)]",
  },
  {
    value: "low",
    label: "Baixo",
    emoji: "🟡",
    bgColor: "bg-yellow-500",
    borderColor: "border-yellow-500",
    shadowColor: "shadow-[0_0_10px_rgba(234,179,8,0.4)]",
  },
  {
    value: "none",
    label: "Sem Impacto",
    emoji: "⚪",
    bgColor: "bg-gray-400",
    borderColor: "border-gray-400",
    shadowColor: "shadow-[0_0_10px_rgba(156,163,175,0.4)]",
  },
];

type ImpactOption = {
  value: ImpactLevel;
  label: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  shadowColor: string;
};

/* Helper Component for Filters to avoid duplication */
function FiltersContent({
  IMPACT_OPTIONS,
  filterImpact,
  setFilterImpact,
  filterCurrency,
  toggleCurrency,
  setFilterCurrency,
}: {
  IMPACT_OPTIONS: ImpactOption[];
  filterImpact: ImpactLevel[];
  setFilterImpact: React.Dispatch<React.SetStateAction<ImpactLevel[]>>;
  filterCurrency: string[];
  toggleCurrency: (currency: string) => void;
  setFilterCurrency: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <>
      {/* Impact Filter - Checkboxes */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="text-sm text-gray-400">Impacto:</span>
        </div>

        {IMPACT_OPTIONS.map((option) => {
          const isChecked = filterImpact.includes(option.value);
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-all md:gap-3 md:px-3 md:py-2 ${
                isChecked ? "bg-gray-800/50" : "bg-transparent hover:bg-gray-800/30"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {
                  setFilterImpact((prev) =>
                    prev.includes(option.value)
                      ? prev.filter((v) => v !== option.value)
                      : [...prev, option.value]
                  );
                }}
                className="peer sr-only"
              />
              <div
                className={`relative flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200 ease-out md:h-6 md:w-6 ${
                  isChecked
                    ? `${option.bgColor} ${option.borderColor} ${option.shadowColor}`
                    : "border-white/10 bg-gray-800/20 hover:border-gray-500"
                }`}
              >
                <svg
                  className={`h-3.5 w-3.5 text-white transition-all duration-200 md:h-4 md:w-4 ${
                    isChecked ? "scale-100 opacity-100" : "scale-50 opacity-0"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span
                className={`text-xs transition-colors md:text-sm ${
                  isChecked ? "text-white" : "text-gray-400"
                }`}
              >
                {option.emoji} <span className="hidden sm:inline">{option.label}</span>
                <span className="sm:hidden">{option.label.split(" ")[0]}</span>
              </span>
            </label>
          );
        })}
      </div>

      {/* Currency Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-400">Moedas:</span>
        {["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF", "CNY"].map((currency) => (
          <button
            key={currency}
            onClick={() => toggleCurrency(currency)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold transition-all md:px-2.5 md:py-1.5 ${
              filterCurrency.includes(currency)
                ? "scale-105 border border-cyan-500/50 bg-cyan-500/20 text-cyan-400 shadow-lg"
                : "border border-gray-600 bg-gray-700/50 text-gray-300 hover:bg-gray-600"
            } `}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/assets/icons/flags/${currency.toLowerCase()}.svg`}
              alt={currency}
              className="h-4 w-4 rounded-full object-cover md:h-5 md:w-5"
            />
            {currency}
          </button>
        ))}
        {filterCurrency.length > 0 && (
          <button
            onClick={() => setFilterCurrency([])}
            className="ml-2 text-xs text-red-400 underline hover:text-red-300"
          >
            Limpar
          </button>
        )}
      </div>
    </>
  );
}

interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  currency: string;
  impact: "high" | "medium" | "low";
  event_name: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
}

/**
 * Economic Calendar component with Forex Factory style UI.
 */
export function EconomicCalendar() {
  const [currentWeek, setCurrentWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [filterImpact, setFilterImpact] = useState<ImpactLevel[]>([
    "high",
    "medium",
    "low",
    "none",
  ]);
  const [filterCurrency, setFilterCurrency] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarCoords, setCalendarCoords] = useState<{ top: number; left: number } | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);
    };
    checkAdminStatus();
  }, []);

  // Calculate position for portal dropdown
  useLayoutEffect(() => {
    if (isCalendarOpen && dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect();
      // Use absolute positioning relative to document + scroll offset
      setCalendarCoords({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
  }, [isCalendarOpen]);

  // Query for fetching events
  const {
    data: events,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["economic-events", format(currentWeek, "yyyy-MM-dd"), viewMode],
    queryFn: () =>
      viewMode === "today" ? getEventsByDate(new Date()) : getEventsForWeek(currentWeek),
    staleTime: 1000 * 60 * 60,
  });

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);

    try {
      const response = await fetch("/api/sync-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRefreshMessage({
            type: "info",
            text: data.error || "Aguarde alguns minutos para atualizar novamente",
          });
        } else {
          setRefreshMessage({ type: "error", text: data.error || "Erro ao atualizar" });
        }
        return;
      }

      setRefreshMessage({ type: "success", text: `${data.synced} eventos atualizados!` });
      await refetch();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      setRefreshMessage({ type: "error", text: "Erro de conexão. Tente novamente." });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshMessage(null), 5000);
    }
  };

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let filtered = [...events] as EconomicEvent[];

    // Impact filter (if not all selected)
    if (filterImpact.length > 0 && filterImpact.length < 4) {
      filtered = filtered.filter((e) => filterImpact.includes(e.impact as ImpactLevel));
    }

    if (filterCurrency.length > 0) {
      filtered = filtered.filter((e) => filterCurrency.includes(e.currency));
    }

    return filtered;
  }, [events, filterImpact, filterCurrency]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, EconomicEvent[]> = {};

    filteredEvents.forEach((event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });

    return grouped;
  }, [filteredEvents]);

  // Handlers
  const handlePrevWeek = () => {
    setViewMode("week");
    setCurrentWeek((prev) => subWeeks(prev, 1));
  };
  const handleNextWeek = () => {
    setViewMode("week");
    setCurrentWeek((prev) => addWeeks(prev, 1));
  };
  const handleToday = () => {
    setViewMode("today");
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };
  const handleThisWeek = () => {
    setViewMode("week");
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const toggleCurrency = (currency: string) => {
    setFilterCurrency((prev) =>
      prev.includes(currency) ? prev.filter((c) => c !== currency) : [...prev, currency]
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _weekEnd = addDays(currentWeek, 6);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <GlassCard className="overflow-visible p-3 md:p-4">
        {/* Title + Navigation */}
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-100 md:text-xl">
            📰 Calendário Econômico
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Previous Week */}
            <IconActionButton variant="back" onClick={handlePrevWeek} title="Semana anterior" />

            {/* Date Range - Clickable to open calendar */}
            <div className="relative flex-1 md:flex-none">
              <button
                ref={dateButtonRef}
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="flex w-full min-w-[180px] items-center justify-center gap-2 rounded-lg border border-gray-600 px-3 py-1.5 transition-colors hover:border-cyan-500 md:w-auto md:min-w-[220px]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-400"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-sm font-medium text-gray-300">
                  {format(currentWeek, "dd MMM", { locale: ptBR })} -{" "}
                  {format(endOfWeek(currentWeek, { weekStartsOn: 0 }), "dd MMM", { locale: ptBR })}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-400"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isCalendarOpen &&
                calendarCoords &&
                typeof window !== "undefined" &&
                createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[9998] bg-transparent"
                      onClick={() => setIsCalendarOpen(false)}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: calendarCoords.top,
                        left: calendarCoords.left,
                        transform: "translateX(-50%)",
                        zIndex: 9999,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <WeekPickerCalendar
                        selectedWeekStart={currentWeek}
                        onWeekSelect={(weekStart) => {
                          const sundayStart = startOfWeek(weekStart, { weekStartsOn: 0 });
                          setCurrentWeek(sundayStart);
                          setViewMode("week");
                          setIsCalendarOpen(false);
                        }}
                        onClose={() => setIsCalendarOpen(false)}
                      />
                    </div>
                  </>,
                  document.body
                )}
            </div>

            {/* Next Week */}
            <IconActionButton variant="next" onClick={handleNextWeek} title="Próxima semana" />

            <div className="hidden gap-2 sm:flex">
              <Button
                variant={viewMode === "today" ? "primary" : "outline"}
                size="sm"
                onClick={handleToday}
              >
                Hoje
              </Button>

              <Button
                variant={viewMode === "week" ? "primary" : "outline"}
                size="sm"
                onClick={handleThisWeek}
              >
                Semana
              </Button>
            </div>

            {/* Admin Only Buttons */}
            {isAdminUser && (
              <div className="ml-auto flex gap-2 md:ml-0">
                <IconActionButton
                  variant="delete"
                  onClick={async () => {
                    // ... same logic
                    if (!window.confirm("Tem certeza? Isso apagará TODOS os eventos desta semana."))
                      return;
                    setIsRefreshing(true);
                    try {
                      await fetch("/api/sync-calendar", { method: "DELETE" });
                      setRefreshMessage({ type: "success", text: "Limpo!" });
                      await refetch();
                    } catch {
                      setRefreshMessage({ type: "error", text: "Erro." });
                    } finally {
                      setIsRefreshing(false);
                      setTimeout(() => setRefreshMessage(null), 3000);
                    }
                  }}
                  disabled={isRefreshing}
                  title="Limpar"
                />

                <IconActionButton
                  variant="refresh"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className={isRefreshing ? "animate-spin text-blue-500" : ""}
                  title="Sincronizar"
                />

                <IconActionButton
                  variant="database"
                  onClick={async () => {
                    // ... same logic
                    if (!window.confirm("Sync anual?")) return;
                    setIsRefreshing(true);
                    setRefreshMessage({ type: "info", text: "Sincronizando..." });
                    try {
                      await fetch("/api/sync-history", { method: "POST" });
                      setRefreshMessage({ type: "success", text: "Feito!" });
                      await refetch();
                    } catch {
                      setRefreshMessage({ type: "error", text: "Erro" });
                    } finally {
                      setIsRefreshing(false);
                      setTimeout(() => setRefreshMessage(null), 5000);
                    }
                  }}
                  disabled={isRefreshing}
                  title="Histórico"
                />
              </div>
            )}
          </div>
        </div>

        {/* Refresh Message */}
        {refreshMessage && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              refreshMessage.type === "success"
                ? "bg-green-500/20 text-green-400"
                : refreshMessage.type === "error"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {refreshMessage.text}
          </div>
        )}

        {/* Filters - Mobile Collapsible / Desktop Always Visible */}
        <details className="group md:hidden">
          <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800">
            <span>Filtros (Impacto & Moedas)</span>
            <svg
              className="h-5 w-5 transition-transform group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <div className="mt-3 flex flex-col gap-4 border-t border-gray-700/50 pt-3">
            <FiltersContent
              IMPACT_OPTIONS={IMPACT_OPTIONS}
              filterImpact={filterImpact}
              setFilterImpact={setFilterImpact}
              filterCurrency={filterCurrency}
              toggleCurrency={toggleCurrency}
              setFilterCurrency={setFilterCurrency}
            />
          </div>
        </details>

        <div className="hidden md:flex md:flex-col md:gap-4">
          <FiltersContent
            IMPACT_OPTIONS={IMPACT_OPTIONS}
            filterImpact={filterImpact}
            setFilterImpact={setFilterImpact}
            filterCurrency={filterCurrency}
            toggleCurrency={toggleCurrency}
            setFilterCurrency={setFilterCurrency}
          />
        </div>
      </GlassCard>

      {/* Loading State */}
      {isLoading && (
        <GlassCard className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <RefreshIcon className="animate-spin" />
            <span>Carregando eventos...</span>
          </div>
        </GlassCard>
      )}

      {/* Error State */}
      {isError && (
        <GlassCard className="p-8 text-center text-red-400">
          ❌ Erro ao carregar eventos. Tente novamente.
        </GlassCard>
      )}

      {/* Empty State */}
      {!isLoading && !isError && Object.keys(eventsByDate).length === 0 && (
        <GlassCard className="p-8 text-center text-gray-400">
          <div className="space-y-2">
            <p>
              Nenhum evento encontrado{viewMode === "today" ? " para hoje" : " para esta semana"}.
            </p>
            <p className="text-sm">Clique no botão 🔄 para sincronizar com o Forex Factory.</p>
          </div>
        </GlassCard>
      )}

      {/* Events Grouped by Date */}
      {!isLoading && !isError && Object.keys(eventsByDate).length > 0 && (
        <div className="space-y-4">
          {Object.entries(eventsByDate)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, dayEvents]) => (
              <GlassCard key={date} padding="none" className="overflow-hidden">
                {/* Day Header */}
                <div
                  className={`border-b border-gray-700/50 px-4 py-2 ${
                    isToday(new Date(date + "T00:00:00")) ? "bg-cyan-900/30" : "bg-gray-800/80"
                  }`}
                >
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
                    {isToday(new Date(date + "T00:00:00")) && (
                      <span className="rounded bg-cyan-500 px-2 py-0.5 text-xs text-white">
                        HOJE
                      </span>
                    )}
                    {format(new Date(date + "T00:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })
                      .replace(/^\w/, (c) => c.toUpperCase())
                      .replace(/de (\w)/, (_, c) => `de ${c.toUpperCase()}`)}
                    <span className="text-xs text-gray-500">
                      ({dayEvents.length} {dayEvents.length === 1 ? "evento" : "eventos"})
                    </span>
                  </h3>
                </div>

                {/* Table Header */}
                <EventsTableHeader />

                {/* Events List */}
                <div>
                  {dayEvents.map((event, index) => (
                    <EventRow key={event.id} event={event} isEven={index % 2 === 1} />
                  ))}
                </div>
              </GlassCard>
            ))}
        </div>
      )}
    </div>
  );
}

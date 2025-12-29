"use client";

interface EventRowProps {
  event: {
    id: string;
    time: string;
    currency: string;
    impact: "high" | "medium" | "low" | "none";
    event_name: string;
    actual: string | null;
    forecast: string | null;
    previous: string | null;
  };
  isEven?: boolean;
}

/**
 * Parse numeric value from string for comparison (handles %, K, B, M, T suffixes)
 */
function parseNumericValue(value: string | null): number | null {
  if (!value) return null;

  // Remove % and trim
  const cleaned = value
    .replace("%", "")
    .replace(/[^\d.-]/g, "")
    .trim();
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
}

/**
 * Compare actual vs forecast to determine color
 * Returns: 'better' | 'worse' | 'neutral' | null
 */
function compareValues(
  actual: string | null,
  forecast: string | null
): "better" | "worse" | "neutral" | null {
  const actualNum = parseNumericValue(actual);
  const forecastNum = parseNumericValue(forecast);

  if (actualNum === null || forecastNum === null) return null;
  if (actualNum === forecastNum) return "neutral";

  // For most economic indicators, higher is better
  // Exception: unemployment, inflation sometimes (context dependent)
  return actualNum > forecastNum ? "better" : "worse";
}

/**
 * Table header component for the events list.
 */
/**
 * Table header component for the events list.
 */
export function EventsTableHeader() {
  return (
    <div className="sticky top-0 z-10 hidden items-center gap-0 border-b border-gray-700 bg-gray-800/80 px-4 py-2 text-xs font-semibold tracking-wider text-gray-400 uppercase md:flex">
      {/* Impact */}
      <div className="w-8 shrink-0 border-r border-gray-700 pr-2 text-center"></div>

      {/* Time */}
      <div className="w-20 shrink-0 border-r border-gray-700 px-2 text-center">Hora</div>

      {/* Currency */}
      <div className="w-16 shrink-0 border-r border-gray-700 px-2 text-center">Moeda</div>

      {/* Event Name */}
      <div className="min-w-0 flex-1 border-r border-gray-700 px-3">Evento</div>

      {/* Values */}
      <div className="w-20 shrink-0 border-r border-gray-700 px-2 text-center">Actual</div>
      <div className="w-20 shrink-0 border-r border-gray-700 px-2 text-center">Forecast</div>
      <div className="w-20 shrink-0 px-2 text-center">Previous</div>
    </div>
  );
}

/**
 * Individual event row component following Forex Factory style.
 * Displays time, currency, impact indicator, event name, and values.
 * Responsive: Stacked on mobile, Table-row on desktop.
 */
export function EventRow({ event, isEven = false }: EventRowProps) {
  // Impact color mapping
  const impactColors: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-orange-500",
    low: "bg-yellow-500",
    none: "bg-gray-400 border border-gray-300",
  };

  const impactLabels: Record<string, string> = {
    high: "Alto",
    medium: "Médio",
    low: "Baixo",
    none: "Sem Impacto",
  };

  // Compare actual vs forecast
  const comparison = compareValues(event.actual, event.forecast);
  const actualColor =
    comparison === "better"
      ? "text-green-400"
      : comparison === "worse"
        ? "text-red-400"
        : event.actual
          ? "text-gray-100"
          : "text-gray-600";

  return (
    <div
      className={`border-b border-gray-700/50 px-4 py-3 transition-colors hover:bg-cyan-500/10 md:flex md:items-center md:gap-0 md:py-2.5 ${
        isEven ? "bg-gray-800/30" : "bg-transparent"
      }`}
    >
      {/* --- MOBILE LAYOUT --- */}
      <div className="flex flex-col gap-2 md:hidden">
        {/* Top Row: Time | Currency | Impact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-gray-400">{event.time}</span>
            <div className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/assets/icons/flags/${event.currency.toLowerCase()}.svg`}
                alt={event.currency}
                className="h-3.5 w-3.5 rounded-full object-cover"
              />
              <span className="text-xs font-bold text-gray-300">{event.currency}</span>
            </div>
          </div>
          <div
            className={`h-2.5 w-2.5 rounded-full ${impactColors[event.impact]}`}
            title={`Impacto ${impactLabels[event.impact]}`}
          />
        </div>

        {/* Middle Row: Event Name */}
        <div className="text-sm font-medium text-gray-200">{event.event_name}</div>

        {/* Bottom Row: Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 border-t border-gray-700/50 pt-2 text-xs">
          <div className="flex flex-col">
            <span className="mb-0.5 text-[10px] text-gray-500 uppercase">Actual</span>
            <span className={`font-semibold ${actualColor}`}>{event.actual || "-"}</span>
          </div>
          <div className="flex flex-col">
            <span className="mb-0.5 text-[10px] text-gray-500 uppercase">Forecast</span>
            <span className="text-gray-400">{event.forecast || "-"}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="mb-0.5 text-[10px] text-gray-500 uppercase">Previous</span>
            <span className="text-gray-500">{event.previous || "-"}</span>
          </div>
        </div>
      </div>

      {/* --- DESKTOP LAYOUT (Table Row) --- */}
      <div className="hidden items-center gap-0 md:flex md:w-full">
        {/* Impact Indicator */}
        <div className="flex w-8 shrink-0 justify-center border-r border-gray-700/50 pr-2">
          <div
            className={`h-3 w-3 rounded-full ${impactColors[event.impact]}`}
            title={`Impacto ${impactLabels[event.impact]}`}
          />
        </div>

        {/* Time */}
        <div className="w-20 shrink-0 border-r border-gray-700/50 px-2 text-center">
          <span className="font-mono text-xs text-gray-400">{event.time}</span>
        </div>

        {/* Currency with flag */}
        <div className="w-16 shrink-0 border-r border-gray-700/50 px-2">
          <div className="flex items-center justify-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/assets/icons/flags/${event.currency.toLowerCase()}.svg`}
              alt={event.currency}
              className="h-4 w-4 rounded-full object-cover"
            />
            <span className="text-xs font-bold text-gray-300">{event.currency}</span>
          </div>
        </div>

        {/* Event Name */}
        <div className="min-w-0 flex-1 border-r border-gray-700/50 px-3">
          <span className="block truncate text-sm text-gray-100">{event.event_name}</span>
        </div>

        {/* Values with comparison coloring */}
        <div className="w-20 shrink-0 border-r border-gray-700/50 px-2 text-center">
          <span className={`text-xs font-medium ${actualColor}`}>{event.actual || "-"}</span>
        </div>

        <div className="w-20 shrink-0 border-r border-gray-700/50 px-2 text-center">
          <span className="text-xs font-medium text-gray-300">{event.forecast || "-"}</span>
        </div>

        <div className="w-20 shrink-0 px-2 text-center">
          <span className="text-xs font-medium text-gray-500">{event.previous || "-"}</span>
        </div>
      </div>
    </div>
  );
}

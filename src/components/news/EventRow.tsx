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
export function EventsTableHeader() {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-0 border-b border-gray-700 bg-gray-800/80 px-4 py-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
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
 * Displays time, currency, impact indicator, event name, and values with vertical dividers.
 */
export function EventRow({ event, isEven = false }: EventRowProps) {
  // Impact color mapping (Forex Factory style: red=high, orange=medium, yellow=low, white=none)
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
      className={`flex items-center gap-0 border-b border-gray-700/50 px-4 py-2.5 transition-colors hover:bg-cyan-500/10 ${
        isEven ? "bg-gray-800/30" : "bg-transparent"
      }`}
    >
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
  );
}

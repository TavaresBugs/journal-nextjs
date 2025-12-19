'use client'

interface EventRowProps {
  event: {
    id: string
    time: string
    currency: string
    impact: 'high' | 'medium' | 'low'
    event_name: string
    actual: string | null
    forecast: string | null
    previous: string | null
  }
  isEven?: boolean
}

/**
 * Parse numeric value from string for comparison (handles %, K, B, M, T suffixes)
 */
function parseNumericValue(value: string | null): number | null {
  if (!value) return null
  
  // Remove % and trim
  const cleaned = value.replace('%', '').replace(/[^\d.-]/g, '').trim()
  const num = parseFloat(cleaned)
  
  return isNaN(num) ? null : num
}

/**
 * Compare actual vs forecast to determine color
 * Returns: 'better' | 'worse' | 'neutral' | null
 */
function compareValues(actual: string | null, forecast: string | null): 'better' | 'worse' | 'neutral' | null {
  const actualNum = parseNumericValue(actual)
  const forecastNum = parseNumericValue(forecast)
  
  if (actualNum === null || forecastNum === null) return null
  if (actualNum === forecastNum) return 'neutral'
  
  // For most economic indicators, higher is better
  // Exception: unemployment, inflation sometimes (context dependent)
  return actualNum > forecastNum ? 'better' : 'worse'
}

/**
 * Table header component for the events list.
 */
export function EventsTableHeader() {
  return (
    <div className="flex items-center gap-0 px-4 py-2 bg-gray-800/80 border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 z-10">
      {/* Impact */}
      <div className="w-8 shrink-0 text-center border-r border-gray-700 pr-2">
        
      </div>
      
      {/* Time */}
      <div className="w-20 shrink-0 text-center border-r border-gray-700 px-2">
        Hora
      </div>
      
      {/* Currency */}
      <div className="w-16 shrink-0 text-center border-r border-gray-700 px-2">
        Moeda
      </div>
      
      {/* Event Name */}
      <div className="flex-1 min-w-0 border-r border-gray-700 px-3">
        Evento
      </div>
      
      {/* Values */}
      <div className="w-20 shrink-0 text-center border-r border-gray-700 px-2">
        Actual
      </div>
      <div className="w-20 shrink-0 text-center border-r border-gray-700 px-2">
        Forecast
      </div>
      <div className="w-20 shrink-0 text-center px-2">
        Previous
      </div>
    </div>
  )
}

/**
 * Individual event row component following Forex Factory style.
 * Displays time, currency, impact indicator, event name, and values with vertical dividers.
 */
export function EventRow({ event, isEven = false }: EventRowProps) {
  // Impact color mapping (Forex Factory style: red=high, orange=medium, yellow=low)
  const impactColors = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-yellow-500'
  }

  const impactLabels = {
    high: 'Alto',
    medium: 'Médio',
    low: 'Baixo'
  }

  // Compare actual vs forecast
  const comparison = compareValues(event.actual, event.forecast)
  const actualColor = comparison === 'better' 
    ? 'text-green-400' 
    : comparison === 'worse' 
      ? 'text-red-400' 
      : event.actual 
        ? 'text-gray-100'
        : 'text-gray-600'

  return (
    <div className={`flex items-center gap-0 px-4 py-2.5 hover:bg-cyan-500/10 transition-colors border-b border-gray-700/50 ${
      isEven ? 'bg-gray-800/30' : 'bg-transparent'
    }`}>
      {/* Impact Indicator */}
      <div className="w-8 shrink-0 flex justify-center border-r border-gray-700/50 pr-2">
        <div 
          className={`w-3 h-3 rounded-full ${impactColors[event.impact]}`}
          title={`Impacto ${impactLabels[event.impact]}`}
        />
      </div>

      {/* Time */}
      <div className="w-20 shrink-0 text-center border-r border-gray-700/50 px-2">
        <span className="text-xs text-gray-400 font-mono">
          {event.time}
        </span>
      </div>

      {/* Currency with flag */}
      <div className="w-16 shrink-0 border-r border-gray-700/50 px-2">
        <div className="flex items-center justify-center gap-1.5">
          <img 
            src={`/assets/icons/flags/${event.currency.toLowerCase()}.svg`} 
            alt={event.currency}
            className="w-4 h-4 rounded-full object-cover"
          />
          <span className="text-xs font-bold text-gray-300">
            {event.currency}
          </span>
        </div>
      </div>

      {/* Event Name */}
      <div className="flex-1 min-w-0 border-r border-gray-700/50 px-3">
        <span className="text-sm text-gray-100 truncate block">
          {event.event_name}
        </span>
      </div>

      {/* Values with comparison coloring */}
      <div className="w-20 shrink-0 text-center border-r border-gray-700/50 px-2">
        <span className={`text-xs font-medium ${actualColor}`}>
          {event.actual || '-'}
        </span>
      </div>
      
      <div className="w-20 shrink-0 text-center border-r border-gray-700/50 px-2">
        <span className="text-xs font-medium text-gray-300">
          {event.forecast || '-'}
        </span>
      </div>
      
      <div className="w-20 shrink-0 text-center px-2">
        <span className="text-xs font-medium text-gray-500">
          {event.previous || '-'}
        </span>
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { getEventsForWeek, getEventsByDate } from '@/lib/repositories/economicEvents.repository'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { IconActionButton } from '@/components/ui/IconActionButton'
import { WeekPickerCalendar } from '@/components/ui/WeekPicker'
import { EventRow, EventsTableHeader } from './EventRow'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Icons (inline SVGs)


const RefreshIcon = ({ className = '' }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 16h5v5"/>
  </svg>
)

type ImpactLevel = 'high' | 'medium' | 'low' | 'none'
type ViewMode = 'week' | 'today'

const IMPACT_OPTIONS: { value: ImpactLevel; label: string; emoji: string; bgColor: string; borderColor: string; shadowColor: string }[] = [
  { value: 'high', label: 'Alto', emoji: '🔴', bgColor: 'bg-red-500', borderColor: 'border-red-500', shadowColor: 'shadow-[0_0_10px_rgba(239,68,68,0.4)]' },
  { value: 'medium', label: 'Médio', emoji: '🟠', bgColor: 'bg-orange-500', borderColor: 'border-orange-500', shadowColor: 'shadow-[0_0_10px_rgba(249,115,22,0.4)]' },
  { value: 'low', label: 'Baixo', emoji: '🟡', bgColor: 'bg-yellow-500', borderColor: 'border-yellow-500', shadowColor: 'shadow-[0_0_10px_rgba(234,179,8,0.4)]' },
  { value: 'none', label: 'Sem Impacto', emoji: '⚪', bgColor: 'bg-gray-400', borderColor: 'border-gray-400', shadowColor: 'shadow-[0_0_10px_rgba(156,163,175,0.4)]' },
]

interface EconomicEvent {
  id: string
  date: string
  time: string
  currency: string
  impact: 'high' | 'medium' | 'low'
  event_name: string
  actual: string | null
  forecast: string | null
  previous: string | null
}

/**
 * Economic Calendar component with Forex Factory style UI.
 */
export function EconomicCalendar() {
  const [currentWeek, setCurrentWeek] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 0 })
  )
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [filterImpact, setFilterImpact] = useState<ImpactLevel[]>(['high', 'medium', 'low', 'none'])
  const [filterCurrency, setFilterCurrency] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [calendarCoords, setCalendarCoords] = useState<{ top: number; left: number } | null>(null)
  const dateButtonRef = useRef<HTMLButtonElement>(null)

  // Calculate position for portal dropdown
  useLayoutEffect(() => {
    if (isCalendarOpen && dateButtonRef.current) {
      const rect = dateButtonRef.current.getBoundingClientRect()
      // Use absolute positioning relative to document + scroll offset
      setCalendarCoords({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX
      })
    }
  }, [isCalendarOpen])

  // Query for fetching events
  const { data: events, isLoading, isError, refetch } = useQuery({
    queryKey: ['economic-events', format(currentWeek, 'yyyy-MM-dd'), viewMode],
    queryFn: () => viewMode === 'today' 
      ? getEventsByDate(new Date()) 
      : getEventsForWeek(currentWeek),
    staleTime: 1000 * 60 * 60,
  })

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    setRefreshMessage(null)
    
    try {
      const response = await fetch('/api/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 429) {
          setRefreshMessage({ type: 'info', text: data.error || 'Aguarde alguns minutos para atualizar novamente' })
        } else {
          setRefreshMessage({ type: 'error', text: data.error || 'Erro ao atualizar' })
        }
        return
      }
      
      setRefreshMessage({ type: 'success', text: `${data.synced} eventos atualizados!` })
      await refetch()
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      setRefreshMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' })
    } finally {
      setIsRefreshing(false)
      setTimeout(() => setRefreshMessage(null), 5000)
    }
  }

  // Filter events
  const filteredEvents = useMemo(() => {
    if (!events) return []
    
    let filtered = [...events] as EconomicEvent[]

    // Impact filter (if not all selected)
    if (filterImpact.length > 0 && filterImpact.length < 4) {
      filtered = filtered.filter(e => filterImpact.includes(e.impact as ImpactLevel))
    }

    if (filterCurrency.length > 0) {
      filtered = filtered.filter(e => filterCurrency.includes(e.currency))
    }

    return filtered
  }, [events, filterImpact, filterCurrency])

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, EconomicEvent[]> = {}
    
    filteredEvents.forEach(event => {
      if (!grouped[event.date]) {
        grouped[event.date] = []
      }
      grouped[event.date].push(event)
    })

    return grouped
  }, [filteredEvents])

  // Handlers
  const handlePrevWeek = () => {
    setViewMode('week')
    setCurrentWeek(prev => subWeeks(prev, 1))
  }
  const handleNextWeek = () => {
    setViewMode('week')
    setCurrentWeek(prev => addWeeks(prev, 1))
  }
  const handleToday = () => {
    setViewMode('today')
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 0 }))
  }
  const handleThisWeek = () => {
    setViewMode('week')
    setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 0 }))
  }

  const toggleCurrency = (currency: string) => {
    setFilterCurrency(prev =>
      prev.includes(currency)
        ? prev.filter(c => c !== currency)
        : [...prev, currency]
    )
  }

  const weekEnd = addDays(currentWeek, 6)

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <GlassCard className="p-4 overflow-visible">
        {/* Title + Navigation */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            📰 Calendário Econômico
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Previous Week */}
            <IconActionButton 
              variant="back"
              onClick={handlePrevWeek}
              title="Semana anterior"
            />
            
            {/* Date Range - Clickable to open calendar */}
            <div className="relative">
              <button
                ref={dateButtonRef}
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-cyan-500 transition-colors min-w-[220px] justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span className="text-sm font-medium text-gray-300">
                  {format(startOfWeek(currentWeek, { weekStartsOn: 0 }), 'dd MMM', { locale: ptBR })} - {format(endOfWeek(currentWeek, { weekStartsOn: 0 }), 'dd MMM', { locale: ptBR })}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              
              {isCalendarOpen && calendarCoords && typeof window !== 'undefined' && createPortal(
                <>
                  {/* Backdrop transparente para fechar ao clicar fora */}
                  <div 
                    className="fixed inset-0 z-[9998] bg-transparent" 
                    onClick={() => setIsCalendarOpen(false)}
                  />
                  <div 
                    style={{ 
                      position: 'absolute',
                      top: calendarCoords.top,
                      left: calendarCoords.left,
                      transform: 'translateX(-50%)',
                      zIndex: 9999
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <WeekPickerCalendar
                      selectedWeekStart={currentWeek}
                      onWeekSelect={(weekStart) => {
                        // Adjust to ensure we start on Sunday (WeekPicker might return Monday based on locale)
                        const sundayStart = startOfWeek(weekStart, { weekStartsOn: 0 })
                        setCurrentWeek(sundayStart)
                        setViewMode('week')
                        setIsCalendarOpen(false)
                      }}
                      onClose={() => setIsCalendarOpen(false)}
                    />
                  </div>
                </>,
                document.body
              )}
            </div>
            
            {/* Next Week */}
            <IconActionButton 
              variant="next"
              onClick={handleNextWeek}
              title="Próxima semana"
            />
            
            <Button 
              variant={viewMode === 'today' ? 'primary' : 'outline'}
              size="sm" 
              onClick={handleToday}
            >
              Hoje
            </Button>
            
            {/* Week Button */}
            <Button 
              variant={viewMode === 'week' ? 'primary' : 'outline'}
              size="sm" 
              onClick={handleThisWeek}
            >
              Semana
            </Button>
            
            {/* Clear Button (Admin) */}
            <IconActionButton
              variant="delete"
              onClick={async () => {
                if (!window.confirm('Tem certeza? Isso apagará TODOS os eventos desta semana.')) return
                
                setIsRefreshing(true)
                try {
                  const res = await fetch('/api/sync-calendar', { method: 'DELETE' })
                  // data variable was unused
                  await res.json() 
                  
                  if (res.ok) {
                    setRefreshMessage({ type: 'success', text: 'Calendário limpo com sucesso!' })
                    await refetch()
                  } else {
                    setRefreshMessage({ type: 'error', text: 'Erro ao limpar.' })
                  }
                } catch {
                  // error variable unused
                  setRefreshMessage({ type: 'error', text: 'Erro de conexão.' })
                } finally {
                  setIsRefreshing(false)
                  setTimeout(() => setRefreshMessage(null), 3000)
                }
              }}
              disabled={isRefreshing}
              title="Limpar Semana (Reset)"
            />

            <IconActionButton
              variant="refresh"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={isRefreshing ? 'animate-spin text-blue-500' : ''}
              title="Sincronizar com Forex Factory"
            />

            {/* History Sync Button */}
            <IconActionButton
              variant="database"
              onClick={async () => {
                if (!window.confirm('Isso vai sincronizar o ano inteiro (Jan-Dez). Pode levar ~1 minuto. Continuar?')) return
                
                setIsRefreshing(true)
                setRefreshMessage({ type: 'info', text: 'Sincronizando ano inteiro... Aguarde.' })
                
                try {
                  const res = await fetch('/api/sync-history', { method: 'POST' })
                  await res.json()
                  
                  if (res.ok) {
                    setRefreshMessage({ type: 'success', text: 'Histórico anual atualizado!' })
                    await refetch()
                  } else {
                    setRefreshMessage({ type: 'error', text: 'Erro no sync histórico.' })
                  }
                } catch {
                  setRefreshMessage({ type: 'error', text: 'Erro de conexão.' })
                } finally {
                  setIsRefreshing(false)
                  setTimeout(() => setRefreshMessage(null), 5000)
                }
              }}
              disabled={isRefreshing}
              title="Sincronizar Histórico (Ano Todo)"
            />
          </div>
        </div>

        {/* Refresh Message */}
        {refreshMessage && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${
            refreshMessage.type === 'success' ? 'bg-green-500/20 text-green-400' :
            refreshMessage.type === 'error' ? 'bg-red-500/20 text-red-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {refreshMessage.text}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4">
          {/* Impact Filter - Checkboxes */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <span className="text-sm text-gray-400">Impacto:</span>
            </div>
            
            {IMPACT_OPTIONS.map(option => {
              const isChecked = filterImpact.includes(option.value)
              return (
                <label 
                  key={option.value}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-all ${
                    isChecked ? 'bg-gray-800/50' : 'bg-transparent hover:bg-gray-800/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setFilterImpact(prev => 
                        prev.includes(option.value)
                          ? prev.filter(v => v !== option.value)
                          : [...prev, option.value]
                      )
                    }}
                    className="peer sr-only"
                  />
                  {/* Custom colored checkbox */}
                  <div
                    className={`relative flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all duration-200 ease-out ${
                      isChecked
                        ? `${option.bgColor} ${option.borderColor} ${option.shadowColor}`
                        : 'bg-gray-800/20 border-white/10 hover:border-gray-500'
                    }`}
                  >
                    <svg
                      className={`h-4 w-4 text-white transition-all duration-200 ${
                        isChecked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className={`text-sm transition-colors ${
                    isChecked ? 'text-white' : 'text-gray-400'
                  }`}>
                    {option.emoji} {option.label}
                  </span>
                </label>
              )
            })}
          </div>

          {/* Currency Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400">Moedas:</span>
            {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'CNY'].map(currency => (
              <button
                key={currency}
                onClick={() => toggleCurrency(currency)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all
                  ${filterCurrency.includes(currency)
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-lg scale-105'
                    : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600'
                  }
                `}
              >
                <img 
                  src={`/assets/icons/flags/${currency.toLowerCase()}.svg`} 
                  alt={currency}
                  className="w-5 h-5 rounded-full object-cover"
                />
                {currency}
              </button>
            ))}
            {filterCurrency.length > 0 && (
              <button
                onClick={() => setFilterCurrency([])}
                className="text-xs text-red-400 hover:text-red-300 underline ml-2"
              >
                Limpar
              </button>
            )}
          </div>
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
            <p>Nenhum evento encontrado{viewMode === 'today' ? ' para hoje' : ' para esta semana'}.</p>
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
                <div className={`px-4 py-2 border-b border-gray-700/50 ${
                  isToday(new Date(date + 'T00:00:00')) 
                    ? 'bg-cyan-900/30' 
                    : 'bg-gray-800/80'
                }`}>
                  <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                    {isToday(new Date(date + 'T00:00:00')) && (
                      <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs rounded">HOJE</span>
                    )}
                    {format(new Date(date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    <span className="text-xs text-gray-500">
                      ({dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'})
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
  )
}

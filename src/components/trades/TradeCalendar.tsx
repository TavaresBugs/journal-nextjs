'use client';

import { useState, useMemo } from 'react';
import type { Trade, JournalEntry } from '@/types';
import { groupTradesByDay, formatCurrency } from '@/lib/calculations';
import { useJournalStore } from '@/store/useJournalStore';
import dayjs from 'dayjs';

interface TradeCalendarProps {
    trades: Trade[];
    entries?: JournalEntry[];
    onDayClick?: (date: string, dayTrades: Trade[]) => void;
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

export function TradeCalendar({ trades, entries: propEntries, onDayClick }: TradeCalendarProps) {
    const [currentDate, setCurrentDate] = useState(dayjs());
    const { entries: storeEntries } = useJournalStore();
    const entries = propEntries || storeEntries;
    
    const currentMonth = currentDate.month();
    const currentYear = currentDate.year();
    
    // Get first day of month
    const firstDayOfMonth = dayjs().year(currentYear).month(currentMonth).date(1);
    
    // Get starting day (include previous month days to fill first week)
    const startingDayOfWeek = firstDayOfMonth.day(); // 0 = Sunday
    const startDate = firstDayOfMonth.subtract(startingDayOfWeek, 'day');
    
    // Generate 42 days (6 weeks) for calendar grid
    const calendarDays = [];
    let currentDay = startDate;
    
    for (let i = 0; i < 42; i++) {
        calendarDays.push(currentDay);
        currentDay = currentDay.add(1, 'day');
    }
    
    // Group trades by day
    const tradesByDay = groupTradesByDay(trades);
    
    // Pure function to calculate day stats (not a hook)
    const calculateDayStats = (dayTrades: Trade[]): DayStatsResult => {
        const totalPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const tradeCount = dayTrades.length;
        const wins = dayTrades.filter(t => t.outcome === 'win').length;
        const losses = dayTrades.filter(t => t.outcome === 'loss').length;
        const breakeven = dayTrades.filter(t => t.outcome === 'breakeven').length;
        
        let statusText = 'N/A';
        let statusColor = 'text-gray-400';
        let textClass = 'text-gray-400';
        let bgClass = 'bg-gray-800/20 border-gray-800 hover:border-gray-700';

        if (tradeCount > 0) {
            if (totalPnL > 0) {
                statusText = 'WIN';
                statusColor = 'text-green-500';
                textClass = 'text-green-400';
                bgClass = 'bg-green-900/10 border-green-500/30 hover:border-green-500/50';
            } else if (totalPnL < 0) {
                statusText = 'LOSS';
                statusColor = 'text-red-500';
                textClass = 'text-red-400';
                bgClass = 'bg-red-900/10 border-red-500/30 hover:border-red-500/50';
            } else {
                statusText = 'B/E';
                statusColor = 'text-gray-400';
                textClass = 'text-gray-400';
                bgClass = 'bg-gray-800/20 border-gray-800 hover:border-gray-700';
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
    const dayStatsMap = useMemo(() => {
        const statsMap: Record<string, DayStatsResult & { dayTrades: Trade[]; journalCount: number }> = {};
        
        // Calculate stats for days with trades
        Object.keys(tradesByDay).forEach(dateStr => {
            const dayTrades = tradesByDay[dateStr];
            const stats = calculateDayStats(dayTrades);
            const dayEntries = entries.filter(e => e.date === dateStr && !e.tradeId);
            
            statsMap[dateStr] = {
                ...stats,
                dayTrades,
                journalCount: dayEntries.length
            };
        });
        
        // Also add stats for days with only journal entries
        entries.forEach(entry => {
            if (!entry.tradeId && !statsMap[entry.date]) {
                statsMap[entry.date] = {
                    ...calculateDayStats([]),
                    dayTrades: [],
                    journalCount: 1
                };
            }
        });
        
        return statsMap;
    }, [tradesByDay, entries]);
    
    // Get stats for a specific day
    const getDayStats = (date: dayjs.Dayjs) => {
        const dateStr = date.format('YYYY-MM-DD');
        return dayStatsMap[dateStr] || {
            ...calculateDayStats([]),
            dayTrades: [],
            journalCount: 0
        };
    };
    
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const handlePrevMonth = () => {
        setCurrentDate(prev => prev.subtract(1, 'month'));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => prev.add(1, 'month'));
    };
    
    return (
        <div className="w-full">
            {/* Month/Year Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-100 capitalize">
                    {currentDate.format('MMMM YYYY')}
                </h3>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <button 
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                </div>
            </div>
            
            {/* Calendar Grid - Responsive: 3 cols on mobile, 4 on tablet, 7 on desktop */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {/* Week day headers - Only show on desktop */}
                {weekDays.map(day => (
                    <div 
                        key={day}
                        className="hidden lg:block text-center text-sm font-semibold text-gray-400 py-2"
                    >
                        {day}
                    </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((date, index) => {
                    const isCurrentMonth = date.month() === currentMonth;
                    const isToday = date.isSame(dayjs(), 'day');
                    const stats = getDayStats(date);
                    const hasTrades = stats.tradeCount > 0;
                    const hasJournal = stats.journalCount > 0;
                    
                    // Use styling from stats hook, with fallback for journal-only days
                    let bgClass = stats.bgClass;
                    
                    if (!hasTrades && hasJournal) {
                        // Style for days with ONLY journal entries but no trades
                        bgClass = 'bg-cyan-900/10 border-cyan-500/30 hover:border-cyan-500/50';
                    } else if (!hasTrades && !hasJournal && isCurrentMonth) {
                        bgClass = 'bg-gray-800/20 border-gray-800 hover:border-gray-700';
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => (hasTrades || hasJournal || isCurrentMonth) && onDayClick && onDayClick(date.format('YYYY-MM-DD'), stats.dayTrades)}
                            className={`
                                min-h-[120px] min-w-[100px] h-auto p-3 rounded-xl border transition-all relative flex flex-col items-center justify-between touch-manipulation
                                ${bgClass}
                                ${isToday ? 'ring-2 ring-cyan-500' : ''}
                                ${hasTrades || hasJournal || isCurrentMonth ? 'hover:border-cyan-500 cursor-pointer' : ''}
                                ${!isCurrentMonth ? 'opacity-30' : ''}
                            `}
                        >
                            {/* Day number */}
                            <div className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-400' : 'text-gray-600'}`}>
                                {date.date()}
                            </div>
                            
                            {/* Content */}
                            {hasTrades ? (
                                <div className="flex flex-col items-center gap-1 w-full my-auto">
                                    {/* Status (WIN/LOSS) */}
                                    <div className={`text-sm font-bold tracking-wider ${stats.statusColor}`}>
                                        {stats.statusText}
                                    </div>
                                    
                                    {/* P&L */}
                                    <div className={`text-xs font-medium ${stats.textClass}`}>
                                        {stats.totalPnL > 0 ? '+' : ''}
                                        {formatCurrency(stats.totalPnL)}
                                    </div>
                                    
                                    {/* Trade Count */}
                                    <div className="text-[10px] text-gray-500">
                                        {stats.tradeCount} {stats.tradeCount === 1 ? 'Trade' : 'Trades'}
                                    </div>

                                    {/* Journal Indicator */}
                                    {hasJournal && (
                                        <div className="text-[10px] text-cyan-400 font-medium mt-1">
                                            Diário ({stats.journalCount})
                                        </div>
                                    )}
                                </div>
                            ) : hasJournal ? (
                                /* Only Journal Entries */
                                <div className="flex flex-col items-center justify-center gap-1 w-full my-auto">
                                    <div className="text-cyan-400 font-bold text-sm">
                                        Diário
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                        {stats.journalCount} {stats.journalCount === 1 ? 'Entrada' : 'Entradas'}
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
        </div>
    );
}

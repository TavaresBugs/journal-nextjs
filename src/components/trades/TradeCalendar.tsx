'use client';

import { useState } from 'react';
import type { Trade } from '@/types';
import { groupTradesByDay, formatCurrency } from '@/lib/calculations';
import { useJournalStore } from '@/store/useJournalStore';
import dayjs from 'dayjs';

interface TradeCalendarProps {
    trades: Trade[];
    onDayClick?: (date: string, dayTrades: Trade[]) => void;
}

export function TradeCalendar({ trades, onDayClick }: TradeCalendarProps) {
    const [currentDate, setCurrentDate] = useState(dayjs());
    const { entries } = useJournalStore();
    
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
    
    // Calculate day stats
    const getDayStats = (date: dayjs.Dayjs) => {
        const dateStr = date.format('YYYY-MM-DD');
        const dayTrades = tradesByDay[dateStr] || [];
        
        const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
        const wins = dayTrades.filter(t => t.outcome === 'win').length;
        const losses = dayTrades.filter(t => t.outcome === 'loss').length;
        
        // Check for journal entries for this specific date
        // We only want to count STANDALONE entries (not linked to trades) for the "Diário (X)" indicator
        const dayEntries = entries.filter(e => e.date === dateStr && !e.tradeId);
        const journalCount = dayEntries.length;
        
        return { dayTrades, totalPnL, wins, losses, count: dayTrades.length, journalCount };
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
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-3">
                {/* Week day headers */}
                {weekDays.map(day => (
                    <div 
                        key={day}
                        className="text-center text-sm font-semibold text-gray-400 py-2"
                    >
                        {day}
                    </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((date, index) => {
                    const isCurrentMonth = date.month() === currentMonth;
                    const isToday = date.isSame(dayjs(), 'day');
                    const stats = getDayStats(date);
                    const hasTrades = stats.count > 0;
                    const hasJournal = stats.journalCount > 0;
                    
                    // Determine cell style based on PnL
                    let bgClass = 'bg-gray-900/30 border-gray-800';
                    let textClass = 'text-gray-500';
                    let statusText = '';
                    let statusColor = '';

                    if (hasTrades) {
                        if (stats.totalPnL > 0) {
                            bgClass = 'bg-green-900/20 border-green-500/30 hover:border-green-500/50';
                            textClass = 'text-green-400';
                            statusText = 'Win';
                            statusColor = 'text-green-400';
                        } else if (stats.totalPnL < 0) {
                            bgClass = 'bg-red-900/20 border-red-500/30 hover:border-red-500/50';
                            textClass = 'text-red-400';
                            statusText = 'Loss';
                            statusColor = 'text-red-400';
                        } else {
                            bgClass = 'bg-gray-800/50 border-gray-600/30 hover:border-gray-500/50';
                            textClass = 'text-gray-300';
                            statusText = 'BE';
                            statusColor = 'text-gray-400';
                        }
                    } else if (hasJournal) {
                        // Style for days with ONLY journal entries but no trades
                        bgClass = 'bg-cyan-900/10 border-cyan-500/30 hover:border-cyan-500/50';
                    } else if (isCurrentMonth) {
                        bgClass = 'bg-gray-800/20 border-gray-800 hover:border-gray-700';
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => (hasTrades || hasJournal || isCurrentMonth) && onDayClick && onDayClick(date.format('YYYY-MM-DD'), stats.dayTrades)}
                            className={`
                                aspect-square p-2 rounded-xl border transition-all relative flex flex-col items-center justify-between
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
                                    <div className={`text-sm font-bold tracking-wider ${statusColor}`}>
                                        {statusText}
                                    </div>
                                    
                                    {/* P&L */}
                                    <div className={`text-xs font-medium ${textClass}`}>
                                        {stats.totalPnL > 0 ? '+' : ''}
                                        {formatCurrency(stats.totalPnL)}
                                    </div>
                                    
                                    {/* Trade Count */}
                                    <div className="text-[10px] text-gray-500">
                                        {stats.count} {stats.count === 1 ? 'Trade' : 'Trades'}
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

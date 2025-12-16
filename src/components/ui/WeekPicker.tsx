'use client';

import React, { useState, useRef, useEffect } from 'react';
import { startOfWeek, endOfWeek, format, getWeek, getYear, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WEEKDAYS_PT = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export interface WeekPickerCalendarProps {
    /** Currently selected week start date */
    selectedWeekStart: Date;
    /** Callback when a week is selected */
    onWeekSelect: (weekStart: Date, weekEnd: Date) => void;
    /** Optional callback to close the picker */
    onClose?: () => void;
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
}

/**
 * Week picker calendar component.
 * Allows selecting a week from a calendar grid.
 */
export function WeekPickerCalendar({ selectedWeekStart, onWeekSelect, onClose }: WeekPickerCalendarProps) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(selectedWeekStart.getFullYear());
    const [viewMonth, setViewMonth] = useState(selectedWeekStart.getMonth());
    const [hoveredWeek, setHoveredWeek] = useState<Date | null>(null);

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayOfMonth = getFirstDayOfMonth(viewYear, viewMonth);
    const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);

    const goToPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const handleWeekClick = (date: Date) => {
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        onWeekSelect(weekStart, weekEnd);
        onClose?.();
    };

    const goToThisWeek = () => {
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        onWeekSelect(weekStart, weekEnd);
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
        onClose?.();
    };

    const isInSelectedWeek = (date: Date) => {
        return isSameWeek(date, selectedWeekStart, { weekStartsOn: 1 });
    };

    const isInHoveredWeek = (date: Date) => {
        if (!hoveredWeek) return false;
        return isSameWeek(date, hoveredWeek, { weekStartsOn: 1 });
    };

    const isToday = (date: Date) => {
        return (
            today.getDate() === date.getDate() &&
            today.getMonth() === date.getMonth() &&
            today.getFullYear() === date.getFullYear()
        );
    };

    // Build calendar grid - ALWAYS 42 cells (6 weeks) for consistent height
    const TOTAL_CALENDAR_CELLS = 42;
    const calendarDays: { date: Date; day: number; isCurrentMonth: boolean }[] = [];
    
    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const month = viewMonth === 0 ? 11 : viewMonth - 1;
        const year = viewMonth === 0 ? viewYear - 1 : viewYear;
        calendarDays.push({ date: new Date(year, month, day), day, isCurrentMonth: false });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push({ date: new Date(viewYear, viewMonth, day), day, isCurrentMonth: true });
    }
    
    // Next month leading days
    const remainingCells = TOTAL_CALENDAR_CELLS - calendarDays.length;
    for (let day = 1; day <= remainingCells; day++) {
        const month = viewMonth === 11 ? 0 : viewMonth + 1;
        const year = viewMonth === 11 ? viewYear + 1 : viewYear;
        calendarDays.push({ date: new Date(year, month, day), day, isCurrentMonth: false });
    }

    // Get week number for a date
    const getWeekNumber = (date: Date) => {
        return getWeek(date, { weekStartsOn: 1, locale: ptBR });
    };

    // Group days by week for row highlighting
    const weeks: { date: Date; day: number; isCurrentMonth: boolean }[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-2xl w-[360px]">
            {/* Header: Month/Year + Navigation */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-100 capitalize">
                    {MONTHS_PT[viewMonth]} {viewYear}
                </h2>
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={goToPrevMonth}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={goToNextMonth}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors focus:outline-none"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-8 mb-2">
                <div className="h-8 flex items-center justify-center text-xs font-semibold text-gray-500">
                    Sem
                </div>
                {WEEKDAYS_PT.map((day) => (
                    <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-500 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid - Row per week */}
            <div className="space-y-1">
                {weeks.map((week, weekIndex) => {
                    const weekDate = week[0].date;
                    const weekNum = getWeekNumber(weekDate);
                    const isSelected = isInSelectedWeek(weekDate);
                    const isHovered = isInHoveredWeek(weekDate);

                    return (
                        <div
                            key={weekIndex}
                            onClick={() => handleWeekClick(weekDate)}
                            onMouseEnter={() => setHoveredWeek(weekDate)}
                            onMouseLeave={() => setHoveredWeek(null)}
                            className={`
                                grid grid-cols-8 rounded-lg cursor-pointer transition-all
                                ${isSelected 
                                    ? 'bg-cyan-500/20 ring-1 ring-cyan-500/50' 
                                    : isHovered 
                                        ? 'bg-gray-700/50' 
                                        : 'hover:bg-gray-700/30'
                                }
                            `}
                        >
                            {/* Week Number */}
                            <div className={`
                                h-10 flex items-center justify-center text-sm font-bold rounded-l-lg
                                ${isSelected ? 'bg-cyan-500 text-gray-900' : 'text-cyan-400'}
                            `}>
                                {weekNum}
                            </div>
                            
                            {/* Days */}
                            {week.map((item, dayIndex) => (
                                <div
                                    key={dayIndex}
                                    className={`
                                        h-10 flex items-center justify-center text-sm font-medium
                                        ${!item.isCurrentMonth 
                                            ? 'text-gray-600' 
                                            : isSelected
                                                ? 'text-cyan-100'
                                                : isToday(item.date)
                                                    ? 'text-cyan-400 font-bold'
                                                    : 'text-gray-300'
                                        }
                                    `}
                                >
                                    {item.day}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="mt-4 flex justify-between items-center text-sm">
                <button
                    type="button"
                    onClick={() => onClose?.()}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                    Fechar
                </button>
                <button
                    type="button"
                    onClick={goToThisWeek}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                    Esta semana
                </button>
            </div>
        </div>
    );
}

export interface WeekPickerProps {
    /** Currently selected week in YYYY-Www format */
    selectedWeek: string;
    /** Callback when week changes, provides YYYY-Www format string */
    onWeekChange: (week: string) => void;
    /** Optional className for the trigger button */
    className?: string;
}

/**
 * Week picker input with dropdown calendar.
 * Shows a button displaying the selected week that opens a calendar on click.
 */
export function WeekPicker({ selectedWeek, onWeekChange, className = '' }: WeekPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse week string (e.g., "2024-W50") to get start date
    const parseWeekString = (weekStr: string): Date => {
        const [yearStr, weekPart] = weekStr.split('-W');
        const year = parseInt(yearStr, 10);
        const week = parseInt(weekPart, 10);
        
        // Get January 4th of the year (always in week 1)
        const jan4 = new Date(year, 0, 4);
        const jan4DayOfWeek = jan4.getDay() || 7;
        
        // Get first Monday of week 1
        const firstMonday = new Date(jan4);
        firstMonday.setDate(jan4.getDate() - jan4DayOfWeek + 1);
        
        // Add weeks to get target week
        const targetDate = new Date(firstMonday);
        targetDate.setDate(targetDate.getDate() + (week - 1) * 7);
        
        return targetDate;
    };

    // Format date to week string
    const formatWeekString = (date: Date): string => {
        const year = getYear(date);
        const week = getWeek(date, { weekStartsOn: 1, locale: ptBR });
        return `${year}-W${week.toString().padStart(2, '0')}`;
    };

    const selectedWeekStart = parseWeekString(selectedWeek);
    const selectedWeekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 });
    const weekNumber = getWeek(selectedWeekStart, { weekStartsOn: 1, locale: ptBR });

    const handleWeekSelect = (weekStart: Date, _weekEnd: Date) => {
        const weekString = formatWeekString(weekStart);
        onWeekChange(weekString);
        setIsOpen(false);
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            >
                <span className="font-medium">Semana {weekNumber}, {selectedWeekStart.getFullYear()}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </button>

            {/* Date Range Display */}
            <span className="ml-3 text-sm text-gray-400">
                {format(selectedWeekStart, 'dd/MM', { locale: ptBR })} - {format(selectedWeekEnd, 'dd/MM', { locale: ptBR })}
            </span>

            {/* Dropdown Calendar */}
            {isOpen && (
                <div className="absolute z-50 mt-2 left-0">
                    <WeekPickerCalendar
                        selectedWeekStart={selectedWeekStart}
                        onWeekSelect={handleWeekSelect}
                        onClose={() => setIsOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}

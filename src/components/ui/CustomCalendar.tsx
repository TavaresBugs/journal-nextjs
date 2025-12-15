'use client';

import React, { useState } from 'react';

const WEEKDAYS_PT = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export interface CalendarProps {
    selected?: Date;
    onSelect: (date: Date) => void;
    onClose?: () => void;
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

/**
 * Custom calendar component for date selection.
 * Displays a month view with navigation and day selection.
 */
export function CustomCalendar({ selected, onSelect, onClose }: CalendarProps) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

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

    const handleDayClick = (day: number) => {
        const newDate = new Date(viewYear, viewMonth, day);
        onSelect(newDate);
        onClose?.();
    };

    const isSelected = (day: number) => {
        if (!selected) return false;
        return (
            selected.getDate() === day &&
            selected.getMonth() === viewMonth &&
            selected.getFullYear() === viewYear
        );
    };

    const isToday = (day: number) => {
        return (
            today.getDate() === day &&
            today.getMonth() === viewMonth &&
            today.getFullYear() === viewYear
        );
    };

    // Build calendar grid - ALWAYS 42 cells (6 weeks) for consistent height
    const TOTAL_CALENDAR_CELLS = 42;
    const calendarDays: { day: number; isCurrentMonth: boolean; monthOffset: number }[] = [];
    
    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false, monthOffset: -1 });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push({ day, isCurrentMonth: true, monthOffset: 0 });
    }
    
    // Next month leading days
    const remainingCells = TOTAL_CALENDAR_CELLS - calendarDays.length;
    for (let day = 1; day <= remainingCells; day++) {
        calendarDays.push({ day, isCurrentMonth: false, monthOffset: 1 });
    }

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-2xl w-[320px]">
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
            <div className="grid grid-cols-7 mb-2">
                {WEEKDAYS_PT.map((day) => (
                    <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-500 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1">
                {calendarDays.map((item, index) => (
                    <button
                        key={index}
                        type="button"
                        disabled={!item.isCurrentMonth}
                        onClick={() => item.isCurrentMonth && handleDayClick(item.day)}
                        className={`
                            h-10 w-10 mx-auto flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none
                            ${!item.isCurrentMonth 
                                ? 'text-gray-600 cursor-default' 
                                : isSelected(item.day)
                                    ? 'bg-cyan-500 text-gray-900 font-bold'
                                    : isToday(item.day)
                                        ? 'ring-2 ring-cyan-500 text-gray-100'
                                        : 'text-gray-300 hover:bg-gray-700 cursor-pointer'
                            }
                        `}
                    >
                        {item.day}
                    </button>
                ))}
            </div>
        </div>
    );
}

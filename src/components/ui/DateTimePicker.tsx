'use client';

import React, { useState, useEffect, useRef } from 'react';

const WEEKDAYS_PT = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];
const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface CalendarProps {
    selected?: Date;
    onSelect: (date: Date) => void;
    onClose?: () => void;
}

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
    // Returns 0-6 (Sun-Sat), we want Mon-Sun (0-6)
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to 6, Monday=1 to 0, etc.
}

export function CustomCalendar({ selected, onSelect, onClose }: CalendarProps) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDayOfMonth = getFirstDayOfMonth(viewYear, viewMonth);
    
    // Previous month days to show
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

    // Build calendar grid
    const calendarDays: { day: number; isCurrentMonth: boolean }[] = [];
    
    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push({ day, isCurrentMonth: true });
    }
    
    // Next month leading days - only fill to complete the last week
    const totalCells = Math.ceil(calendarDays.length / 7) * 7;
    const remainingCells = totalCells - calendarDays.length;
    for (let day = 1; day <= remainingCells; day++) {
        calendarDays.push({ day, isCurrentMonth: false });
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
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={goToNextMonth}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"
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
                            h-10 w-10 mx-auto flex items-center justify-center rounded-lg text-sm font-medium transition-colors
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

// DatePickerInput wrapper
export function DatePickerInput({
    label,
    value,
    onChange,
    required = false,
    className = '',
    openDirection = 'top',
}: {
    label: string;
    value: string; // yyyy-MM-dd format
    onChange: (value: string) => void;
    required?: boolean;
    className?: string;
    openDirection?: 'top' | 'bottom';
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const dateValue = value ? new Date(value + 'T00:00:00') : undefined;
    
    const handleSelect = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
    };

    // Format display value in Brazilian format
    const formatDisplayDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
    
    const displayValue = dateValue ? formatDisplayDate(dateValue) : '';

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

    const calendarPosition = openDirection === 'bottom' 
        ? 'top-full mt-1' 
        : 'bottom-full mb-1';

    return (
        <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
            <label className="text-xs font-medium text-gray-400">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={displayValue}
                    onClick={() => setIsOpen(!isOpen)}
                    readOnly
                    placeholder="dd/mm/aaaa"
                    className="w-full pl-3 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 text-sm
                               focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                               placeholder-gray-500 cursor-pointer transition-all duration-200"
                />
                {/* Calendar Icon */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                </button>
                {isOpen && (
                    <div className={`absolute ${calendarPosition} left-1/2 -translate-x-1/2 z-50`}>
                        <CustomCalendar
                            selected={dateValue}
                            onSelect={handleSelect}
                            onClose={() => setIsOpen(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// iOS-style wheel picker for time (hours 0-23, minutes 0-59)
export function TimePickerInput({
    label,
    value,
    onChange,
    required = false,
    className = '',
}: {
    label: string;
    value: string; // HH:mm format
    onChange: (value: string) => void;
    required?: boolean;
    className?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hoursRef = useRef<HTMLDivElement>(null);
    const minutesRef = useRef<HTMLDivElement>(null);
    
    // Parse current value
    const [hours, minutes] = value ? value.split(':').map(Number) : [0, 0];

    const handleHourChange = (h: number) => {
        const newMinutes = minutes || 0;
        onChange(`${String(h).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`);
    };

    const handleMinuteChange = (m: number) => {
        const newHours = hours || 0;
        onChange(`${String(newHours).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    };

    // Scroll to selected value when picker opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (hoursRef.current) {
                    const selectedHour = hoursRef.current.querySelector(`[data-value="${hours}"]`);
                    selectedHour?.scrollIntoView({ block: 'center', behavior: 'instant' });
                }
                if (minutesRef.current) {
                    const selectedMinute = minutesRef.current.querySelector(`[data-value="${minutes}"]`);
                    selectedMinute?.scrollIntoView({ block: 'center', behavior: 'instant' });
                }
            }, 10);
        }
    }, [isOpen, hours, minutes]);

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
        <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
            <label className="text-xs font-medium text-gray-400">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
                <input
                    type="text"
                    value={value || ''}
                    onClick={() => setIsOpen(true)}
                    readOnly
                    placeholder="HH:mm"
                    className="w-full pl-3 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 text-sm
                               focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                               placeholder-gray-500 cursor-pointer"
                />
                {/* Clock Icon */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-cyan-400 transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </button>
                {isOpen && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 min-w-[200px]">
                        <div className="text-center text-gray-400 text-sm mb-3 font-medium">Selecione o horário</div>
                        
                        <div className="flex justify-center gap-2 relative">
                            {/* Selection indicator */}
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 bg-gray-700/50 rounded-lg pointer-events-none border-y border-gray-600" />
                            
                            {/* Hours Column */}
                            <div 
                                ref={hoursRef}
                                className="h-32 overflow-y-auto scrollbar-none scroll-smooth snap-y snap-mandatory"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                <div className="h-11" />
                                {Array.from({ length: 24 }, (_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        data-value={i}
                                        onClick={() => handleHourChange(i)}
                                        className={`w-14 h-10 flex items-center justify-center text-lg snap-center transition-all ${
                                            hours === i 
                                                ? 'text-cyan-400 font-bold scale-110' 
                                                : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                    >
                                        {String(i).padStart(2, '0')}
                                    </button>
                                ))}
                                <div className="h-11" />
                            </div>

                            {/* Separator */}
                            <div className="flex items-center text-2xl text-gray-400 font-bold">:</div>

                            {/* Minutes Column */}
                            <div 
                                ref={minutesRef}
                                className="h-32 overflow-y-auto scrollbar-none scroll-smooth snap-y snap-mandatory"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                <div className="h-11" />
                                {Array.from({ length: 60 }, (_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        data-value={i}
                                        onClick={() => handleMinuteChange(i)}
                                        className={`w-14 h-10 flex items-center justify-center text-lg snap-center transition-all ${
                                            minutes === i 
                                                ? 'text-cyan-400 font-bold scale-110' 
                                                : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                    >
                                        {String(i).padStart(2, '0')}
                                    </button>
                                ))}
                                <div className="h-11" />
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="mt-4 w-full py-2 text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
                        >
                            Confirmar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface TimePickerInputProps {
    label: string;
    value: string; // HH:mm format
    onChange: (value: string) => void;
    required?: boolean;
    className?: string;
    error?: string;
    onBlur?: () => void;
}

/**
 * Time picker input with iOS-style wheel picker and manual input support.
 * Accepts HH:mm, H:mm, HHmm formats for manual input.
 */
export function TimePickerInput({
    label,
    value,
    onChange,
    required = false,
    className = '',
    error,
    onBlur: externalOnBlur,
}: TimePickerInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [localInputValue, setLocalInputValue] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isInvalid, setIsInvalid] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const hoursRef = useRef<HTMLDivElement>(null);
    const minutesRef = useRef<HTMLDivElement>(null);
    
    // Parse current value
    const [hours, minutes] = value ? value.split(':').map(Number) : [0, 0];
    
    // Display value: use local state when editing, otherwise from props
    const displayValue = isEditing ? localInputValue : (value || '');

    /**
     * Parse time input string to hour and minute
     */
    const parseTimeInput = (text: string): { hour: number; minute: number } | null => {
        const cleanText = text.replace(/\s/g, '');
        
        // Try HH:mm or H:mm format
        const colonMatch = cleanText.match(/^(\d{1,2}):(\d{1,2})$/);
        if (colonMatch) {
            const hour = parseInt(colonMatch[1], 10);
            const minute = parseInt(colonMatch[2], 10);
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                return { hour, minute };
            }
            return null;
        }
        
        // Try HHmm or Hmm format
        if (/^\d{3,4}$/.test(cleanText)) {
            let hour: number, minute: number;
            if (cleanText.length === 4) {
                hour = parseInt(cleanText.substring(0, 2), 10);
                minute = parseInt(cleanText.substring(2, 4), 10);
            } else {
                hour = parseInt(cleanText.substring(0, 1), 10);
                minute = parseInt(cleanText.substring(1, 3), 10);
            }
            if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                return { hour, minute };
            }
        }
        
        return null;
    };
    
    /**
     * Format hour and minute to HH:mm string
     */
    const formatTime = (hour: number, minute: number): string => {
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    };

    const handleHourChange = (h: number) => {
        const newMinutes = minutes || 0;
        onChange(formatTime(h, newMinutes));
    };

    const handleMinuteChange = (m: number) => {
        const newHours = hours || 0;
        onChange(formatTime(newHours, m));
    };
    
    // Handle focus: enter editing mode
    const handleFocus = () => {
        setIsEditing(true);
        setLocalInputValue(value || '');
        setIsInvalid(false);
    };
    
    // Handle input change with auto-formatting
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value;
        
        // Remove non-digit and non-colon characters
        newValue = newValue.replace(/[^\d:]/g, '');
        
        // Auto-add colon after 2 digits
        if (newValue.length === 2 && !newValue.includes(':') && localInputValue.length < newValue.length) {
            newValue = newValue + ':';
        }
        
        // Limit to 5 characters (HH:mm)
        if (newValue.length > 5) {
            newValue = newValue.substring(0, 5);
        }
        
        setLocalInputValue(newValue);
        setIsInvalid(false);
    };
    
    // Handle blur: validate and apply
    const handleBlur = () => {
        setIsEditing(false);
        
        if (!localInputValue || localInputValue.trim() === '') {
            onChange('');
            setIsInvalid(false);
            externalOnBlur?.();
            return;
        }
        
        const parsed = parseTimeInput(localInputValue);
        if (parsed) {
            onChange(formatTime(parsed.hour, parsed.minute));
            setIsInvalid(false);
        } else {
            setIsInvalid(true);
        }
        
        externalOnBlur?.();
    };
    
    // Handle keyboard
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBlur();
            setIsOpen(false);
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setLocalInputValue(value || '');
            setIsInvalid(false);
            setIsOpen(false);
        }
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
                    value={displayValue}
                    onFocus={handleFocus}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="HH:mm"
                    maxLength={5}
                    className={`w-full pl-3 pr-10 py-2 bg-[#232b32] border rounded-lg text-gray-100 text-sm
                               focus:outline-none focus:ring-2 focus:border-transparent
                               placeholder-gray-500 transition-all duration-200
                               ${(isInvalid || error)
                                   ? 'border-red-500 focus:ring-red-500' 
                                   : 'border-gray-700 focus:ring-cyan-500'}`}
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
                                        className={`w-14 h-10 flex items-center justify-center text-lg snap-center transition-all focus:outline-none ${
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
                                        className={`w-14 h-10 flex items-center justify-center text-lg snap-center transition-all focus:outline-none ${
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
                            className="mt-4 w-full py-2 text-cyan-400 font-semibold hover:text-cyan-300 transition-colors focus:outline-none"
                        >
                            Confirmar
                        </button>
                    </div>
                )}
            </div>
            {(error || isInvalid) && (
                <span className="text-xs text-red-400">
                    {error || 'Horário inválido. Use o formato HH:mm'}
                </span>
            )}
        </div>
    );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { CustomCalendar } from "./CustomCalendar";

export interface DatePickerInputProps {
  label: string;
  value: string; // yyyy-MM-dd format
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  openDirection?: "top" | "bottom";
  error?: string;
  onBlur?: () => void;
}

/**
 * Date picker input with calendar popup and manual input support.
 * Accepts DD/MM/YYYY format for manual input and outputs yyyy-MM-dd.
 */
export function DatePickerInput({
  label,
  value,
  onChange,
  required = false,
  className = "",
  openDirection = "top",
  error,
  onBlur,
}: DatePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localInputValue, setLocalInputValue] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dateValue = value ? new Date(value + "T00:00:00") : undefined;

  // Format display value in Brazilian format
  const formatDisplayDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Derive display value: use local state when editing, otherwise from props
  const displayValue = isEditing ? localInputValue : dateValue ? formatDisplayDate(dateValue) : "";

  // Parse DD/MM/YYYY input to Date
  const parseDateInput = (text: string): Date | null => {
    const cleanText = text.replace(/\s/g, "");
    const match = cleanText.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (!match) return null;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    if (year < 1900 || year > 2100) return null;

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  };

  // Handle calendar selection
  const handleSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
  };

  // Handle input focus
  const handleFocus = () => {
    setIsEditing(true);
    setLocalInputValue(dateValue ? formatDisplayDate(dateValue) : "");
  };

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value;

    // Auto-add slashes
    if (text.length === 2 && !text.includes("/")) {
      text = text + "/";
    } else if (text.length === 5 && text.charAt(2) === "/" && !text.slice(3).includes("/")) {
      text = text + "/";
    }

    setLocalInputValue(text);
    setIsInvalid(false);
  };

  // Handle blur
  const handleBlur = () => {
    setIsEditing(false);

    if (!localInputValue) {
      setIsInvalid(false);
      return;
    }

    const parsedDate = parseDateInput(localInputValue);
    if (parsedDate) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
      const day = String(parsedDate.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
      setIsInvalid(false);
    } else {
      setIsInvalid(true);
    }

    onBlur?.();
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calendarPosition = openDirection === "bottom" ? "top-full mt-1" : "bottom-full mb-1";

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      <label className="text-xs font-medium text-gray-400">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onFocus={handleFocus}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="dd/mm/aaaa"
          maxLength={10}
          className={`h-12 w-full rounded-lg border bg-[#232b32] pr-10 pl-3 text-sm text-gray-100 placeholder-gray-500 transition-all duration-200 focus:border-transparent focus:ring-2 focus:outline-none ${
            isInvalid || error
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-700 focus:ring-cyan-500"
          }`}
        />
        {/* Calendar Icon */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-400 transition-colors hover:text-cyan-400"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
        {isOpen && (
          <div className={`absolute ${calendarPosition} left-1/2 z-50 -translate-x-1/2`}>
            <CustomCalendar
              selected={dateValue}
              onSelect={handleSelect}
              onClose={() => setIsOpen(false)}
            />
          </div>
        )}
      </div>
      {(error || isInvalid) && (
        <span className="text-xs text-red-400">
          {error || "Data inválida. Use o formato DD/MM/AAAA"}
        </span>
      )}
    </div>
  );
}

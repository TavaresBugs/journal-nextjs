import React, { useId } from "react";
import { cn } from "@/lib/utils/general";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

/**
 * Glass-style Select Component - Zorin Glass Design System
 *
 * Matches the glassmorphism aesthetic with transparent background
 * and green accent on focus.
 */
export function Select({
  label,
  error,
  options,
  placeholder,
  className = "",
  ...props
}: SelectProps) {
  const generatedId = useId();
  const id = props.id || generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-gray-400">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          // Glass base - Specific user requested color
          "w-full bg-[#232b32] px-3 py-2 backdrop-blur-sm",
          // Border
          "rounded-lg border",
          error ? "border-red-500" : "border-gray-700",
          // Text
          "text-sm text-gray-100",
          // Focus - Cyan focus to match DatePicker
          "focus:border-transparent focus:ring-2 focus:ring-cyan-500 focus:outline-none",
          // Transition
          "transition-all duration-200",
          // Cursor
          "cursor-pointer",
          // Arrow styling
          "appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2012%2012%22%3e%3cpath%20fill%3d%22%239ca3af%22%20d%3d%22M2%204l4%204%204-4%22%2f%3e%3c%2fsvg%3e')] bg-[right_0.75rem_center] bg-no-repeat",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

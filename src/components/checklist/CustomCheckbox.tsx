"use client";

import { useId } from "react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function CustomCheckbox({
  checked,
  onChange,
  label,
  id,
  disabled = false,
}: CustomCheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || `checkbox-${generatedId}`;

  return (
    <label
      htmlFor={checkboxId}
      className={`group flex items-center gap-3 ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      {/* Hidden native input for accessibility */}
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={disabled ? undefined : onChange}
        disabled={disabled}
        className="peer sr-only"
      />

      {/* Custom checkbox visual - Zorin Deep Glass Theme */}
      <div
        className={`relative flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all duration-200 ease-out ${
          checked
            ? "bg-zorin-accent border-zorin-accent shadow-[0_0_10px_rgba(0,200,83,0.4)]"
            : "bg-zorin-bg/20 group-hover:border-zorin-ice border-white/10"
        } peer-focus-visible:ring-zorin-accent peer-focus-visible:ring-offset-zorin-bg peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2`}
      >
        {/* Check icon with animation */}
        <svg
          className={`h-4 w-4 text-white transition-all duration-200 ${
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0"
          } `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Label text */}
      {label && (
        <span
          className={`text-sm transition-colors duration-200 ${checked ? "text-white" : "text-gray-300 group-hover:text-white"} `}
        >
          {label}
        </span>
      )}
    </label>
  );
}

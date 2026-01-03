"use client";

import React from "react";
import { Input } from "@/components/ui/Input";
import {
  HTF_OPTIONS,
  LTF_OPTIONS,
  MARKET_CONDITIONS,
  PD_ARRAY_OPTIONS,
  ENTRY_QUALITY_OPTIONS,
} from "@/constants/trading";

// Re-export for backward compatibility
export { HTF_OPTIONS, LTF_OPTIONS, MARKET_CONDITIONS, PD_ARRAY_OPTIONS, ENTRY_QUALITY_OPTIONS };

// ============================================
// SHARED TYPES
// ============================================

interface DatalistInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  warning?: string;
  className?: string;
}

// ============================================
// TIMEFRAME SELECT
// ============================================

interface TimeframeSelectProps extends DatalistInputProps {
  type: "htf" | "ltf";
}

/**
 * Timeframe selection input with HTF or LTF options.
 */
export function TimeframeSelect({
  type,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  className,
}: TimeframeSelectProps) {
  const options = type === "htf" ? HTF_OPTIONS : LTF_OPTIONS;
  const listId = `tf-${type}-list`;

  return (
    <div className={className}>
      <Input
        label={label}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder || (type === "htf" ? "H4" : "M15")}
        required={required}
        error={error}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}

// ============================================
// DIRECTION SELECT
// ============================================

type DirectionSelectProps = DatalistInputProps;

/**
 * Trade direction selection (Long/Short).
 */
export function DirectionSelect({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  className,
}: DirectionSelectProps) {
  return (
    <div className={className}>
      <Input
        label={label}
        list="direction-list"
        value={value}
        onChange={(e) => onChange(e.target.value as "Long" | "Short")}
        onBlur={onBlur}
        placeholder={placeholder || "Long/Short"}
        required={required}
        error={error}
        autoComplete="off"
      />
      <datalist id="direction-list">
        <option value="Long" />
        <option value="Short" />
      </datalist>
    </div>
  );
}

// ============================================
// MARKET CONDITION SELECT
// ============================================

type MarketConditionSelectProps = DatalistInputProps;

/**
 * Market condition selection input.
 */
export function MarketConditionSelect({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  className,
}: MarketConditionSelectProps) {
  return (
    <div className={className}>
      <Input
        label={label}
        list="market-conditions-list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder || "Tendência, Lateral..."}
        required={required}
        error={error}
        autoComplete="off"
      />
      <datalist id="market-conditions-list">
        {MARKET_CONDITIONS.map((cond) => (
          <option key={cond} value={cond} />
        ))}
      </datalist>
    </div>
  );
}

// ============================================
// PD ARRAY SELECT
// ============================================

interface PdArraySelectProps extends DatalistInputProps {
  icon?: string;
}

/**
 * PD Array selection input with icon support.
 */
export function PdArraySelect({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  className,
}: PdArraySelectProps) {
  const selectedOption = PD_ARRAY_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className || ""}`}>
      <Input
        label={label}
        list="pd-array-list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder || "FVG, OB..."}
        required={required}
        error={error}
        autoComplete="off"
        className={selectedOption ? "pl-8" : ""}
      />
      {selectedOption && (
        <div className="absolute top-[38px] left-2.5 -translate-y-1/2 text-sm">
          {selectedOption.label.split(" ")[0]}
        </div>
      )}
      <datalist id="pd-array-list">
        {PD_ARRAY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </datalist>
    </div>
  );
}

// ============================================
// ENTRY QUALITY SELECT
// ============================================

type EntryQualitySelectProps = DatalistInputProps;

/**
 * Entry quality evaluation input.
 */
export function EntryQualitySelect({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  error,
  className,
}: EntryQualitySelectProps) {
  return (
    <div className={className}>
      <Input
        label={label}
        list="entry-quality-list"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder || "🌟 Picture Perfect..."}
        required={required}
        error={error}
        autoComplete="off"
      />
      <datalist id="entry-quality-list">
        {ENTRY_QUALITY_OPTIONS.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}

// NOTE: AssetSelect was removed - use AssetCombobox from @/components/shared instead

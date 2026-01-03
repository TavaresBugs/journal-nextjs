"use client";

import React from "react";
import { FormSection, FormRow } from "@/components/ui";
import { DatePickerInput, TimePickerInput } from "@/components/ui/DateTimePicker";
import { getSessionEmoji, type TradingSession } from "@/lib/utils/trading";

interface TradeDateTimeSectionProps {
  // Values
  entryDate: string;
  entryTime: string;
  exitDate: string;
  exitTime: string;
  // Setters
  setEntryDate: (v: string) => void;
  setEntryTime: (v: string) => void;
  setExitDate: (v: string) => void;
  setExitTime: (v: string) => void;
  // Validation
  onFieldBlur: (
    field:
      | "type"
      | "entryPrice"
      | "exitPrice"
      | "stopLoss"
      | "takeProfit"
      | "lot"
      | "entryDate"
      | "entryTime"
      | "exitDate"
      | "exitTime"
      | "symbol"
  ) => void;
  getError: (field: string) => string | undefined;
  // Computed
  detectedSession: TradingSession;
  isTradeOpen: boolean;
  // Mode
  mode: "create" | "edit";
}

export const TradeDateTimeSection = React.memo(function TradeDateTimeSection({
  entryDate,
  entryTime,
  exitDate,
  exitTime,
  setEntryDate,
  setEntryTime,
  setExitDate,
  setExitTime,
  onFieldBlur,
  getError,
  detectedSession,
  isTradeOpen,
  mode,
}: TradeDateTimeSectionProps) {
  return (
    <FormSection icon="📅" title="Data e Hora">
      <FormRow cols={2}>
        <DatePickerInput
          label="Data Entrada"
          value={entryDate}
          onChange={setEntryDate}
          onBlur={() => onFieldBlur("entryDate")}
          error={getError("entryDate")}
          required
        />
        <TimePickerInput
          label="Hora Entrada"
          value={entryTime}
          onChange={setEntryTime}
          onBlur={() => onFieldBlur("entryTime")}
          error={getError("entryTime")}
          required
        />
      </FormRow>

      {/* Session Badge */}
      {entryTime && (
        <div
          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium ${
            detectedSession === "London-NY Overlap"
              ? "border border-orange-500/30 bg-orange-500/20 text-orange-300"
              : detectedSession === "New York" || detectedSession === "London"
                ? "border border-cyan-500/30 bg-cyan-500/20 text-cyan-300"
                : "border border-gray-600 bg-gray-700/50 text-gray-400"
          }`}
        >
          {getSessionEmoji(detectedSession)} {detectedSession}
        </div>
      )}

      {/* Exit DateTime */}
      {(mode === "edit" || !isTradeOpen) && (
        <FormRow cols={2}>
          <DatePickerInput
            label="Data Saída"
            value={exitDate}
            onChange={setExitDate}
            onBlur={() => onFieldBlur("exitDate")}
            error={getError("exitDate")}
            required={!isTradeOpen}
          />
          <TimePickerInput
            label="Hora Saída"
            value={exitTime}
            onChange={setExitTime}
            onBlur={() => onFieldBlur("exitTime")}
            error={getError("exitTime")}
            required={!isTradeOpen}
          />
        </FormRow>
      )}
    </FormSection>
  );
});

"use client";

import React from "react";
import {
  Input,
  FormSection,
  FormRow,
  FormGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { AssetCombobox } from "@/components/shared/AssetCombobox";
import { SelectValueWithIcon, RiskRewardCards, TradeResultBadge } from "../shared";

interface TradeFinancialDataSectionProps {
  // Values
  symbol: string;
  lot: string;
  type: "Long" | "Short" | "";
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  exitPrice: string;
  commission: string;
  swap: string;
  // Setters
  setSymbol: (v: string) => void;
  setLot: (v: string) => void;
  setType: (v: "Long" | "Short" | "") => void;
  setEntryPrice: (v: string) => void;
  setStopLoss: (v: string) => void;
  setTakeProfit: (v: string) => void;
  setExitPrice: (v: string) => void;
  setCommission: (v: string) => void;
  setSwap: (v: string) => void;
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
  getWarning: (field: string) => string | undefined;
  // Computed
  isTradeOpen: boolean;
  estimates: { risk: number; reward: number };
  rMultiplePreview: number | null;
  // Mode
  mode: "create" | "edit";
}

export const TradeFinancialDataSection = React.memo(function TradeFinancialDataSection({
  symbol,
  lot,
  type,
  entryPrice,
  stopLoss,
  takeProfit,
  exitPrice,
  commission,
  swap,
  setSymbol,
  setLot,
  setType,
  setEntryPrice,
  setStopLoss,
  setTakeProfit,
  setExitPrice,
  setCommission,
  setSwap,
  onFieldBlur,
  getError,
  getWarning,
  isTradeOpen,
  estimates,
  rMultiplePreview,
  mode,
}: TradeFinancialDataSectionProps) {
  return (
    <FormSection icon="💵" title="Dados Financeiros">
      {/* Ativo, Lote, Direção */}
      <FormRow cols={3}>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">
            Ativo <span className="text-red-500">*</span>
          </label>
          <AssetCombobox value={symbol} onChange={setSymbol} placeholder="Buscar ativo..." />
          {getError("symbol") && <p className="mt-1 text-xs text-red-400">{getError("symbol")}</p>}
        </div>
        <Input
          label="Lote"
          type="number"
          step="0.01"
          value={lot}
          onChange={(e) => setLot(e.target.value)}
          onBlur={() => onFieldBlur("lot")}
          placeholder="1.0"
          required
          error={getError("lot")}
          autoComplete="off"
        />
        {/* Direção */}
        <FormGroup label="Direção" required>
          <Select value={type} onValueChange={(v) => setType(v as "Long" | "Short")}>
            <SelectTrigger className="flex h-12 items-center gap-2.5 border-[#333b44] bg-[#232b32] text-white hover:bg-[#2a333a]">
              {type ? (
                <SelectValueWithIcon icon={type === "Long" ? "📈" : "📉"} label={type} />
              ) : (
                <SelectValue placeholder="Long/Short" />
              )}
            </SelectTrigger>
            <SelectContent className="border-[#333b44] bg-[#21292e]">
              <SelectItem
                value="Long"
                className="flex cursor-pointer items-center gap-2.5 py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
              >
                <span className="shrink-0 text-xl">📈</span>
                <span>Long</span>
              </SelectItem>
              <SelectItem
                value="Short"
                className="flex cursor-pointer items-center gap-2.5 py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
              >
                <span className="shrink-0 text-xl">📉</span>
                <span>Short</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </FormGroup>
      </FormRow>

      {/* Entry, SL, TP */}
      <FormRow cols={3}>
        <Input
          label="Preço Entrada"
          type="number"
          step="0.00001"
          value={entryPrice}
          onChange={(e) => setEntryPrice(e.target.value)}
          onBlur={() => onFieldBlur("entryPrice")}
          required
          error={getError("entryPrice")}
          autoComplete="off"
        />
        <Input
          label="Stop Loss"
          type="number"
          step="0.00001"
          value={stopLoss}
          onChange={(e) => setStopLoss(e.target.value)}
          onBlur={() => onFieldBlur("stopLoss")}
          error={getError("stopLoss")}
          warning={getWarning("stopLoss")}
          autoComplete="off"
        />
        <Input
          label="Take Profit"
          type="number"
          step="0.00001"
          value={takeProfit}
          onChange={(e) => setTakeProfit(e.target.value)}
          onBlur={() => onFieldBlur("takeProfit")}
          error={getError("takeProfit")}
          warning={getWarning("takeProfit")}
          autoComplete="off"
        />
      </FormRow>

      {/* Exit Price */}
      {(mode === "edit" || !isTradeOpen) && (
        <Input
          label="Preço Saída"
          type="number"
          step="0.00001"
          value={exitPrice}
          onChange={(e) => setExitPrice(e.target.value)}
          onBlur={() => onFieldBlur("exitPrice")}
          error={getError("exitPrice")}
          required={!isTradeOpen}
          autoComplete="off"
        />
      )}

      {/* Costs */}
      <FormRow cols={2}>
        <Input
          label="Corretagem ($)"
          type="number"
          step="0.01"
          min="0"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          placeholder="0.00"
          autoComplete="off"
        />
        <Input
          label="Swap ($)"
          type="number"
          step="0.01"
          value={swap}
          onChange={(e) => setSwap(e.target.value)}
          placeholder="-1.50"
          autoComplete="off"
        />
      </FormRow>

      {/* Estimates - Risk/Return Cards */}
      <RiskRewardCards risk={estimates.risk} reward={estimates.reward} />

      {/* Result Badge - Only show when trade is closed and we have all required data */}
      {!isTradeOpen && entryPrice && exitPrice && type && (
        <TradeResultBadge
          entryPrice={entryPrice}
          exitPrice={exitPrice}
          type={type}
          lot={lot}
          symbol={symbol}
          commission={commission}
          swap={swap}
          rMultiplePreview={rMultiplePreview}
        />
      )}
    </FormSection>
  );
});

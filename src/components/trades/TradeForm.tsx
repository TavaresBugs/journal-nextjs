"use client";

import {
  Input,
  Button,
  FormSection,
  FormRow,
  FormGroup,
  SegmentedToggle,
  ModalFooterActions,
} from "@/components/ui";
import { DatePickerInput, TimePickerInput } from "@/components/ui/DateTimePicker";
import type { Trade } from "@/types";
import { DEFAULT_ASSETS } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { useToast } from "@/providers/ToastProvider";
import { getSessionEmoji, formatRMultiple, getRMultipleColor } from "@/lib/timeframeUtils";

// Import hooks
import {
  useTradeForm,
  useTradeSubmit,
  useTradeValidation,
  type TradeValidationInput,
} from "./hooks";

// Import domain selects
import {
  MARKET_CONDITIONS,
  PD_ARRAY_OPTIONS,
  ENTRY_QUALITY_OPTIONS,
  HTF_OPTIONS,
  LTF_OPTIONS,
} from "./DomainSelects";

// AssetCombobox
import { AssetCombobox } from "@/components/shared/AssetCombobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectCustom";
import {
  getStrategyIcon,
  getStrategyLabel,
  getPDArrayIcon,
  getPDArrayLabel,
} from "@/lib/tradeHelpers";

// Helper component for Select Value with Icon
interface SelectValueWithIconProps {
  value: string;
  icon: string;
  label: string;
  placeholder?: string;
}

function SelectValueWithIcon({ value, icon, label, placeholder }: SelectValueWithIconProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex-shrink-0 text-lg">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

// Badge colors for confluence tags
const TAG_COLORS = [
  { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-500/30" },
  { bg: "bg-cyan-500/20", text: "text-cyan-300", border: "border-cyan-500/30" },
  { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500/30" },
  { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-500/30" },
  { bg: "bg-pink-500/20", text: "text-pink-300", border: "border-pink-500/30" },
  { bg: "bg-indigo-500/20", text: "text-indigo-300", border: "border-indigo-500/30" },
];

const getTagColor = (index: number) => TAG_COLORS[index % TAG_COLORS.length];

interface TradeFormProps {
  accountId: string;
  onSubmit: (trade: Omit<Trade, "id" | "createdAt" | "updatedAt">) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<Trade>;
  mode?: "create" | "edit";
}

export function TradeForm({
  accountId,
  onSubmit,
  onCancel,
  initialData,
  mode = "create",
}: TradeFormProps) {
  const { strategies, setups } = useSettingsStore();
  const { playbooks } = usePlaybookStore();
  const { showToast } = useToast();

  // Use extracted hooks for state and logic
  const { state, setters, computed, resetForm } = useTradeForm(initialData);
  const { isSaving, handleSubmit: submitHandler } = useTradeSubmit({
    accountId,
    mode,
    playbooks,
    onSubmit,
    onCancel,
    onSuccess: resetForm,
  });

  const {
    tfAnalise,
    tfEntrada,
    tagsList,
    tagInput,
    strategy,
    setup,
    entryQuality,
    marketConditionV2,
    pdArray,
    symbol,
    type,
    entryPrice,
    stopLoss,
    takeProfit,
    exitPrice,
    lot,
    commission,
    swap,
    entryDate,
    entryTime,
    exitDate,
    exitTime,
  } = state;

  const {
    setTfAnalise,
    setTfEntrada,
    setTagsList,
    setTagInput,
    setStrategy,
    setSetup,
    setEntryQuality,
    setMarketConditionV2,
    setPdArray,
    setSymbol,
    setType,
    setEntryPrice,
    setStopLoss,
    setTakeProfit,
    setExitPrice,
    setLot,
    setCommission,
    setSwap,
    setEntryDate,
    setEntryTime,
    setExitDate,
    setExitTime,
  } = setters;

  const { isTradeOpen, detectedSession, alignmentResult, rMultiplePreview, estimates } = computed;

  // Validation hook
  const { validateForm, validateSingleField, getError, getWarning, clearAllErrors } =
    useTradeValidation();

  // Build validation input from form state
  const buildValidationInput = (): TradeValidationInput => ({
    type: state.type,
    entryPrice: state.entryPrice,
    exitPrice: state.exitPrice,
    stopLoss: state.stopLoss,
    takeProfit: state.takeProfit,
    lot: state.lot,
    entryDate: state.entryDate,
    entryTime: state.entryTime,
    exitDate: state.exitDate,
    exitTime: state.exitTime,
    symbol: state.symbol,
  });

  // Validate single field on blur
  const handleFieldBlur = (field: keyof TradeValidationInput) => {
    validateSingleField(field, state[field] as string, buildValidationInput());
  };

  // Wrap form submit with validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearAllErrors();
    const result = validateForm(buildValidationInput());
    if (!result.isValid) {
      const errorCount = result.errors.length;
      showToast(
        `Corrija ${errorCount} erro${errorCount !== 1 ? "s" : ""} antes de salvar`,
        "error"
      );
      return;
    }
    submitHandler(e, state, computed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Toggle: Em Aberto / Finalizado */}
      {mode === "create" && (
        <div className="mb-2">
          <SegmentedToggle
            options={[
              {
                value: "open",
                label: "🟡 Em Aberto",
                activeTextColor: "text-amber-400",
                activeBgColor: "bg-linear-to-r from-amber-500/20 to-amber-400/10",
                activeShadowColor: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
              },
              {
                value: "closed",
                label: "🟢 Finalizado",
                activeTextColor: "text-green-400",
                activeBgColor: "bg-linear-to-r from-green-500/20 to-green-400/10",
                activeShadowColor: "shadow-[0_0_15px_rgba(34,197,94,0.15)]",
              },
            ]}
            value={isTradeOpen ? "open" : "closed"}
            onChange={(val) => {
              if (val === "open") {
                setExitPrice("");
              } else {
                setExitPrice(entryPrice || "0");
              }
            }}
            className="w-full"
          />
        </div>
      )}

      {/* ===== BLOCO 1: CONDIÇÕES DE MERCADO ===== */}
      <FormSection icon="📊" title="Condições de Mercado">
        {/* Market Condition + Strategy + PD Array */}
        <FormRow cols={3}>
          {/* Condição */}
          <FormGroup label="Condição">
            <Select value={marketConditionV2} onValueChange={setMarketConditionV2}>
              <SelectTrigger className="flex h-12 items-center gap-2.5 border-[#333b44] bg-[#232b32] text-white hover:bg-[#2a333a]">
                <SelectValue placeholder="Tendência, Lateral..." />
              </SelectTrigger>
              <SelectContent className="border-[#333b44] bg-[#232b32]">
                {MARKET_CONDITIONS.map((cond) => (
                  <SelectItem
                    key={cond}
                    value={cond}
                    className="flex cursor-pointer items-center gap-2.5 py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
                  >
                    <span className="text-lg">{cond.split(" ")[0]}</span>
                    <span>{cond.split(" ").slice(1).join(" ")}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* Estratégia */}
          <FormGroup label="Estratégia">
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger className="flex h-12 items-center gap-2.5 border-[#333b44] bg-[#232b32] text-white hover:bg-[#2a333a]">
                {strategy ? (
                  <SelectValueWithIcon
                    value={strategy}
                    icon={
                      playbooks.find((p) => p.name === strategy)?.icon || getStrategyIcon(strategy)
                    }
                    label={strategy}
                  />
                ) : (
                  <SelectValue placeholder="Selecione uma estratégia" />
                )}
              </SelectTrigger>
              <SelectContent className="border-[#333b44] bg-[#232b32]">
                {playbooks
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((pb) => {
                    const strat = pb.name;
                    return (
                      <SelectItem
                        key={strat}
                        value={strat}
                        className="flex cursor-pointer items-center gap-2.5 py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
                      >
                        <span className="flex-shrink-0 text-xl">
                          {pb?.icon || getStrategyIcon(strat)}
                        </span>
                        <span>{getStrategyLabel(strat)}</span>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* PD Array */}
          <FormGroup label="PD Array">
            <Select value={pdArray} onValueChange={setPdArray}>
              <SelectTrigger className="flex h-12 items-center gap-2.5 border-[#333b44] bg-[#232b32] text-white hover:bg-[#2a333a]">
                {pdArray ? (
                  <SelectValueWithIcon
                    value={pdArray}
                    icon={getPDArrayIcon(pdArray)}
                    label={
                      PD_ARRAY_OPTIONS.find((o) => o.value === pdArray)
                        ?.label.split(" ")
                        .slice(1)
                        .join(" ") || getPDArrayLabel(pdArray)
                    }
                  />
                ) : (
                  <SelectValue placeholder="Selecione PD Array" />
                )}
              </SelectTrigger>
              <SelectContent className="border-[#333b44] bg-[#232b32]">
                {PD_ARRAY_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="flex cursor-pointer items-center gap-2.5 py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
                  >
                    <span className="flex-shrink-0 text-xl">{getPDArrayIcon(opt.value)}</span>
                    <span>{opt.label.split(" ").slice(1).join(" ")}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormGroup>
        </FormRow>

        {/* Timeframes + Setup */}
        {/* Timeframes + Setup */}
        <FormRow cols={3}>
          {/* TF Análise */}
          <FormGroup label="TF Análise">
            <Select value={tfAnalise} onValueChange={setTfAnalise}>
              <SelectTrigger className="flex h-12 items-center justify-between border-[#333b44] bg-[#232b32] text-white hover:bg-[#2a333a]">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 border-[#333b44] bg-[#232b32]">
                {HTF_OPTIONS.map((tf) => (
                  <SelectItem
                    key={tf}
                    value={tf}
                    className="cursor-pointer py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
                  >
                    <span className="pl-1">{tf}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* TF Entrada */}
          <FormGroup label="TF Entrada">
            <Select value={tfEntrada} onValueChange={setTfEntrada}>
              <SelectTrigger className="flex h-12 items-center justify-between border-[#333b44] bg-[#232b32] text-white hover:bg-[#2a333a]">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="max-h-80 overflow-y-auto border-[#333b44] bg-[#232b32]">
                {LTF_OPTIONS.map((tf) => (
                  <SelectItem
                    key={tf}
                    value={tf}
                    className="cursor-pointer py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
                  >
                    <span className="pl-1">{tf}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormGroup>

          {/* Setup */}
          <FormGroup label="Setup">
            <Select value={setup} onValueChange={setSetup}>
              <SelectTrigger className="flex h-12 items-center justify-between border-[#333b44] bg-[#232b32] text-white hover:bg-[#2a333a]">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 border-[#333b44] bg-[#232b32]">
                {setups.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="cursor-pointer py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
                  >
                    <span className="pl-1">{s}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormGroup>
        </FormRow>

        {/* Alignment Badge */}
        {tfAnalise &&
          tfEntrada &&
          (() => {
            const alignment = alignmentResult;
            return (
              <div
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium ${
                  alignment.isWarning
                    ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
                    : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {alignment.isWarning ? "⚠️ " : "✓ "}
                {alignment.label}
              </div>
            );
          })()}

        {/* Confluências + Avaliação */}
        <FormRow cols={2}>
          <FormGroup label="Confluências">
            <div
              className="flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-lg border border-gray-700 bg-[#232b32] px-3 py-2 transition-all duration-200 focus-within:border-transparent focus-within:ring-2 focus-within:ring-cyan-500"
              onClick={() => document.getElementById("tags-input")?.focus()}
            >
              {tagsList.map((tag, index) => {
                const color = getTagColor(index);
                return (
                  <span
                    key={index}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${color.bg} ${color.text} border ${color.border} flex items-center gap-1`}
                  >
                    🏷️ {tag}
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTagsList((prev) => prev.filter((_, i) => i !== index));
                      }}
                      className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/20 hover:text-white"
                      title="Remover tag"
                    >
                      ×
                    </div>
                  </span>
                );
              })}
              <input
                id="tags-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    const newTag = tagInput.trim();
                    if (newTag && !tagsList.includes(newTag)) {
                      setTagsList((prev) => [...prev, newTag]);
                      setTagInput("");
                    }
                  } else if (e.key === "Backspace" && !tagInput && tagsList.length > 0) {
                    setTagsList((prev) => prev.slice(0, -1));
                  }
                }}
                placeholder={tagsList.length === 0 ? "FVG Breaker OB" : ""}
                className="min-w-[60px] flex-1 border-none bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
              />
            </div>
          </FormGroup>

          {/* Avaliação (Entry Quality) */}
          <FormGroup label="Avaliação">
            <Select value={entryQuality} onValueChange={setEntryQuality}>
              <SelectTrigger className="flex h-12 items-center justify-between border-[#333b44] bg-[#232b32] text-white hover:bg-[#2a333a]">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="max-h-60 border-[#333b44] bg-[#232b32]">
                {ENTRY_QUALITY_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt}
                    value={opt}
                    className="cursor-pointer py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
                  >
                    <span className="pl-1">{opt}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormGroup>
        </FormRow>
      </FormSection>

      {/* ===== BLOCO 2: FINANCEIRO ===== */}
      <FormSection icon="💵" title="Dados Financeiros">
        {/* Ativo, Lote, Direção */}
        <FormRow cols={3}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Ativo <span className="text-red-500">*</span>
            </label>
            <AssetCombobox value={symbol} onChange={setSymbol} placeholder="Buscar ativo..." />
            {getError("symbol") && (
              <p className="mt-1 text-xs text-red-400">{getError("symbol")}</p>
            )}
          </div>
          <Input
            label="Lote"
            type="number"
            step="0.01"
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            onBlur={() => handleFieldBlur("lot")}
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
                  <SelectValueWithIcon
                    value={type}
                    icon={type === "Long" ? "📈" : "📉"}
                    label={type}
                  />
                ) : (
                  <SelectValue placeholder="Long/Short" />
                )}
              </SelectTrigger>
              <SelectContent className="border-[#333b44] bg-[#21292e]">
                <SelectItem
                  value="Long"
                  className="flex cursor-pointer items-center gap-2.5 py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
                >
                  <span className="flex-shrink-0 text-xl">📈</span>
                  <span>Long</span>
                </SelectItem>
                <SelectItem
                  value="Short"
                  className="flex cursor-pointer items-center gap-2.5 py-2.5 text-white hover:bg-[#2a333a] focus:bg-[#2a333a] focus:text-white"
                >
                  <span className="flex-shrink-0 text-xl">📉</span>
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
            onBlur={() => handleFieldBlur("entryPrice")}
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
            onBlur={() => handleFieldBlur("stopLoss")}
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
            onBlur={() => handleFieldBlur("takeProfit")}
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
            onBlur={() => handleFieldBlur("exitPrice")}
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
        <FormRow cols={2} className="pt-2">
          <div className="relative overflow-hidden rounded-xl border border-red-500/40 bg-linear-to-b from-red-500/20 to-transparent p-4 text-center shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
              <svg className="h-16 w-16 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M16 18l2-2-6-6-6 6 2 2 4-4 4 4zm0-8l2-2-6-6-6 6 2 2 4-4 4 4z"
                  transform="rotate(180 12 12)"
                />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="mb-1 text-xs font-medium tracking-wider text-red-400/80 uppercase">
                Risco
              </div>
              <div className="font-mono text-2xl font-bold text-red-400 drop-shadow-md">
                $ {estimates.risk.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="from-zorin-accent/20 border-zorin-accent/40 relative overflow-hidden rounded-xl border bg-linear-to-b to-transparent p-4 text-center shadow-[0_0_20px_rgba(0,200,83,0.15)]">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
              <svg className="text-zorin-accent h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 18l2-2-6-6-6 6 2 2 4-4 4 4zm0-8l2-2-6-6-6 6 2 2 4-4 4 4z" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="text-zorin-accent/80 mb-1 text-xs font-medium tracking-wider uppercase">
                Retorno
              </div>
              <div className="text-zorin-accent font-mono text-2xl font-bold drop-shadow-md">
                $ {estimates.reward.toFixed(2)}
              </div>
            </div>
          </div>
        </FormRow>

        {/* Result */}
        {!isTradeOpen && exitPrice && entryPrice && (
          <div className="pt-2">
            {(() => {
              const entry = parseFloat(entryPrice);
              const exit = parseFloat(exitPrice);
              const lotSize = parseFloat(lot) || 1;
              const assetMultiplier = DEFAULT_ASSETS[symbol.toUpperCase()] || 1;
              let pnl =
                type === "Long"
                  ? (exit - entry) * lotSize * assetMultiplier
                  : (entry - exit) * lotSize * assetMultiplier;
              pnl +=
                (commission ? -Math.abs(parseFloat(commission)) : 0) +
                (swap ? parseFloat(swap) : 0);

              return (
                <div className="flex items-center justify-between">
                  <div
                    className={`flex-1 rounded-lg py-2 text-center text-lg font-bold ${
                      pnl > 0
                        ? "border border-green-500/30 bg-green-900/30 text-green-400"
                        : pnl < 0
                          ? "border border-red-500/30 bg-red-900/30 text-red-400"
                          : "border border-yellow-500/30 bg-yellow-900/30 text-yellow-400"
                    }`}
                  >
                    {pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BE"}
                  </div>
                  {rMultiplePreview !== null && (
                    <div
                      className={`ml-3 rounded-lg px-3 py-2 font-bold ${getRMultipleColor(rMultiplePreview)} border border-gray-700 bg-gray-900/50`}
                    >
                      {formatRMultiple(rMultiplePreview)}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </FormSection>

      {/* ===== BLOCO 3: DATA E HORA ===== */}
      <FormSection icon="📅" title="Data e Hora">
        <FormRow cols={2}>
          <DatePickerInput
            label="Data Entrada"
            value={entryDate}
            onChange={setEntryDate}
            onBlur={() => handleFieldBlur("entryDate")}
            error={getError("entryDate")}
          />
          <TimePickerInput
            label="Hora Entrada"
            value={entryTime}
            onChange={setEntryTime}
            onBlur={() => handleFieldBlur("entryTime")}
            error={getError("entryTime")}
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
              onBlur={() => handleFieldBlur("exitDate")}
              error={getError("exitDate")}
            />
            <TimePickerInput
              label="Hora Saída"
              value={exitTime}
              onChange={setExitTime}
              onBlur={() => handleFieldBlur("exitTime")}
              error={getError("exitTime")}
            />
          </FormRow>
        )}
      </FormSection>

      {/* Submit Button */}
      {/* Submit Button */}
      <ModalFooterActions
        isSubmit
        onSecondary={mode === "edit" && onCancel ? onCancel : undefined}
        primaryLabel={mode === "edit" ? "Salvar" : "Registrar Trade"}
        primaryVariant="zorin-primary"
        isLoading={isSaving}
        disabled={isSaving}
        isFullWidth
        className="mt-6"
      />
    </form>
  );
}

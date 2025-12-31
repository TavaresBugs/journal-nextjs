"use client";

import { SegmentedToggle, ModalFooterActions } from "@/components/ui";
import type { Trade } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { useToast } from "@/providers/ToastProvider";
import { validateClosedTrade } from "@/lib/validation/tradeValidation";

// Import hooks
import {
  useTradeForm,
  useTradeSubmit,
  useTradeValidation,
  type TradeValidationInput,
} from "./hooks";

// Import extracted sections
import {
  TradeMarketConditionsSection,
  TradeFinancialDataSection,
  TradeDateTimeSection,
} from "./sections";

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
  const { setups } = useSettingsStore();
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

    // Use contextual validation: closed trades require exit fields
    const input = buildValidationInput();
    const result = isTradeOpen ? validateForm(input) : validateClosedTrade(input);

    if (!result.isValid) {
      const errorCount = result.errors.length;
      showToast(
        `Corrija ${errorCount} erro${errorCount !== 1 ? "s" : ""} antes de salvar`,
        "error"
      );
      // Update field errors from the validation result
      result.errors.forEach((err) => {
        if (err.field) {
          // The hook's validateForm already sets errors, but for validateClosedTrade we need to set them
          validateSingleField(
            err.field as keyof typeof input,
            input[err.field as keyof typeof input] || "",
            input
          );
        }
      });
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
            value={state.tradeMode}
            onChange={(val) => {
              const newMode = val as "open" | "closed";
              setters.setTradeMode(newMode);

              if (newMode === "open") {
                // Clear exit price when switching to open
                setters.setExitPrice("");
              } else if (!state.exitPrice) {
                // Pre-fill exit price only if it's empty
                setters.setExitPrice(state.entryPrice || "0");
              }
            }}
            className="w-full"
          />
        </div>
      )}

      {/* ===== BLOCO 1: CONDIÇÕES DE MERCADO ===== */}
      <TradeMarketConditionsSection
        marketConditionV2={state.marketConditionV2}
        strategy={state.strategy}
        pdArray={state.pdArray}
        tfAnalise={state.tfAnalise}
        tfEntrada={state.tfEntrada}
        setup={state.setup}
        entryQuality={state.entryQuality}
        tagsList={state.tagsList}
        tagInput={state.tagInput}
        setMarketConditionV2={setters.setMarketConditionV2}
        setStrategy={setters.setStrategy}
        setPdArray={setters.setPdArray}
        setTfAnalise={setters.setTfAnalise}
        setTfEntrada={setters.setTfEntrada}
        setSetup={setters.setSetup}
        setEntryQuality={setters.setEntryQuality}
        setTagsList={setters.setTagsList}
        setTagInput={setters.setTagInput}
        playbooks={playbooks}
        setups={setups}
        alignmentResult={alignmentResult}
      />

      {/* ===== BLOCO 2: FINANCEIRO ===== */}
      <TradeFinancialDataSection
        symbol={state.symbol}
        lot={state.lot}
        type={state.type}
        entryPrice={state.entryPrice}
        stopLoss={state.stopLoss}
        takeProfit={state.takeProfit}
        exitPrice={state.exitPrice}
        commission={state.commission}
        swap={state.swap}
        setSymbol={setters.setSymbol}
        setLot={setters.setLot}
        setType={setters.setType}
        setEntryPrice={setters.setEntryPrice}
        setStopLoss={setters.setStopLoss}
        setTakeProfit={setters.setTakeProfit}
        setExitPrice={setters.setExitPrice}
        setCommission={setters.setCommission}
        setSwap={setters.setSwap}
        onFieldBlur={handleFieldBlur}
        getError={getError}
        getWarning={getWarning}
        isTradeOpen={isTradeOpen}
        estimates={estimates}
        rMultiplePreview={rMultiplePreview}
        mode={mode}
      />

      {/* ===== BLOCO 3: DATA E HORA ===== */}
      <TradeDateTimeSection
        entryDate={state.entryDate}
        entryTime={state.entryTime}
        exitDate={state.exitDate}
        exitTime={state.exitTime}
        setEntryDate={setters.setEntryDate}
        setEntryTime={setters.setEntryTime}
        setExitDate={setters.setExitDate}
        setExitTime={setters.setExitTime}
        onFieldBlur={handleFieldBlur}
        getError={getError}
        detectedSession={detectedSession}
        isTradeOpen={isTradeOpen}
        mode={mode}
      />

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

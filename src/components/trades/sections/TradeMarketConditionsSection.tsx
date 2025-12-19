"use client";

import React from "react";
import { FormSection, FormRow, FormGroup } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/SelectCustom";
import {
  MARKET_CONDITIONS,
  PD_ARRAY_OPTIONS,
  ENTRY_QUALITY_OPTIONS,
  HTF_OPTIONS,
  LTF_OPTIONS,
} from "../DomainSelects";
import { SelectValueWithIcon, ConfluenceTags } from "../shared";
import {
  getStrategyIcon,
  getStrategyLabel,
  getPDArrayIcon,
  getPDArrayLabel,
} from "@/lib/tradeHelpers";
import type { Playbook } from "@/types";

interface TradeMarketConditionsSectionProps {
  // Values
  marketConditionV2: string;
  strategy: string;
  pdArray: string;
  tfAnalise: string;
  tfEntrada: string;
  setup: string;
  entryQuality: string;
  tagsList: string[];
  tagInput: string;
  // Setters
  setMarketConditionV2: (v: string) => void;
  setStrategy: (v: string) => void;
  setPdArray: (v: string) => void;
  setTfAnalise: (v: string) => void;
  setTfEntrada: (v: string) => void;
  setSetup: (v: string) => void;
  setEntryQuality: (v: string) => void;
  setTagsList: React.Dispatch<React.SetStateAction<string[]>>;
  setTagInput: (v: string) => void;
  // Data
  playbooks: Playbook[];
  setups: string[];
  // Computed
  alignmentResult: { label: string; isWarning: boolean };
}

export const TradeMarketConditionsSection = React.memo(function TradeMarketConditionsSection({
  marketConditionV2,
  strategy,
  pdArray,
  tfAnalise,
  tfEntrada,
  setup,
  entryQuality,
  tagsList,
  tagInput,
  setMarketConditionV2,
  setStrategy,
  setPdArray,
  setTfAnalise,
  setTfEntrada,
  setSetup,
  setEntryQuality,
  setTagsList,
  setTagInput,
  playbooks,
  setups,
  alignmentResult,
}: TradeMarketConditionsSectionProps) {
  return (
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
                      <span className="shrink-0 text-xl">{pb?.icon || getStrategyIcon(strat)}</span>
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
                  <span className="shrink-0 text-xl">{getPDArrayIcon(opt.value)}</span>
                  <span>{opt.label.split(" ").slice(1).join(" ")}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormGroup>
      </FormRow>

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
      {tfAnalise && tfEntrada && (
        <div
          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium ${
            alignmentResult.isWarning
              ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
              : "border border-emerald-500/30 bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {alignmentResult.isWarning ? "⚠️ " : "✓ "}
          {alignmentResult.label}
        </div>
      )}

      {/* Confluências + Avaliação */}
      <FormRow cols={2}>
        <ConfluenceTags
          tagsList={tagsList}
          tagInput={tagInput}
          onTagsChange={setTagsList}
          onInputChange={setTagInput}
        />

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
  );
});

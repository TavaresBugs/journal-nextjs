"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/Select";
import { AssetIcon } from "./AssetIcon";
import {
  ASSET_OPTIONS,
  groupAssetsByType,
  findAssetBySymbol,
  type AssetOption,
} from "@/features/trades";
import { cn } from "@/lib/utils/general";

// ============================================
// TYPES
// ============================================

interface AssetSelectProps {
  value?: string;
  onChange: (symbol: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showAllOption?: boolean;
}

// ============================================
// COMPONENT
// ============================================

/**
 * AssetSelect - Alternativa mais simples ao AssetCombobox
 *
 * Usa o Select padrão (ui/Select) com ícones dos ativos.
 * Estética mais limpa e minimalista.
 */
export function AssetSelect({
  value,
  onChange,
  placeholder = "Selecione...",
  className,
  disabled = false,
  showAllOption = false,
}: AssetSelectProps) {
  const isAllSelected = showAllOption && value === "TODOS OS ATIVOS";
  const selectedAsset = value ? findAssetBySymbol(value) : undefined;
  const groupedAssets = groupAssetsByType(ASSET_OPTIONS);

  // Order groups for display
  const groupOrder: AssetOption["type"][] = ["Forex", "Futures", "Commodity", "Crypto"];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        disabled={disabled}
        className={cn(
          "h-10 border-gray-700 bg-gray-900/80",
          "hover:border-gray-600 hover:bg-gray-800",
          "focus:ring-2 focus:ring-cyan-500/50",
          className
        )}
      >
        {/* Valor selecionado com ícone */}
        {isAllSelected ? (
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-cyan-500/20 text-[10px] font-bold text-cyan-500">
              ALL
            </span>
            <span className="text-sm font-medium text-white">Todos os Ativos</span>
          </div>
        ) : selectedAsset ? (
          <div className="flex items-center gap-2">
            <AssetIcon symbol={selectedAsset.value} size="sm" />
            <span className="text-sm font-medium text-white">{selectedAsset.label}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">{placeholder}</span>
        )}
      </SelectTrigger>

      <SelectContent className="max-h-[450px] min-w-[280px] border-gray-700 bg-gray-900">
        {/* Opção "Todos os Ativos" */}
        {showAllOption && (
          <SelectGroup>
            <SelectLabel className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Geral
            </SelectLabel>
            <SelectItem value="TODOS OS ATIVOS" className="py-2.5">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-cyan-500/20 text-[10px] font-bold text-cyan-500">
                  ALL
                </span>
                <span className="text-sm font-semibold text-white">Todos os Ativos</span>
              </div>
            </SelectItem>
          </SelectGroup>
        )}

        {/* Grupos de ativos */}
        {groupOrder.map((type) => {
          const assets = groupedAssets[type];
          if (!assets || assets.length === 0) return null;

          return (
            <SelectGroup key={type}>
              <SelectLabel className="mt-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                {type}
              </SelectLabel>
              {assets.map((asset) => (
                <SelectItem key={asset.value} value={asset.value} className="py-2.5">
                  <div className="flex items-center gap-3">
                    <AssetIcon symbol={asset.value} size="sm" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{asset.label}</p>
                      <p className="text-xs text-gray-400">{asset.name}</p>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}

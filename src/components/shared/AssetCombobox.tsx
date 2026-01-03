"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils/general";
import { Button } from "@/components/ui/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AssetIcon } from "./AssetIcon";
import {
  ASSET_OPTIONS,
  groupAssetsByType,
  findAssetBySymbol,
  type AssetOption,
} from "@/constants/assetComboboxData";

// ============================================
// TYPES
// ============================================

interface AssetComboboxProps {
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

export function AssetCombobox({
  value,
  onChange,
  placeholder = "Selecione um ativo...",
  className,
  disabled = false,
  showAllOption = false,
}: AssetComboboxProps) {
  const [open, setOpen] = useState(false);
  // Handle "All Assets" special case
  const isAllSelected = showAllOption && value === "TODOS OS ATIVOS";

  const selectedAsset = value ? findAssetBySymbol(value) : undefined;
  const groupedAssets = groupAssetsByType(ASSET_OPTIONS);

  // Order groups for display
  const groupOrder: AssetOption["type"][] = ["Forex", "Futures", "Commodity", "Crypto"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-between",
            "border-gray-700 bg-gray-800",
            "hover:border-gray-600 hover:bg-gray-700",
            "focus:ring-2 focus:ring-cyan-500",
            !value && "text-muted-foreground",
            className
          )}
        >
          {isAllSelected ? (
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-cyan-500/20 text-xs font-bold text-cyan-500">
                ALL
              </span>
              <span className="font-medium text-white">Todos os Ativos</span>
            </div>
          ) : selectedAsset ? (
            <div className="flex items-center gap-2.5">
              <AssetIcon symbol={selectedAsset.value} size="sm" />
              <span className="font-medium">{selectedAsset.label}</span>
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] border-gray-700 bg-gray-800 p-0" align="start">
        <Command className="bg-gray-800">
          <CommandInput
            placeholder="Buscar ativo (EUR, BTC, ES...)"
            className="h-12 border-b border-gray-700 bg-gray-800 text-white placeholder:text-gray-400"
          />
          <CommandEmpty className="py-6 text-center text-sm text-gray-400">
            Nenhum ativo encontrado.
          </CommandEmpty>

          <CommandList className="max-h-[400px] overflow-y-auto">
            {showAllOption && (
              <CommandGroup
                heading="Geral"
                className="px-2 py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:uppercase"
              >
                <CommandItem
                  value="TODOS OS ATIVOS ALL"
                  onSelect={() => {
                    onChange("TODOS OS ATIVOS");
                    setOpen(false);
                  }}
                  className={cn(
                    "cursor-pointer rounded-md px-2 py-2.5",
                    "hover:bg-gray-700",
                    "data-[selected=true]:bg-gray-700"
                  )}
                >
                  <div className="flex w-full items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-cyan-500/20 text-[10px] font-bold text-cyan-500">
                      ALL
                    </span>
                    <span className="flex-1 text-sm font-semibold text-white">Todos os Ativos</span>
                    <Check
                      className={cn(
                        "h-4 w-4 text-cyan-500",
                        value === "TODOS OS ATIVOS" ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
            {groupOrder.map((type) => {
              const assets = groupedAssets[type];
              if (!assets || assets.length === 0) return null;

              return (
                <CommandGroup
                  key={type}
                  heading={type}
                  className="px-2 py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:uppercase"
                >
                  {assets.map((asset) => (
                    <CommandItem
                      key={asset.value}
                      value={`${asset.value} ${asset.name}`}
                      onSelect={() => {
                        onChange(asset.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "cursor-pointer rounded-md px-2 py-2.5",
                        "hover:bg-gray-700",
                        "data-[selected=true]:bg-gray-700"
                      )}
                    >
                      <div className="flex w-full items-center gap-3">
                        {/* Ícone SVG */}
                        <AssetIcon symbol={asset.value} size="sm" className="shrink-0" />

                        {/* Info do ativo */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{asset.label}</p>
                          <p className="truncate text-xs text-gray-400">{asset.name}</p>
                        </div>

                        {/* Badge de tipo */}
                        <span className="rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 uppercase">
                          {asset.type}
                        </span>

                        {/* Checkmark se selecionado */}
                        <Check
                          className={cn(
                            "h-4 w-4 text-cyan-500",
                            value === asset.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

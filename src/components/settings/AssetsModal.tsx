"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ModalFooterActions } from "@/components/ui/ModalFooterActions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/switch";
import { AssetIcon } from "@/components/shared/AssetIcon";
import { Search, RotateCcw, Lock, Settings2 } from "lucide-react";
import { ASSET_OPTIONS, type AssetOption } from "@/constants/assetComboboxData";
import { getDefaultMultiplier } from "@/constants/defaultMultipliers";
import { cn } from "@/lib/utils/general";

// ============================================
// TYPES
// ============================================

interface AssetConfig {
  symbol: string;
  name: string;
  type: AssetOption["type"];
  multiplier: number;
  defaultMultiplier: number;
  isLocked: boolean;
  isActive: boolean;
}

interface AssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (configs: AssetConfig[]) => void;
}

// ============================================
// HELPER: Initialize asset configs from defaults
// ============================================

function initializeAssetConfigs(): AssetConfig[] {
  return ASSET_OPTIONS.map((asset) => {
    const multiplierConfig = getDefaultMultiplier(asset.value);
    return {
      symbol: asset.value,
      name: asset.name,
      type: asset.type,
      multiplier: multiplierConfig.value,
      defaultMultiplier: multiplierConfig.value,
      isLocked: multiplierConfig.locked,
      isActive: true,
    };
  });
}

// ============================================
// COMPONENT
// ============================================

export function AssetsModal({ isOpen, onClose, onSave }: AssetsModalProps) {
  const [configs, setConfigs] = useState<AssetConfig[]>(() => initializeAssetConfigs());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Filter assets based on search and type
  const filteredConfigs = useMemo(() => {
    return configs.filter((config) => {
      const matchesSearch =
        config.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || config.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [configs, searchQuery, filterType]);

  // Group by type
  const groupedConfigs = useMemo(() => {
    return filteredConfigs.reduce(
      (acc, config) => {
        if (!acc[config.type]) acc[config.type] = [];
        acc[config.type].push(config);
        return acc;
      },
      {} as Record<string, AssetConfig[]>
    );
  }, [filteredConfigs]);

  // Update a single asset config
  const updateConfig = (symbol: string, updates: Partial<AssetConfig>) => {
    setConfigs((prev) =>
      prev.map((config) => (config.symbol === symbol ? { ...config, ...updates } : config))
    );
  };

  // Reset multiplier to default
  const resetToDefault = (symbol: string) => {
    const config = configs.find((c) => c.symbol === symbol);
    if (config) {
      updateConfig(symbol, { multiplier: config.defaultMultiplier });
    }
  };

  // Toggle active status
  const toggleActive = (symbol: string) => {
    const config = configs.find((c) => c.symbol === symbol);
    if (config) {
      updateConfig(symbol, { isActive: !config.isActive });
    }
  };

  // Handle save
  const handleSave = () => {
    onSave?.(configs);
    onClose();
  };

  const filterButtons: { label: string; value: string }[] = [
    { label: "Todos", value: "all" },
    { label: "Forex", value: "Forex" },
    { label: "Futures", value: "Futures" },
    { label: "Commodities", value: "Commodity" },
    { label: "Crypto", value: "Crypto" },
  ];

  const groupOrder = ["Forex", "Futures", "Commodity", "Crypto"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[85vh] w-full max-w-6xl flex-col border-gray-700 bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings2 className="h-5 w-5 text-cyan-500" />
            Configuração de Ativos
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure multiplicadores e ative/desative ativos para o trading
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar ativo (EUR, BTC, ES...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-gray-600 bg-gray-700/50 pl-10 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <Button
                key={btn.value}
                size="sm"
                variant={filterType === btn.value ? "primary" : "outline"}
                onClick={() => setFilterType(btn.value)}
                className={cn(
                  filterType === btn.value
                    ? "bg-cyan-600 text-white hover:bg-cyan-700"
                    : "border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600"
                )}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Asset List */}
        <div className="mt-4 flex-1 space-y-6 overflow-y-auto pr-2">
          {groupOrder.map((type) => {
            const typeConfigs = groupedConfigs[type];
            if (!typeConfigs || typeConfigs.length === 0) return null;

            return (
              <div key={type} className="space-y-2">
                <h3 className="sticky top-0 z-50 bg-gray-800 py-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  {type}
                </h3>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {typeConfigs.map((config) => (
                    <div
                      key={config.symbol}
                      className={cn(
                        "rounded-lg border p-3 transition-colors",
                        config.isActive
                          ? "border-gray-600 bg-gray-700/50"
                          : "border-gray-700 bg-gray-900/50 opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* LEFT: Icon and Info */}
                        <div className="flex min-w-[140px] flex-1 items-center gap-3">
                          <AssetIcon symbol={config.symbol} size="md" />
                          <div className="min-w-0">
                            <p className="font-semibold text-white">{config.symbol}</p>
                            <p className="truncate text-xs text-gray-400">{config.name}</p>
                          </div>
                        </div>

                        {/* CENTER: Multiplier Input */}
                        <div className="flex flex-col items-center">
                          <label className="mb-1 flex items-center justify-center gap-1 text-[10px] font-medium text-gray-400">
                            Multiplicador
                            {config.isLocked && (
                              <div
                                title="🔒 Multiplicador fixo definido pelo contrato"
                                className="flex cursor-help items-center"
                              >
                                <Lock className="h-3 w-3 text-amber-500" />
                              </div>
                            )}
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={config.multiplier}
                              onChange={(e) =>
                                updateConfig(config.symbol, {
                                  multiplier: parseFloat(e.target.value) || 0,
                                })
                              }
                              disabled={config.isLocked}
                              className={cn(
                                "h-9 w-32 border-gray-600 bg-gray-800/80 text-center text-sm transition-colors focus:border-cyan-500",
                                config.isLocked && "cursor-not-allowed opacity-50"
                              )}
                            />
                            {!config.isLocked && config.multiplier !== config.defaultMultiplier && (
                              <button
                                onClick={() => resetToDefault(config.symbol)}
                                className="absolute top-1/2 -right-6 -translate-y-1/2 p-1 text-gray-500 transition-colors hover:text-cyan-400"
                                title="Restaurar padrão"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: Active Switch */}
                        <div className="flex min-w-[60px] flex-col items-center">
                          <span className="mb-1 text-[10px] font-medium text-gray-400">Busca</span>
                          <div className="flex h-9 items-center justify-center">
                            <Switch
                              checked={config.isActive}
                              onCheckedChange={() => toggleActive(config.symbol)}
                              className="data-[state=checked]:bg-cyan-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredConfigs.length === 0 && (
            <div className="py-8 text-center text-gray-500">Nenhum ativo encontrado</div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-gray-700 pt-0">
          <ModalFooterActions
            mode="save-cancel"
            onPrimary={handleSave}
            onSecondary={onClose}
            primaryLabel="Salvar Alterações"
            secondaryLabel="Cancelar"
            isFullWidth
            className="w-full border-t-0"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

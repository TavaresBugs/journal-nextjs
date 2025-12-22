"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
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
  // Handle close - save changes automatically
  const handleClose = () => {
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

  const modalTitle = (
    <div className="flex items-center gap-2">
      <Settings2 className="h-5 w-5 text-gray-400" />
      <span>Configuração de Ativos</span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} maxWidth="5xl">
      <div className="flex flex-col gap-4">
        {/* Description */}
        <p className="text-sm text-gray-400">
          Configure multiplicadores e ative/desative ativos para o trading
        </p>

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
        <div className="max-h-[50vh] space-y-6 overflow-y-auto pr-2">
          {groupOrder.map((type) => {
            const typeConfigs = groupedConfigs[type];
            if (!typeConfigs || typeConfigs.length === 0) return null;

            return (
              <div key={type} className="space-y-2">
                <h3 className="bg-zorin-bg sticky top-0 z-10 py-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  {type}
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      <div className="flex items-center justify-between gap-3">
                        {/* LEFT: Icon and Info */}
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <AssetIcon symbol={config.symbol} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{config.symbol}</p>
                            <p className="truncate text-xs text-gray-400">{config.name}</p>
                          </div>
                        </div>

                        {/* CENTER: Multiplier Input */}
                        <div className="flex flex-col items-center">
                          <label className="mb-1 flex items-center justify-center gap-1 text-[10px] font-medium text-gray-400">
                            Mult.
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
                                "h-8 w-20 border-gray-600 bg-gray-800/80 text-center text-xs transition-colors focus:border-cyan-500",
                                config.isLocked && "cursor-not-allowed opacity-50"
                              )}
                            />
                            {!config.isLocked && config.multiplier !== config.defaultMultiplier && (
                              <button
                                onClick={() => resetToDefault(config.symbol)}
                                className="absolute top-1/2 -right-5 -translate-y-1/2 p-0.5 text-gray-500 transition-colors hover:text-cyan-400"
                                title="Restaurar padrão"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: Active Switch */}
                        <div className="flex flex-col items-center">
                          <span className="mb-1 text-[10px] font-medium text-gray-400">Ativo</span>
                          <Switch
                            checked={config.isActive}
                            onCheckedChange={() => toggleActive(config.symbol)}
                            className="data-[state=checked]:bg-cyan-600"
                          />
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
      </div>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import { exportAllData, downloadAsJSON } from "@/services/trades/export";

interface BackupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackupOption {
  id: string;
  icon: string;
  title: string;
  description: string;
  selected: boolean;
}

export function BackupSettingsModal({ isOpen, onClose }: BackupSettingsModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<BackupOption[]>([
    {
      id: "trades",
      icon: "📈",
      title: "Trades",
      description: "Todos os trades e histórico",
      selected: true,
    },
    {
      id: "playbooks",
      icon: "📖",
      title: "Playbooks",
      description: "Estratégias e configurações",
      selected: true,
    },
    {
      id: "journal",
      icon: "📝",
      title: "Journal",
      description: "Entradas do diário",
      selected: true,
    },
    {
      id: "settings",
      icon: "⚙️",
      title: "Configurações",
      description: "Moedas, alavancagens, setups",
      selected: true,
    },
  ]);

  const toggleOption = (id: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, selected: !opt.selected } : opt))
    );
  };

  const selectedCount = options.filter((opt) => opt.selected).length;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      // For now, export all data regardless of selection
      // In future, filter based on selected options
      const data = await exportAllData();
      downloadAsJSON(data);
      onClose();
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📥 Baixar Backup" maxWidth="lg">
      <div className="space-y-8">
        <p className="text-sm text-gray-400">Selecione o que você deseja incluir no backup.</p>

        {/* Options list - single column for more space */}
        <div className="flex flex-col gap-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`group flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                option.selected
                  ? "border-cyan-500/50 bg-cyan-500/10"
                  : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600"
              }`}
            >
              <span className="text-3xl">{option.icon}</span>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-gray-100">{option.title}</h4>
                <p className="mt-1 text-sm text-gray-500">{option.description}</p>
              </div>
              {/* Checkbox indicator */}
              <div
                className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all ${
                  option.selected ? "border-cyan-500 bg-cyan-500" : "border-gray-600 bg-transparent"
                }`}
              >
                {option.selected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Export button */}
        <Button
          variant="gradient-info"
          onClick={handleExport}
          className="w-full py-3 text-base font-extrabold"
          disabled={isExporting || selectedCount === 0}
        >
          {isExporting ? "Exportando..." : `📥 Baixar Backup (${selectedCount} itens)`}
        </Button>
      </div>
    </Modal>
  );
}

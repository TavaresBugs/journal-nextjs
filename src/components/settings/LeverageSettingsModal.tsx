"use client";

import { useState } from "react";
import { Modal, Input, Button } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";

interface LeverageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeverageSettingsModal({ isOpen, onClose }: LeverageSettingsModalProps) {
  const {
    leverages,
    addLeverage: addLeverageToStore,
    removeLeverage: removeLeverageFromStore,
  } = useSettingsStore();

  const [newLeverage, setNewLeverage] = useState("");

  const addLeverage = () => {
    if (newLeverage.trim() && !leverages.includes(newLeverage)) {
      addLeverageToStore(newLeverage);
      setNewLeverage("");
    }
  };

  const removeLeverage = (leverage: string) => {
    removeLeverageFromStore(leverage);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚖️ Configurar Alavancagem" maxWidth="md">
      <div className="space-y-6">
        <p className="text-sm text-gray-400">
          Configure os níveis de alavancagem disponíveis para suas carteiras.
        </p>

        {/* Add new leverage */}
        <div className="flex gap-2">
          <Input
            placeholder="Nova alavancagem (ex: 1:300)"
            value={newLeverage}
            onChange={(e) => setNewLeverage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addLeverage()}
            className="flex-1"
          />
          <Button
            variant="gradient-success"
            onClick={addLeverage}
            className="h-12 px-6 font-extrabold"
          >
            Adicionar
          </Button>
        </div>

        {/* Leverage list */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {leverages.map((leverage) => (
            <div
              key={leverage}
              className="group flex items-center justify-between rounded-xl border border-gray-700/50 bg-gray-800/50 px-4 py-3 transition-all hover:border-gray-600 hover:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-cyan-500/20 to-blue-500/20 text-sm font-bold text-cyan-400">
                  ⚖️
                </span>
                <span className="font-medium text-gray-200">{leverage}</span>
              </div>
              <button
                onClick={() => removeLeverage(leverage)}
                className="rounded-full p-1.5 text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

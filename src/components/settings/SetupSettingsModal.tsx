"use client";

import { useState } from "react";
import { Modal, Input, Button } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";

interface SetupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetupSettingsModal({ isOpen, onClose }: SetupSettingsModalProps) {
  const {
    setups,
    addSetup: addSetupToStore,
    removeSetup: removeSetupFromStore,
  } = useSettingsStore();

  const [newSetup, setNewSetup] = useState("");

  const addSetup = () => {
    if (newSetup.trim() && !setups.includes(newSetup)) {
      addSetupToStore(newSetup);
      setNewSetup("");
    }
  };

  const removeSetup = (setup: string) => {
    removeSetupFromStore(setup);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🎯 Tipos de Entrada (Setups)" maxWidth="md">
      <div className="space-y-6">
        <p className="text-sm text-gray-400">
          Configure os tipos de entrada disponíveis para classificar seus trades.
        </p>

        {/* Add new setup */}
        <div className="flex gap-2">
          <Input
            placeholder="Novo Setup (ex: ST, RE, ST+RE)"
            value={newSetup}
            onChange={(e) => setNewSetup(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addSetup()}
            className="flex-1"
          />
          <Button
            variant="gradient-success"
            onClick={addSetup}
            className="h-12 px-6 font-extrabold"
          >
            Adicionar
          </Button>
        </div>

        {/* Setups list - compact inline tags */}
        <div className="flex flex-wrap gap-2">
          {setups.map((setup) => (
            <div
              key={setup}
              className="group inline-flex items-center gap-2 rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 py-2 transition-all hover:border-gray-600 hover:bg-gray-800"
            >
              <span className="font-medium text-gray-200">{setup}</span>
              <button
                onClick={() => removeSetup(setup)}
                className="rounded-full p-0.5 text-gray-500 transition-all hover:bg-red-500/20 hover:text-red-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
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

        {setups.length === 0 && (
          <p className="text-center text-sm text-gray-500 italic">
            Nenhum setup configurado. Adicione seu primeiro setup acima.
          </p>
        )}
      </div>
    </Modal>
  );
}

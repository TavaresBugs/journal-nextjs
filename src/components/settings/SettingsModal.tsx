"use client";

import { useState, useEffect } from "react";
import { Modal, Input, Button } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";
import { exportAllData, downloadAsJSON } from "@/services/trades/export";
import { MentorshipSettings } from "./MentorshipSettings";
import { AssetsModal } from "./AssetsModal";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string;
  currentBalance?: number;
  onUpdateBalance?: (newBalance: number) => void;
}

// SVG Icon for Settings Header
const SettingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-[#bde6fb]"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export function SettingsModal({ isOpen, onClose, accountId }: SettingsModalProps) {
  // Global Settings State from Store
  const {
    currencies,
    addCurrency: addCurrencyToStore,
    removeCurrency: removeCurrencyFromStore,
    leverages,
    addLeverage: addLeverageToStore,
    removeLeverage: removeLeverageFromStore,
    setups,
    addSetup: addSetupToStore,
    removeSetup: removeSetupFromStore,
    loadSettings,
  } = useSettingsStore();

  // Load settings from Supabase when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, loadSettings]);

  const [newCurrency, setNewCurrency] = useState("");
  const [newLeverage, setNewLeverage] = useState("");
  const [newSetup, setNewSetup] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportAllData();
      downloadAsJSON(data);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const addSetup = () => {
    if (newSetup.trim() && !setups.includes(newSetup)) {
      addSetupToStore(newSetup);
      setNewSetup("");
    }
  };

  const removeSetup = (setup: string) => {
    removeSetupFromStore(setup);
  };

  const addCurrency = () => {
    if (newCurrency.trim() && !currencies.includes(newCurrency.toUpperCase())) {
      addCurrencyToStore(newCurrency.toUpperCase());
      setNewCurrency("");
    }
  };

  const removeCurrency = (currency: string) => {
    removeCurrencyFromStore(currency);
  };

  const addLeverage = () => {
    if (newLeverage.trim() && !leverages.includes(newLeverage)) {
      addLeverageToStore(newLeverage);
      setNewLeverage("");
    }
  };

  const removeLeverage = (leverage: string) => {
    removeLeverageFromStore(leverage);
  };

  const isGlobalMode = !accountId;

  // Custom header with SVG icon
  const headerTitle = (
    <div className="flex items-center gap-3">
      <SettingsIcon />
      <span className="text-xl font-bold text-gray-100">
        {isGlobalMode ? "Configurações Globais" : "Configurações"}
      </span>
    </div>
  );

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={headerTitle} maxWidth="4xl">
        <div className="max-h-[70vh] space-y-8 overflow-y-auto pr-2">
          {/* Global Settings Sections - ONLY visible in Global Mode */}
          {isGlobalMode ? (
            <>
              <p className="text-sm text-gray-400">
                Ajuste as listas usadas no modal de criação de conta.
              </p>

              {/* Moedas */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-200">
                  💰 Moedas
                </h3>
                <div className="mb-2 flex gap-2">
                  <Input
                    placeholder="NOVA MOEDA (EX: CAD)"
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addCurrency()}
                    className="uppercase"
                  />
                  <Button
                    variant="gradient-success"
                    onClick={addCurrency}
                    className="h-10 w-20 font-extrabold"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currencies.map((currency) => (
                    <span
                      key={currency}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-sm text-gray-200"
                    >
                      {currency}
                      <Button
                        variant="danger"
                        size="icon"
                        onClick={() => removeCurrency(currency)}
                        className="h-6 w-6 p-0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </Button>
                    </span>
                  ))}
                </div>
              </section>

              {/* Alavancagem */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-200">
                  ⚖️ Alavancagem
                </h3>
                <div className="mb-2 flex gap-2">
                  <Input
                    placeholder="Nova Alavancagem (ex: 1:300)"
                    value={newLeverage}
                    onChange={(e) => setNewLeverage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addLeverage()}
                  />
                  <Button
                    variant="gradient-success"
                    onClick={addLeverage}
                    className="h-10 w-20 font-extrabold"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {leverages.map((leverage) => (
                    <span
                      key={leverage}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-sm text-gray-200"
                    >
                      {leverage}
                      <Button
                        variant="danger"
                        size="icon"
                        onClick={() => removeLeverage(leverage)}
                        className="h-6 w-6 p-0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </Button>
                    </span>
                  ))}
                </div>
              </section>

              {/* Mentoria */}
              <section>
                <MentorshipSettings />
              </section>
            </>
          ) : (
            <>
              {/* Dashboard Settings - ONLY visible when inside a dashboard (accountId exists) */}

              {/* Ativos & Multiplicadores - Button to open modal */}
              <section>
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 p-4">
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-200">
                      📊 Ativos de Trading
                    </h3>
                    <p className="text-sm text-gray-500">
                      Configure multiplicadores, ative/desative ativos
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setIsAssetsModalOpen(true)}
                    className="gap-2"
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
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Configurar Ativos
                  </Button>
                </div>
              </section>

              {/* Tipos de Entrada (Setups) - Full width now since Estratégias is removed */}
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-200">
                  🎯 Tipos de Entrada (Setups)
                </h3>
                <div className="mb-4 flex gap-2">
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
                    className="h-10 w-24 font-extrabold"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {setups.map((setup) => (
                    <span
                      key={setup}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-4 py-2 text-sm text-gray-200"
                    >
                      {setup}
                      <Button
                        variant="danger"
                        size="icon"
                        onClick={() => removeSetup(setup)}
                        className="h-6 w-6 p-0"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </Button>
                    </span>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Footer for Global Settings */}
        {isGlobalMode && (
          <div className="mt-6 space-y-3 border-t border-gray-700 pt-4">
            <Button
              variant="secondary"
              onClick={handleExport}
              className="flex w-full items-center justify-center gap-2 font-extrabold"
              disabled={isExporting}
            >
              {isExporting ? "Exportando..." : "📥 Baixar Backup"}
            </Button>
            <Button variant="gradient-danger" onClick={onClose} className="w-full font-extrabold">
              Fechar
            </Button>
          </div>
        )}
      </Modal>

      {/* Assets Configuration Modal */}
      <AssetsModal isOpen={isAssetsModalOpen} onClose={() => setIsAssetsModalOpen(false)} />
    </>
  );
}

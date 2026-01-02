"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui";
import { useSettingsStore } from "@/store/useSettingsStore";
import { MentorshipSettings } from "./MentorshipSettings";
import { AssetsModal } from "./AssetsModal";
import { CurrencySettingsModal } from "./CurrencySettingsModal";
import { LeverageSettingsModal } from "./LeverageSettingsModal";
import { SetupSettingsModal } from "./SetupSettingsModal";
import { BackupSettingsModal } from "./BackupSettingsModal";
import { ProfileSettingsModal } from "./ProfileSettingsModal";

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

// Settings Card Component for the new design
interface SettingsCardProps {
  icon: string;
  title: string;
  description: string;
  count?: number;
  onClick: () => void;
}

function SettingsCard({ icon, title, description, count, onClick }: SettingsCardProps) {
  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer items-center justify-between rounded-xl border border-gray-700/50 bg-gray-800/30 p-4 transition-all duration-200 hover:border-cyan-500/30 hover:bg-gray-800/60"
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-100">
            {title}
            {count !== undefined && (
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">
                {count}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {/* Chevron arrow indicator */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-500 transition-all group-hover:translate-x-1 group-hover:text-cyan-400"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose, accountId }: SettingsModalProps) {
  // Global Settings State from Store
  const { currencies, leverages, setups, loadSettings } = useSettingsStore();

  // Load settings from Supabase when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, loadSettings]);

  const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isLeverageModalOpen, setIsLeverageModalOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
      <Modal isOpen={isOpen} onClose={onClose} title={headerTitle} maxWidth="2xl">
        <div className="space-y-4">
          {/* Global Settings Sections - ONLY visible in Global Mode */}
          {isGlobalMode ? (
            <>
              {/* Settings Cards */}
              <SettingsCard
                icon="🪙"
                title="Moedas"
                description="Configure as moedas disponíveis para suas carteiras"
                count={currencies.length}
                onClick={() => setIsCurrencyModalOpen(true)}
              />

              <SettingsCard
                icon="⚖️"
                title="Alavancagem"
                description="Configure os níveis de alavancagem disponíveis"
                count={leverages.length}
                onClick={() => setIsLeverageModalOpen(true)}
              />

              <SettingsCard
                icon="🎓"
                title="Mentoria"
                description="Gerencie seus mentores e permissões de acesso"
                onClick={() => setIsMentorModalOpen(true)}
              />

              {/* Divider */}
              <div className="border-t border-gray-700/50 pt-4">
                <SettingsCard
                  icon="👤"
                  title="Perfil"
                  description="Configure seu perfil de compartilhamento"
                  onClick={() => setIsProfileModalOpen(true)}
                />

                <div className="mt-4">
                  <SettingsCard
                    icon="📥"
                    title="Backup"
                    description="Baixe seus dados (trades, playbooks, journal)"
                    onClick={() => setIsBackupModalOpen(true)}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Dashboard Settings - ONLY visible when inside a dashboard (accountId exists) */}

              {/* Ativos & Multiplicadores */}
              <SettingsCard
                icon="📊"
                title="Ativos de Trading"
                description="Configure multiplicadores, ative/desative ativos"
                onClick={() => setIsAssetsModalOpen(true)}
              />

              {/* Tipos de Entrada (Setups) */}
              <SettingsCard
                icon="🎯"
                title="Tipos de Entrada (Setups)"
                description="Configure os tipos de entrada para classificar trades"
                count={setups.length}
                onClick={() => setIsSetupModalOpen(true)}
              />
            </>
          )}
        </div>
      </Modal>

      {/* Sub-modals */}
      <AssetsModal isOpen={isAssetsModalOpen} onClose={() => setIsAssetsModalOpen(false)} />
      <CurrencySettingsModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
      />
      <LeverageSettingsModal
        isOpen={isLeverageModalOpen}
        onClose={() => setIsLeverageModalOpen(false)}
      />
      <SetupSettingsModal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} />
      <BackupSettingsModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Mentor Modal */}
      <Modal
        isOpen={isMentorModalOpen}
        onClose={() => setIsMentorModalOpen(false)}
        title="🎓 Configurar Mentoria"
        maxWidth="2xl"
      >
        <MentorshipSettings />
      </Modal>
    </>
  );
}

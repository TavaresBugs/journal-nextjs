"use client";

import { useState } from "react";
import { Modal, IconActionButton, SegmentedToggle } from "@/components/ui";
import { TabPanel } from "@/components/ui/Tabs";
import { PlaybookReviewTab } from "./PlaybookReviewTab";
import type { Playbook, Trade } from "@/types";

interface ViewPlaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
  playbook: Playbook | null;
  onEdit?: (playbook: Playbook) => void;
  trades?: Trade[];
  currency?: string;
}

export function ViewPlaybookModal({
  isOpen,
  onClose,
  playbook,
  onEdit,
  trades = [],
  currency = "USD",
}: ViewPlaybookModalProps) {
  const [activeTab, setActiveTab] = useState("info");

  if (!playbook) return null;

  // Filter trades that match this playbook strategy
  const playbookTrades = trades.filter((t) => t.strategy === playbook.name);

  const handleClose = () => {
    setActiveTab("info"); // Reset to info tab on close
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${playbook.icon} ${playbook.name}`}
      maxWidth="5xl"
      headerActions={
        onEdit && activeTab === "info" ? (
          <IconActionButton
            variant="edit"
            size="md"
            onClick={() => {
              onEdit(playbook);
              handleClose();
            }}
            className="[&_svg]:h-6 [&_svg]:w-6"
          />
        ) : undefined
      }
    >
      <div className="min-h-[500px] space-y-6 transition-all duration-300 ease-in-out">
        {/* Description (if exists) */}
        {playbook.description && (
          <p className="px-1 text-sm leading-relaxed text-gray-400">{playbook.description}</p>
        )}

        {/* Tabs */}
        <SegmentedToggle
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "info", label: <>📋 Info</> },
            { value: "relatorios", label: <>📊 Relatórios</> },
          ]}
        />

        {/* Tab: Info (Rules) */}
        <TabPanel value="info" activeTab={activeTab}>
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-xl">📜</span>
              REGRAS DO PLAYBOOK
            </h3>

            <div className="space-y-4">
              {playbook.ruleGroups?.map((group) => {
                // Map common rule group names to emojis
                const getGroupEmoji = (name: string): string => {
                  const normalized = name.toLowerCase().trim();
                  if (
                    normalized.includes("condições") ||
                    normalized.includes("mercado") ||
                    normalized.includes("contexto")
                  )
                    return "📊";
                  if (
                    normalized.includes("entrada") ||
                    normalized.includes("trigger") ||
                    normalized.includes("gatilho")
                  )
                    return "🎯";
                  if (
                    normalized.includes("saída") ||
                    normalized.includes("exit") ||
                    normalized.includes("alvo")
                  )
                    return "🏁";
                  if (
                    normalized.includes("gestão") ||
                    normalized.includes("risco") ||
                    normalized.includes("risk")
                  )
                    return "🛡️";
                  if (
                    normalized.includes("psico") ||
                    normalized.includes("mental") ||
                    normalized.includes("emocional")
                  )
                    return "🧠";
                  return "📋";
                };

                return (
                  <div
                    key={group.id}
                    className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800 px-4 py-2 font-semibold text-gray-200">
                      <span className="text-lg">{getGroupEmoji(group.name)}</span>
                      {group.name}
                    </div>
                    <div className="space-y-2 p-4">
                      {group.rules.length > 0 ? (
                        group.rules.map((rule, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm text-gray-300">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="mt-0.5 shrink-0 text-emerald-400"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="leading-relaxed">{rule}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">Nenhuma regra definida.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabPanel>

        {/* Tab: Relatórios (Analytics) */}
        <TabPanel value="relatorios" activeTab={activeTab}>
          <PlaybookReviewTab trades={playbookTrades} currency={currency} />
        </TabPanel>
      </div>
    </Modal>
  );
}

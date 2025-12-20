"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  SegmentedToggle,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { CustomCheckbox } from "./CustomCheckbox";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { ArgumentsCalculator } from "./ArgumentsCalculator";
import type { Playbook, RuleGroup } from "@/types";

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTradeStart?: () => void;
}

const CHECKLIST_OPTIONS = [
  { value: "rules", label: <>📋 Checklist & Regras</> },
  { value: "arguments", label: <>⚖️ Argumentos</> },
];

export function ChecklistModal({ isOpen, onClose, onTradeStart }: ChecklistModalProps) {
  const { playbooks, loadPlaybooks, isLoading } = usePlaybookStore();

  // Tab State: 'rules' | 'arguments'
  const [activeTab, setActiveTab] = useState<"rules" | "arguments">("rules");

  // Selected playbook ID
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>("");

  // Checklist state: Map<groupId, Map<ruleIndex, checked>>
  const [checkedRules, setCheckedRules] = useState<Record<string, Record<number, boolean>>>({});

  // Load playbooks when modal opens
  useEffect(() => {
    if (isOpen && playbooks.length === 0) {
      loadPlaybooks();
    }
  }, [isOpen, playbooks.length, loadPlaybooks]);

  // Reset tab on close
  const handleClose = () => {
    setSelectedPlaybookId("");
    setCheckedRules({});
    setActiveTab("rules"); // Reset tab
    onClose();
  };

  // Get selected playbook
  const selectedPlaybook = useMemo(() => {
    return playbooks.find((p) => p.id === selectedPlaybookId) || null;
  }, [playbooks, selectedPlaybookId]);

  // Check if all rules are checked
  const allRulesChecked = useMemo(() => {
    if (!selectedPlaybook || selectedPlaybook.ruleGroups.length === 0) {
      return false;
    }

    return selectedPlaybook.ruleGroups.every((group: RuleGroup) => {
      // Ignore "Critérios de Saída" from validation as they are informational
      if (group.name.toLowerCase().includes("saída") || group.name.toLowerCase().includes("exit")) {
        return true;
      }

      if (!group.rules || group.rules.length === 0) return true;
      const groupChecks = checkedRules[group.id] || {};
      return group.rules.every((_, index) => groupChecks[index] === true);
    });
  }, [selectedPlaybook, checkedRules]);

  // Total rules count for progress display (excluding exit/info criteria)
  const { totalRules, checkedCount } = useMemo(() => {
    if (!selectedPlaybook) return { totalRules: 0, checkedCount: 0 };

    let total = 0;
    let checked = 0;

    selectedPlaybook.ruleGroups.forEach((group: RuleGroup) => {
      // Skip counting info/exit groups for the progress bar
      const isExitCriteria =
        group.name.toLowerCase().includes("saída") || group.name.toLowerCase().includes("exit");
      if (isExitCriteria) return;

      if (group.rules) {
        total += group.rules.length;
        const groupChecks = checkedRules[group.id] || {};
        checked += Object.values(groupChecks).filter(Boolean).length;
      }
    });

    return { totalRules: total, checkedCount: checked };
  }, [selectedPlaybook, checkedRules]);

  const handlePlaybookChange = (playbookId: string) => {
    setSelectedPlaybookId(playbookId);
    setCheckedRules({});
  };

  const handleRuleToggle = (groupId: string, ruleIndex: number) => {
    setCheckedRules((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [ruleIndex]: !prev[groupId]?.[ruleIndex],
      },
    }));
  };

  const handleConfirm = () => {
    if (onTradeStart) {
      onTradeStart();
    } else {
      console.log("Trade Liberado! 🚀");
    }
    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="✅ Pre-Flight Checklist" maxWidth="4xl">
      <div className="space-y-6">
        {/* Tab Switcher - Using Standard Tabs Component */}
        {/* Tab Switcher - Using Standard Tabs Component */}
        <SegmentedToggle
          value={activeTab}
          onChange={(val) => setActiveTab(val as "rules" | "arguments")}
          options={CHECKLIST_OPTIONS}
        />

        {/* Content switching */}
        {activeTab === "arguments" ? (
          <ArgumentsCalculator />
        ) : (
          <>
            {/* Playbook Selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Selecione o Playbook
              </label>
              <Select value={selectedPlaybookId} onValueChange={handlePlaybookChange}>
                <SelectTrigger
                  className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-700 bg-gray-800 px-4 text-gray-100 transition-colors hover:bg-gray-700/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  disabled={isLoading}
                >
                  {selectedPlaybookId ? (
                    <span className="flex items-center gap-2">
                      {playbooks.find((p) => p.id === selectedPlaybookId)?.icon}{" "}
                      {playbooks.find((p) => p.id === selectedPlaybookId)?.name}
                    </span>
                  ) : (
                    <SelectValue
                      placeholder={isLoading ? "Carregando..." : "-- Escolha uma estratégia --"}
                    />
                  )}
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  {playbooks.map((playbook: Playbook) => (
                    <SelectItem
                      key={playbook.id}
                      value={playbook.id}
                      className="flex cursor-pointer items-center gap-2 py-2.5 text-gray-100 hover:bg-gray-700 focus:bg-gray-700 focus:text-white"
                    >
                      <span className="text-lg">{playbook.icon}</span>
                      <span>{playbook.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Checklist Content */}
            {selectedPlaybook && (
              <div className="space-y-4">
                {/* Progress indicator */}
                {totalRules > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${(checkedCount / totalRules) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">
                      {checkedCount}/{totalRules}
                    </span>
                  </div>
                )}

                {/* Rule Groups */}
                {selectedPlaybook.ruleGroups.length === 0 ? (
                  <p className="py-4 text-center text-gray-400">
                    Este playbook não possui regras configuradas.
                  </p>
                ) : (
                  <div className="custom-scrollbar max-h-96 space-y-4 overflow-y-auto pr-2">
                    {selectedPlaybook.ruleGroups.map((group: RuleGroup) => {
                      const isExitCriteria =
                        group.name.toLowerCase().includes("saída") ||
                        group.name.toLowerCase().includes("exit");

                      return (
                        <div key={group.id} className="space-y-2">
                          {/* Group Title */}
                          <div className="mt-2 flex items-center gap-3 py-2 first:mt-0">
                            <div className="h-px flex-1 bg-gray-700/50" />
                            <span
                              className={`text-xs font-bold tracking-widest uppercase ${
                                isExitCriteria ? "text-blue-400" : "text-green-500"
                              }`}
                            >
                              {group.name} {isExitCriteria && "(Informativo)"}
                            </span>
                            <div className="h-px flex-1 bg-gray-700/50" />
                          </div>

                          {/* Rules */}
                          {group.rules && group.rules.length > 0 ? (
                            <div className="space-y-2">
                              {group.rules.map((rule, index) => {
                                // If it's exit criteria, render as Info Card
                                if (isExitCriteria) {
                                  return (
                                    <div
                                      key={`${group.id}-${index}`}
                                      className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3"
                                    >
                                      <span className="mt-0.5 text-blue-400">ℹ️</span>
                                      <span className="text-sm text-gray-300">{rule}</span>
                                    </div>
                                  );
                                }

                                // Standard Checkbox Rule
                                const isChecked = checkedRules[group.id]?.[index] || false;
                                return (
                                  <div
                                    key={`${group.id}-${index}`}
                                    onClick={() => handleRuleToggle(group.id, index)}
                                    className={`group flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                                      isChecked
                                        ? "border-green-500/30 bg-green-500/10"
                                        : "border-white/5 bg-black/20 hover:border-green-500/40 hover:bg-black/30"
                                    }`}
                                  >
                                    <CustomCheckbox
                                      checked={isChecked}
                                      onChange={() => handleRuleToggle(group.id, index)}
                                      id={`rule-${group.id}-${index}`}
                                    />
                                    <span
                                      className={`flex-1 text-sm transition-colors duration-200 ${
                                        isChecked ? "text-white" : "text-gray-200"
                                      }`}
                                    >
                                      {rule}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="pl-4 text-sm text-gray-500 italic">
                              Nenhuma regra neste grupo
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!selectedPlaybook && (
              <div className="py-8 text-center">
                <div className="mb-3 text-4xl">📋</div>
                <p className="text-gray-400">Selecione um playbook para ver o checklist</p>
              </div>
            )}

            {/* Action Button */}
            <div className="border-t border-gray-700 pt-4">
              <Button
                variant="gradient-success"
                onClick={handleConfirm}
                disabled={!allRulesChecked}
                className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                  allRulesChecked
                    ? "opacity-100 shadow-lg shadow-emerald-500/20 hover:scale-[1.02]"
                    : "cursor-not-allowed opacity-50"
                }`}
              >
                {allRulesChecked ? "➕ Adicionar Trade" : "⏳ Complete o Checklist"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

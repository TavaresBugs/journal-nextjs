'use client';

import { useState, useEffect, useMemo } from 'react';
import { Modal, SegmentedToggle } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { CustomCheckbox } from './CustomCheckbox';
import { usePlaybookStore } from '@/store/usePlaybookStore';
import { ArgumentsCalculator } from './ArgumentsCalculator';
import type { Playbook, RuleGroup } from '@/types';

interface ChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTradeStart?: () => void;
}

const CHECKLIST_OPTIONS = [
    { value: 'rules', label: <>📋 Checklist & Regras</> },
    { value: 'arguments', label: <>⚖️ Argumentos</> }
];

export function ChecklistModal({ isOpen, onClose, onTradeStart }: ChecklistModalProps) {
    const { playbooks, loadPlaybooks, isLoading } = usePlaybookStore();
    
    // Tab State: 'rules' | 'arguments'
    const [activeTab, setActiveTab] = useState<'rules' | 'arguments'>('rules');

    // Selected playbook ID
    const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('');
    
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
        setSelectedPlaybookId('');
        setCheckedRules({});
        setActiveTab('rules'); // Reset tab
        onClose();
    };

    // Get selected playbook
    const selectedPlaybook = useMemo(() => {
        return playbooks.find(p => p.id === selectedPlaybookId) || null;
    }, [playbooks, selectedPlaybookId]);

    // Check if all rules are checked
    const allRulesChecked = useMemo(() => {
        if (!selectedPlaybook || selectedPlaybook.ruleGroups.length === 0) {
            return false;
        }

        return selectedPlaybook.ruleGroups.every((group: RuleGroup) => {
            // Ignore "Critérios de Saída" from validation as they are informational
            if (group.name.toLowerCase().includes('saída') || group.name.toLowerCase().includes('exit')) {
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
            const isExitCriteria = group.name.toLowerCase().includes('saída') || group.name.toLowerCase().includes('exit');
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
        setCheckedRules(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                [ruleIndex]: !prev[groupId]?.[ruleIndex]
            }
        }));
    };

    const handleConfirm = () => {
        if (onTradeStart) {
            onTradeStart();
        } else {
            console.log('Trade Liberado! 🚀');
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
                    onChange={(val) => setActiveTab(val as 'rules' | 'arguments')}
                    options={CHECKLIST_OPTIONS}
                />

                {/* Content switching */}
                {activeTab === 'arguments' ? (
                    <ArgumentsCalculator />
                ) : (
                    <>
                        {/* Playbook Selector */}
                        <div>
                           <label className="block text-sm font-medium text-gray-300 mb-2">
                                Selecione o Playbook
                            </label>
                            <select
                                value={selectedPlaybookId}
                                onChange={(e) => handlePlaybookChange(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                disabled={isLoading}
                            >
                                <option value="">
                                    {isLoading ? 'Carregando...' : '-- Escolha uma estratégia --'}
                                </option>
                                {playbooks.map((playbook: Playbook) => (
                                    <option key={playbook.id} value={playbook.id}>
                                        {playbook.icon} {playbook.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Checklist Content */}
                        {selectedPlaybook && (
                            <div className="space-y-4">
                                {/* Progress indicator */}
                                {totalRules > 0 && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
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
                                    <p className="text-gray-400 text-center py-4">
                                        Este playbook não possui regras configuradas.
                                    </p>
                                ) : (
                                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedPlaybook.ruleGroups.map((group: RuleGroup) => {
                                            const isExitCriteria = group.name.toLowerCase().includes('saída') || group.name.toLowerCase().includes('exit');
                                            
                                            return (
                                                <div key={group.id} className="space-y-2">
                                                    {/* Group Title */}
                                                    <div className="flex items-center gap-3 py-2 mt-2 first:mt-0">
                                                        <div className="flex-1 h-px bg-gray-700/50" />
                                                        <span className={`text-xs font-bold uppercase tracking-widest ${
                                                            isExitCriteria ? 'text-blue-400' : 'text-green-500'
                                                        }`}>
                                                            {group.name} {isExitCriteria && '(Informativo)'}
                                                        </span>
                                                        <div className="flex-1 h-px bg-gray-700/50" />
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
                                                                            className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                                                                        >
                                                                            <span className="text-blue-400 mt-0.5">ℹ️</span>
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
                                                                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 group ${
                                                                            isChecked
                                                                                ? 'bg-green-500/10 border-green-500/30'
                                                                                : 'bg-black/20 border-white/5 hover:border-green-500/40 hover:bg-black/30'
                                                                        }`}
                                                                    >
                                                                        <CustomCheckbox
                                                                            checked={isChecked}
                                                                            onChange={() => handleRuleToggle(group.id, index)}
                                                                            id={`rule-${group.id}-${index}`}
                                                                        />
                                                                        <span className={`text-sm flex-1 transition-colors duration-200 ${
                                                                            isChecked ? 'text-white' : 'text-gray-200'
                                                                        }`}>
                                                                            {rule}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 text-sm italic pl-4">
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
                            <div className="text-center py-8">
                                <div className="text-4xl mb-3">📋</div>
                                <p className="text-gray-400">
                                    Selecione um playbook para ver o checklist
                                </p>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-4 border-t border-gray-700">
                            <Button
                                variant="gradient-success"
                                onClick={handleConfirm}
                                disabled={!allRulesChecked}
                                className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                                    allRulesChecked 
                                        ? 'opacity-100 hover:scale-[1.02] shadow-lg shadow-emerald-500/20' 
                                        : 'opacity-50 cursor-not-allowed'
                                }`}
                            >
                                {allRulesChecked ? '➕ Adicionar Trade' : '⏳ Complete o Checklist'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

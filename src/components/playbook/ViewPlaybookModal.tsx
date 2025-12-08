'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { PlaybookReviewTab } from './PlaybookReviewTab';
import type { Playbook, Trade } from '@/types';

const PLAYBOOK_TABS = [
    { id: 'info', label: 'Info', icon: '📋' },
    { id: 'relatorios', label: 'Relatórios', icon: '📊' }
];

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
    currency = 'USD'
}: ViewPlaybookModalProps) {
    const [activeTab, setActiveTab] = useState('info');

    if (!playbook) return null;

    // Filter trades that match this playbook strategy
    const playbookTrades = trades.filter(t => t.strategy === playbook.name);

    const handleClose = () => {
        setActiveTab('info'); // Reset to info tab on close
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={handleClose} 
            title={`${playbook.icon} ${playbook.name}`} 
            maxWidth="5xl"
            headerActions={
                onEdit && activeTab === 'info' ? (
                    <Button
                        variant="gold"
                        size="sm"
                        onClick={() => {
                            onEdit(playbook);
                            handleClose();
                        }}
                        leftIcon={<span>✏️</span>}
                    >
                        Editar
                    </Button>
                ) : undefined
            }
        >
            <div className="space-y-6">
                {/* Description (if exists) */}
                {playbook.description && (
                    <p className="text-gray-400 text-sm leading-relaxed px-1">
                        {playbook.description}
                    </p>
                )}

                {/* Tabs */}
                <Tabs tabs={PLAYBOOK_TABS} activeTab={activeTab} onChange={setActiveTab} />

                {/* Tab: Info (Rules) */}
                <TabPanel value="info" activeTab={activeTab}>
                    <div>
                        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                            Regras do Playbook
                        </h4>
                        
                        <div className="space-y-4">
                            {playbook.ruleGroups?.map((group) => (
                                <div key={group.id} className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
                                    <div className="px-4 py-2 bg-gray-900/50 border-b border-gray-700 flex items-center gap-2">
                                        <span className="text-gray-500">☰</span>
                                        <span className="font-medium text-gray-200">{group.name}</span>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {group.rules.length > 0 ? (
                                            group.rules.map((rule, index) => (
                                                <div key={index} className="flex items-start gap-3 text-sm text-gray-300">
                                                    <span className="text-emerald-500 mt-0.5">✓</span>
                                                    <span className="leading-relaxed">{rule}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">Nenhuma regra definida.</p>
                                        )}
                                    </div>
                                </div>
                            ))}
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

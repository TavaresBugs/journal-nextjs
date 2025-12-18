'use client';

import { useState } from 'react';
import { Modal, GlassCard, IconActionButton, SegmentedToggle } from '@/components/ui';
import { TabPanel } from '@/components/ui/Tabs';
import { PlaybookReviewTab } from './PlaybookReviewTab';
import type { Playbook, Trade } from '@/types';

const GROUP_ICONS: Record<string, string> = {
    market: '📊',
    entry: '🎯',
    exit: '🏁',
};

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
                    <IconActionButton
                        variant="edit"
                        size="md"
                        onClick={() => {
                            onEdit(playbook);
                            handleClose();
                        }}
                        className="[&_svg]:w-6 [&_svg]:h-6"
                    />
                ) : undefined
            }
        >
            <div className="space-y-6 min-h-[500px] transition-all duration-300 ease-in-out">
                {/* Description (if exists) */}
                {playbook.description && (
                    <p className="text-gray-400 text-sm leading-relaxed px-1">
                        {playbook.description}
                    </p>
                )}

                {/* Tabs */}
                <SegmentedToggle
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { value: 'info', label: <>📋 Info</> },
                        { value: 'relatorios', label: <>📊 Relatórios</> }
                    ]}
                />

                {/* Tab: Info (Rules) */}
                <TabPanel value="info" activeTab={activeTab}>
                    <div>
                        <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                            Regras do Playbook
                        </h4>
                        
                        <div className="space-y-4">
                            {playbook.ruleGroups?.map((group) => (
                                <GlassCard key={group.id} className="bg-zorin-bg/30 border-white/5 overflow-hidden">
                                    <div className="px-4 py-2 bg-zorin-bg/50 border-b border-white/5 flex items-center gap-2">
                                        <span className="text-lg">{GROUP_ICONS[group.id] || '📋'}</span>
                                        <span className="font-medium text-gray-200">{group.name}</span>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {group.rules.length > 0 ? (
                                            group.rules.map((rule, index) => (
                                                <div key={index} className="flex items-start gap-3 text-sm text-gray-300">
                                                    <span className="text-zorin-accent mt-0.5">✓</span>
                                                    <span className="leading-relaxed">{rule}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">Nenhuma regra definida.</p>
                                        )}
                                    </div>
                                </GlassCard>
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

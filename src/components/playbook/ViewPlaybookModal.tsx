'use client';

import { Modal, Button } from '@/components/ui';
import type { Playbook } from '@/types';

interface ViewPlaybookModalProps {
    isOpen: boolean;
    onClose: () => void;
    playbook: Playbook | null;
    onEdit?: (playbook: Playbook) => void;
}

export function ViewPlaybookModal({ isOpen, onClose, playbook, onEdit }: ViewPlaybookModalProps) {
    if (!playbook) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`📖 ${playbook.name}`} maxWidth="2xl">
            <div className="space-y-6">
                {/* Header Info */}
                <div className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                    <div 
                        className="text-4xl p-3 rounded-xl bg-gray-900/50 border border-gray-700"
                        style={{ color: playbook.color }}
                    >
                        {playbook.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-100 mb-1">{playbook.name}</h3>
                        {playbook.description && (
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {playbook.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Rules */}
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

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        Fechar
                    </Button>
                    {onEdit && (
                        <Button
                            variant="primary"
                            onClick={() => {
                                onEdit(playbook);
                                onClose();
                            }}
                            leftIcon={<span>✏️</span>}
                        >
                            Editar Playbook
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}

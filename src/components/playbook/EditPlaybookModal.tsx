'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import { usePlaybookStore } from '@/store/usePlaybookStore';
import type { Playbook, RuleGroup } from '@/types';

interface EditPlaybookModalProps {
    isOpen: boolean;
    onClose: () => void;
    playbook: Playbook | null;
    onUpdatePlaybook: () => void;
}

const EMOJI_LIST = [
    '📈', '📉', '💰', '💵', '💲', '🎯', '🔥', '⚡', '🚀', '💎',
    '📊', '💸', '💹', '🏆', '⭐', '✨', '🎲', '🎰', '🔮', '📱',
    '💻', '⌚', '🔔', '📌', '📍', '🎪', '🎭', '🎨', '🎬', '🎸',
];

const COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
];

const DEFAULT_GROUPS = [
    { id: 'entry', name: 'Critérios de entrada' },
    { id: 'exit', name: 'Critérios de saída' },
    { id: 'market', name: 'Condições de mercado' },
];

export function EditPlaybookModal({ isOpen, onClose, playbook, onUpdatePlaybook }: EditPlaybookModalProps) {
    const { updatePlaybook } = usePlaybookStore();
    const [activeTab, setActiveTab] = useState<'general' | 'rules'>('general');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('📈');
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>([]);
    const [newRuleInputs, setNewRuleInputs] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (playbook) {
            setName(playbook.name);
            setDescription(playbook.description || '');
            setSelectedIcon(playbook.icon);
            setSelectedColor(playbook.color);
            setRuleGroups(playbook.ruleGroups && playbook.ruleGroups.length > 0 
                ? playbook.ruleGroups 
                : DEFAULT_GROUPS.map(g => ({ id: g.id, name: g.name, rules: [] }))
            );
        }
    }, [playbook]);

    const addRuleToGroup = (groupId: string) => {
        const ruleText = newRuleInputs[groupId]?.trim();
        if (ruleText) {
            setRuleGroups(ruleGroups.map(group => 
                group.id === groupId 
                    ? { ...group, rules: [...group.rules, ruleText] }
                    : group
            ));
            setNewRuleInputs({ ...newRuleInputs, [groupId]: '' });
        }
    };

    const removeRule = (groupId: string, ruleIndex: number) => {
        setRuleGroups(ruleGroups.map(group =>
            group.id === groupId
                ? { ...group, rules: group.rules.filter((_, i) => i !== ruleIndex) }
                : group
        ));
    };

    const handleSubmit = async () => {
        if (!playbook) return;

        setIsSaving(true);
        try {
            await updatePlaybook({
                ...playbook,
                name,
                description,
                icon: selectedIcon,
                color: selectedColor,
                ruleGroups,
            });
            onUpdatePlaybook();
            onClose();
        } catch (error) {
            console.error('Error updating playbook:', error);
            alert('Erro ao atualizar playbook. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="📖 Editar Playbook" maxWidth="3xl">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-3 font-medium transition-all ${
                        activeTab === 'general'
                            ? 'text-emerald-400 border-b-2 border-emerald-400'
                            : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                    Informações Gerais
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-6 py-3 font-medium transition-all ${
                        activeTab === 'rules'
                            ? 'text-emerald-400 border-b-2 border-emerald-400'
                            : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                    Regras do Playbook
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <p className="text-sm text-gray-400">
                        Edite as informações principais do seu playbook.
                    </p>

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Escolha um ícone
                        </label>
                        <div className="grid grid-cols-10 gap-2 p-4 bg-gray-800/30 rounded-lg border border-gray-700 max-h-40 overflow-y-auto">
                            {EMOJI_LIST.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => setSelectedIcon(emoji)}
                                    className={`text-2xl p-3 rounded-lg transition-all hover:bg-gray-700 ${
                                        selectedIcon === emoji
                                            ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                            : 'bg-gray-800/50 border-2 border-transparent'
                                    }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Escolha uma cor
                        </label>
                        <div className="flex gap-3">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-12 h-12 rounded-lg transition-all hover:scale-110 ${
                                        selectedColor === color ? 'ring-4 ring-white/50' : ''
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Playbook Name */}
                    <Input
                        label="Nome do playbook"
                        placeholder="Nomeie seu playbook de trading"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Descrição
                        </label>
                        <textarea
                            placeholder="Adicione uma descrição ao seu playbook de trading"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-vertical"
                        />
                    </div>
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-medium text-gray-300 mb-1">Regras do Playbook</h3>
                        <p className="text-sm text-gray-500">
                            Defina suas regras de playbook com agrupamento.
                        </p>
                    </div>

                    {/* Rule Groups */}
                    <div className="space-y-4">
                        {ruleGroups.map((group) => (
                            <div key={group.id} className="bg-gray-800/30 rounded-lg border border-gray-700 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">☰</span> {group.name}
                                    </h4>
                                </div>
                                <div className="space-y-2 mb-3">
                                    {group.rules.map((rule, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-gray-900/50 p-2 rounded group/rule">
                                            <span className="text-gray-500 text-xs">☰</span>
                                            <span className="flex-1 text-sm text-gray-300">{rule}</span>
                                            <button
                                                onClick={() => removeRule(group.id, index)}
                                                className="text-red-400 hover:text-red-300 text-sm opacity-0 group-hover/rule:opacity-100 transition-opacity"
                                            >
                                                🗑️ Deletar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Criar nova regra"
                                        value={newRuleInputs[group.id] || ''}
                                        onChange={(e) => setNewRuleInputs({ ...newRuleInputs, [group.id]: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && addRuleToGroup(group.id)}
                                        className="flex-1 px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <Button variant="ghost-success" size="sm" onClick={() => addRuleToGroup(group.id)}>
                                        + Criar nova regra
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-700">
                <Button
                    type="button"
                    variant="gradient-danger"
                    onClick={onClose}
                    className="flex-1 font-extrabold"
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    variant="gradient-success"
                    onClick={handleSubmit}
                    className="flex-1 font-extrabold"
                    disabled={!name.trim() || isSaving}
                >
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>
        </Modal>
    );
}

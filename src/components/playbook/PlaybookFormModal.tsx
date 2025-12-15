'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button, GlassCard } from '@/components/ui';
import { usePlaybookStore } from '@/store/usePlaybookStore';
import type { Playbook, RuleGroup } from '@/types';

interface PlaybookFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** If provided, modal is in edit mode. Otherwise, create mode. */
    playbook?: Playbook | null;
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
    { id: 'market', name: 'Condições de mercado' },
    { id: 'entry', name: 'Critérios de entrada' },
    { id: 'exit', name: 'Critérios de saída' },
];

/**
 * Unified modal for creating and editing playbooks.
 * Pass `playbook` prop for edit mode, omit for create mode.
 */
export function PlaybookFormModal({ isOpen, onClose, onSuccess, playbook }: PlaybookFormModalProps) {
    const { addPlaybook, updatePlaybook } = usePlaybookStore();
    const isEditMode = !!playbook;

    const [activeTab, setActiveTab] = useState<'general' | 'rules'>('general');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('📈');
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>(
        DEFAULT_GROUPS.map(g => ({ id: g.id, name: g.name, rules: [] }))
    );
    const [newRuleInputs, setNewRuleInputs] = useState<Record<string, string>>({});
    const [editingRule, setEditingRule] = useState<{groupId: string, index: number} | null>(null);
    const [editingRuleText, setEditingRuleText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Populate form when editing
    useEffect(() => {
        if (isEditMode && playbook && isOpen) {
            setName(playbook.name || '');
            setDescription(playbook.description || '');
            setSelectedIcon(playbook.icon || '📈');
            setSelectedColor(playbook.color || '#3B82F6');
            if (playbook.ruleGroups && playbook.ruleGroups.length > 0) {
                setRuleGroups(playbook.ruleGroups);
            } else {
                setRuleGroups(DEFAULT_GROUPS.map(g => ({ id: g.id, name: g.name, rules: [] })));
            }
            setActiveTab('general');
        }
    }, [playbook, isEditMode, isOpen]);

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

    const startEditingRule = (groupId: string, ruleIndex: number, currentText: string) => {
        setEditingRule({ groupId, index: ruleIndex });
        setEditingRuleText(currentText);
    };

    const saveEditingRule = () => {
        if (!editingRule || !editingRuleText.trim()) return;
        
        setRuleGroups(ruleGroups.map(group =>
            group.id === editingRule.groupId
                ? { 
                    ...group, 
                    rules: group.rules.map((rule, i) => 
                        i === editingRule.index ? editingRuleText.trim() : rule
                    )
                  }
                : group
        ));
        
        setEditingRule(null);
        setEditingRuleText('');
    };

    const cancelEditingRule = () => {
        setEditingRule(null);
        setEditingRuleText('');
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            if (isEditMode && playbook) {
                await updatePlaybook({
                    ...playbook,
                    name,
                    description,
                    icon: selectedIcon,
                    color: selectedColor,
                    ruleGroups,
                });
            } else {
                await addPlaybook({
                    userId: '', // Will be set by the store
                    name,
                    description,
                    icon: selectedIcon,
                    color: selectedColor,
                    ruleGroups,
                });
            }
            handleReset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving playbook:', error);
            alert('Erro ao salvar playbook. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setName('');
        setDescription('');
        setSelectedIcon('📈');
        setSelectedColor('#3B82F6');
        setRuleGroups(DEFAULT_GROUPS.map(g => ({ id: g.id, name: g.name, rules: [] })));
        setNewRuleInputs({});
        setActiveTab('general');
    };

    const modalTitle = isEditMode ? '✏️ Editar Playbook' : '📖 Criar Playbook';
    const submitButtonText = isSaving ? 'Salvando...' : (isEditMode ? 'Atualizar Playbook' : 'Salvar Playbook');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} maxWidth="3xl">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/5">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-6 py-3 font-medium transition-all ${
                        activeTab === 'general'
                            ? 'text-zorin-accent border-b-2 border-zorin-accent'
                            : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                    Informações Gerais
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-6 py-3 font-medium transition-all ${
                        activeTab === 'rules'
                            ? 'text-zorin-accent border-b-2 border-zorin-accent'
                            : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                    Regras do Playbook
                </button>
            </div>

            {/* General Tab */}
            {activeTab === 'general' && (
                <div className="space-y-6">
                    <p className="text-sm text-gray-400">
                        Escolha um ícone ou imagem e nomeie seu playbook de trading para começar.
                    </p>

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Escolha um ícone
                        </label>
                        <GlassCard className="grid grid-cols-10 gap-2 p-4 bg-zorin-bg/30 border-white/5 max-h-40 overflow-y-auto custom-scrollbar">
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
                        </GlassCard>
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
                            className="w-full px-4 py-2.5 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-zorin-accent resize-vertical transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Rules Tab */}
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
                            <GlassCard key={group.id} className="bg-zorin-bg/30 border-white/5 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <span className="text-gray-500">☰</span> {group.name}
                                    </h4>
                                </div>
                                <div className="space-y-2 mb-3">
                                    {group.rules.map((rule, index) => {
                                        const isEditing = editingRule?.groupId === group.id && editingRule?.index === index;
                                        
                                        return (
                                            <div key={index} className="flex items-center gap-2 bg-zorin-bg/50 p-2 rounded group/rule border border-white/5">
                                                <span className="text-gray-500 text-xs">☰</span>
                                                
                                                {isEditing ? (
                                                    <>
                                                        <Input
                                                            type="text"
                                                            value={editingRuleText}
                                                            onChange={(e) => setEditingRuleText(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && saveEditingRule()}
                                                            className="flex-1 h-8 text-sm"
                                                            autoFocus
                                                        />
                                                        <Button variant="zorin-primary" size="sm" onClick={saveEditingRule} className="text-xs px-3 py-1 font-semibold">
                                                            Salvar
                                                        </Button>
                                                        <Button variant="zorin-ghost" size="sm" onClick={cancelEditingRule} className="text-xs px-2 py-1">
                                                            ✕
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="flex-1 text-sm text-gray-300">{rule}</span>
                                                        <Button
                                                            variant="zorin-ghost"
                                                            size="icon"
                                                            onClick={() => startEditingRule(group.id, index, rule)}
                                                            className="w-6 h-6 text-xs text-yellow-500 hover:text-yellow-400"
                                                            title="Editar"
                                                        >
                                                            ✏️
                                                        </Button>
                                                        <Button
                                                            variant="zorin-ghost"
                                                            size="icon"
                                                            onClick={() => removeRule(group.id, index)}
                                                            className="w-6 h-6 text-xs text-red-500 hover:text-red-400"
                                                            title="Deletar"
                                                        >
                                                            🗑️
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        placeholder="Criar nova regra"
                                        value={newRuleInputs[group.id] || ''}
                                        onChange={(e) => setNewRuleInputs({ ...newRuleInputs, [group.id]: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && addRuleToGroup(group.id)}
                                        className="flex-1 h-10"
                                    />
                                    <Button variant="zorin-primary" size="sm" onClick={() => addRuleToGroup(group.id)}>
                                        + Criar nova regra
                                    </Button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-700">
                <Button
                    type="button"
                    variant="gradient-danger"
                    onClick={() => {
                        handleReset();
                        onClose();
                    }}
                    className="flex-1 font-extrabold"
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    variant="zorin-primary"
                    onClick={handleSubmit}
                    className="flex-1 font-extrabold"
                    disabled={!name.trim() || isSaving}
                >
                    {submitButtonText}
                </Button>
            </div>
        </Modal>
    );
}

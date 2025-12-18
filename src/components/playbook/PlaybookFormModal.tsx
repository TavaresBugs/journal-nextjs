'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button, GlassCard, IconActionButton, SegmentedToggle, ModalFooterActions } from '@/components/ui';
import { usePlaybookStore } from '@/store/usePlaybookStore';
import type { Playbook, RuleGroup } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlaybookFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** If provided, modal is in edit mode. Otherwise, create mode. */
    playbook?: Playbook | null;
    /** Called when back button is pressed (to return to view modal) */
    onBack?: () => void;
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

const GROUP_ICONS: Record<string, string> = {
    market: '📊', // Análise/Condições
    entry: '🎯',  // Gatilho/Entrada
    exit: '🏁',   // Saída/Alvo
};

/**
 * Internal type for rule items with unique IDs for dnd-kit
 */
interface SortableRule {
    id: string;
    text: string;
}

interface SortableRuleGroup {
    id: string;
    name: string;
    rules: SortableRule[];
}

// --- Sortable Item Component ---

interface SortableRuleItemProps {
    rule: SortableRule;
    isEditing: boolean;
    editingText: string;
    onEditStart: () => void;
    onEditCancel: () => void;
    onEditSave: () => void;
    onEditTextChange: (text: string) => void;
    onDelete: () => void;
}

function SortableRuleItem({
    rule,
    isEditing,
    editingText,
    onEditStart,
    onEditCancel,
    onEditSave,
    onEditTextChange,
    onDelete
}: SortableRuleItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: rule.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`flex items-center gap-2 bg-zorin-bg/50 p-2 rounded group/rule border border-white/5 ${isDragging ? 'shadow-lg border-zorin-accent/50' : ''}`}
        >
            {/* Drag Handle */}
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-move text-gray-500 hover:text-gray-300 p-1 touch-none"
            >
                ☰
            </div>

            {isEditing ? (
                <>
                    <Input
                        type="text"
                        value={editingText}
                        onChange={(e) => onEditTextChange(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onEditSave()}
                        className="flex-1 h-8 text-sm"
                        autoFocus
                    />
                    <Button variant="zorin-primary" size="sm" onClick={onEditSave} className="text-xs px-3 py-1 font-semibold">
                        Salvar
                    </Button>
                    <Button variant="zorin-ghost" size="sm" onClick={onEditCancel} className="text-xs px-2 py-1">
                        ✕
                    </Button>
                </>
            ) : (
                <>
                    <span className="flex-1 text-sm text-gray-300">{rule.text}</span>
                    <IconActionButton
                        variant="edit"
                        size="sm"
                        onClick={onEditStart}
                    />
                    <IconActionButton
                        variant="delete"
                        size="sm"
                        onClick={onDelete}
                    />
                </>
            )}
        </div>
    );
}

// --- Main Modal Component ---

export function PlaybookFormModal({ isOpen, onClose, onSuccess, playbook, onBack }: PlaybookFormModalProps) {
    const { addPlaybook, updatePlaybook } = usePlaybookStore();
    const isEditMode = !!playbook;

    const [activeTab, setActiveTab] = useState<'general' | 'rules'>('general');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('📈');
    const [selectedColor, setSelectedColor] = useState('#3B82F6');
    
    // Use local state with IDs for DnD
    const [sortableGroups, setSortableGroups] = useState<SortableRuleGroup[]>([]);
    
    const [newRuleInputs, setNewRuleInputs] = useState<Record<string, string>>({});
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [editingRuleText, setEditingRuleText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Populate form when editing
    useEffect(() => {
        if (isOpen) {
            if (isEditMode && playbook) {
                setName(playbook.name || '');
                setDescription(playbook.description || '');
                setSelectedIcon(playbook.icon || '📈');
                setSelectedColor(playbook.color || '#3B82F6');
                
                // Convert simple string rules into SortableRules with IDs
                if (playbook.ruleGroups && playbook.ruleGroups.length > 0) {
                    setSortableGroups(playbook.ruleGroups.map(g => ({
                        id: g.id,
                        name: g.name,
                        rules: g.rules.map(ruleText => ({
                            id: Math.random().toString(36).substr(2, 9),
                            text: ruleText
                        }))
                    })));
                } else {
                    initializeDefaultGroups();
                }
            } else {
                // Create mode: Reset everything
                handleReset();
            }
            setActiveTab('general');
        }
    }, [playbook, isEditMode, isOpen]); // removed handleReset from deps to avoid loop

    const initializeDefaultGroups = () => {
        setSortableGroups(DEFAULT_GROUPS.map(g => ({ 
            id: g.id, 
            name: g.name, 
            rules: [] 
        })));
    };

    const addRuleToGroup = (groupId: string) => {
        const ruleText = newRuleInputs[groupId]?.trim();
        if (ruleText) {
            const newRule: SortableRule = {
                id: Math.random().toString(36).substr(2, 9),
                text: ruleText
            };

            setSortableGroups(groups => groups.map(group => 
                group.id === groupId 
                    ? { ...group, rules: [...group.rules, newRule] }
                    : group
            ));
            setNewRuleInputs({ ...newRuleInputs, [groupId]: '' });
        }
    };

    const removeRule = (groupId: string, ruleId: string) => {
        setSortableGroups(groups => groups.map(group =>
            group.id === groupId
                ? { ...group, rules: group.rules.filter(r => r.id !== ruleId) }
                : group
        ));
    };

    const startEditingRule = (ruleId: string, currentText: string) => {
        setEditingRuleId(ruleId);
        setEditingRuleText(currentText);
    };

    const saveEditingRule = (groupId: string) => {
        if (!editingRuleId || !editingRuleText.trim()) return;
        
        setSortableGroups(groups => groups.map(group =>
            group.id === groupId
                ? { 
                    ...group, 
                    rules: group.rules.map(rule => 
                        rule.id === editingRuleId ? { ...rule, text: editingRuleText.trim() } : rule
                    )
                  }
                : group
        ));
        
        setEditingRuleId(null);
        setEditingRuleText('');
    };

    const cancelEditingRule = () => {
        setEditingRuleId(null);
        setEditingRuleText('');
    };

    // Drag and Drop Logic
    const handleDragEnd = (event: DragEndEvent, groupId: string) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setSortableGroups((groups) => {
                return groups.map(group => {
                    if (group.id !== groupId) return group;

                    const oldIndex = group.rules.findIndex((r) => r.id === active.id);
                    const newIndex = group.rules.findIndex((r) => r.id === over?.id);

                    return {
                        ...group,
                        rules: arrayMove(group.rules, oldIndex, newIndex)
                    };
                });
            });
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            // Convert SortableGroups back to clean RuleGroups (string arrays)
            const cleanRuleGroups: RuleGroup[] = sortableGroups.map(g => ({
                id: g.id,
                name: g.name,
                rules: g.rules.map(r => r.text)
            }));

            if (isEditMode && playbook) {
                await updatePlaybook({
                    ...playbook,
                    name,
                    description,
                    icon: selectedIcon,
                    color: selectedColor,
                    ruleGroups: cleanRuleGroups, // Use cleaned groups
                });
            } else {
                await addPlaybook({
                    userId: '', // Will be set by the store
                    name,
                    description,
                    icon: selectedIcon,
                    color: selectedColor,
                    ruleGroups: cleanRuleGroups,
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
        initializeDefaultGroups();
        setNewRuleInputs({});
        setActiveTab('general');
        setEditingRuleId(null);
    };

    const modalTitle = isEditMode ? '✏️ Editar Playbook' : '📖 Criar Playbook';
    const submitButtonText = isSaving ? 'Salvando...' : (isEditMode ? 'Atualizar Playbook' : 'Salvar Playbook');

    const handleBackClick = () => {
        handleReset();
        if (onBack) {
            onBack();
        } else {
            onClose();
        }
    };

    const titleElement = (
        <div className="flex items-center gap-3">
            <IconActionButton
                variant="back"
                onClick={handleBackClick}
            />
            <h2 className="text-xl font-bold text-gray-100">{modalTitle}</h2>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={titleElement} maxWidth="3xl">
            {/* Segmented Toggle Control */}
            <SegmentedToggle
                value={activeTab}
                onChange={(val: string) => setActiveTab(val as 'general' | 'rules')}
                options={[
                    { value: 'general', label: '📋 Informações Gerais' },
                    { value: 'rules', label: '📜 Regras do Playbook' }
                ]}
                className="mb-8"
            />

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
                            Defina suas regras de playbook com agrupamento e arraste para organizar.
                        </p>
                    </div>

                    {/* Rule Groups */}
                    <div className="space-y-4">
                        {sortableGroups.map((group) => (
                            <GlassCard key={group.id} className="bg-zorin-bg/30 border-white/5 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                        <span className="text-lg">{GROUP_ICONS[group.id] || '📋'}</span> {group.name}
                                    </h4>
                                </div>
                                <div className="space-y-2 mb-3">
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={(event) => handleDragEnd(event, group.id)}
                                    >
                                        <SortableContext 
                                            items={group.rules.map(r => r.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {group.rules.map((rule) => (
                                                <SortableRuleItem
                                                    key={rule.id}
                                                    rule={rule}
                                                    isEditing={editingRuleId === rule.id}
                                                    editingText={editingRuleText}
                                                    onEditStart={() => startEditingRule(rule.id, rule.text)}
                                                    onEditCancel={cancelEditingRule}
                                                    onEditSave={() => saveEditingRule(group.id)}
                                                    onEditTextChange={setEditingRuleText}
                                                    onDelete={() => removeRule(group.id, rule.id)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="text"
                                        placeholder="Criar nova regra"
                                        value={newRuleInputs[group.id] || ''}
                                        onChange={(e) => setNewRuleInputs({ ...newRuleInputs, [group.id]: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && addRuleToGroup(group.id)}
                                        className="flex-1 h-10"
                                    />
                                    <Button variant="zorin-primary" size="md" onClick={() => addRuleToGroup(group.id)}>
                                        + Criar nova regra
                                    </Button>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer Buttons */}
            {/* Footer Buttons */}
            <ModalFooterActions
                onPrimary={handleSubmit}
                onSecondary={() => {
                    handleReset();
                    onClose();
                }}
                primaryLabel={submitButtonText}
                primaryVariant="zorin-primary"
                disabled={!name.trim() || isSaving}
                isFullWidth
            />
        </Modal>
    );
}

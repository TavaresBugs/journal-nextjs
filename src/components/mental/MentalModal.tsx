'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { saveMentalLog, type MentalLog } from '@/services/mentalService';

interface MentalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (log: MentalLog) => void;
}

type MoodTag = 'fear' | 'greed' | 'fomo' | 'tilt' | 'revenge' | 'hesitation' | 'overconfidence' | 'other';

interface MoodOption {
    value: MoodTag;
    label: string;
    emoji: string;
    description: string;
}

const MOOD_OPTIONS: MoodOption[] = [
    { value: 'fear', label: 'Medo', emoji: '😰', description: 'Medo de perder, de entrar, de sair' },
    { value: 'greed', label: 'Ganância', emoji: '🤑', description: 'Querer mais, não respeitar alvos' },
    { value: 'fomo', label: 'FOMO', emoji: '😱', description: 'Medo de ficar de fora' },
    { value: 'tilt', label: 'Tilt', emoji: '🤬', description: 'Raiva, frustração, descontrole' },
    { value: 'revenge', label: 'Revenge', emoji: '😤', description: 'Querer recuperar perdas' },
    { value: 'hesitation', label: 'Hesitação', emoji: '🤔', description: 'Dúvida, paralisia na decisão' },
    { value: 'overconfidence', label: 'Excesso de Confiança', emoji: '😎', description: 'Arrogância após ganhos' },
    { value: 'other', label: 'Outro', emoji: '💭', description: 'Outro bloqueio mental' },
];

const STEPS = [
    { id: 0, title: 'Qual é o sentimento?', subtitle: 'Identifique o bloqueio mental' },
    { id: 1, title: 'Descreva o Problema', subtitle: 'O que você está sentindo? O que quer fazer?' },
    { id: 2, title: 'Validação', subtitle: 'Por que esse sentimento faz sentido?' },
    { id: 3, title: 'A Falha', subtitle: 'Onde está o erro nessa lógica?' },
    { id: 4, title: 'A Correção', subtitle: 'Qual é a verdade lógica?' },
    { id: 5, title: 'Reforço', subtitle: 'Por que a correção está certa?' },
    { id: 6, title: 'Sua Verdade', subtitle: 'Respire fundo e internalize' },
];

export function MentalModal({ isOpen, onClose, onSave }: MentalModalProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [moodTag, setMoodTag] = useState<MoodTag | null>(null);
    const [step1, setStep1] = useState('');
    const [step2, setStep2] = useState('');
    const [step3, setStep3] = useState('');
    const [step4, setStep4] = useState('');
    const [step5, setStep5] = useState('');

    const resetForm = () => {
        setCurrentStep(0);
        setMoodTag(null);
        setStep1('');
        setStep2('');
        setStep3('');
        setStep4('');
        setStep5('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleMoodSelect = (mood: MoodTag) => {
        setMoodTag(mood);
        setCurrentStep(1);
    };

    const handleNext = () => {
        if (currentStep < 6) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0: return moodTag !== null;
            case 1: return step1.trim().length > 0;
            case 2: return step2.trim().length > 0;
            case 3: return step3.trim().length > 0;
            case 4: return step4.trim().length > 0;
            case 5: return step5.trim().length > 0;
            default: return true;
        }
    };

    const handleSave = async () => {
        if (!moodTag) return;
        
        setIsSaving(true);
        try {
            const log = await saveMentalLog({
                moodTag,
                step1Problem: step1,
                step2Validation: step2,
                step3Flaw: step3,
                step4Correction: step4,
                step5Logic: step5,
            });
            
            if (log && onSave) {
                onSave(log);
            }
            
            handleClose();
        } catch (error) {
            console.error('Error saving mental log:', error);
            alert('Erro ao salvar. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const getCurrentValue = () => {
        switch (currentStep) {
            case 1: return step1;
            case 2: return step2;
            case 3: return step3;
            case 4: return step4;
            case 5: return step5;
            default: return '';
        }
    };

    const setCurrentValue = (value: string) => {
        switch (currentStep) {
            case 1: setStep1(value); break;
            case 2: setStep2(value); break;
            case 3: setStep3(value); break;
            case 4: setStep4(value); break;
            case 5: setStep5(value); break;
        }
    };

    const selectedMood = MOOD_OPTIONS.find(m => m.value === moodTag);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="2xl">
            <div className="relative">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-green-500 transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / 6) * 100}%` }}
                    />
                </div>

                {/* Header with mood badge */}
                <div className="pt-6 pb-4 text-center">
                    {selectedMood && currentStep > 0 && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-black/30 border border-gray-700 rounded-full text-sm text-gray-300 mb-3">
                            <span>{selectedMood.emoji}</span>
                            <span>{selectedMood.label}</span>
                        </span>
                    )}
                    <h2 className="text-2xl font-bold text-gray-100 mb-1">
                        {STEPS[currentStep].title}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {STEPS[currentStep].subtitle}
                    </p>
                </div>

                {/* Content area with transition */}
                <div className="min-h-[320px] transition-all duration-300">
                    
                    {/* Step 0: Mood Selection */}
                    {currentStep === 0 && (
                        <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                            {MOOD_OPTIONS.map((mood) => (
                                <button
                                    key={mood.value}
                                    onClick={() => handleMoodSelect(mood.value)}
                                    className={`p-4 rounded-xl border text-left transition-all duration-200 group
                                        ${moodTag === mood.value 
                                            ? 'bg-green-500/10 border-green-500/40' 
                                            : 'bg-black/20 border-white/5 hover:border-green-500/40 hover:bg-black/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{mood.emoji}</span>
                                        <div>
                                            <div className="font-semibold text-gray-100 group-hover:text-green-400 transition-colors">
                                                {mood.label}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {mood.description}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Steps 1-5: Textarea input */}
                    {currentStep >= 1 && currentStep <= 5 && (
                        <div className="animate-fadeIn">
                            <textarea
                                value={getCurrentValue()}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                placeholder={getPlaceholder(currentStep)}
                                className="w-full h-64 p-4 bg-black/20 border border-white/5 rounded-xl text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 transition-all"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                {getHint(currentStep)}
                            </p>
                        </div>
                    )}

                    {/* Step 6: Calm Card - Summary */}
                    {currentStep === 6 && (
                        <div className="animate-fadeIn space-y-6">
                            {/* The Calm Card */}
                            <div className="relative p-6 bg-green-500/10 border-2 border-green-500/40 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                    SUA VERDADE LÓGICA
                                </div>
                                <p className="text-lg text-gray-100 leading-relaxed mt-2">
                                    &ldquo;{step4}&rdquo;
                                </p>
                            </div>

                            {/* Breathing prompt */}
                            <div className="text-center space-y-3">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 animate-pulse">
                                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-400 text-sm">
                                    Respire fundo. Leia sua correção novamente.
                                </p>
                                <p className="text-green-400 text-sm font-medium">
                                    Você está no controle agora.
                                </p>
                            </div>

                            {/* Summary of reframing */}
                            <div className="p-4 bg-black/20 border border-white/5 rounded-xl space-y-2">
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Reforço</div>
                                <p className="text-gray-300 text-sm">{step5}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-800 mt-6">
                    <div>
                        {currentStep > 0 && (
                            <Button
                                variant="secondary"
                                onClick={handleBack}
                                className="px-6"
                            >
                                ← Voltar
                            </Button>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {currentStep > 0 && currentStep < 6 && (
                            <span>Passo {currentStep} de 5</span>
                        )}
                    </div>

                    <div>
                        {currentStep > 0 && currentStep < 6 && (
                            <button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                                    canProceed()
                                        ? 'bg-[#00c853] hover:bg-[#00e676] text-white'
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Próximo →
                            </button>
                        )}
                        {currentStep === 6 && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`px-8 py-2 rounded-lg font-semibold transition-all duration-200 ${
                                    isSaving
                                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#00c853] hover:bg-[#00e676] text-white'
                                }`}
                            >
                                {isSaving ? 'Salvando...' : '✓ Salvar e Fechar'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}

// Helper functions for step-specific content
function getPlaceholder(step: number): string {
    switch (step) {
        case 1: return 'Descreva o que está sentindo agora. O que você quer fazer? Seja honesto consigo mesmo...';
        case 2: return 'Por que faz sentido você estar sentindo isso? Valide seu sentimento...';
        case 3: return 'Onde está o erro nessa lógica? O que você está ignorando?';
        case 4: return 'Qual é a verdade lógica? O que você deveria fazer de diferente?';
        case 5: return 'Por que essa correção está certa? Reforce a nova lógica...';
        default: return '';
    }
}

function getHint(step: number): string {
    switch (step) {
        case 1: return 'Identifique o problema sem julgamento. Apenas descreva.';
        case 2: return 'Todo sentimento vem de algum lugar. Reconheça sua origem.';
        case 3: return 'Procure a falha no raciocínio emocional.';
        case 4: return 'Esta será sua "verdade" para reler quando precisar.';
        case 5: return 'Consolidar a lógica ajuda a internalizá-la.';
        default: return '';
    }
}

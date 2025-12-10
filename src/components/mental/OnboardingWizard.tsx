'use client';

/**
 * OnboardingWizard Component
 * 
 * Cold start experience for new Mental Hub users.
 * Allows users to seed their profiles based on their
 * primary trading challenge (Fear, Greed, Tilt, or All).
 */

import React, { useState } from 'react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GlassCardFooter } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useMentalHub } from '@/hooks/useMentalHub';

interface OnboardingWizardProps {
    onComplete?: () => void;
}

type OnboardingOption = 'fear' | 'greed' | 'tilt' | 'all';

const ONBOARDING_OPTIONS: Array<{
    id: OnboardingOption;
    emoji: string;
    title: string;
    description: string;
}> = [
    {
        id: 'fear',
        emoji: '😨',
        title: 'Medo / Hesitação',
        description: 'Perco oportunidades por duvidar demais',
    },
    {
        id: 'greed',
        emoji: '🤑',
        title: 'Ganância / FOMO',
        description: 'Entro em trades que não devia por medo de perder',
    },
    {
        id: 'tilt',
        emoji: '😡',
        title: 'Raiva / Tilt',
        description: 'Perco o controle após trades ruins',
    },
    {
        id: 'all',
        emoji: '🚀',
        title: 'Quero tudo',
        description: 'Importar o pack completo de perfis',
    },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const { seedProfiles, isLoading, error } = useMentalHub();
    const [selectedOption, setSelectedOption] = useState<OnboardingOption | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const handleOptionClick = (option: OnboardingOption) => {
        setSelectedOption(option);
    };

    const handleConfirm = async () => {
        if (!selectedOption) return;

        setIsSeeding(true);
        const success = await seedProfiles(selectedOption);
        setIsSeeding(false);

        if (success) {
            setIsComplete(true);
            // Delay before calling onComplete to show success state
            setTimeout(() => {
                onComplete?.();
            }, 1500);
        }
    };

    // Success state
    if (isComplete) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <GlassCard className="w-full max-w-md text-center" glow>
                    <GlassCardContent className="py-12">
                        <div className="text-6xl mb-4 animate-bounce">✅</div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            Perfis Importados!
                        </h2>
                        <p className="text-gray-400">
                            Seu Mental Hub está pronto para uso.
                        </p>
                    </GlassCardContent>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-2xl" glow>
                <GlassCardHeader>
                    <GlassCardTitle icon={<span className="text-2xl">🧠</span>}>
                        Calibrando seu Mental Hub
                    </GlassCardTitle>
                </GlassCardHeader>

                <GlassCardContent>
                    <p className="text-gray-300 mb-6">
                        Olá! Para começar a mapear seu jogo mental, 
                        qual é o seu <strong className="text-[#00c853]">maior desafio</strong> hoje?
                    </p>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {ONBOARDING_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleOptionClick(option.id)}
                                className={`
                                    p-4 rounded-xl border text-left transition-all duration-300
                                    ${selectedOption === option.id
                                        ? 'bg-[#00c853]/20 border-[#00c853] shadow-lg shadow-green-500/20'
                                        : 'bg-black/20 border-white/10 hover:border-white/20 hover:bg-black/30'
                                    }
                                `}
                            >
                                <div className="text-3xl mb-2">{option.emoji}</div>
                                <h3 className={`font-bold mb-1 ${
                                    selectedOption === option.id ? 'text-[#00c853]' : 'text-white'
                                }`}>
                                    {option.title}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    {option.description}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}
                </GlassCardContent>

                <GlassCardFooter>
                    <Button
                        variant="zorin-primary"
                        size="lg"
                        onClick={handleConfirm}
                        disabled={!selectedOption || isSeeding || isLoading}
                        isLoading={isSeeding}
                    >
                        {isSeeding ? 'Importando...' : 'Confirmar e Começar'}
                    </Button>
                </GlassCardFooter>
            </GlassCard>
        </div>
    );
}

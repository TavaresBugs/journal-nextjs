"use client";

/**
 * OnboardingWizard Component
 *
 * Cold start experience for new Mental Hub users.
 * Allows users to seed their profiles based on their
 * primary trading challenge (Fear, Greed, Tilt, or All).
 */

import React, { useState } from "react";
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassCardFooter,
} from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useMentalHub } from "@/hooks/useMentalHub";

interface OnboardingWizardProps {
  onComplete?: () => void;
}

type OnboardingOption = "fear" | "greed" | "tilt" | "all";

const ONBOARDING_OPTIONS: Array<{
  id: OnboardingOption;
  emoji: string;
  title: string;
  description: string;
}> = [
  {
    id: "fear",
    emoji: "😨",
    title: "Medo / Hesitação",
    description: "Perco oportunidades por duvidar demais",
  },
  {
    id: "greed",
    emoji: "🤑",
    title: "Ganância / FOMO",
    description: "Entro em trades que não devia por medo de perder",
  },
  {
    id: "tilt",
    emoji: "😡",
    title: "Raiva / Tilt",
    description: "Perco o controle após trades ruins",
  },
  {
    id: "all",
    emoji: "🚀",
    title: "Quero tudo",
    description: "Importar o pack completo de perfis",
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
            <div className="mb-4 animate-bounce text-6xl">✅</div>
            <h2 className="mb-2 text-2xl font-bold text-white">Perfis Importados!</h2>
            <p className="text-gray-400">Seu Mental Hub está pronto para uso.</p>
          </GlassCardContent>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <GlassCard className="w-full max-w-2xl" glow>
        <GlassCardHeader>
          <GlassCardTitle icon={<span className="text-2xl">🧠</span>}>
            Calibrando seu Mental Hub
          </GlassCardTitle>
        </GlassCardHeader>

        <GlassCardContent>
          <p className="mb-6 text-gray-300">
            Olá! Para começar a mapear seu jogo mental, qual é o seu{" "}
            <strong className="text-zorin-accent">maior desafio</strong> hoje?
          </p>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ONBOARDING_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className={`rounded-xl border p-4 text-left transition-all duration-300 ${
                  selectedOption === option.id
                    ? "bg-zorin-accent/20 border-zorin-accent shadow-zorin-accent/20 shadow-lg"
                    : "bg-zorin-bg/30 hover:bg-zorin-bg/50 border-white/10 hover:border-white/20"
                } `}
              >
                <div className="mb-2 text-3xl">{option.emoji}</div>
                <h3
                  className={`mb-1 font-bold ${
                    selectedOption === option.id ? "text-zorin-accent" : "text-white"
                  }`}
                >
                  {option.title}
                </h3>
                <p className="text-sm text-gray-400">{option.description}</p>
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300">
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
            {isSeeding ? "Importando..." : "Confirmar e Começar"}
          </Button>
        </GlassCardFooter>
      </GlassCard>
    </div>
  );
}

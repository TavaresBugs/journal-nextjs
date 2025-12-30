"use client";

import { useState, useEffect } from "react";
import { Modal, GlassCard, SegmentedToggle } from "@/components/ui";
import { saveMentalLogAction } from "@/app/actions/mental";
import { getEmotionalProfilesAction } from "@/app/actions/emotionalProfile";
import type { MentalLog } from "@/lib/database/repositories/MentalRepository";
import type { EmotionalProfile } from "@/lib/database/repositories/EmotionalProfileRepository";
import { PerformanceGauge } from "./PerformanceGauge";
import { MentalGrid } from "./MentalGrid";
import { EmotionalProfileCard } from "./EmotionalProfileCard";
import { EmotionalProfileView } from "./EmotionalProfileView";

interface MentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (log: MentalLog) => void;
}

type TabId = "wizard" | "diary" | "profiles";
type MoodTag =
  | "fear"
  | "greed"
  | "fomo"
  | "tilt"
  | "revenge"
  | "hesitation"
  | "overconfidence"
  | "other";

interface MoodOption {
  value: MoodTag;
  label: string;
  emoji: string;
  description: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { value: "fear", label: "Medo", emoji: "😰", description: "Medo de perder, de entrar, de sair" },
  {
    value: "greed",
    label: "Ganância",
    emoji: "🤑",
    description: "Querer mais, não respeitar alvos",
  },
  { value: "fomo", label: "FOMO", emoji: "😱", description: "Medo de ficar de fora" },
  { value: "tilt", label: "Tilt", emoji: "🤬", description: "Raiva, frustração, descontrole" },
  { value: "revenge", label: "Revenge", emoji: "😤", description: "Querer recuperar perdas" },
  {
    value: "hesitation",
    label: "Hesitação",
    emoji: "🤔",
    description: "Dúvida, paralisia na decisão",
  },
  {
    value: "overconfidence",
    label: "Excesso de Confiança",
    emoji: "😎",
    description: "Arrogância após ganhos",
  },
  { value: "other", label: "Outro", emoji: "💭", description: "Outro bloqueio mental" },
];

const WIZARD_STEPS = [
  {
    id: 0,
    title: "Qual é o sentimento?",
    subtitle: "Identifique o bloqueio mental que está enfrentando agora",
  },
  {
    id: 1,
    title: "Descreva o Problema",
    subtitle: "O que você está sentindo? O que quer fazer? Seja honesto e específico",
  },
  {
    id: 2,
    title: "Validação",
    subtitle: "Por que faz sentido você estar sentindo isso? Valide sua emoção sem julgamento",
  },
  {
    id: 3,
    title: "A Falha",
    subtitle: "Onde está o erro nessa lógica? O que você está ignorando ou exagerando?",
  },
  {
    id: 4,
    title: "A Correção",
    subtitle: "Qual é a verdade lógica? Escreva o pensamento racional que substitui a emoção",
  },
  {
    id: 5,
    title: "Reforço",
    subtitle: "Por que essa correção está certa? Reforce com evidências e argumentos",
  },
  { id: 6, title: "Sua Verdade", subtitle: "Respire fundo e internalize sua nova perspectiva" },
];

// Profiles Tab Component
function ProfilesTab({ refreshTrigger }: { refreshTrigger: number }) {
  const [profiles, setProfiles] = useState<EmotionalProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<EmotionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[ProfilesTab] Loading profiles...");
      const data = await getEmotionalProfilesAction();
      console.log("[ProfilesTab] Loaded profiles:", data?.length);
      setProfiles(data);
      if (data.length === 0) {
        setError("Nenhum perfil retornado. Verifique o console do servidor.");
      }
    } catch (err) {
      console.error("[ProfilesTab] Error loading profiles:", err);
      setError("Erro ao carregar perfis");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [refreshTrigger]);

  const handleProfileSaved = async () => {
    const data = await getEmotionalProfilesAction();
    setProfiles(data);
  };

  if (selectedProfile) {
    return (
      <div className="animate-fadeIn">
        <EmotionalProfileView
          profile={selectedProfile}
          onBack={() => setSelectedProfile(null)}
          onSave={handleProfileSaved}
        />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-4">
        <h3 className="text-sm font-bold tracking-wider text-gray-300 uppercase">
          Perfis Emocionais
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Clique em um perfil para configurar seus gatilhos e padrões
        </p>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Carregando...</div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">{error}</p>
          <button
            onClick={loadProfiles}
            className="mt-3 rounded-lg bg-white/5 px-4 py-2 text-gray-300 transition-colors hover:bg-white/10"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {profiles.map((profile) => (
            <EmotionalProfileCard
              key={profile.id}
              profile={profile}
              onClick={() => setSelectedProfile(profile)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MentalModal({ isOpen, onClose, onSave }: MentalModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("wizard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [moodTag, setMoodTag] = useState<MoodTag | null>(null);
  const [step1, setStep1] = useState("");
  const [step2, setStep2] = useState("");
  const [step3, setStep3] = useState("");
  const [step4, setStep4] = useState("");
  const [step5, setStep5] = useState("");

  const resetForm = () => {
    setCurrentStep(0);
    setMoodTag(null);
    setStep1("");
    setStep2("");
    setStep3("");
    setStep4("");
    setStep5("");
  };

  const handleClose = () => {
    resetForm();
    setActiveTab("wizard");
    onClose();
  };

  const handleMoodSelect = (mood: MoodTag) => {
    setMoodTag(mood);
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return moodTag !== null;
      case 1:
        return step1.trim().length > 0;
      case 2:
        return step2.trim().length > 0;
      case 3:
        return step3.trim().length > 0;
      case 4:
        return step4.trim().length > 0;
      case 5:
        return step5.trim().length > 0;
      default:
        return true;
    }
  };

  const handleSave = async () => {
    if (!moodTag) return;
    setIsSaving(true);
    try {
      const result = await saveMentalLogAction({
        moodTag,
        step1Problem: step1,
        step2Validation: step2,
        step3Flaw: step3,
        step4Correction: step4,
        step5Logic: step5,
      });

      if (result.success && result.log) {
        if (onSave) onSave(result.log);
        setRefreshTrigger((prev) => prev + 1); // Refresh gauge/grid
        handleClose();
      } else {
        throw new Error(result.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Error saving mental log:", error);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentValue = () => {
    switch (currentStep) {
      case 1:
        return step1;
      case 2:
        return step2;
      case 3:
        return step3;
      case 4:
        return step4;
      case 5:
        return step5;
      default:
        return "";
    }
  };

  const setCurrentValue = (value: string) => {
    switch (currentStep) {
      case 1:
        setStep1(value);
        break;
      case 2:
        setStep2(value);
        break;
      case 3:
        setStep3(value);
        break;
      case 4:
        setStep4(value);
        break;
      case 5:
        setStep5(value);
        break;
    }
  };

  const selectedMood = MOOD_OPTIONS.find((m) => m.value === moodTag);

  const TABS_OPTIONS = [
    { value: "wizard", label: <>🧠 Análise do Momento</> },
    { value: "diary", label: <>📊 Análise Psicológica</> },
    { value: "profiles", label: <>👤 Perfis Emocionais</> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="4xl">
      <div className="min-h-[500px]">
        {/* Tabs Navigation */}
        <SegmentedToggle
          options={TABS_OPTIONS}
          value={activeTab}
          onChange={(val) => setActiveTab(val as TabId)}
        />

        <div className="mt-6">
          {/* Tab Content */}
          <div className="relative">
            {/* Tab 1: Wizard */}
            {activeTab === "wizard" && (
              <div className="animate-fadeIn">
                {/* Progress Bar - Only show when wizard has started */}
                {currentStep > 0 && (
                  <div className="mb-6 h-1 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="bg-zorin-accent h-full transition-all duration-500 ease-out"
                      style={{ width: `${(currentStep / 6) * 100}%` }}
                    />
                  </div>
                )}

                {/* Header with mood badge */}
                <div className="pb-4">
                  {/* Mood badge - centered */}
                  {selectedMood && currentStep > 0 && (
                    <div className="mb-3 text-center">
                      <span className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-black/30 px-3 py-1 text-sm text-gray-300">
                        <span>{selectedMood.emoji}</span>
                        <span>{selectedMood.label}</span>
                      </span>
                    </div>
                  )}

                  {/* Title row with arrows at edges */}
                  <div className="flex items-center justify-between">
                    {/* Back Arrow - Red (IconActionButton style) */}
                    <button
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className={`rounded-lg p-3 text-gray-400 transition-colors ${
                        currentStep > 0 ? "hover:bg-red-500/10 hover:text-red-400" : "invisible"
                      }`}
                      title="Voltar"
                      aria-label="Voltar"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-100">
                      {WIZARD_STEPS[currentStep].title}
                    </h2>

                    {/* Next Arrow - Green (IconActionButton style) */}
                    <button
                      onClick={handleNext}
                      disabled={currentStep === 0 || currentStep >= 6 || !canProceed()}
                      className={`rounded-lg p-3 text-gray-400 transition-colors ${
                        currentStep > 0 && currentStep < 6 && canProceed()
                          ? "hover:bg-green-500/10 hover:text-green-400"
                          : currentStep > 0 && currentStep < 6
                            ? "cursor-not-allowed text-gray-600"
                            : "invisible"
                      }`}
                      title="Próximo"
                      aria-label="Próximo"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>

                  {/* Subtitle */}
                  <p className="mt-1 text-center text-sm text-gray-400">
                    {WIZARD_STEPS[currentStep].subtitle}
                  </p>
                </div>

                {/* Content */}
                <div>
                  {/* Step 0: Mood Selection */}
                  {currentStep === 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {MOOD_OPTIONS.map((mood) => (
                        <button
                          key={mood.value}
                          onClick={() => handleMoodSelect(mood.value)}
                          className="group text-left"
                        >
                          <GlassCard
                            className={`h-full p-4 transition-all duration-200 ${
                              moodTag === mood.value
                                ? "bg-zorin-accent/10 border-zorin-accent/40 ring-zorin-accent/20 ring-1"
                                : "hover:bg-zorin-bg/50 hover:border-zorin-accent/20"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{mood.emoji}</span>
                              <div>
                                <div className="group-hover:text-zorin-accent font-semibold text-gray-100 transition-colors">
                                  {mood.label}
                                </div>
                                <div className="text-xs text-gray-500">{mood.description}</div>
                              </div>
                            </div>
                          </GlassCard>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Steps 1-5: Textarea */}
                  {currentStep >= 1 && currentStep <= 5 && (
                    <div>
                      <textarea
                        value={getCurrentValue()}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        placeholder={getPlaceholder(currentStep, moodTag)}
                        className="focus:border-zorin-primary/50 focus:ring-zorin-primary/30 h-56 w-full resize-none rounded-xl border border-white/5 bg-black/20 p-4 text-gray-100 placeholder-gray-500 backdrop-blur-sm transition-all focus:ring-1 focus:outline-none"
                        autoFocus
                      />
                      {/* Hint centered + Step indicator right */}
                      <div className="relative mt-3">
                        <p className="text-center text-xs text-gray-500">{getHint(currentStep)}</p>
                        <span className="absolute top-0 right-0 text-base font-medium text-gray-400">
                          Passo {currentStep} de 5
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Calm Card */}
                  {currentStep === 6 && (
                    <div className="space-y-6">
                      <div className="relative rounded-2xl border-2 border-green-500/40 bg-green-500/10 p-6 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                        <div className="absolute -top-3 left-6 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                          SUA VERDADE LÓGICA
                        </div>
                        <p className="mt-2 text-lg leading-relaxed text-gray-100">
                          &ldquo;{step4}&rdquo;
                        </p>
                      </div>
                      <div className="space-y-3 text-center">
                        <div className="inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full border border-green-500/30 bg-green-500/20">
                          <svg
                            className="h-8 w-8 text-green-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-400">
                          Respire fundo. Leia sua correção novamente.
                        </p>
                        <p className="text-sm font-medium text-green-400">
                          Você está no controle agora.
                        </p>
                      </div>
                      <div className="space-y-2 rounded-xl border border-white/5 bg-black/20 p-4">
                        <div className="text-xs tracking-wider text-gray-500 uppercase">
                          Reforço
                        </div>
                        <p className="text-sm text-gray-300">{step5}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button - Only on Step 6 */}
                {currentStep === 6 && (
                  <div className="mt-6 flex justify-center border-t border-gray-800 pt-6">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`rounded-lg px-8 py-2 font-semibold transition-all duration-200 ${
                        isSaving
                          ? "cursor-not-allowed bg-gray-700 text-gray-500"
                          : "bg-zorin-accent hover:bg-zorin-accent/90 text-black"
                      }`}
                    >
                      {isSaving ? "Salvando..." : "✓ Salvar e Fechar"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Diary & Performance */}
            {activeTab === "diary" && (
              <div className="animate-fadeIn space-y-6">
                {/* Performance Gauge */}
                <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                  <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-300 uppercase">
                    Curva de Stress (Últimos 5 registros)
                  </h3>
                  <PerformanceGauge refreshTrigger={refreshTrigger} />
                </div>

                {/* Mental Grid */}
                <MentalGrid
                  refreshTrigger={refreshTrigger}
                  onEntryChange={() => setRefreshTrigger((prev) => prev + 1)}
                />
              </div>
            )}

            {/* Tab 3: Profiles */}
            {activeTab === "profiles" && <ProfilesTab refreshTrigger={refreshTrigger} />}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Helper functions
function getPlaceholder(step: number, mood: MoodTag | null): string {
  const examples: Record<MoodTag, Record<number, string>> = {
    fear: {
      1: "Ex: Estou com medo de entrar no trade porque posso perder dinheiro...",
      2: "Ex: Faz sentido ter medo porque já perdi antes e ainda estou me recuperando...",
      3: "Ex: Estou ignorando que o setup está alinhado e que segui meu plano...",
      4: "Ex: Seguir o plano é o que importa. Um loss não define minha competência...",
      5: "Ex: Porque estatisticamente trades bem executados geram lucro consistente...",
    },
    greed: {
      1: "Ex: Quero aumentar a posição porque está dando muito certo...",
      2: "Ex: Faz sentido querer mais, afinal estou ganhando e parece fácil...",
      3: "Ex: Estou ignorando que ganância já me fez devolver lucros antes...",
      4: "Ex: Respeitar meus alvos e stops é o que protege meu capital...",
      5: "Ex: Porque disciplina consistente gera resultados melhores que ganância...",
    },
    fomo: {
      1: "Ex: Estou vendo o mercado subir e sinto que preciso entrar agora...",
      2: "Ex: Faz sentido ter FOMO, ninguém quer perder oportunidades...",
      3: "Ex: Estou ignorando que entrar sem setup é apostar, não operar...",
      4: "Ex: Sempre haverá novas oportunidades. Paciência é minha vantagem...",
      5: "Ex: Porque operar apenas setups do meu plano me protege de erros...",
    },
    tilt: {
      1: "Ex: Estou com raiva porque perdi um trade que não deveria ter perdido...",
      2: "Ex: Faz sentido estar irritado, me dediquei e não deu certo...",
      3: "Ex: Estou ignorando que operar irritado só piora a situação...",
      4: "Ex: Preciso pausar e recuperar meu equilíbrio antes de operar...",
      5: "Ex: Porque decisões tomadas com raiva são sempre ruins no trading...",
    },
    revenge: {
      1: "Ex: Preciso recuperar o que perdi AGORA, vou aumentar a mão...",
      2: "Ex: Faz sentido querer recuperar, foi uma perda injusta...",
      3: "Ex: Estou ignorando que revenge trading é a causa de quebras...",
      4: "Ex: Aceitar losses faz parte. Recupero com disciplina, não com pressa...",
      5: "Ex: Porque a pressa para recuperar sempre gera mais perdas...",
    },
    hesitation: {
      1: "Ex: O setup apareceu mas não consegui clicar, fiquei paralisado...",
      2: "Ex: Faz sentido hesitar, errar dói e quero ter certeza...",
      3: "Ex: Estou ignorando que hesitação me faz perder bons trades...",
      4: "Ex: Confiar no processo e executar. A análise já foi feita...",
      5: "Ex: Porque executar o plano é meu trabalho, não prever o futuro...",
    },
    overconfidence: {
      1: "Ex: Estou me sentindo invencível, tudo que faço dá certo...",
      2: "Ex: Faz sentido estar confiante, afinal estou ganhando...",
      3: "Ex: Estou ignorando que excesso de confiança precede grandes quedas...",
      4: "Ex: Manter a humildade e seguir o processo independente dos resultados...",
      5: "Ex: Porque o mercado não respeita egos, apenas disciplina...",
    },
    other: {
      1: "Ex: Descreva o que está sentindo neste momento...",
      2: "Ex: Explique por que faz sentido você se sentir assim...",
      3: "Ex: Onde está o erro no seu raciocínio atual?",
      4: "Ex: Qual seria a forma mais racional de pensar sobre isso?",
      5: "Ex: Por que essa nova perspectiva é mais correta?",
    },
  };

  if (!mood || !examples[mood] || !examples[mood][step]) {
    return "Descreva seus pensamentos aqui...";
  }

  return examples[mood][step];
}

function getHint(step: number): string {
  switch (step) {
    case 1:
      return "Identifique o problema sem julgamento. Apenas descreva.";
    case 2:
      return "Todo sentimento vem de algum lugar. Reconheça sua origem.";
    case 3:
      return "Procure a falha no raciocínio emocional.";
    case 4:
      return 'Esta será sua "verdade" para reler quando precisar.';
    case 5:
      return "Consolidar a lógica ajuda a internalizá-la.";
    default:
      return "";
  }
}

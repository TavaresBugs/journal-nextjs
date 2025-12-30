"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { saveEmotionalProfileAction } from "@/app/actions/emotionalProfile";
import type { EmotionalProfile } from "@/lib/database/repositories/EmotionalProfileRepository";
import { Play, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { EmotionType } from "@/lib/database/repositories";

interface EmotionalProfileViewProps {
  profile: EmotionalProfile;
  onBack: () => void;
  onSave: () => void;
}

export function EmotionalProfileView({ profile, onBack, onSave }: EmotionalProfileViewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstSign: profile.firstSign || "",
    correctiveActions: profile.correctiveActions || "",
    injectingLogic: profile.injectingLogic || "",
    triggers: profile.triggers.join("\n"), // Edit as multiline text
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const triggersArray = formData.triggers
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const result = await saveEmotionalProfileAction(profile.emotionType as EmotionType, {
        firstSign: formData.firstSign,
        correctiveActions: formData.correctiveActions,
        injectingLogic: formData.injectingLogic,
        triggers: triggersArray,
      });

      if (result.success) {
        onSave();
        onBack();
      } else {
        alert("Erro ao salvar perfil: " + result.error);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Erro ao salvar perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const emotionColors: Record<string, string> = {
    fear: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    greed: "text-green-400 border-green-500/30 bg-green-500/10",
    fomo: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    tilt: "text-red-400 border-red-500/30 bg-red-500/10",
    revenge: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    default: "text-gray-400 border-gray-500/30 bg-gray-500/10",
  };

  const themeClass = emotionColors[profile.emotionType] || emotionColors.default;

  return (
    <div className="animate-fadeIn space-y-4">
      {/* Header */}
      <GlassCard className={`border-l-4 p-4 ${themeClass.split(" ")[1]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10"
            >
              ←
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-100 capitalize">
                {profile.emotionType} Profile
              </h2>
              <p className="text-sm text-gray-500">
                Ocorrências: {profile.occurrenceCount} | Última:{" "}
                {profile.lastOccurrence
                  ? new Date(profile.lastOccurrence).toLocaleDateString()
                  : "Nunca"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`rounded-lg px-4 py-2 font-medium transition-all ${
              isSaving
                ? "cursor-not-allowed bg-gray-700 text-gray-500"
                : "bg-zorin-accent hover:bg-zorin-accent/90 text-black"
            }`}
          >
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* First Signs */}
        <GlassCard className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertTriangle size={20} />
            <h3 className="text-sm font-bold tracking-wider uppercase">Primeiros Sinais</h3>
          </div>
          <p className="text-xs text-gray-500">
            Como você sabe que está entrando neste estado emocional? Sinais físicos ou mentais.
          </p>
          <textarea
            value={formData.firstSign}
            onChange={(e) => handleChange("firstSign", e.target.value)}
            className="focus:ring-zorin-accent focus:border-zorin-accent/50 h-32 w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-gray-200 outline-none focus:ring-1"
            placeholder="Ex: Coração acelerado, vontade de clicar rápido..."
          />
        </GlassCard>

        {/* Triggers */}
        <GlassCard className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-orange-400">
            <Zap size={20} />
            <h3 className="text-sm font-bold tracking-wider uppercase">Gatilhos</h3>
          </div>
          <p className="text-xs text-gray-500">
            O que costuma disparar essa emoção? (Um por linha)
          </p>
          <textarea
            value={formData.triggers}
            onChange={(e) => handleChange("triggers", e.target.value)}
            className="focus:ring-zorin-accent focus:border-zorin-accent/50 h-32 w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-gray-200 outline-none focus:ring-1"
            placeholder="Ex: Perder um trade ganho&#10;Ver o mercado andar sem mim..."
          />
        </GlassCard>

        {/* Injecting Logic (The antidote) */}
        <GlassCard className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-blue-400">
            <ShieldCheck size={20} />
            <h3 className="text-sm font-bold tracking-wider uppercase">Lógica Corretiva</h3>
          </div>
          <p className="text-xs text-gray-500">Qual a verdade racional que desmonta essa emoção?</p>
          <textarea
            value={formData.injectingLogic}
            onChange={(e) => handleChange("injectingLogic", e.target.value)}
            className="focus:ring-zorin-accent focus:border-zorin-accent/50 h-32 w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-gray-200 outline-none focus:ring-1"
            placeholder="Ex: O mercado é neutro. Uma perda não muda minha capacidade..."
          />
        </GlassCard>

        {/* Corrective Actions */}
        <GlassCard className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-green-400">
            <Play size={20} />
            <h3 className="text-sm font-bold tracking-wider uppercase">Ações Imediatas</h3>
          </div>
          <p className="text-xs text-gray-500">
            O que você deve fazer FISICAMENTE quando sentir isso?
          </p>
          <textarea
            value={formData.correctiveActions}
            onChange={(e) => handleChange("correctiveActions", e.target.value)}
            className="focus:ring-zorin-accent focus:border-zorin-accent/50 h-32 w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-gray-200 outline-none focus:ring-1"
            placeholder="Ex: Levantar da cadeira por 2 min. Beber água. Respirar fundo..."
          />
        </GlassCard>
      </div>
    </div>
  );
}

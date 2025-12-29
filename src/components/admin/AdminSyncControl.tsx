"use client";

import { useState } from "react";
import { useToast } from "@/providers/ToastProvider";
import { triggerGithubSyncAction } from "@/app/actions/admin";

export function AdminSyncControl() {
  const [loading, setLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSync = async (workflow: "calendar" | "monthly") => {
    setLoading(workflow);
    try {
      showToast(
        `Iniciando sincronização ${workflow === "calendar" ? "Semanal" : "Mensal"}...`,
        "loading"
      );

      const result = await triggerGithubSyncAction(workflow);

      if (result.success) {
        showToast(
          `Sincronização ${workflow === "calendar" ? "Semanal" : "Mensal"} iniciada! check o GitHub.`,
          "success"
        );
      } else {
        showToast(`Erro ao iniciar sincronização: ${result.error}`, "error");
      }
    } catch (err) {
      showToast("Erro inesperado ao conectar com GitHub.", "error");
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Sincronização Manual</h3>
          <p className="text-sm text-gray-400">
            Dispare workflows do GitHub Actions manualmente para atualizar dados.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSync("calendar")}
            disabled={!!loading}
            className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {loading === "calendar" ? "Iniciando..." : "📅 Sync Semanal"}
          </button>
          <button
            onClick={() => handleSync("monthly")}
            disabled={!!loading}
            className="flex items-center gap-2 rounded-lg border border-blue-900/50 bg-blue-900/20 px-4 py-2 text-sm font-medium text-blue-200 hover:bg-blue-900/40 disabled:opacity-50"
          >
            {loading === "monthly" ? "Iniciando..." : "🗓️ Sync Mensal"}
          </button>
        </div>
      </div>
    </div>
  );
}

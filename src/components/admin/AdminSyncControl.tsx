"use client";

import { useState } from "react";
import { useToast } from "@/providers/ToastProvider";
import { triggerGithubSyncAction, deleteWeeklyEventsAction } from "@/app/actions/admin";

export function AdminSyncControl() {
  const [loading, setLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSync = async (workflow: "calendar" | "monthly" | "history") => {
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

  const handleDeleteWeekly = async () => {
    if (
      !window.confirm("Isso apagará TODOS os eventos desta semana do banco de dados. Tem certeza?")
    ) {
      return;
    }

    setLoading("delete");
    try {
      showToast("Limpando eventos da semana...", "loading");
      const result = await deleteWeeklyEventsAction();

      if (result.success) {
        showToast(`Sucesso! ${result.deletedCount} eventos removidos.`, "success");
      } else {
        showToast(`Erro ao limpar: ${result.error}`, "error");
      }
    } catch (err) {
      showToast("Erro inesperado ao limpar dados.", "error");
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleHistorySync = async () => {
    if (!window.confirm("Isso dispará um Workflow no GitHub (demora ~5min). Continuar?")) {
      return;
    }

    setLoading("history");
    try {
      showToast("Iniciando workflow de histórico no GitHub...", "loading");

      const result = await triggerGithubSyncAction("history");

      if (result.success) {
        showToast("Workflow de Histórico iniciado! Cheque a aba Actions no GitHub.", "success");
      } else {
        showToast(`Erro ao iniciar workflow: ${result.error}`, "error");
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
          <h3 className="text-lg font-semibold text-white">Sincronização & Manutenção</h3>
          <p className="text-sm text-gray-400">Gerencie dados do calendário (GitHub ou Local).</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSync("calendar")}
            disabled={!!loading}
            className="group flex items-center gap-2 rounded-lg border border-green-900/50 bg-green-900/20 px-4 py-2 text-sm font-medium text-green-200 hover:bg-green-900/40 disabled:opacity-50"
            title="Sincronizar Semana (GitHub)"
          >
            <span className="opacity-70 group-hover:opacity-100">📅</span>
            <span className="hidden sm:inline">Sync Semanal</span>
          </button>

          <button
            onClick={() => handleSync("monthly")}
            disabled={!!loading}
            className="group flex items-center gap-2 rounded-lg border border-blue-900/50 bg-blue-900/20 px-4 py-2 text-sm font-medium text-blue-200 hover:bg-blue-900/40 disabled:opacity-50"
            title="Sincronizar Mês (GitHub)"
          >
            <span className="opacity-70 group-hover:opacity-100">🗓️</span>
            <span className="hidden sm:inline">Sync Mensal</span>
          </button>

          <button
            onClick={handleHistorySync}
            disabled={!!loading}
            className="group flex items-center gap-2 rounded-lg border border-purple-900/50 bg-purple-900/20 px-4 py-2 text-sm font-medium text-purple-200 hover:bg-purple-900/40 disabled:opacity-50"
            title="Sincronizar Histórico Anual (GitHub)"
          >
            <span className="opacity-70 group-hover:opacity-100">🗄️</span>
            <span className="hidden sm:inline">Histórico</span>
          </button>

          <button
            onClick={handleDeleteWeekly}
            disabled={!!loading}
            className="group flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-900/40 disabled:opacity-50"
            title="Apagar dados da semana atual"
          >
            <span className="opacity-70 group-hover:opacity-100">🗑️</span>
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

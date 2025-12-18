import React from "react";

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

interface ImportStepReviewProps {
  status: "importing" | "complete";
  stats: ImportStats;
  onClose: () => void;
}

export const ImportStepReview: React.FC<ImportStepReviewProps> = ({ status, stats, onClose }) => {
  if (status === "importing") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-4 h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
        <p className="font-medium text-gray-300">Importando trades...</p>
        <p className="mt-2 text-sm text-gray-500">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  // Complete status
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
        <svg
          className="h-8 w-8 text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="mb-2 text-xl font-bold text-white">Importação Concluída</h3>
      <div className="mx-auto mt-4 max-w-sm space-y-2 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Processado:</span>
          <span className="font-medium text-white">{stats.total}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Sucesso:</span>
          <span className="font-medium text-emerald-400">{stats.success}</span>
        </div>
        {stats.skipped > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Duplicados (Pularam):</span>
            <span className="font-medium text-yellow-400">{stats.skipped}</span>
          </div>
        )}
        {stats.failed > 0 && (
          <div className="mt-2 flex justify-between border-t border-gray-700 pt-2 text-sm">
            <span className="text-gray-400">Falhas:</span>
            <span className="font-medium text-red-400">{stats.failed}</span>
          </div>
        )}
      </div>
      <div className="mt-8">
        <button
          onClick={onClose}
          className="rounded-lg bg-cyan-600 px-8 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-900/20 transition-colors hover:bg-cyan-500"
        >
          Concluir
        </button>
      </div>
    </div>
  );
};

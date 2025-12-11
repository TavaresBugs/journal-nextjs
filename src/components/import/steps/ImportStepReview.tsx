import React from 'react';

interface ImportStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
}

interface ImportStepReviewProps {
  status: 'importing' | 'complete';
  stats: ImportStats;
  onClose: () => void;
}

export const ImportStepReview: React.FC<ImportStepReviewProps> = ({ status, stats, onClose }) => {

    if (status === 'importing') {
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-gray-300 font-medium">Importando trades...</p>
            <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
          </div>
        );
    }

    // Complete status
    return (
        <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 mb-6">
            <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Importação Concluída</h3>
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700 max-w-sm mx-auto space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Processado:</span>
                <span className="text-white font-medium">{stats.total}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Sucesso:</span>
                <span className="text-emerald-400 font-medium">{stats.success}</span>
            </div>
            {stats.skipped > 0 && (
                <div className="flex justify-between text-sm">
                <span className="text-gray-400">Duplicados (Pularam):</span>
                <span className="text-yellow-400 font-medium">{stats.skipped}</span>
                </div>
            )}
            {stats.failed > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-gray-700 mt-2">
                <span className="text-gray-400">Falhas:</span>
                <span className="text-red-400 font-medium">{stats.failed}</span>
                </div>
            )}
        </div>
            <div className="mt-8">
            <button
            onClick={onClose}
            className="px-8 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors shadow-lg shadow-cyan-900/20"
            >
            Concluir
            </button>
        </div>
        </div>
    );
};

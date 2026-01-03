"use client";

import { createPortal } from "react-dom";
import { GlassCard } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/trading";
import type { Trade } from "@/types";

interface LinkTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTrades: Trade[];
  onSelectTrade: (trade: Trade) => void;
}

export function LinkTradeModal({
  isOpen,
  onClose,
  availableTrades,
  onSelectTrade,
}: LinkTradeModalProps) {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <GlassCard className="bg-zorin-bg w-full max-w-md overflow-hidden border-white/10 p-0 shadow-2xl">
        <div className="bg-zorin-surface/50 flex items-center justify-between border-b border-white/5 p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-cyan-400">
            🔗 Vincular Trade
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-gray-400 transition-colors hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <p className="mb-4 text-sm text-gray-400">
            Selecione um trade do dia para vincular a este diário:
          </p>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {availableTrades.length > 0 ? (
              availableTrades.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTrade(t)}
                  className="bg-zorin-bg/50 hover:bg-zorin-surface/50 hover:border-zorin-accent/50 group w-full rounded-lg border border-white/5 p-3 text-left transition-all"
                >
                  <div className="mb-1 flex items-start justify-between">
                    <span className="font-bold text-gray-200">{t.symbol}</span>
                    <span
                      className={`font-bold ${
                        t.pnl && t.pnl >= 0 ? "text-zorin-accent" : "text-red-400"
                      }`}
                    >
                      {formatCurrency(t.pnl || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span
                        className={`flex items-center gap-1 ${
                          t.type === "Long" ? "text-zorin-accent" : "text-red-400"
                        }`}
                      >
                        {t.type}
                        {t.type === "Long" ? (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                          </svg>
                        ) : (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                            <polyline points="17 18 23 18 23 12"></polyline>
                          </svg>
                        )}
                      </span>
                      <span className="text-gray-400">@ {t.entryPrice}</span>
                    </span>
                    <span>
                      {(() => {
                        // Dados já estão armazenados como horário NY
                        const timeFormatted = t.entryTime ? t.entryTime.substring(0, 5) : "";
                        return `${timeFormatted} (NY)`;
                      })()}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-700 bg-gray-800/20 p-8 text-center">
                <div className="mb-3 text-4xl opacity-30">🔍</div>
                <h4 className="mb-1 font-medium text-gray-300">Nenhum trade encontrado</h4>
                <p className="text-xs text-gray-500">
                  Não há trades nesta data disponíveis para vínculo.
                </p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>,
    document.body
  );
}

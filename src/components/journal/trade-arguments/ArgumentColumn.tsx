"use client";

import { useState } from "react";
import type { TradeArgument } from "@/types";

interface ArgumentColumnProps {
  type: "pro" | "contra";
  title: string;
  icon: string;
  color: "green" | "red";
  arguments: TradeArgument[];
  onAdd: (argument: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const colorClasses = {
  green: {
    bg: "bg-green-900/30",
    border: "border-green-700/50",
    button: "bg-green-600 hover:bg-green-700",
    text: "text-green-400",
    badge: "bg-green-500",
  },
  red: {
    bg: "bg-red-900/30",
    border: "border-red-700/50",
    button: "bg-red-600 hover:bg-red-700",
    text: "text-red-400",
    badge: "bg-red-500",
  },
};

export function ArgumentColumn({
  type,
  title,
  icon,
  color,
  arguments: args,
  onAdd,
  onRemove,
  isLoading = false,
}: ArgumentColumnProps) {
  const [inputValue, setInputValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const colors = colorClasses[color];

  const handleAdd = async () => {
    if (!inputValue.trim() || isAdding) return;

    setIsAdding(true);
    try {
      await onAdd(inputValue.trim());
      setInputValue("");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    setDeletingId(id);
    try {
      await onRemove(id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={`${colors.bg} ${colors.border} rounded-lg border p-4`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-gray-100">
          <span>{icon}</span>
          {title}
        </h3>
        <span className={`${colors.badge} rounded-full px-2 py-1 text-sm font-bold text-white`}>
          {args.length}
        </span>
      </div>

      {/* Lista de Argumentos */}
      <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
        {args.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500 italic">
            Nenhum argumento adicionado.
          </p>
        ) : (
          args.map((arg) => (
            <div
              key={arg.id}
              className={`group flex items-start justify-between gap-2 rounded-md bg-gray-800/50 p-3 ${
                deletingId === arg.id ? "opacity-50" : ""
              }`}
            >
              <p className="flex-1 text-sm text-gray-200">{arg.argument}</p>
              <button
                onClick={() => handleRemove(arg.id)}
                disabled={deletingId === arg.id}
                className="text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                title="Remover argumento"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Input para Adicionar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Adicionar ${type === "pro" ? "pró" : "contra"}...`}
          maxLength={500}
          className="flex-1 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          disabled={isAdding || isLoading}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim() || isAdding || isLoading}
          className={`${colors.button} rounded-md p-2 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
          title="Adicionar argumento"
        >
          {isAdding ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </button>
      </div>

      {/* Character counter */}
      {inputValue.length > 0 && (
        <p className="mt-1 text-right text-xs text-gray-500">{inputValue.length}/500</p>
      )}
    </div>
  );
}

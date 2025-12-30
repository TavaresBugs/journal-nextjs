"use client";

import { useState, useEffect, useCallback } from "react";
import type { TradeArgument } from "@/types";
import { useToast } from "@/providers/ToastProvider";
import {
  getTradeArgumentsAction,
  addTradeArgumentAction,
  removeTradeArgumentAction,
} from "@/app/actions/trade-arguments";
import { ArgumentColumn } from "./ArgumentColumn";
import { ResultadoDisplay } from "./ResultadoDisplay";

interface TradeArgumentsAccordionProps {
  journalEntryId: string;
  initialArguments?: TradeArgument[];
  /** Controlled expansion state (optional - internal state used if not provided) */
  isExpanded?: boolean;
  /** Callback when expansion state changes */
  onExpandChange?: (expanded: boolean) => void;
}

// Graph icon SVG component
function GraphIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

// Chevron icon SVG component
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function TradeArgumentsAccordion({
  journalEntryId,
  initialArguments = [],
  isExpanded: controlledExpanded,
  onExpandChange,
}: TradeArgumentsAccordionProps) {
  const { showToast } = useToast();
  // Internal state used when not controlled
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Use controlled or internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setIsExpanded = (expanded: boolean) => {
    if (onExpandChange) {
      onExpandChange(expanded);
    } else {
      setInternalExpanded(expanded);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [proArgs, setProArgs] = useState<TradeArgument[]>(
    initialArguments.filter((a) => a.type === "pro")
  );
  const [contraArgs, setContraArgs] = useState<TradeArgument[]>(
    initialArguments.filter((a) => a.type === "contra")
  );

  // Fetch arguments when first expanded (if no initial args)
  useEffect(() => {
    if (isExpanded && initialArguments.length === 0 && !isLoading) {
      const fetchArguments = async () => {
        setIsLoading(true);
        try {
          const args = await getTradeArgumentsAction(journalEntryId);
          setProArgs(args.filter((a) => a.type === "pro"));
          setContraArgs(args.filter((a) => a.type === "contra"));
        } catch (error) {
          console.error("Error fetching arguments:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchArguments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, journalEntryId]);

  const handleAddArgument = useCallback(
    async (type: "pro" | "contra", argument: string) => {
      // Optimistic update
      const tempId = crypto.randomUUID();
      const optimisticArg: TradeArgument = {
        id: tempId,
        journalEntryId,
        type,
        argument,
        weight: 1,
        createdAt: new Date().toISOString(),
      };

      if (type === "pro") {
        setProArgs((prev) => [...prev, optimisticArg]);
      } else {
        setContraArgs((prev) => [...prev, optimisticArg]);
      }

      // Call server action
      const result = await addTradeArgumentAction(journalEntryId, type, argument);

      if (!result.success) {
        // Rollback on error
        if (type === "pro") {
          setProArgs((prev) => prev.filter((a) => a.id !== tempId));
        } else {
          setContraArgs((prev) => prev.filter((a) => a.id !== tempId));
        }
        showToast(result.error || "Erro ao adicionar", "error");
        return;
      }

      // Replace temp ID with real ID
      if (result.data) {
        if (type === "pro") {
          setProArgs((prev) => prev.map((a) => (a.id === tempId ? result.data! : a)));
        } else {
          setContraArgs((prev) => prev.map((a) => (a.id === tempId ? result.data! : a)));
        }
      }
    },
    [journalEntryId, showToast]
  );

  const handleRemoveArgument = useCallback(
    async (argumentId: string, type: "pro" | "contra") => {
      // Optimistic update
      const originalPro = [...proArgs];
      const originalContra = [...contraArgs];

      if (type === "pro") {
        setProArgs((prev) => prev.filter((a) => a.id !== argumentId));
      } else {
        setContraArgs((prev) => prev.filter((a) => a.id !== argumentId));
      }

      // Call server action
      const result = await removeTradeArgumentAction(argumentId);

      if (!result.success) {
        // Rollback on error
        setProArgs(originalPro);
        setContraArgs(originalContra);
        showToast(result.error || "Erro ao remover", "error");
      }
    },
    [proArgs, contraArgs, showToast]
  );

  const totalProPoints = proArgs.reduce((sum, arg) => sum + arg.weight, 0);
  const totalContraPoints = contraArgs.reduce((sum, arg) => sum + arg.weight, 0);
  const totalArguments = proArgs.length + contraArgs.length;

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between rounded-lg bg-gray-800/50 p-4 transition-colors hover:bg-gray-800"
      >
        <div className="flex items-center gap-3">
          <GraphIcon className="h-5 w-5 text-blue-400" />
          <span className="font-semibold text-gray-100">Análise PDArray</span>
          {totalArguments > 0 && (
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
              {totalArguments} argumento{totalArguments !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 rounded-lg bg-gray-900/50 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="h-8 w-8 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
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
            </div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Prós Column */}
                <ArgumentColumn
                  type="pro"
                  title="Argumentos PRÓ"
                  icon="🚀"
                  color="green"
                  arguments={proArgs}
                  onAdd={(arg) => handleAddArgument("pro", arg)}
                  onRemove={(id) => handleRemoveArgument(id, "pro")}
                />

                {/* Contras Column */}
                <ArgumentColumn
                  type="contra"
                  title="Argumentos CONTRA"
                  icon="⚠️"
                  color="red"
                  arguments={contraArgs}
                  onAdd={(arg) => handleAddArgument("contra", arg)}
                  onRemove={(id) => handleRemoveArgument(id, "contra")}
                />
              </div>

              {/* Resultado Display */}
              <ResultadoDisplay
                proPoints={totalProPoints}
                contraPoints={totalContraPoints}
                hasArguments={totalArguments > 0}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

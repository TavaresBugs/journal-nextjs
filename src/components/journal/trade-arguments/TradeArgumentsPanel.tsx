"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { TradeArgument } from "@/types";
import { useToast } from "@/providers/ToastProvider";
import { Button, IconActionButton } from "@/components/ui";
import { ProbabilityChart } from "@/components/checklist/ProbabilityChart";
import {
  getTradeArgumentsAction,
  addTradeArgumentAction,
  removeTradeArgumentAction,
} from "@/app/actions/trade-arguments";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sortable Argument Item Component ---
interface SortableArgumentItemProps {
  argument: TradeArgument;
  onRemove: () => void;
  color: "green" | "red";
}

function SortableArgumentItem({ argument, onRemove, color }: SortableArgumentItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: argument.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const borderClass =
    color === "green"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : "border-red-500/30 bg-red-500/10";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-lg border ${borderClass} p-3 ${isDragging ? "shadow-lg" : ""}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-move touch-none p-1 text-gray-500 hover:text-gray-300"
      >
        ☰
      </div>
      <span className="flex-1 text-sm break-words text-gray-200">{argument.argument}</span>
      <IconActionButton
        variant="delete"
        size="sm"
        onClick={onRemove}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  );
}

interface TradeArgumentsPanelProps {
  journalEntryId: string;
  initialArguments?: TradeArgument[];
}

/**
 * Side panel component for PDArray (Prós e Contras) analysis.
 * Uses same design as ArgumentsCalculator from Pre-Flight Checklist.
 */
export function TradeArgumentsPanel({
  journalEntryId,
  initialArguments = [],
}: TradeArgumentsPanelProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [proArgs, setProArgs] = useState<TradeArgument[]>(
    initialArguments.filter((a) => a.type === "pro")
  );
  const [contraArgs, setContraArgs] = useState<TradeArgument[]>(
    initialArguments.filter((a) => a.type === "contra")
  );

  // Input states
  const [newPro, setNewPro] = useState("");
  const [newContra, setNewContra] = useState("");

  // Drag and Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculations
  const proCount = proArgs.length;
  const contraCount = contraArgs.length;
  const totalPoints = proCount + contraCount;

  const { proPct, contraPct, label } = useMemo(() => {
    if (totalPoints === 0) {
      return { proPct: 0, contraPct: 0, label: "Neutro" };
    }

    const pPct = (proCount / totalPoints) * 100;
    const cPct = (contraCount / totalPoints) * 100;

    let l = "Neutro";
    if (pPct >= 70) l = "High Probability Long 🟢";
    else if (pPct >= 55) l = "Medium Probability Long 🟡";
    else if (cPct >= 70) l = "High Probability Short 🔴";
    else if (cPct >= 55) l = "Medium Probability Short 🟠";
    else l = "Low Probability / Choppy ⚪";

    return { proPct: pPct, contraPct: cPct, label: l };
  }, [proCount, contraCount, totalPoints]);

  // Fetch arguments on mount
  useEffect(() => {
    if (initialArguments.length === 0) {
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
  }, [journalEntryId]);

  // Handlers
  const addPro = useCallback(async () => {
    if (!newPro.trim()) return;
    const argument = newPro.trim();
    setNewPro("");

    // Optimistic update
    const tempId = crypto.randomUUID();
    const optimisticArg: TradeArgument = {
      id: tempId,
      journalEntryId,
      type: "pro",
      argument,
      weight: 1,
      createdAt: new Date().toISOString(),
    };
    setProArgs((prev) => [...prev, optimisticArg]);

    // Call server action
    const result = await addTradeArgumentAction(journalEntryId, "pro", argument);

    if (!result.success) {
      setProArgs((prev) => prev.filter((a) => a.id !== tempId));
      showToast(result.error || "Erro ao adicionar", "error");
      return;
    }

    if (result.data) {
      setProArgs((prev) => prev.map((a) => (a.id === tempId ? result.data! : a)));
    }
  }, [journalEntryId, newPro, showToast]);

  const addContra = useCallback(async () => {
    if (!newContra.trim()) return;
    const argument = newContra.trim();
    setNewContra("");

    // Optimistic update
    const tempId = crypto.randomUUID();
    const optimisticArg: TradeArgument = {
      id: tempId,
      journalEntryId,
      type: "contra",
      argument,
      weight: 1,
      createdAt: new Date().toISOString(),
    };
    setContraArgs((prev) => [...prev, optimisticArg]);

    // Call server action
    const result = await addTradeArgumentAction(journalEntryId, "contra", argument);

    if (!result.success) {
      setContraArgs((prev) => prev.filter((a) => a.id !== tempId));
      showToast(result.error || "Erro ao adicionar", "error");
      return;
    }

    if (result.data) {
      setContraArgs((prev) => prev.map((a) => (a.id === tempId ? result.data! : a)));
    }
  }, [journalEntryId, newContra, showToast]);

  const removePro = useCallback(
    async (argumentId: string) => {
      const original = [...proArgs];
      setProArgs((prev) => prev.filter((a) => a.id !== argumentId));

      const result = await removeTradeArgumentAction(argumentId);
      if (!result.success) {
        setProArgs(original);
        showToast(result.error || "Erro ao remover", "error");
      }
    },
    [proArgs, showToast]
  );

  const removeContra = useCallback(
    async (argumentId: string) => {
      const original = [...contraArgs];
      setContraArgs((prev) => prev.filter((a) => a.id !== argumentId));

      const result = await removeTradeArgumentAction(argumentId);
      if (!result.success) {
        setContraArgs(original);
        showToast(result.error || "Erro ao remover", "error");
      }
    },
    [contraArgs, showToast]
  );

  const handleKeyDown = (e: React.KeyboardEvent, type: "pro" | "contra") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "pro") addPro();
      else addContra();
    }
  };

  // Drag and Drop handlers
  const handleProDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setProArgs((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleContraDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setContraArgs((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-12">
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
    );
  }

  return (
    <div className="animate-fadeIn space-y-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Bullish (Pro) Column */}
        <div className="flex h-full flex-col rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4">
          <h3 className="mb-4 flex items-center justify-between font-bold text-emerald-400">
            <span>🚀 Bullish Arguments</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
              {proCount}
            </span>
          </h3>

          {/* List with Drag and Drop */}
          <div className="custom-scrollbar mb-4 max-h-60 flex-1 space-y-2 overflow-y-auto">
            {proArgs.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500 italic">
                Nenhum argumento adicionado.
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleProDragEnd}
            >
              <SortableContext
                items={proArgs.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {proArgs.map((arg) => (
                  <SortableArgumentItem
                    key={arg.id}
                    argument={arg}
                    onRemove={() => removePro(arg.id)}
                    color="green"
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newPro}
              onChange={(e) => setNewPro(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "pro")}
              placeholder="Adicionar pró..."
              maxLength={500}
              className="flex-1 rounded-lg border border-emerald-500/30 bg-black/20 px-3 py-2 text-sm text-white transition-colors placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <Button
              variant="gradient-success"
              size="sm"
              onClick={addPro}
              disabled={!newPro.trim()}
              className="px-3"
            >
              +
            </Button>
          </div>
        </div>

        {/* Bearish (Contra) Column */}
        <div className="flex h-full flex-col rounded-xl border border-red-500/20 bg-red-900/10 p-4">
          <h3 className="mb-4 flex items-center justify-between font-bold text-red-400">
            <span>📉 Bearish Arguments</span>
            <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
              {contraCount}
            </span>
          </h3>

          {/* List with Drag and Drop */}
          <div className="custom-scrollbar mb-4 max-h-60 flex-1 space-y-2 overflow-y-auto">
            {contraArgs.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500 italic">
                Nenhum argumento adicionado.
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleContraDragEnd}
            >
              <SortableContext
                items={contraArgs.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {contraArgs.map((arg) => (
                  <SortableArgumentItem
                    key={arg.id}
                    argument={arg}
                    onRemove={() => removeContra(arg.id)}
                    color="red"
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newContra}
              onChange={(e) => setNewContra(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "contra")}
              placeholder="Adicionar contra..."
              maxLength={500}
              className="flex-1 rounded-lg border border-red-500/30 bg-black/20 px-3 py-2 text-sm text-white transition-colors placeholder:text-gray-600 focus:border-red-500 focus:outline-none"
            />
            <Button
              variant="danger"
              size="sm"
              onClick={addContra}
              disabled={!newContra.trim()}
              className="border-none bg-red-500 px-3 text-white hover:bg-red-600"
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-6">
        <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
          {/* Chart Side */}
          <div className="flex-shrink-0">
            <ProbabilityChart bullishPct={proPct} bearishPct={contraPct} />
          </div>

          {/* Stats Side */}
          <div className="w-full flex-1 space-y-4 text-center md:text-left">
            <div>
              <h4 className="mb-1 text-sm tracking-wider text-gray-400 uppercase">Resultado</h4>
              <div className="text-2xl font-bold text-white">{label}</div>
              {totalPoints === 0 && (
                <p className="mt-1 text-sm text-yellow-500">
                  ⚠️ Adicione pelo menos 1 argumento para calcular.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                <div className="mb-1 text-xs text-emerald-400">Prós (Bullish)</div>
                <div className="font-mono text-xl text-white">
                  {proCount} <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                <div className="mb-1 text-xs text-red-400">Contras (Bearish)</div>
                <div className="font-mono text-xl text-white">
                  {contraCount} <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

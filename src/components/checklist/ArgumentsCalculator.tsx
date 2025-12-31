import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Button, IconActionButton } from "@/components/ui";
import { ProbabilityChart } from "./ProbabilityChart";
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

// Argument with unique ID for DnD
interface ArgumentItem {
  id: string;
  text: string;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Convert string[] to ArgumentItem[]
const stringsToItems = (strings: string[]): ArgumentItem[] =>
  strings.map((text) => ({ id: generateId(), text }));

// --- Sortable Argument Item Component ---
interface SortableArgumentItemProps {
  item: ArgumentItem;
  onRemove: () => void;
  color: "green" | "red";
}

function SortableArgumentItem({ item, onRemove, color }: SortableArgumentItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
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
      <span className="flex-1 text-sm break-words text-gray-200">{item.text}</span>
      <IconActionButton
        variant="delete"
        size="sm"
        onClick={onRemove}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  );
}

// --- Main Component ---
interface ArgumentsCalculatorProps {
  initialBullishArgs?: string[];
  initialBearishArgs?: string[];
  onComplete?: (result: {
    bullishCount: number;
    bearishCount: number;
    bullishPct: number;
    bearishPct: number;
    label: string;
  }) => void;
}

export function ArgumentsCalculator({
  initialBullishArgs = [],
  initialBearishArgs = [],
  onComplete,
}: ArgumentsCalculatorProps) {
  // State with objects containing IDs
  const [bullishArgs, setBullishArgs] = useState<ArgumentItem[]>(() =>
    stringsToItems(initialBullishArgs)
  );
  const [bearishArgs, setBearishArgs] = useState<ArgumentItem[]>(() =>
    stringsToItems(initialBearishArgs)
  );

  // Input states
  const [newBullish, setNewBullish] = useState("");
  const [newBearish, setNewBearish] = useState("");

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculations
  const bullishCount = bullishArgs.length;
  const bearishCount = bearishArgs.length;
  const totalPoints = bullishCount + bearishCount;

  const { bullishPct, bearishPct, label } = useMemo(() => {
    if (totalPoints === 0) {
      return { bullishPct: 0, bearishPct: 0, label: "Neutro" };
    }

    const bPct = (bullishCount / totalPoints) * 100;
    const bearPct = (bearishCount / totalPoints) * 100;

    let l = "Neutro";
    if (bPct >= 70) l = "High Probability Long 🟢";
    else if (bPct >= 55) l = "Medium Probability Long 🟡";
    else if (bearPct >= 70) l = "High Probability Short 🔴";
    else if (bearPct >= 55) l = "Medium Probability Short 🟠";
    else l = "Low Probability / Choppy ⚪";

    return { bullishPct: bPct, bearishPct: bearPct, label: l };
  }, [bullishCount, bearishCount, totalPoints]);

  // Notify parent
  useEffect(() => {
    if (onComplete) {
      onComplete({ bullishCount, bearishCount, bullishPct, bearishPct, label });
    }
  }, [bullishCount, bearishCount, bullishPct, bearishPct, label, onComplete]);

  // Add handlers
  const addBullish = useCallback(() => {
    if (!newBullish.trim()) return;
    setBullishArgs((prev) => [...prev, { id: generateId(), text: newBullish.trim() }]);
    setNewBullish("");
  }, [newBullish]);

  const addBearish = useCallback(() => {
    if (!newBearish.trim()) return;
    setBearishArgs((prev) => [...prev, { id: generateId(), text: newBearish.trim() }]);
    setNewBearish("");
  }, [newBearish]);

  // Remove handlers
  const removeBullish = useCallback((id: string) => {
    setBullishArgs((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const removeBearish = useCallback((id: string) => {
    setBearishArgs((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // DnD handlers
  const handleBullishDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setBullishArgs((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleBearishDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setBearishArgs((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, type: "bullish" | "bearish") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "bullish") addBullish();
      else addBearish();
    }
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Bullish Column */}
        <div className="flex h-full flex-col rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4">
          <h3 className="mb-4 flex items-center justify-between font-bold text-emerald-400">
            <span>🚀 Bullish Arguments</span>
            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
              {bullishCount}
            </span>
          </h3>

          {/* List with Drag and Drop */}
          <div className="custom-scrollbar mb-4 max-h-60 flex-1 space-y-2 overflow-y-auto">
            {bullishArgs.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500 italic">
                Nenhum argumento adicionado.
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleBullishDragEnd}
            >
              <SortableContext
                items={bullishArgs.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {bullishArgs.map((item) => (
                  <SortableArgumentItem
                    key={item.id}
                    item={item}
                    onRemove={() => removeBullish(item.id)}
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
              value={newBullish}
              onChange={(e) => setNewBullish(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "bullish")}
              placeholder="Adicionar pró..."
              className="flex-1 rounded-lg border border-emerald-500/30 bg-black/20 px-3 py-2 text-sm text-white transition-colors placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <Button
              variant="gradient-success"
              size="sm"
              onClick={addBullish}
              disabled={!newBullish.trim()}
              className="px-3"
            >
              +
            </Button>
          </div>
        </div>

        {/* Bearish Column */}
        <div className="flex h-full flex-col rounded-xl border border-red-500/20 bg-red-900/10 p-4">
          <h3 className="mb-4 flex items-center justify-between font-bold text-red-400">
            <span>📉 Bearish Arguments</span>
            <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
              {bearishCount}
            </span>
          </h3>

          {/* List with Drag and Drop */}
          <div className="custom-scrollbar mb-4 max-h-60 flex-1 space-y-2 overflow-y-auto">
            {bearishArgs.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-500 italic">
                Nenhum argumento adicionado.
              </p>
            )}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleBearishDragEnd}
            >
              <SortableContext
                items={bearishArgs.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {bearishArgs.map((item) => (
                  <SortableArgumentItem
                    key={item.id}
                    item={item}
                    onRemove={() => removeBearish(item.id)}
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
              value={newBearish}
              onChange={(e) => setNewBearish(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "bearish")}
              placeholder="Adicionar contra..."
              className="flex-1 rounded-lg border border-red-500/30 bg-black/20 px-3 py-2 text-sm text-white transition-colors placeholder:text-gray-600 focus:border-red-500 focus:outline-none"
            />
            <Button
              variant="danger"
              size="sm"
              onClick={addBearish}
              disabled={!newBearish.trim()}
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
          <div className="shrink-0">
            <ProbabilityChart bullishPct={bullishPct} bearishPct={bearishPct} />
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
                  {bullishCount} <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
                <div className="mb-1 text-xs text-red-400">Contras (Bearish)</div>
                <div className="font-mono text-xl text-white">
                  {bearishCount} <span className="text-xs text-gray-500">pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

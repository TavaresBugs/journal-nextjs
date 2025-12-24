"use client";

import { memo, useState, useEffect } from "react";
import type { DailyRoutine } from "@/types";
import { GlassCard } from "@/components/ui";
import { CustomCheckbox } from "@/components/checklist/CustomCheckbox";

interface DailyHabitsRowProps {
  currentRoutine: DailyRoutine | null;
  onToggleHabit?: (
    habit: keyof Omit<DailyRoutine, "id" | "accountId" | "date" | "createdAt" | "updatedAt">
  ) => void;
  readOnly?: boolean;
}

const habits = [
  { key: "aerobic", label: "Aeróbico", icon: "🏃" },
  { key: "diet", label: "Alimentação", icon: "🍎" },
  { key: "reading", label: "Leitura", icon: "📚" },
  { key: "meditation", label: "Meditação", icon: "🧘" },
  { key: "preMarket", label: "PréMarket", icon: "📊" },
  { key: "prayer", label: "Oração", icon: "🙏" },
] as const;

/**
 * Component for daily habits checklist
 * Displays checkable habit buttons with visual feedback
 * Memoized to prevent unnecessary re-renders
 * @param readOnly - If true, habits cannot be toggled (for mentor view)
 */
const DailyHabitsRowComponent = ({
  currentRoutine,
  onToggleHabit,
  readOnly = false,
}: DailyHabitsRowProps) => {
  // Optimistic UI state
  const [optimisticRoutine, setOptimisticRoutine] = useState<DailyRoutine | null>(currentRoutine);

  // Sync with prop when it changes (server response)
  useEffect(() => {
    setOptimisticRoutine(currentRoutine);
  }, [currentRoutine]);

  const handleToggle = (
    key: keyof Omit<DailyRoutine, "id" | "accountId" | "date" | "createdAt" | "updatedAt">
  ) => {
    if (readOnly || !onToggleHabit) return;

    // Optimistic update
    setOptimisticRoutine((prev) => {
      if (!prev) return null;
      return { ...prev, [key]: !prev[key] };
    });

    // Call actual handler
    onToggleHabit(key);
  };

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
      {habits.map((habit) => {
        const isChecked = optimisticRoutine
          ? optimisticRoutine[habit.key]
          : currentRoutine?.[habit.key] || false;

        return (
          <GlassCard
            key={habit.key}
            onClick={() => handleToggle(habit.key)}
            className={`group flex items-center justify-center gap-2 px-2 py-2 transition-all duration-200 ${
              readOnly ? "cursor-default" : "cursor-pointer"
            } ${
              isChecked
                ? "bg-zorin-accent/10 border-zorin-accent/50 shadow-[0_0_10px_rgba(0,200,83,0.1)]"
                : "bg-zorin-bg/30 hover:border-zorin-accent/30 hover:bg-zorin-bg/40 border-white/5"
            } `}
          >
            <CustomCheckbox
              checked={isChecked}
              onChange={() => handleToggle(habit.key)}
              id={`habit-${habit.key}`}
              disabled={readOnly}
            />
            <div className="flex items-center gap-2">
              <span className="text-lg">{habit.icon}</span>
              <span
                className={`text-sm font-medium transition-colors ${isChecked ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}
              >
                {habit.label}
              </span>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};

export const DailyHabitsRow = memo(DailyHabitsRowComponent);

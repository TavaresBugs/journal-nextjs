'use client';

import { memo } from 'react';
import type { DailyRoutine } from '@/types';

interface DailyHabitsRowProps {
  currentRoutine: DailyRoutine | null;
  onToggleHabit: (habit: keyof Omit<DailyRoutine, 'id' | 'accountId' | 'date' | 'createdAt' | 'updatedAt'>) => void;
}

const habits = [
  { key: 'aerobic', label: 'Aeróbico', icon: '🏃' },
  { key: 'diet', label: 'Alimentação', icon: '🍎' },
  { key: 'reading', label: 'Leitura', icon: '📚' },
  { key: 'meditation', label: 'Meditação', icon: '🧘' },
  { key: 'preMarket', label: 'PréMarket', icon: '📊' },
  { key: 'prayer', label: 'Oração', icon: '🙏' },
] as const;

/**
 * Component for daily habits checklist
 * Displays checkable habit buttons with visual feedback
 * Memoized to prevent unnecessary re-renders
 */
const DailyHabitsRowComponent = ({ currentRoutine, onToggleHabit }: DailyHabitsRowProps) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {habits.map((habit) => {
        const isChecked = currentRoutine?.[habit.key] || false;
        return (
          <button
            key={habit.key}
            onClick={() => onToggleHabit(habit.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
              ${
                isChecked
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-600'
              }
            `}
          >
            <div
              className={`
                w-5 h-5 rounded flex items-center justify-center border
                ${
                  isChecked
                    ? 'bg-emerald-500 border-emerald-500 text-black'
                    : 'border-gray-600'
                }
              `}
            >
              {isChecked && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="text-lg">{habit.icon}</span>
            <span className="text-sm font-medium">{habit.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export const DailyHabitsRow = memo(DailyHabitsRowComponent);

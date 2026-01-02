import type { ReactNode } from "react";

interface MentalStepSectionProps {
  icon: ReactNode;
  label: string;
  colorClass: string;
  bgClass?: string;
  children: ReactNode;
}

/**
 * MentalStepSection
 *
 * Reusable component for rendering mental log step sections with consistent styling.
 * Used by ViewEntryModal and EditEntryModal.
 */
export function MentalStepSection({
  icon,
  label,
  colorClass,
  bgClass,
  children,
}: MentalStepSectionProps) {
  return (
    <div>
      <label
        className={`mb-2 flex items-center gap-2 text-sm font-medium tracking-wide uppercase ${colorClass}`}
      >
        {icon}
        {label}
      </label>
      {bgClass ? <div className={`rounded-lg p-4 ${bgClass}`}>{children}</div> : children}
    </div>
  );
}

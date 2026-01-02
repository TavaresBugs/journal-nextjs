"use client";

import { cn } from "@/lib/utils";
import {
  DollarIcon,
  TrendIcon,
  CheckCircleIcon,
  BarChartIcon,
  FireIcon,
  WalletIcon,
} from "@/components/ui/MetricIcons";

export type MetricIconType = "dollar" | "trend" | "check" | "chart" | "fire" | "wallet";

interface MetricCardProps {
  icon: MetricIconType;
  label: string;
  value: string | number;
  subValue?: string;
  /** Color variant for the icon and value */
  colorVariant?: "green" | "red" | "cyan" | "blue" | "orange" | "indigo" | "gray";
  /** Additional className for the card container */
  className?: string;
}

// Icon component map
const iconComponents: Record<MetricIconType, React.ComponentType> = {
  dollar: DollarIcon,
  trend: TrendIcon,
  check: CheckCircleIcon,
  chart: BarChartIcon,
  fire: FireIcon,
  wallet: WalletIcon,
};

// Hover color classes - one place to change them all!
const hoverColorClasses: Record<string, string> = {
  green: "text-gray-500 group-hover:text-green-500",
  red: "text-gray-500 group-hover:text-red-500",
  cyan: "text-gray-500 group-hover:text-cyan-400",
  blue: "text-gray-500 group-hover:text-blue-500",
  orange: "text-orange-500/80 group-hover:text-orange-400",
  indigo: "text-gray-500 group-hover:text-indigo-400",
  gray: "text-gray-500",
};

// Value color classes
const valueColorClasses: Record<string, string> = {
  green: "text-green-400",
  red: "text-red-400",
  cyan: "text-cyan-400",
  blue: "text-blue-400",
  orange: "text-orange-400",
  indigo: "text-gray-100",
  gray: "text-gray-100",
};

/**
 * Reusable MetricCard component for dashboard metrics.
 * Used in both home page and dashboard.
 */
export function MetricCard({
  icon,
  label,
  value,
  subValue,
  colorVariant = "gray",
  className,
}: MetricCardProps) {
  const IconComponent = iconComponents[icon];

  return (
    <div
      className={cn(
        "group flex min-h-[100px] flex-col items-center justify-center rounded-xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-800/40 p-3 text-center backdrop-blur-sm transition-colors hover:border-gray-600/50 sm:min-h-[120px] sm:p-4",
        className
      )}
    >
      {/* Icon */}
      <div className={cn("mb-1.5 transition-colors sm:mb-2", hoverColorClasses[colorVariant])}>
        <IconComponent />
      </div>

      {/* Label */}
      <p className="mb-0.5 text-[10px] tracking-wide text-gray-400 uppercase sm:mb-1 sm:text-xs">
        {label}
      </p>

      {/* Value */}
      <p
        className={cn(
          "max-w-full truncate text-sm font-bold sm:text-base md:text-lg",
          valueColorClasses[colorVariant]
        )}
      >
        {value}
      </p>

      {/* Sub-value (optional, like percentage) */}
      {subValue && (
        <p className={cn("text-[10px] sm:text-xs", valueColorClasses[colorVariant] + "/70")}>
          {subValue}
        </p>
      )}
    </div>
  );
}

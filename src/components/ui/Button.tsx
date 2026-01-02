import React, { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/general";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "outline-danger"
    | "ghost"
    | "danger"
    | "success"
    | "gradient-success"
    | "gradient-danger"
    | "gradient-info"
    | "gold"
    | "zorin-primary"
    | "zorin-ghost"
    | "solid-danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Button Component - Design System
 *
 * Variants consolidados (22 → 14):
 * - REMOVIDOS (sem uso): warning, info, ghost-success, purple, zorin-outline,
 *   zorin-success, zorin-danger, zorin-warning, solid-gray
 * - MANTIDOS: primary, secondary, outline, outline-danger, ghost, danger,
 *   success, gradient-success, gradient-danger, gradient-info, gold,
 *   zorin-primary, zorin-ghost, solid-danger
 */
export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    // Standard "Neutral Dark" style with Cyan hover effect
    primary:
      "bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-400 focus:ring-cyan-500/50 shadow-sm backdrop-blur-sm font-medium",

    // Secondary/Alternative
    secondary: "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500 font-medium",

    // Outline
    outline:
      "border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white focus:ring-gray-600 font-medium",

    // Outline Danger - Subtle red outline
    "outline-danger":
      "border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500 focus:ring-red-500/50 font-medium",

    // Ghost (for "Voltar" etc)
    ghost: "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 focus:ring-gray-600 font-medium",

    // Glowing/Neon variants - Progressive Fill Effect
    danger:
      "bg-red-500/10 text-red-500 border border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] font-black",
    success:
      "bg-emerald-500/10 text-emerald-500 border border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] font-black",

    // Gradient variants (Solid Gradients)
    "gradient-success":
      "bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/30 border-none",
    "gradient-danger":
      "bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/30 border-none",
    "gradient-info":
      "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/30 border-none",

    // Gold (for Edit buttons)
    gold: "bg-yellow-500/10 text-yellow-500 border border-yellow-500 hover:shadow-[0_0_20px_rgba(234,179,8,0.6)] font-black",

    // Zorin Glass - Primary Action (WCAG AA compliant)
    "zorin-primary":
      "bg-[#008f3e] hover:bg-[#00a347] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 border-none",

    // Zorin Glass - Ghost variant
    "zorin-ghost":
      "bg-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5 focus:ring-gray-600 font-medium",

    // Solid Danger (Bold + Solid Color)
    "solid-danger":
      "bg-red-600 hover:bg-red-700 text-white border border-red-600 hover:border-red-700 focus:ring-red-500 font-bold shadow-lg shadow-red-500/20",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "h-10 w-10 sm:h-12 sm:w-12 p-2 flex items-center justify-center",
  };

  // Determine if we should apply the progressive fill effect
  const isProgressive = variant === "danger" || variant === "success" || variant === "gold";

  return (
    <button
      className={cn(
        "group/btn relative overflow-hidden",
        baseStyles,
        variants[variant],
        (size !== "icon" || !className.includes("w-")) && sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Progressive Fill Animation */}
      {isProgressive && (
        <span
          className={`absolute inset-0 w-0 opacity-30 transition-all duration-300 ease-out group-hover/btn:w-full ${
            variant === "danger"
              ? "bg-red-500"
              : variant === "success"
                ? "bg-emerald-500"
                : "bg-yellow-500"
          }`}
        />
      )}

      {/* Content Wrapper */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span>{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span>{rightIcon}</span>}
      </span>
    </button>
  );
}

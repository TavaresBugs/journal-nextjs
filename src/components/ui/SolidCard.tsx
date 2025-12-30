"use client";

import React from "react";
import { cn } from "@/lib/utils/general";

interface SolidCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  /** Padding preset */
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Solid Card Component - For use in modals or nested contexts
 *
 * Uses solid dark backgrounds instead of transparency/blur.
 * Matches the styling used in TradeForm sections.
 *
 * Colors:
 * - Background: #232b32
 * - Border: #333b44
 * - Hover: #2a333a
 */
export function SolidCard({
  children,
  className = "",
  onClick,
  hover = false,
  padding = "md",
}: SolidCardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        // Solid Background - Dark consistent color
        "bg-[#232b32]",
        // Border - Subtle gray edge
        "border border-[#333b44]",
        // Shape
        "rounded-xl",
        // Padding
        paddingStyles[padding],
        // Hover Effects
        hover && "cursor-pointer transition-all duration-300 hover:bg-[#2a333a]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface SolidCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SolidCardHeader({ children, className = "" }: SolidCardHeaderProps) {
  return <div className={cn("mb-3 border-b border-gray-700/50 pb-2", className)}>{children}</div>;
}

interface SolidCardTitleProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function SolidCardTitle({ children, className = "", icon }: SolidCardTitleProps) {
  return (
    <h3
      className={cn(
        "flex items-center gap-2 text-sm font-semibold tracking-wider text-gray-300 uppercase",
        className
      )}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </h3>
  );
}

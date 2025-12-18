import React from "react";
import { cn } from "@/lib/utils/general";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  /** Add subtle glow effect on hover */
  glow?: boolean;
  /** Padding preset */
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Glassmorphism Card Component - Zorin Glass Design System
 *
 * Core building block for the HUD aesthetic. Uses transparency + blur
 * so the wallpaper bleeds through subtly.
 */
export function GlassCard({
  children,
  className = "",
  onClick,
  hover = false,
  glow = false,
  padding = "md",
}: GlassCardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        // Glassmorphism Base - Zorin Midnight with transparency
        "bg-zorin-bg/70 backdrop-blur-md",
        // Border - Subtle white edge
        "border border-white/5",
        // Shape
        "rounded-xl",
        // Shadow - Deep for floating effect
        "shadow-2xl",
        // Padding
        paddingStyles[padding],
        // Hover Effects
        hover &&
          "hover:bg-zorin-bg/80 cursor-pointer transition-all duration-300 hover:border-white/10",
        // Glow Effect
        glow && "hover:shadow-[0_0_30px_rgba(0,200,83,0.15)]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface GlassCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCardHeader({ children, className = "" }: GlassCardHeaderProps) {
  return <div className={cn("mb-4 border-b border-white/5 pb-4", className)}>{children}</div>;
}

interface GlassCardTitleProps {
  children: React.ReactNode;
  className?: string;
  /** Icon to display before title */
  icon?: React.ReactNode;
}

export function GlassCardTitle({ children, className = "", icon }: GlassCardTitleProps) {
  return (
    <h3 className={cn("flex items-center gap-2 text-xl font-bold text-gray-100", className)}>
      {icon && <span className="text-[#bde6fb]">{icon}</span>}
      {children}
    </h3>
  );
}

interface GlassCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCardContent({ children, className = "" }: GlassCardContentProps) {
  return <div className={className}>{children}</div>;
}

interface GlassCardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCardFooter({ children, className = "" }: GlassCardFooterProps) {
  return (
    <div
      className={cn(
        "mt-4 flex items-center justify-end gap-3 border-t border-white/5 pt-4",
        className
      )}
    >
      {children}
    </div>
  );
}

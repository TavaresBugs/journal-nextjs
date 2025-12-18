import React from "react";
import { cn } from "@/lib/utils/general";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className = "", onClick, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-lg",
        hover &&
          "cursor-pointer transition-all duration-200 hover:border-cyan-500 hover:shadow-cyan-500/20",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return <div className={cn("mb-4 border-b border-gray-700 pb-4", className)}>{children}</div>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  return <h3 className={cn("text-xl font-bold text-gray-100", className)}>{children}</h3>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/general";
import { useBlockBodyScroll } from "@/hooks/useBlockBodyScroll";
import { IconActionButton } from "./IconActionButton";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  /** When true, modal has no backdrop (use for modals that open over other modals) */
  noBackdrop?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  headerActions,
  children,
  maxWidth = "lg",
  noBackdrop = false,
}: ModalProps) {
  // Block body scroll when modal is open
  useBlockBodyScroll(isOpen);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  const modalContent = (
    <div
      className={cn(
        // Base layout - centered vertically
        "fixed inset-0 z-50 flex items-center justify-center",
        // Padding igual em todos os lados
        "p-4",
        // Touch optimizado
        "touch-manipulation",
        !noBackdrop && "bg-black/50"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          maxWidthClasses[maxWidth],
          "bg-zorin-bg w-full",
          // Border radius completo em todas as telas
          "rounded-2xl border border-white/10 shadow-2xl",
          // Max height - garante que header fique visível
          "flex max-h-[90vh] transform flex-col transition-all duration-200"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - padding responsivo e touch targets maiores */}
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6 md:py-4">
            <div className="min-w-0 flex-1">
              {typeof title === "string" ? (
                <h2 className="truncate text-lg font-bold text-gray-100 md:text-xl">{title}</h2>
              ) : (
                title
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1 md:gap-2">
              {headerActions}
              <IconActionButton variant="close" onClick={onClose} size="md" />
            </div>
          </div>
        )}

        {/* Content - padding responsivo */}
        <div className="flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4">{children}</div>
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(modalContent, document.body) : null;
}

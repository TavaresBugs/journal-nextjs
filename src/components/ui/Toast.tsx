"use client";

import { cn } from "@/lib/utils/general";
import { memo, useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning" | "loading";

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

/**
 * Toast notification component.
 * Displays temporary messages to the user.
 * Memoized to prevent unnecessary re-renders.
 *
 * @param message - The message to display
 * @param type - The type of toast (success, error, info, warning, loading)
 * @param isVisible - Whether the toast is visible
 * @param onClose - Callback to close the toast
 * @param duration - Duration in ms before auto-closing
 */
const ToastComponent = ({
  message,
  type = "success",
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to ensure the initial render happens before showing (for animation)
      const raf = requestAnimationFrame(() => {
        setShow(true);
      });

      // Don't auto-close loading toasts
      if (type !== "loading") {
        const timer = setTimeout(() => {
          setShow(false);
          setTimeout(onClose, 300); // Wait for animation to finish
        }, duration);

        return () => {
          cancelAnimationFrame(raf);
          clearTimeout(timer);
        };
      }

      return () => {
        cancelAnimationFrame(raf);
      };
    }
  }, [isVisible, duration, onClose, type]);

  if (!isVisible && !show) return null;

  const bgColors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
    warning: "bg-yellow-600",
    loading: "bg-green-600", // Same color as success
  };

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
    loading: "⏳",
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-100 flex min-h-[72px] transform items-center gap-3 rounded-xl px-6 py-4 font-medium text-white shadow-2xl transition-all duration-300",
        show ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
        bgColors[type]
      )}
    >
      <span className="text-xl">{icons[type]}</span>
      {type === "loading" && (
        <div className="ml-1 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      <span className="flex-1">{message}</span>
      {type !== "loading" && (
        <button onClick={() => setShow(false)} className="ml-4 text-white/80 hover:text-white">
          ✕
        </button>
      )}
    </div>
  );
};

export const Toast = memo(ToastComponent);

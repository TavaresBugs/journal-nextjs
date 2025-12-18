"use client";

import { errorMetrics } from "./errorMetrics";

/**
 * Error severity levels for different handling strategies
 */
export type ErrorSeverity = "silent" | "warn" | "error" | "critical";

/**
 * Structured error returned by handleServiceError
 */
export interface ServiceError {
  message: string;
  code?: string;
  context: string;
  severity: ErrorSeverity;
  timestamp: number;
}

/**
 * Options for handling service errors
 */
interface HandleErrorOptions {
  /** Error severity level (default: 'error') */
  severity?: ErrorSeverity;
  /** Whether to show toast notification (default: true for error/critical) */
  showToast?: boolean;
  /** Custom user-friendly message (overrides error.message in toast) */
  userMessage?: string;
}

/**
 * Toast function placeholder - will be replaced with actual implementation
 * This allows the error handler to work even without toast context
 */
let toastFunction: ((message: string, type: "error" | "warning") => void) | null = null;

/**
 * Register toast function for error notifications
 * Call this from ToastProvider on mount
 *
 * @example
 * // In ToastProvider.tsx
 * useEffect(() => {
 *   registerToastHandler((msg, type) => showToast(msg, type));
 * }, []);
 */
export function registerToastHandler(
  handler: (message: string, type: "error" | "warning") => void
): void {
  toastFunction = handler;
}

/**
 * Centralized error handler for all service operations
 * Logs errors, tracks metrics, and optionally shows user notifications
 *
 * @param error - The error object (can be Error, Supabase error, or unknown)
 * @param context - Service/function name for tracking (e.g., 'getJournalEntries')
 * @param options - Configuration options
 * @returns Structured ServiceError object
 *
 * @example
 * // In a service function:
 * const { data, error } = await supabase.from('trades').select('*');
 * if (error) {
 *   handleServiceError(error, 'getTrades');
 *   return [];
 * }
 *
 * @example
 * // Silent error (no toast):
 * handleServiceError(error, 'backgroundSync', { severity: 'silent' });
 *
 * @example
 * // With custom user message:
 * handleServiceError(error, 'createTrade', {
 *   userMessage: 'Não foi possível salvar o trade. Tente novamente.'
 * });
 */
export function handleServiceError(
  error: unknown,
  context: string,
  options: HandleErrorOptions = {}
): ServiceError {
  const {
    severity = "error",
    showToast = severity === "error" || severity === "critical",
    userMessage,
  } = options;

  // Extract message from various error types
  let message: string;
  let code: string | undefined;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object" && error !== null) {
    // Handle Supabase-style errors
    const supabaseError = error as { message?: string; code?: string; details?: string };
    message = supabaseError.message || supabaseError.details || "Erro desconhecido";
    code = supabaseError.code;
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = "Erro desconhecido";
  }

  // Always log to console
  const logPrefix = `[${context}]`;
  switch (severity) {
    case "critical":
      console.error(`🔴 CRITICAL ${logPrefix}`, error);
      break;
    case "error":
      console.error(`❌ ${logPrefix}`, error);
      break;
    case "warn":
      console.warn(`⚠️ ${logPrefix}`, error);
      break;
    case "silent":
      // Still log but at debug level
      console.debug(`🔇 ${logPrefix}`, error);
      break;
  }

  // Track in metrics
  errorMetrics.increment(context);

  // Show toast notification if enabled
  if (showToast && toastFunction) {
    const displayMessage = userMessage || message;
    const toastType = severity === "warn" ? "warning" : "error";
    toastFunction(displayMessage, toastType);
  }

  return {
    message,
    code,
    context,
    severity,
    timestamp: Date.now(),
  };
}

/**
 * Wrapper for async operations with automatic error handling
 * Returns null on error instead of throwing
 *
 * @example
 * const result = await safeAsync(
 *   () => supabase.from('trades').select('*'),
 *   'getTrades'
 * );
 * if (!result) return []; // Error was handled
 * return result.data;
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: string,
  options?: HandleErrorOptions
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleServiceError(error, context, options);
    return null;
  }
}

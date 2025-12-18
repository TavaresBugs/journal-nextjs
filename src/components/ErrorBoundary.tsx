"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { GlassCard, Button } from "@/components/ui";

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Optional fallback UI to show on error */
  fallback?: ReactNode;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Context name for logging (default: 'Component') */
  context?: string;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component for catching runtime errors in component tree
 * Provides graceful degradation with retry capability
 *
 * @example
 * // Wrap critical components
 * <ErrorBoundary context="TradeForm">
 *   <TradeForm />
 * </ErrorBoundary>
 *
 * @example
 * // With custom fallback
 * <ErrorBoundary
 *   context="Dashboard"
 *   fallback={<p>Dashboard unavailable</p>}
 * >
 *   <Dashboard />
 * </ErrorBoundary>
 *
 * @example
 * // With error callback
 * <ErrorBoundary
 *   context="PaymentForm"
 *   onError={(error) => logToSentry(error)}
 * >
 *   <PaymentForm />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, context = "Component" } = this.props;

    // Log the error
    console.error(`🔴 [ErrorBoundary:${context}]`, error);
    console.error("Component Stack:", errorInfo.componentStack);

    // Store error info for display
    this.setState({ errorInfo });

    // Call optional callback
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, context = "Component" } = this.props;

    if (hasError) {
      // Custom fallback provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <GlassCard className="p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            {/* Error Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <div>
              <h3 className="mb-1 text-lg font-semibold text-gray-100">Algo deu errado</h3>
              <p className="mb-2 text-sm text-gray-400">
                Ocorreu um erro ao carregar {context.toLowerCase()}.
              </p>
              {process.env.NODE_ENV === "development" && error && (
                <p className="mt-2 rounded bg-red-500/10 p-2 font-mono text-xs text-red-400">
                  {error.message}
                </p>
              )}
            </div>

            {/* Retry Button */}
            <Button variant="outline" onClick={this.handleRetry} className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </GlassCard>
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap any component with ErrorBoundary
 *
 * @example
 * const SafeTradeForm = withErrorBoundary(TradeForm, 'TradeForm');
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  context: string
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary context={context}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return WithErrorBoundary;
}

/**
 * Base Repository
 *
 * Abstract base class providing common patterns for Prisma repositories:
 * - Logging infrastructure with slow query detection
 * - Error handling with Result type
 * - Performance timing utilities
 *
 * @example
 * class TradeRepository extends BaseRepository {
 *   protected readonly repositoryName = "TradeRepository";
 *   protected readonly slowQueryThresholdMs = 1000;
 * }
 */

import { Logger } from "@/lib/logging/Logger";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";

/**
 * Abstract base class for Prisma repositories.
 * Provides common logging, error handling, and performance utilities.
 */
export abstract class BaseRepository {
  protected abstract readonly repositoryName: string;
  protected readonly slowQueryThresholdMs: number = 1000;

  private _logger: Logger | null = null;

  /**
   * Lazy-initialized logger instance.
   */
  protected get logger(): Logger {
    if (!this._logger) {
      this._logger = new Logger(this.repositoryName);
    }
    return this._logger;
  }

  /**
   * Logs a warning if query exceeds threshold.
   */
  protected logSlowQuery(
    method: string,
    durationMs: number,
    metadata?: Record<string, unknown>
  ): void {
    if (durationMs > this.slowQueryThresholdMs) {
      this.logger.warn(`Slow query detected in ${method}`, {
        durationMs,
        threshold: this.slowQueryThresholdMs,
        ...metadata,
      });
    }
  }

  /**
   * Wraps an async operation with logging and error handling.
   * Returns a Result type for type-safe error handling.
   */
  protected async withQuery<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<Result<T, AppError>> {
    const startTime = performance.now();
    this.logger.info(operation, metadata);

    try {
      const result = await fn();
      const durationMs = performance.now() - startTime;

      this.logSlowQuery(operation, durationMs, metadata);
      this.logger.info(`${operation} completed in ${durationMs.toFixed(0)}ms`, metadata);

      return { data: result, error: null };
    } catch (error) {
      const durationMs = performance.now() - startTime;
      this.logger.error(`${operation} failed after ${durationMs.toFixed(0)}ms`, {
        error,
        ...metadata,
      });

      return {
        data: null,
        error: this.mapError(error, operation),
      };
    }
  }

  /**
   * Maps unknown errors to AppError instances.
   */
  protected mapError(error: unknown, operation: string): AppError {
    if (error instanceof AppError) {
      return error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return new AppError(`${operation} failed: ${message}`, ErrorCode.DB_QUERY_FAILED, 500);
  }

  /**
   * Creates a "not found" error for consistent error responses.
   */
  protected notFoundError(entity: string): AppError {
    return new AppError(`${entity} not found`, ErrorCode.DB_NOT_FOUND, 404);
  }

  /**
   * Creates an "unauthorized" error for ownership verification failures.
   */
  protected unauthorizedError(): AppError {
    return new AppError("Unauthorized", ErrorCode.AUTH_FORBIDDEN, 403);
  }

  /**
   * Times an operation and returns duration in milliseconds.
   */
  protected startTimer(): () => number {
    const start = performance.now();
    return () => performance.now() - start;
  }
}

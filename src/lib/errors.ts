export enum ErrorCode {
  // Database
  DB_QUERY_FAILED = "DB_QUERY_FAILED",
  DB_NOT_FOUND = "DB_NOT_FOUND",
  DB_CONSTRAINT_VIOLATION = "DB_CONSTRAINT_VIOLATION",

  // Auth
  AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",
  AUTH_FORBIDDEN = "AUTH_FORBIDDEN",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // Network
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",

  // Unknown
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    statusCode: number = 500,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.metadata = metadata;
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as Record<string, unknown>).message);
  }

  return "An unexpected error occurred";
}

export function toAppError(
  error: unknown,
  defaultMessage = "An unexpected error occurred"
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, ErrorCode.UNKNOWN_ERROR, 500);
  }

  if (typeof error === "string") {
    return new AppError(error, ErrorCode.UNKNOWN_ERROR, 500);
  }

  return new AppError(defaultMessage, ErrorCode.UNKNOWN_ERROR, 500);
}

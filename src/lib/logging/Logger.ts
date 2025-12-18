export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export class Logger {
  constructor(private context: string) {}

  private log(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
    const entry = {
      level,
      context: this.context,
      message,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
      ...metadata,
    };

    // In production, send to logging service (Sentry, LogRocket, etc)
    if (process.env.NODE_ENV === "production") {
      // sendToLoggingService(entry);
    }

    // Use consistent console methods
    const consoleMethod =
      level === LogLevel.ERROR
        ? "error"
        : level === LogLevel.WARN
          ? "warn"
          : level === LogLevel.INFO
            ? "info"
            : "debug";

    console[consoleMethod](entry);
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, metadata?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Debug a trade object in development mode
   * Shows ownership verification, required fields validation, and full data
   */
  static debugTrade(trade: Record<string, unknown>, context?: string) {
    if (process.env.NODE_ENV !== "development") return;

    console.group(`🔍 Trade Debug ${context ? `(${context})` : ""}`);
    console.log("ID:", trade?.id);
    console.log("User ID:", trade?.user_id);
    console.log("Full data:", trade);

    // Validate structure:
    const requiredFields = ["id", "user_id", "strategy", "outcome"];
    const missingFields = requiredFields.filter((field) => !(field in trade));

    if (missingFields.length > 0) {
      console.warn("⚠️ Missing fields:", missingFields);
    } else {
      console.log("✅ All required fields present");
    }

    console.groupEnd();
  }
}

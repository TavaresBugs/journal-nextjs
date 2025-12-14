export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  constructor(private context: string) {}

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const entry = {
      level,
      context: this.context,
      message,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      ...metadata
    };

    // In production, send to logging service (Sentry, LogRocket, etc)
    if (process.env.NODE_ENV === 'production') {
      // sendToLoggingService(entry);
    }

    // Use consistent console methods
    const consoleMethod = level === LogLevel.ERROR ? 'error' :
                          level === LogLevel.WARN ? 'warn' :
                          level === LogLevel.INFO ? 'info' : 'debug';

    console[consoleMethod](entry);
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, metadata);
  }
}

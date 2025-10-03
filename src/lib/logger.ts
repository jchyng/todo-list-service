/**
 * Production-ready logging system
 * Replaces console.log statements with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;

    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private formatMessage(entry: LogEntry): string {
    const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}`;
    const context = entry.context ? `[${entry.context}]` : '';
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';

    return `${prefix}${context}: ${entry.message}${dataStr}`;
  }

  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, context, data);
    console.log(this.formatMessage(entry));
  }

  info(message: string, context?: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, context, data);
    console.info(this.formatMessage(entry));
  }

  warn(message: string, context?: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, context, data);
    console.warn(this.formatMessage(entry));
  }

  error(message: string, context?: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;

    const entry = this.createLogEntry('error', message, context, data);
    console.error(this.formatMessage(entry));
  }

  // Success logging for important operations
  success(message: string, context?: string, data?: Record<string, unknown>): void {
    this.info(`✅ ${message}`, context, data);
  }

  // Operation start logging
  start(message: string, context?: string, data?: Record<string, unknown>): void {
    this.debug(`🔄 ${message}`, context, data);
  }
}

export const logger = new Logger();

// Convenience exports for common contexts
export const authLogger = {
  debug: (message: string, data?: Record<string, unknown>) => logger.debug(message, 'Auth', data),
  info: (message: string, data?: Record<string, unknown>) => logger.info(message, 'Auth', data),
  warn: (message: string, data?: Record<string, unknown>) => logger.warn(message, 'Auth', data),
  error: (message: string, data?: Record<string, unknown>) => logger.error(message, 'Auth', data),
  success: (message: string, data?: Record<string, unknown>) => logger.success(message, 'Auth', data),
  start: (message: string, data?: Record<string, unknown>) => logger.start(message, 'Auth', data),
};

export const contextLogger = {
  debug: (message: string, data?: Record<string, unknown>) => logger.debug(message, 'Context', data),
  info: (message: string, data?: Record<string, unknown>) => logger.info(message, 'Context', data),
  warn: (message: string, data?: Record<string, unknown>) => logger.warn(message, 'Context', data),
  error: (message: string, data?: Record<string, unknown>) => logger.error(message, 'Context', data),
  success: (message: string, data?: Record<string, unknown>) => logger.success(message, 'Context', data),
  start: (message: string, data?: Record<string, unknown>) => logger.start(message, 'Context', data),
};

export const todoLogger = {
  debug: (message: string, data?: Record<string, unknown>) => logger.debug(message, 'TodoService', data),
  info: (message: string, data?: Record<string, unknown>) => logger.info(message, 'TodoService', data),
  warn: (message: string, data?: Record<string, unknown>) => logger.warn(message, 'TodoService', data),
  error: (message: string, data?: Record<string, unknown>) => logger.error(message, 'TodoService', data),
  success: (message: string, data?: Record<string, unknown>) => logger.success(message, 'TodoService', data),
  start: (message: string, data?: Record<string, unknown>) => logger.start(message, 'TodoService', data),
};

export const menuLogger = {
  debug: (message: string, data?: Record<string, unknown>) => logger.debug(message, 'MenuService', data),
  info: (message: string, data?: Record<string, unknown>) => logger.info(message, 'MenuService', data),
  warn: (message: string, data?: Record<string, unknown>) => logger.warn(message, 'MenuService', data),
  error: (message: string, data?: Record<string, unknown>) => logger.error(message, 'MenuService', data),
  success: (message: string, data?: Record<string, unknown>) => logger.success(message, 'MenuService', data),
  start: (message: string, data?: Record<string, unknown>) => logger.start(message, 'MenuService', data),
};
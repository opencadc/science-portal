/**
 * API Logger Utility
 *
 * Production logs are one line: method, route, status, duration.
 * Header and body dumps run outside production, and credential values are
 * never written — not even a prefix.
 */

import { NextRequest } from 'next/server';
import {
  cookieNames,
  isProductionLog,
  redactBodyText,
  redactHeaderRecord,
  redactSecrets,
} from './redact';

export interface LogContext {
  route: string;
  method: string;
  timestamp: string;
}

export class ApiLogger {
  private context: LogContext;

  constructor(route: string, method: string) {
    this.context = {
      route,
      method,
      timestamp: new Date().toISOString(),
    };
  }

  private durationMs(): number {
    return Date.now() - new Date(this.context.timestamp).getTime();
  }

  /**
   * Log incoming request with headers and body
   */
  logRequest(request: NextRequest, body?: unknown) {
    if (isProductionLog()) return;

    console.info(`[api] ${this.context.method} ${this.context.route}`);

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.info('[api] headers', redactHeaderRecord(headers));

    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      console.info('[api] cookie names', cookieNames(cookieHeader));
    }

    if (body !== undefined) {
      console.info('[api] body', redactSecrets(body));
    }
  }

  /**
   * Log external API call
   */
  logExternalCall(url: string, method: string, headers?: Record<string, unknown>) {
    console.info(`[upstream] ${method} ${url}`);
    if (isProductionLog() || !headers) return;
    console.info('[upstream] headers', redactHeaderRecord(headers));
  }

  /**
   * Log external API response
   */
  logExternalResponse(status: number, statusText: string, data?: unknown) {
    const line = `[upstream] ${status} ${statusText}`;
    if (status >= 400) console.warn(line);
    else console.info(line);

    if (!isProductionLog() && data !== undefined) {
      console.info('[upstream] body', redactSecrets(data));
    }
  }

  /**
   * Log successful response
   */
  logSuccess(statusCode: number, data?: unknown) {
    console.info(
      `[api] ${this.context.method} ${this.context.route} ${statusCode} ${this.durationMs()}ms`,
    );
    if (!isProductionLog() && data !== undefined) {
      console.info('[api] response', redactSecrets(data));
    }
  }

  /**
   * Log error response
   */
  logError(statusCode: number, error: string | Error, details?: unknown) {
    const message = error instanceof Error ? error.message : error;
    console.error(
      `[api] ${this.context.method} ${this.context.route} ${statusCode} ${this.durationMs()}ms ${message}`,
    );

    if (!isProductionLog() && error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    if (!isProductionLog() && details !== undefined) {
      const safe =
        typeof details === 'string' ? redactBodyText(details) : redactSecrets(details);
      console.error('[api] details', safe);
    }
  }

  /**
   * Log a general info message
   */
  info(message: string, data?: unknown) {
    const line = `[api] ${this.context.route} ${message}`;
    if (data === undefined || isProductionLog()) {
      console.info(line);
      return;
    }
    console.info(line, redactSecrets(data));
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: unknown) {
    const line = `[api] ${this.context.route} ${message}`;
    if (data === undefined || isProductionLog()) {
      console.warn(line);
      return;
    }
    console.warn(line, redactSecrets(data));
  }
}

/**
 * Create a logger instance for an API route
 */
export function createLogger(route: string, method: string): ApiLogger {
  return new ApiLogger(route, method);
}

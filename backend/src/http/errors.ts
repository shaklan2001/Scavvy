import { ZodError } from 'zod';
import type { ErrorRequestHandler } from 'express';
import { logEvent } from './log.js';

export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'HttpError';
  }
}

function requestIdOf(response: { getHeader(name: string): number | string | string[] | undefined }): string | undefined {
  const value = response.getHeader('x-request-id');
  return typeof value === 'string' ? value : undefined;
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const requestId = requestIdOf(response);
  if (error instanceof ZodError) {
    logEvent('warn', 'input_validation_failed', {
      requestId,
      path: request.path,
      issues: error.issues.map((issue) => ({ path: issue.path.join('.'), code: issue.code, message: issue.message })),
    });
    response.status(400).json({
      error: 'Invalid request',
      requestId,
      details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
    return;
  }
  if (error instanceof HttpError) {
    logEvent('warn', 'http_error', { requestId, path: request.path, status: error.statusCode });
    response.status(error.statusCode).json({ error: error.message, requestId, ...(error.details ? { details: error.details } : {}) });
    return;
  }
  if (request.path === '/api/voice') {
    logEvent('warn', 'voice_unavailable', {
      requestId,
      reason: error instanceof Error ? error.name : 'unknown',
    });
    response.sendStatus(204);
    return;
  }
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  const status = /not found/i.test(message)
    ? 404
    : /Exactly 3|image is required|Only JPEG|AI must generate/i.test(message)
      ? 400
      : /AI provider|voice generation/i.test(message)
        ? 502
        : 500;
  logEvent(status >= 500 ? 'error' : 'warn', 'request_failed', {
    requestId,
    path: request.path,
    status,
    reason: error instanceof Error ? error.name : 'unknown',
  });
  response.status(status).json({ error: status === 500 ? 'Unexpected server error' : message, requestId });
};

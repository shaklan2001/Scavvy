import { ZodError } from 'zod';
import type { ErrorRequestHandler } from 'express';
import multer from 'multer';

export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = 'HttpError';
  }
}

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof multer.MulterError) {
    response.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Image exceeds the upload size limit' : error.message });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({ error: 'Invalid request', details: error.issues });
    return;
  }
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({ error: error.message, ...(error.details ? { details: error.details } : {}) });
    return;
  }
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  const status = /not found/i.test(message)
    ? 404
    : /Exactly 3|image is required|Only JPEG|AI must generate/i.test(message)
      ? 400
      : /AI|ElevenLabs|voice generation/i.test(message)
        ? 502
        : 500;
  response.status(status).json({ error: status === 500 ? 'Unexpected server error' : message });
};

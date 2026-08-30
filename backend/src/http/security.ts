import type { NextFunction, Request, Response } from 'express';

export const DEFAULT_CORS_ORIGINS = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:8082',
  'http://127.0.0.1:8082',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'http://localhost:19000',
  'http://localhost:8083',
];

export function parseCorsOrigins(raw: string | undefined): string[] {
  const source = (raw ?? '').trim() || DEFAULT_CORS_ORIGINS.join(',');
  const origins = source.split(',').map((item) => item.trim()).filter(Boolean);
  for (const origin of origins) {
    if (origin === '*' || origin.toLowerCase() === 'null' || origin.includes('*')) {
      throw new Error('CORS_ORIGINS must be an exact allowlist of origins');
    }
  }
  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS must include at least one origin');
  }
  return origins;
}

export function corsAndSecurity(options: { allowedOrigins: string[]; isProduction: boolean }) {
  const allowed = new Set(options.allowedOrigins);

  return (request: Request, response: Response, next: NextFunction) => {
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('x-frame-options', 'DENY');
    response.setHeader('referrer-policy', 'strict-origin-when-cross-origin');
    response.setHeader('content-security-policy', "default-src 'none'; frame-ancestors 'none'");
    if (options.isProduction) {
      response.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains');
    }

    const origin = request.headers.origin;
    if (origin && allowed.has(origin)) {
      response.setHeader('access-control-allow-origin', origin);
      response.setHeader('vary', 'Origin');
    }
    response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
    response.setHeader('access-control-allow-headers', 'content-type');

    if (request.method === 'OPTIONS') {
      return response.sendStatus(204);
    }
    next();
  };
}

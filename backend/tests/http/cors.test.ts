import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { parseCorsOrigins } from '../../src/http/security.js';

function app(corsOrigins?: string[]) {
  return createApp({
    ai: {} as never,
    voice: { async synthesize() { return null; } },
  }, { corsOrigins });
}

describe('CORS allowlist', () => {
  it('echoes an exact allowlisted origin and never uses a wildcard', async () => {
    const response = await request(app(['http://localhost:8081']))
      .get('/api/health')
      .set('Origin', 'http://localhost:8081');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:8081');
    expect(response.headers['access-control-allow-origin']).not.toBe('*');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('does not reflect unknown or null origins', async () => {
    const unknown = await request(app(['http://localhost:8081']))
      .get('/api/health')
      .set('Origin', 'https://evil.example');
    const nullOrigin = await request(app(['http://localhost:8081']))
      .options('/api/environment/analyze')
      .set('Origin', 'null');

    expect(unknown.headers['access-control-allow-origin']).toBeUndefined();
    expect(nullOrigin.headers['access-control-allow-origin']).toBeUndefined();
    expect(nullOrigin.status).toBe(204);
  });

  it('rejects wildcard CORS configuration at parse time', () => {
    expect(() => parseCorsOrigins('*')).toThrow(/exact allowlist/);
    expect(() => parseCorsOrigins('http://localhost:8081,null')).toThrow(/exact allowlist/);
  });
});

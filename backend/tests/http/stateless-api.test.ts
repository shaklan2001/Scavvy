import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

describe('stateless API', () => {
  it('does not expose persistent adventure routes', async () => {
    const app = createApp({
      ai: {} as never,
      voice: { async synthesize() { return null; } },
    } as never);

    const response = await request(app).post('/api/adventures').send({ locationType: 'office' });

    expect(response.status).toBe(404);
  });

  it('serves a health response without database configuration', async () => {
    const app = createApp({
      ai: {} as never,
      voice: { async synthesize() { return null; } },
    });

    const response = await request(app).get('/api/health');

    expect(response).toMatchObject({ status: 200, body: { status: 'ok' } });
  });
});

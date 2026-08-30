import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

function app() {
  return createApp({
    ai: {} as never,
    voice: { async synthesize() { return null; } },
  });
}

describe('reference frontend compatibility routes', () => {
  it('starts a three-mission adventure with the frontend response shape', async () => {
    const response = await request(app())
      .post('/api/adventure/start')
      .send({ name: 'Nishant', personality: 'chaos', style: 'CHAOS' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: 'Nishant', personality: 'chaos', style: 'CHAOS' });
    expect(response.body.missions).toHaveLength(3);
    expect(response.body.missions[0]).toMatchObject({ index: 0, difficulty: 'Easy' });
  });

  it('makes a second mission attempt succeed with the expected payload', async () => {
    const response = await request(app())
      .post('/api/mission/analyze')
      .send({ mission_title: 'Find something blue.', mission_index: 0, difficulty: 'Medium', attempt: 2 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.xp).toBe(120);
    expect(response.body.scavvy_line).toEqual(expect.any(String));
  });

  it('provides easier missions and a complete adventure summary', async () => {
    const easier = await request(app()).post('/api/mission/easier').send({ mission_title: 'Find a lamp.', style: 'RANDOM' });
    const summary = await request(app()).post('/api/adventure/summary').send({ personality: 'detective', missions_completed: 3, total_xp: 300 });

    expect(easier.status).toBe(200);
    expect(easier.body).toMatchObject({ index: 0, difficulty: 'Easy' });
    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({ headline: 'ADVENTURE COMPLETE', total_xp: 300, streak_delta: 1 });
    expect(summary.body.traits).toEqual(expect.objectContaining({ explorer: expect.any(Number), observation: expect.any(Number), curiosity: expect.any(Number), chaos: expect.any(Number) }));
  });

  it('returns fallback environment context and three environment quests', async () => {
    const environment = await request(app()).post('/api/environment/analyze').send({ location_type: 'Office' });
    const quests = await request(app()).post('/api/environment/quests').send({ location_type: 'Office', environment: environment.body.environment });

    expect(environment.status).toBe(200);
    expect(environment.body.source).toBe('mock');
    expect(environment.body.environment).toEqual(expect.objectContaining({ environmentType: expect.any(String), visibleObjects: expect.any(Array), possibleHints: expect.any(Array) }));
    expect(quests.status).toBe(200);
    expect(quests.body.quests).toHaveLength(3);
    expect(quests.body.quests[0]).toEqual(expect.objectContaining({ id: 'q1', hint: expect.any(String), xp: expect.any(Number) }));
  });

  it('accepts the raw base64 camera images produced by the Expo scanner', async () => {
    const visionApp = createApp({
      ai: {
        async analyzeEnvironment(images: Array<{ buffer: Buffer }>) {
          expect(images).toHaveLength(1);
          expect(images[0]?.buffer.toString()).toBe('camera-frame');
          return {
            environmentType: 'a scanned room', visibleObjects: ['lamp'], colors: ['orange'], landmarks: ['desk'],
            possibleQuestTargets: ['lamp'], possibleHints: ['near the desk'],
          };
        },
      } as never,
      voice: { async synthesize() { return null; } },
    });

    const response = await request(visionApp)
      .post('/api/environment/analyze')
      .send({ location_type: 'Home', images: [Buffer.from('camera-frame').toString('base64')] });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ source: 'vision', environment: { environmentType: 'a scanned room' } });
  });

  it('uses the configured AI for a supplied legacy quest photo and contextual hint', async () => {
    const aiApp = createApp({
      ai: {
        async validateQuest() {
          return { success: true, confidence: 0.93, explanation: 'That is clearly a lamp.', scavvyReaction: 'Great find.' };
        },
        async generateHint() {
          return 'The desk is worth another look.';
        },
      } as never,
      voice: { async synthesize() { return null; } },
    });

    const validation = await request(aiApp)
      .post('/api/quest/validate')
      .send({ mission_title: 'Find a lamp.', image: Buffer.from('mission-photo').toString('base64'), environment: { visibleObjects: ['lamp'] } });
    const hint = await request(aiApp)
      .post('/api/quest/hint')
      .send({ mission_title: 'Find a lamp.', hint_level: 1, environment: { visibleObjects: ['lamp'] } });

    expect(validation.status).toBe(200);
    expect(validation.body).toMatchObject({ success: true, xp: 100, reasoning: 'That is clearly a lamp.', scavvy_line: 'Great find.' });
    expect(hint.status).toBe(200);
    expect(hint.body).toEqual({ hint: 'The desk is worth another look.' });
  });

  it('validates retries, returns escalating hints, and keeps voice fallback silent', async () => {
    const validation = await request(app()).post('/api/quest/validate').send({ mission_title: 'Find something blue.', attempt: 2 });
    const hint = await request(app()).post('/api/quest/hint').send({ mission_title: 'Find something blue.', hint_level: 2, environment: { possibleHints: ['near the desk'] } });
    const voice = await request(app()).get('/api/voice?line=success');

    expect(validation.status).toBe(200);
    expect(validation.body).toMatchObject({ success: true, xp: 100, scavvy_line: expect.any(String) });
    expect(hint.status).toBe(200);
    expect(hint.body.hint).toContain('Think about it');
    expect(voice.status).toBe(204);
  });
});

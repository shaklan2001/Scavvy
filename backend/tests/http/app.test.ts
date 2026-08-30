import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import type { ScavvyStore } from '../../src/domain/ports.js';
import type { Adventure, EnvironmentContext, GeneratedQuest, Quest, VerificationResult } from '../../src/domain/types.js';

const context: EnvironmentContext = {
  environmentType: 'office', visibleObjects: ['projector'], colors: ['blue'], landmarks: ['front wall'],
  possibleQuestTargets: ['projector'], possibleHints: ['near the front'],
};
const generated: GeneratedQuest[] = [
  { type: 'observation', title: 'Observe', description: 'Find a useful thing.', difficulty: 'easy', xp: 100 },
  { type: 'visual_clue', title: 'Spot blue', description: 'Find something blue.', difficulty: 'easy', xp: 75 },
  { type: 'reasoning', title: 'Think', description: 'Find a power-dependent thing.', difficulty: 'medium', xp: 150 },
];

class ApiStore implements ScavvyStore {
  adventure: Adventure = { id: 'adv-1', locationType: 'office', status: 'awaiting_scan', xp: 0, createdAt: new Date().toISOString() };
  scan: EnvironmentContext | null = null;
  quests: Quest[] = [];
  async createAdventure(locationType: Adventure['locationType']) { this.adventure = { ...this.adventure, id: 'adv-1', locationType }; return this.adventure; }
  async findAdventure(id: string) { return id === this.adventure.id ? this.adventure : null; }
  async updateAdventure(id: string, patch: Partial<Adventure>) { this.adventure = { ...this.adventure, ...patch, id }; return this.adventure; }
  async saveEnvironmentScan() { this.scan = context; }
  async findEnvironmentScan() { return this.scan; }
  async saveQuests(adventureId: string, input: GeneratedQuest[]) { this.quests = input.map((quest, index) => ({ ...quest, id: `quest-${index + 1}`, adventureId, status: 'available' })); return this.quests; }
  async listQuests() { return this.quests; }
  async findQuest(id: string) { return this.quests.find((quest) => quest.id === id) ?? null; }
  async saveAttempt() {}
  async completeQuestIfPending(id: string) { const quest = this.quests.find((item) => item.id === id); if (!quest || quest.status === 'completed') return false; quest.status = 'completed'; return true; }
  async addXp(_id: string, xp: number) { this.adventure.xp += xp; }
  async saveHint() {}
}

describe('Scavvy HTTP API', () => {
  it('creates an adventure and rejects an invalid location type', async () => {
    const store = new ApiStore();
    const app = createApp({ store, ai: {} as never, voice: { async synthesize() { return null; } } });

    const created = await request(app).post('/api/adventures').send({ locationType: 'office' });
    const invalid = await request(app).post('/api/adventures').send({ locationType: 'warehouse' });

    expect(created.status).toBe(201);
    expect(created.body.adventure.locationType).toBe('office');
    expect(invalid.status).toBe(400);
  });

  it('requires three images and returns generated quests after a valid scan', async () => {
    const store = new ApiStore();
    const app = createApp({
      store,
      ai: { async analyzeEnvironment() { return context; }, async generateQuests() { return generated; } } as never,
      voice: { async synthesize() { return null; } },
    });

    const tooFew = await request(app).post('/api/adventures/adv-1/scan').attach('images', Buffer.from('one'), 'one.jpg');
    const scan = await request(app)
      .post('/api/adventures/adv-1/scan')
      .attach('images', Buffer.from('one'), { filename: 'one.jpg', contentType: 'image/jpeg' })
      .attach('images', Buffer.from('two'), { filename: 'two.jpg', contentType: 'image/jpeg' })
      .attach('images', Buffer.from('three'), { filename: 'three.jpg', contentType: 'image/jpeg' });

    expect(tooFew.status).toBe(400);
    expect(scan.status).toBe(200);
    expect(scan.body.quests).toHaveLength(3);
    expect(scan.body.environmentContext).toBeUndefined();
  });

  it('verifies quests, returns hints, and exposes aggregate progress', async () => {
    const store = new ApiStore();
    store.scan = context;
    store.quests = generated.map((quest, index) => ({ ...quest, id: `quest-${index + 1}`, adventureId: 'adv-1', status: 'available' }));
    const verification: VerificationResult = { success: true, confidence: 0.9, explanation: 'Matches.', scavvyReaction: 'That counts!' };
    const app = createApp({
      store,
      ai: { async validateQuest() { return verification; }, async generateHint() { return 'Look near the front.'; } } as never,
      voice: { async synthesize() { return 'data:audio/mpeg;base64,AQID'; } },
    });

    const verified = await request(app).post('/api/quests/quest-1/verify').attach('image', Buffer.from('photo'), 'photo.jpg');
    const hint = await request(app).post('/api/quests/quest-1/hint').send({ level: 1, voice: true });
    const aggregate = await request(app).get('/api/adventures/adv-1');

    expect(verified.status).toBe(200);
    expect(verified.body.awardedXp).toBe(100);
    expect(hint.body).toEqual({ text: 'Look near the front.', audioUrl: 'data:audio/mpeg;base64,AQID' });
    expect(aggregate.body.adventure.xp).toBe(100);
  });

  it('returns a health response', async () => {
    const app = createApp({ store: new ApiStore(), ai: {} as never, voice: { async synthesize() { return null; } } });
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

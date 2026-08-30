import { describe, expect, it } from 'vitest';
import type {
  Adventure,
  EnvironmentContext,
  GeneratedQuest,
  Quest,
  VerificationResult,
} from '../../src/domain/types.js';
import type { ScavvyStore } from '../../src/domain/ports.js';
import { AdventureService } from '../../src/domain/adventure-service.js';
import { QuestService } from '../../src/domain/quest-service.js';

const context: EnvironmentContext = {
  environmentType: 'office',
  visibleObjects: ['projector', 'blue backpack'],
  colors: ['blue'],
  landmarks: ['front presentation wall'],
  possibleQuestTargets: ['projector', 'blue backpack'],
  possibleHints: ['near the front of the room'],
};

const generatedQuests: GeneratedQuest[] = [
  { type: 'observation', title: 'Find a communication tool', description: 'Find something that helps people communicate without speaking.', difficulty: 'easy', xp: 100 },
  { type: 'visual_clue', title: 'Find something blue', description: 'Find the blue item Scavvy noticed.', difficulty: 'easy', xp: 75 },
  { type: 'reasoning', title: 'Power dependent', description: 'Find something that becomes less useful without electricity.', difficulty: 'medium', xp: 150 },
];

class FakeStore implements ScavvyStore {
  adventure: Adventure = { id: 'adv-1', locationType: 'office', status: 'awaiting_scan', xp: 0, createdAt: new Date().toISOString() };
  scan: EnvironmentContext | null = null;
  quests: Quest[] = [];
  attempts: VerificationResult[] = [];

  async createAdventure(): Promise<Adventure> { return this.adventure; }
  async findAdventure(): Promise<Adventure | null> { return this.adventure; }
  async updateAdventure(id: string, patch: Partial<Adventure>): Promise<Adventure> {
    this.adventure = { ...this.adventure, ...patch, id };
    return this.adventure;
  }
  async saveEnvironmentScan(): Promise<void> { this.scan = context; }
  async findEnvironmentScan(): Promise<EnvironmentContext | null> { return this.scan; }
  async saveQuests(adventureId: string, quests: GeneratedQuest[]): Promise<Quest[]> {
    this.quests = quests.map((quest, index) => ({ ...quest, id: `quest-${index + 1}`, adventureId, status: 'available' }));
    return this.quests;
  }
  async listQuests(): Promise<Quest[]> { return this.quests; }
  async findQuest(id: string): Promise<Quest | null> { return this.quests.find((quest) => quest.id === id) ?? null; }
  async saveAttempt(_questId: string, result: VerificationResult): Promise<void> { this.attempts.push(result); }
  async completeQuestIfPending(id: string): Promise<boolean> {
    const quest = this.quests.find((item) => item.id === id);
    if (!quest || quest.status === 'completed') return false;
    quest.status = 'completed';
    return true;
  }
  async addXp(_adventureId: string, xp: number): Promise<void> { this.adventure.xp += xp; }
  async saveHint(): Promise<void> {}
}

describe('Scavvy domain services', () => {
  it('analyzes the three scan images before generating three quests', async () => {
    const store = new FakeStore();
    const calls: string[] = [];
    const ai = {
      async analyzeEnvironment() { calls.push('analyze'); return context; },
      async generateQuests() { calls.push('generate'); return generatedQuests; },
    };
    const service = new AdventureService(store, ai);

    const result = await service.scan('adv-1', [1, 2, 3].map((value) => ({ buffer: Buffer.from(String(value)), mimetype: 'image/jpeg' })));

    expect(calls).toEqual(['analyze', 'generate']);
    expect(result.quests).toHaveLength(3);
    expect(result.adventure.status).toBe('ready');
  });

  it('awards XP only once when the same quest is verified twice', async () => {
    const store = new FakeStore();
    store.scan = context;
    store.quests = generatedQuests.map((quest, index) => ({ ...quest, id: `quest-${index + 1}`, adventureId: 'adv-1', status: 'available' }));
    const verification: VerificationResult = { success: true, confidence: 0.95, explanation: 'The projector matches.', scavvyReaction: 'That counts!' };
    const ai = { async validateQuest() { return verification; } };
    const service = new QuestService(store, ai as never, { async synthesize() { return null; } });

    await service.verify('quest-1', Buffer.from('photo'));
    await service.verify('quest-1', Buffer.from('photo'));

    expect(store.adventure.xp).toBe(100);
    expect(store.quests[0].status).toBe('completed');
  });

  it('uses stored environment context to generate a hint and optional voice audio', async () => {
    const store = new FakeStore();
    store.scan = context;
    store.quests = [{ ...generatedQuests[0], id: 'quest-1', adventureId: 'adv-1', status: 'available' }];
    let receivedContext: EnvironmentContext | undefined;
    const ai = {
      async generateHint(_quest: Quest, environmentContext: EnvironmentContext) { receivedContext = environmentContext; return 'Look near the front.'; },
    };
    const service = new QuestService(store, ai as never, { async synthesize() { return 'https://audio.test/hint.mp3'; } });

    const result = await service.hint('quest-1', 1, true);

    expect(receivedContext).toBe(context);
    expect(result.text).toBe('Look near the front.');
    expect(result.audioUrl).toBe('https://audio.test/hint.mp3');
  });
});

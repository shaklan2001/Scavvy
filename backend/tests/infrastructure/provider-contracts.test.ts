import { describe, expect, it } from 'vitest';
import { OpenAiProvider } from '../../src/infrastructure/openai-provider.js';
import { ElevenLabsProvider } from '../../src/infrastructure/elevenlabs-provider.js';
import type { Quest } from '../../src/domain/types.js';

const quest: Quest = {
  id: 'quest-1', adventureId: 'adv-1', type: 'observation', title: 'Find it',
  description: 'Find something useful.', difficulty: 'easy', xp: 100, status: 'available',
};

describe('OpenAI provider', () => {
  it('sends image inputs and returns validated environment context', async () => {
    let request: unknown;
    const provider = new OpenAiProvider({
      responses: { create: async (input) => { request = input; return { output_text: JSON.stringify({
        environmentType: 'office', visibleObjects: ['projector'], colors: ['blue'],
        landmarks: ['front wall'], possibleQuestTargets: ['projector'], possibleHints: ['near the front'],
      }) }; } },
    });

    const result = await provider.analyzeEnvironment([{ buffer: Buffer.from('image'), mimetype: 'image/jpeg' } as never], 'office');

    expect(result.environmentType).toBe('office');
    expect(JSON.stringify(request)).toContain('input_image');
    expect(request).toMatchObject({ model: 'gpt-5.6-luna' });
  });

  it('rejects AI output that does not contain exactly three quests', async () => {
    const provider = new OpenAiProvider({
      responses: { create: async () => ({ output_text: JSON.stringify([{ type: 'observation', title: 'Only one', description: 'Nope', difficulty: 'easy', xp: 100 }]) }) },
    });

    await expect(provider.generateQuests({
      environmentType: 'office', visibleObjects: [], colors: [], landmarks: [], possibleQuestTargets: [], possibleHints: [],
    })).rejects.toThrow('exactly 3 quests');
  });

  it('parses quest validation and hint responses', async () => {
    const provider = new OpenAiProvider({
      responses: { create: async (input) => ({ output_text: JSON.stringify(
        JSON.stringify(input).includes('hint') ? { hint: 'Look near the front.' } :
          { success: true, confidence: 0.92, explanation: 'Matches.', scavvyReaction: 'That counts!' },
      ) }) },
    });
    const context = { environmentType: 'office', visibleObjects: [], colors: [], landmarks: [], possibleQuestTargets: [], possibleHints: [] };

    await expect(provider.validateQuest(quest, context, { buffer: Buffer.from('photo'), mimetype: 'image/jpeg' })).resolves.toMatchObject({ success: true, confidence: 0.92 });
    await expect(provider.generateHint(quest, context, 1)).resolves.toBe('Look near the front.');
  });
});

describe('ElevenLabs provider', () => {
  it('falls back without making a network request when voice is unconfigured', async () => {
    const provider = new ElevenLabsProvider({ apiKey: '', voiceId: '' });
    await expect(provider.synthesize('Hello')).resolves.toBeNull();
  });

  it('converts returned audio bytes into a playable data URL', async () => {
    let url = '';
    const provider = new ElevenLabsProvider({
      apiKey: 'test-key', voiceId: 'voice-1', fetchFn: async (input) => {
        url = String(input);
        return { ok: true, headers: { get: () => 'audio/mpeg' }, arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer } as never;
      },
    });

    await expect(provider.synthesize('Hello')).resolves.toBe('data:audio/mpeg;base64,AQID');
    expect(url).toContain('/v1/text-to-speech/voice-1');
  });
});

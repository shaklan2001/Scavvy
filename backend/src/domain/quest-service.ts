import { hintLevelSchema } from './validation.js';
import type { ScavvyAiProvider, ScavvyStore, VoiceProvider } from './ports.js';
import type { HintResult, ImageInput, Quest, VerificationResult } from './types.js';

export class QuestService {
  constructor(
    private readonly store: ScavvyStore,
    private readonly ai: Pick<ScavvyAiProvider, 'validateQuest' | 'generateHint'>,
    private readonly voice: VoiceProvider,
  ) {}

  async verify(questId: string, image: ImageInput | Buffer): Promise<VerificationResult & { awardedXp: number; adventureStatus: string }> {
    const quest = await this.store.findQuest(questId);
    if (!quest) throw new Error('Quest not found');
    const adventure = await this.store.findAdventure(quest.adventureId);
    if (!adventure) throw new Error('Adventure not found');
    const context = await this.store.findEnvironmentScan(quest.adventureId);
    if (!context) throw new Error('Environment scan not found');

    const input: ImageInput = Buffer.isBuffer(image) ? { buffer: image, mimetype: 'image/jpeg' } : image;
    const result = await this.ai.validateQuest(quest, context, input);
    await this.store.saveAttempt(questId, result);

    let awardedXp = 0;
    if (result.success && await this.store.completeQuestIfPending(questId)) {
      awardedXp = quest.xp;
      await this.store.addXp(quest.adventureId, quest.xp);
      const quests = await this.store.listQuests(quest.adventureId);
      if (quests.length > 0 && quests.every((item) => item.status === 'completed')) {
        await this.store.updateAdventure(quest.adventureId, { status: 'completed', completedAt: new Date().toISOString() });
      }
    }

    const updatedAdventure = await this.store.findAdventure(quest.adventureId);
    return { ...result, awardedXp, adventureStatus: updatedAdventure?.status ?? adventure.status };
  }

  async hint(questId: string, level: number, voice: boolean): Promise<HintResult> {
    const validLevel = hintLevelSchema.parse(level);
    const quest = await this.store.findQuest(questId);
    if (!quest) throw new Error('Quest not found');
    const context = await this.store.findEnvironmentScan(quest.adventureId);
    if (!context) throw new Error('Environment scan not found');
    const text = await this.ai.generateHint(quest, context, validLevel);
    const audioUrl = voice ? await this.voice.synthesize(text) : null;
    await this.store.saveHint(questId, validLevel, text, audioUrl);
    return { text, audioUrl };
  }
}

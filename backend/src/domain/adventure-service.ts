import { assertExactlyThreeImages } from './validation.js';
import type { ScavvyAiProvider, ScavvyStore } from './ports.js';
import type { Adventure, ImageInput, Quest } from './types.js';

export class AdventureService {
  constructor(
    private readonly store: ScavvyStore,
    private readonly ai: Pick<ScavvyAiProvider, 'analyzeEnvironment' | 'generateQuests'>,
  ) {}

  async create(locationType: Adventure['locationType']): Promise<Adventure> {
    return this.store.createAdventure(locationType);
  }

  async get(adventureId: string): Promise<{ adventure: Adventure; quests: Quest[] }> {
    const adventure = await this.store.findAdventure(adventureId);
    if (!adventure) throw new Error('Adventure not found');
    return { adventure, quests: await this.store.listQuests(adventureId) };
  }

  async scan(adventureId: string, images: ImageInput[]): Promise<{ adventure: Adventure; quests: Quest[] }> {
    assertExactlyThreeImages(images.map((image) => image.buffer));
    const adventure = await this.store.findAdventure(adventureId);
    if (!adventure) throw new Error('Adventure not found');

    await this.store.updateAdventure(adventureId, { status: 'analyzing' });
    const context = await this.ai.analyzeEnvironment(images, adventure.locationType);
    await this.store.saveEnvironmentScan(adventureId, context);
    const quests = await this.ai.generateQuests(context);
    if (quests.length !== 3) throw new Error('AI must generate exactly 3 quests');
    await this.store.saveQuests(adventureId, quests);
    const readyAdventure = await this.store.updateAdventure(adventureId, { status: 'ready' });
    return { adventure: readyAdventure, quests: await this.store.listQuests(adventureId) };
  }
}

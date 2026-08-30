import type {
  Adventure,
  EnvironmentContext,
  GeneratedQuest,
  ImageInput,
  LocationType,
  Quest,
  VerificationResult,
} from './types.js';

export interface ScavvyStore {
  createAdventure(locationType: LocationType): Promise<Adventure>;
  findAdventure(id: string): Promise<Adventure | null>;
  updateAdventure(id: string, patch: Partial<Adventure>): Promise<Adventure>;
  saveEnvironmentScan(adventureId: string, context: EnvironmentContext): Promise<void>;
  findEnvironmentScan(adventureId: string): Promise<EnvironmentContext | null>;
  saveQuests(adventureId: string, quests: GeneratedQuest[]): Promise<Quest[]>;
  listQuests(adventureId: string): Promise<Quest[]>;
  findQuest(id: string): Promise<Quest | null>;
  saveAttempt(questId: string, result: VerificationResult): Promise<void>;
  completeQuestIfPending(id: string): Promise<boolean>;
  addXp(adventureId: string, xp: number): Promise<void>;
  saveHint(questId: string, level: number, text: string, audioUrl: string | null): Promise<void>;
}

export interface ScavvyAiProvider {
  analyzeEnvironment(images: ImageInput[], locationType: LocationType): Promise<EnvironmentContext>;
  generateQuests(context: EnvironmentContext): Promise<GeneratedQuest[]>;
  validateQuest(quest: Quest, context: EnvironmentContext, image: ImageInput): Promise<VerificationResult>;
  generateHint(quest: Quest, context: EnvironmentContext, level: number): Promise<string>;
}

export interface VoiceProvider {
  synthesize(text: string): Promise<string | null>;
}

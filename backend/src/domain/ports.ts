import type { EnvironmentContext, GeneratedQuest, ImageInput, LocationType, Quest, VerificationResult } from './types.js';

export interface ScavvyAiProvider {
  analyzeEnvironment(images: ImageInput[], locationType: LocationType): Promise<EnvironmentContext>;
  generateQuests(context: EnvironmentContext): Promise<GeneratedQuest[]>;
  validateQuest(quest: Quest, context: EnvironmentContext, image: ImageInput): Promise<VerificationResult>;
  generateHint(quest: Quest, context: EnvironmentContext, level: number): Promise<string>;
}

export interface VoiceProvider {
  synthesize(text: string): Promise<string | null>;
}

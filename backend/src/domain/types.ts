export type LocationType = 'home' | 'office' | 'campus' | 'outdoors' | 'other';
export type AdventureStatus = 'awaiting_scan' | 'analyzing' | 'ready' | 'completed';
export type QuestType = 'observation' | 'visual_clue' | 'reasoning';
export type QuestDifficulty = 'easy' | 'medium' | 'hard';
export type QuestStatus = 'available' | 'completed';

export interface ImageInput {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
}

export interface EnvironmentContext {
  environmentType: string;
  visibleObjects: string[];
  colors: string[];
  landmarks: string[];
  possibleQuestTargets: string[];
  possibleHints: string[];
}

export interface GeneratedQuest {
  type: QuestType;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  xp: number;
}

export interface Quest extends GeneratedQuest {
  id: string;
  adventureId: string;
  status: QuestStatus;
}

export interface Adventure {
  id: string;
  locationType: LocationType;
  status: AdventureStatus;
  xp: number;
  createdAt: string;
  completedAt?: string;
}

export interface VerificationResult {
  success: boolean;
  confidence: number;
  explanation: string;
  scavvyReaction: string;
}

export interface HintResult {
  text: string;
  audioUrl: string | null;
}

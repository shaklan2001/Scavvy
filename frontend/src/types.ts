export type LocationType = "Home" | "Office" | "Campus" | "Outdoors" | "Somewhere Else";

export type EnvironmentContext = {
  environmentType: string;
  visibleObjects: string[];
  colors: string[];
  landmarks: string[];
  possibleQuestTargets: string[];
  possibleHints: string[];
};

export type QuestType = "observation" | "reasoning" | "visual" | "visual_clue" | "quick";

export type Quest = {
  id: string;
  type: QuestType | string;
  title: string;
  hint: string;
  difficulty: string;
  xp: number;
};

export type Mission = {
  index: number;
  title: string;
  hint: string;
  difficulty: string;
  type?: string;
  xp?: number;
};

export type Adventure = {
  id: string;
  name: string;
  personality: string;
  style: string;
  missions: Mission[];
};

export type VerificationPhoto = {
  uri: string;
  base64: string | null;
};

export type AnalyzeResult = {
  success: boolean;
  xp: number;
  detected?: string;
  reasoning: string;
  scavvy_line: string;
};

export type AdventureSummary = {
  headline: string;
  summary: string;
  traits: Record<string, number>;
  total_xp: number;
  streak_delta: number;
};

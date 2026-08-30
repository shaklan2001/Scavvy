import {
  fallbackAnalyze,
  fallbackEnvironment,
  fallbackHint,
  fallbackMissions,
  fallbackQuests,
  FALLBACK_SUMMARY,
  FALLBACK_TRAITS,
} from "@/src/data/content";
import { apiPost } from "@/src/services/http";
import { toApiImage, toApiImages } from "@/src/services/images";
import type {
  Adventure,
  AdventureSummary,
  AnalyzeResult,
  EnvironmentContext,
  Mission,
  Quest,
} from "@/src/types";

export type { Adventure, Mission };

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asEnvironment(value: unknown): EnvironmentContext | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const environmentType = typeof record.environmentType === "string" ? record.environmentType : null;
  if (!environmentType) return null;
  return {
    environmentType,
    visibleObjects: asStringArray(record.visibleObjects),
    colors: asStringArray(record.colors),
    landmarks: asStringArray(record.landmarks),
    possibleQuestTargets: asStringArray(record.possibleQuestTargets),
    possibleHints: asStringArray(record.possibleHints),
  };
}

function asQuest(value: unknown): Quest | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.title !== "string" || record.title.trim().length === 0) return null;
  return {
    id: typeof record.id === "string" ? record.id : `q-${record.title}`,
    type: typeof record.type === "string" ? record.type : "observation",
    title: record.title,
    hint: typeof record.hint === "string" ? record.hint : "",
    difficulty: typeof record.difficulty === "string" ? record.difficulty : "Easy",
    xp: typeof record.xp === "number" && Number.isFinite(record.xp) ? record.xp : 100,
  };
}

function asMission(value: unknown): Mission | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.title !== "string" || record.title.trim().length === 0) return null;
  return {
    index: typeof record.index === "number" ? record.index : 0,
    title: record.title,
    hint: typeof record.hint === "string" ? record.hint : "",
    difficulty: typeof record.difficulty === "string" ? record.difficulty : "Easy",
  };
}

function asAdventure(value: unknown, fallback: { name: string; personality: string; style: string }): Adventure | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const missions = Array.isArray(record.missions)
    ? record.missions.map(asMission).filter((mission): mission is Mission => mission !== null)
    : [];
  if (missions.length < 1) return null;
  return {
    id: typeof record.id === "string" ? record.id : `local-${Date.now()}`,
    name: typeof record.name === "string" ? record.name : fallback.name,
    personality: typeof record.personality === "string" ? record.personality : fallback.personality,
    style: typeof record.style === "string" ? record.style : fallback.style,
    missions,
  };
}

function asAnalyzeResult(value: unknown): AnalyzeResult | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.success !== "boolean") return null;
  const line = typeof record.scavvy_line === "string" ? record.scavvy_line : null;
  const reasoning = typeof record.reasoning === "string" ? record.reasoning : line;
  if (!reasoning) return null;
  return {
    success: record.success,
    xp: typeof record.xp === "number" && Number.isFinite(record.xp) ? record.xp : 0,
    detected: typeof record.detected === "string" ? record.detected : undefined,
    reasoning,
    scavvy_line: line ?? reasoning,
  };
}

function asSummary(value: unknown, totalXp: number): AdventureSummary | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.summary !== "string" || typeof record.headline !== "string") return null;
  const traits = record.traits && typeof record.traits === "object" && !Array.isArray(record.traits)
    ? Object.fromEntries(
      Object.entries(record.traits as Record<string, unknown>).flatMap(([key, score]) => (
        typeof score === "number" && Number.isFinite(score) ? [[key, score]] : []
      )),
    )
    : {};
  return {
    headline: record.headline,
    summary: record.summary,
    traits,
    total_xp: typeof record.total_xp === "number" ? record.total_xp : totalXp,
    streak_delta: typeof record.streak_delta === "number" ? record.streak_delta : 1,
  };
}

function warnFallback(action: string, error: unknown): void {
  if (__DEV__) {
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : "unknown";
    console.warn(`[scavvy] ${action} fell back to local mock`, reason);
  }
}

export const ai = {
  async startAdventure(name: string, personality: string, style: string): Promise<Adventure> {
    try {
      const payload = await apiPost<unknown>("/adventure/start", { name, personality, style });
      const adventure = asAdventure(payload, { name, personality, style });
      if (!adventure) throw new Error("invalid adventure");
      return adventure;
    } catch (error) {
      warnFallback("startAdventure", error);
      return {
        id: `local-${Date.now()}`,
        name,
        personality,
        style,
        missions: fallbackMissions(style),
      };
    }
  },

  async analyzeImage(args: {
    missionTitle: string;
    missionIndex: number;
    difficulty: string;
    personality: string;
    style: string;
    attempt: number;
  }): Promise<AnalyzeResult> {
    try {
      const payload = await apiPost<unknown>("/mission/analyze", {
        mission_title: args.missionTitle,
        mission_index: args.missionIndex,
        difficulty: args.difficulty,
        personality: args.personality,
        style: args.style,
        attempt: args.attempt,
      });
      const result = asAnalyzeResult(payload);
      if (!result) throw new Error("invalid analyze result");
      return result;
    } catch (error) {
      warnFallback("analyzeImage", error);
      return fallbackAnalyze(args.missionTitle, args.difficulty);
    }
  },

  async easierMission(missionTitle: string, style: string): Promise<Mission> {
    try {
      const payload = await apiPost<unknown>("/mission/easier", { mission_title: missionTitle, style });
      const mission = asMission(payload);
      if (!mission) throw new Error("invalid mission");
      return mission;
    } catch (error) {
      warnFallback("easierMission", error);
      return {
        index: 0,
        title: "Find literally anything orange. That's the mission.",
        hint: "Okay okay, I made it easy. Go.",
        difficulty: "Easy",
      };
    }
  },

  async analyzeEnvironment(locationType: string, images: string[]) {
    try {
      const payload = await apiPost<unknown>(
        "/environment/analyze",
        { location_type: locationType, images: toApiImages(images) },
        45000,
      );
      if (!payload || typeof payload !== "object") throw new Error("invalid environment");
      const record = payload as Record<string, unknown>;
      const environment = asEnvironment(record.environment);
      if (!environment) throw new Error("invalid environment");
      return {
        environment,
        source: typeof record.source === "string" ? record.source : "live",
      };
    } catch (error) {
      warnFallback("analyzeEnvironment", error);
      return { environment: fallbackEnvironment(locationType), source: "mock" };
    }
  },

  async generateQuests(locationType: string, environment: EnvironmentContext): Promise<Quest[]> {
    try {
      const payload = await apiPost<unknown>(
        "/environment/quests",
        { location_type: locationType, environment },
        20000,
      );
      const quests = payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>).quests)
        ? (payload as { quests: unknown[] }).quests.map(asQuest).filter((quest): quest is Quest => quest !== null)
        : [];
      if (quests.length < 3) throw new Error("invalid quests");
      return quests.slice(0, 3);
    } catch (error) {
      warnFallback("generateQuests", error);
      return fallbackQuests(environment);
    }
  },

  async validateQuest(args: {
    missionTitle: string;
    environment: EnvironmentContext | null;
    image: string | null;
    attempt: number;
    difficulty?: string;
  }): Promise<AnalyzeResult> {
    try {
      const payload = await apiPost<unknown>(
        "/quest/validate",
        {
          mission_title: args.missionTitle,
          environment: args.environment ?? undefined,
          image: toApiImage(args.image),
          attempt: args.attempt,
          difficulty: args.difficulty,
        },
        45000,
      );
      const result = asAnalyzeResult(payload);
      if (!result) throw new Error("invalid validation");
      return result;
    } catch (error) {
      warnFallback("validateQuest", error);
      return fallbackAnalyze(args.missionTitle, args.difficulty);
    }
  },

  async askHint(missionTitle: string, environment: EnvironmentContext | null, hintLevel: number) {
    try {
      const payload = await apiPost<unknown>(
        "/quest/hint",
        { mission_title: missionTitle, environment: environment ?? undefined, hint_level: hintLevel },
        15000,
      );
      const hint = payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).hint === "string"
        ? (payload as { hint: string }).hint
        : "";
      if (!hint) throw new Error("invalid hint");
      return hint;
    } catch (error) {
      warnFallback("askHint", error);
      return fallbackHint(environment, hintLevel);
    }
  },

  async adventureSummary(args: {
    name: string;
    personality: string;
    style: string;
    missionsCompleted: number;
    totalXp: number;
  }): Promise<AdventureSummary> {
    try {
      const payload = await apiPost<unknown>("/adventure/summary", {
        name: args.name,
        personality: args.personality,
        style: args.style,
        missions_completed: args.missionsCompleted,
        total_xp: args.totalXp,
      });
      const summary = asSummary(payload, args.totalXp);
      if (!summary) throw new Error("invalid summary");
      return summary;
    } catch (error) {
      warnFallback("adventureSummary", error);
      const personality = args.personality || "explorer";
      return {
        headline: "ADVENTURE COMPLETE",
        summary: FALLBACK_SUMMARY[personality] || FALLBACK_SUMMARY.explorer,
        traits: FALLBACK_TRAITS[personality] || FALLBACK_TRAITS.explorer,
        total_xp: args.totalXp,
        streak_delta: 1,
      };
    }
  },
};

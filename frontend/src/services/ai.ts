// Local-first AI layer. The Expo app runs fully offline with mock quests.
// A live backend is optional — only used when EXPO_PUBLIC_BACKEND_URL is set.
import {
  fallbackAnalyze,
  fallbackEnvironment,
  fallbackHint,
  fallbackMissions,
  fallbackQuests,
  FALLBACK_SUMMARY,
  FALLBACK_TRAITS,
} from "@/src/data/content";
import { API_URL, isLiveApi } from "@/src/config";
import type {
  Adventure,
  AdventureSummary,
  AnalyzeResult,
  EnvironmentContext,
  Mission,
  Quest,
} from "@/src/types";

export type { Adventure, Mission };

type JsonRecord = Record<string, unknown>;

async function post<T>(path: string, body: JsonRecord, timeoutMs = 6000): Promise<T> {
  if (!isLiveApi) {
    throw new Error("offline");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export const ai = {
  async startAdventure(name: string, personality: string, style: string): Promise<Adventure> {
    try {
      return await post<Adventure>("/adventure/start", { name, personality, style });
    } catch {
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
      return await post<AnalyzeResult>("/mission/analyze", {
        mission_title: args.missionTitle,
        mission_index: args.missionIndex,
        difficulty: args.difficulty,
        personality: args.personality,
        style: args.style,
        attempt: args.attempt,
      });
    } catch {
      return fallbackAnalyze(args.missionTitle, args.difficulty);
    }
  },

  async easierMission(missionTitle: string, style: string): Promise<Mission> {
    try {
      return await post<Mission>("/mission/easier", { mission_title: missionTitle, style });
    } catch {
      return {
        index: 0,
        title: "Find literally anything orange. That's the mission.",
        hint: "Okay okay, I made it easy. Go.",
        difficulty: "Easy",
      };
    }
  },

  async analyzeEnvironment(locationType: string, _images: string[]) {
    try {
      return await post<{ environment: EnvironmentContext; source: string }>(
        "/environment/analyze",
        { location_type: locationType, images: _images },
        30000
      );
    } catch {
      return { environment: fallbackEnvironment(locationType), source: "mock" };
    }
  },

  async generateQuests(locationType: string, environment: EnvironmentContext): Promise<Quest[]> {
    try {
      const result = await post<{ quests: Quest[] }>(
        "/environment/quests",
        { location_type: locationType, environment },
        20000
      );
      return result.quests;
    } catch {
      return fallbackQuests(environment);
    }
  },

  async validateQuest(args: {
    missionTitle: string;
    environment: EnvironmentContext | null;
    image: string | null;
    attempt: number;
  }): Promise<AnalyzeResult> {
    try {
      return await post<AnalyzeResult>(
        "/quest/validate",
        {
          mission_title: args.missionTitle,
          environment: args.environment ?? undefined,
          image: args.image,
          attempt: args.attempt,
        },
        30000
      );
    } catch {
      return fallbackAnalyze(args.missionTitle);
    }
  },

  async askHint(missionTitle: string, environment: EnvironmentContext | null, hintLevel: number) {
    try {
      const result = await post<{ hint: string }>(
        "/quest/hint",
        { mission_title: missionTitle, environment: environment ?? undefined, hint_level: hintLevel },
        15000
      );
      return result.hint;
    } catch {
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
      return await post<AdventureSummary>("/adventure/summary", {
        name: args.name,
        personality: args.personality,
        style: args.style,
        missions_completed: args.missionsCompleted,
        total_xp: args.totalXp,
      });
    } catch {
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

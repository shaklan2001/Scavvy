// Backend / AI service layer. Wraps the FastAPI mock endpoints and always
// degrades gracefully to local fallbacks so the demo never gets stuck.
import {
  fallbackAnalyze,
  fallbackMissions,
  FALLBACK_SUMMARY,
  FALLBACK_TRAITS,
} from "@/src/data/content";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

async function post(path: string, body: any, timeoutMs = 6000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export type Mission = {
  index: number;
  title: string;
  hint: string;
  difficulty: string;
};

export type Adventure = {
  id: string;
  name: string;
  personality: string;
  style: string;
  missions: Mission[];
};

export const ai = {
  async startAdventure(name: string, personality: string, style: string): Promise<Adventure> {
    try {
      return await post("/adventure/start", { name, personality, style });
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
  }) {
    try {
      return await post("/mission/analyze", {
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
      return await post("/mission/easier", { mission_title: missionTitle, style });
    } catch {
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
      return await post("/environment/analyze", { location_type: locationType, images }, 30000);
    } catch {
      return { environment: { environmentType: `a ${locationType} space`, visibleObjects: ["object"], colors: ["mixed"], landmarks: [], possibleQuestTargets: [], possibleHints: ["It's closer than you think."] }, source: "mock" };
    }
  },

  async generateQuests(locationType: string, environment: any) {
    try {
      const r = await post("/environment/quests", { location_type: locationType, environment }, 20000);
      return r.quests as any[];
    } catch {
      return [
        { id: "q1", type: "observation", title: "Find something that helps people communicate without speaking.", hint: "You'll know it when you see it.", difficulty: "Easy", xp: 100 },
        { id: "q2", type: "reasoning", title: "I remember seeing something colourful. Find it.", hint: "Trust your memory of the room.", difficulty: "Medium", xp: 150 },
        { id: "q3", type: "visual", title: "Find something that becomes much less useful without electricity.", hint: "It probably has a plug or a battery.", difficulty: "Easy", xp: 75 },
      ];
    }
  },

  async validateQuest(args: { missionTitle: string; environment: any; image: string | null; attempt: number }) {
    try {
      return await post("/quest/validate", { mission_title: args.missionTitle, environment: args.environment, image: args.image, attempt: args.attempt }, 30000);
    } catch {
      return fallbackAnalyze(args.missionTitle);
    }
  },

  async askHint(missionTitle: string, environment: any, hintLevel: number) {
    try {
      const r = await post("/quest/hint", { mission_title: missionTitle, environment, hint_level: hintLevel }, 15000);
      return r.hint as string;
    } catch {
      const hints = ["I remember seeing something useful nearby.", "People usually spend the most time near it.", "It's a very ordinary object, honestly."];
      return hints[Math.min(hintLevel - 1, 2)];
    }
  },

  async adventureSummary(args: {
    name: string;
    personality: string;
    style: string;
    missionsCompleted: number;
    totalXp: number;
  }) {
    try {
      return await post("/adventure/summary", {
        name: args.name,
        personality: args.personality,
        style: args.style,
        missions_completed: args.missionsCompleted,
        total_xp: args.totalXp,
      });
    } catch {
      const p = args.personality || "explorer";
      return {
        headline: "ADVENTURE COMPLETE",
        summary: FALLBACK_SUMMARY[p] || FALLBACK_SUMMARY.explorer,
        traits: FALLBACK_TRAITS[p] || FALLBACK_TRAITS.explorer,
        total_xp: args.totalXp,
        streak_delta: 1,
      };
    }
  },
};
